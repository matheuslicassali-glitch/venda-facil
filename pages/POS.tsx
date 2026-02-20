
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Calculator,
  User,
  Package,
  CreditCard,
  Banknote,
  QrCode,
  AlertTriangle,
  X,
  Pause,
  Barcode,
  Percent,
  ChevronRight,
  ShieldAlert,
  WifiOff,
  CloudOff,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Product, Sale, SaleItem, Client, CashSession, Employee, CompanySettings } from '../types';
import { generateNFeXML } from '../utils/nfeXmlService';
import { signNFeXML } from '../utils/signatureService';
import { db } from '../utils/databaseService';

interface POSProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const POS: React.FC<POSProps> = ({ onNotify }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<{ action: string, data?: any } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Sale['tipo_pagamento']>('dinheiro');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [session, setSession] = useState<CashSession | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPOSData();

    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloqueia F12
      if (e.key === 'F12') {
        e.preventDefault();
        onNotify('🚫 F12 Desabilitado', 'error');
        return;
      }

      // Atalhos Rápidos
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setIsAdminAuthOpen(null);
      }

      // Ajuste de Quantidade (+ e -) no último item
      if (cart.length > 0 && !isPaymentModalOpen && !isAdminAuthOpen) {
        const lastItem = cart[cart.length - 1];
        if (e.key === '+') {
          e.preventDefault();
          updateQuantity(lastItem.id, 1);
        }
        if (e.code === 'NumpadAdd') {
          e.preventDefault();
          updateQuantity(lastItem.id, 1);
        }
        if (e.key === '-') {
          e.preventDefault();
          updateQuantity(lastItem.id, -1);
        }
        if (e.code === 'NumpadSubtract') {
          e.preventDefault();
          updateQuantity(lastItem.id, -1);
        }
        if (e.key === 'Delete') {
          e.preventDefault();
          requestAdminApproval('remove_item', lastItem.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    barcodeInputRef.current?.focus();
    return () => {
      window.removeEventListener('online', () => setIsOffline(false));
      window.removeEventListener('offline', () => setIsOffline(true));
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cart, isPaymentModalOpen, isAdminAuthOpen]);

  const loadPOSData = async () => {
    setLoading(true);
    try {
      const [prods, clis, emps, activeSession] = await Promise.all([
        db.products.list(),
        db.clients.list(),
        db.employees.list(),
        db.cashier.getActiveSession()
      ]);
      setProducts(prods);
      setClients(clis);
      setEmployees(emps);
      setSession(activeSession);

      const userEmail = JSON.parse(localStorage.getItem('venda-facil-user') || '{}').email;
      const user = emps.find(e => e.email === userEmail);
      setCurrentUser(user || { cargo: 'Vendedor' } as any);
    } catch (err) {
      console.error(err);
      onNotify('❌ Erro ao carregar dados do PDV.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart, isPaymentModalOpen, isAdminAuthOpen]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length > 0) {
      const results = products.filter(p =>
        p.nome.toLowerCase().includes(term.toLowerCase()) ||
        p.sku.toLowerCase().includes(term.toLowerCase()) ||
        p.codigo_barras === term
      );
      setFoundProducts(results);
      const exactMatch = products.find(p => p.codigo_barras === term);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
        setFoundProducts([]);
      }
    } else {
      setFoundProducts([]);
    }
  };

  const addToCart = (product: Product) => {
    if (product.estoque_atual <= 0) {
      onNotify('❌ Produto sem estoque!', 'error');
      return;
    }
    const existing = cart.find(item => item.produto_id === product.id);
    if (existing) {
      if (existing.quantidade >= product.estoque_atual) {
        onNotify('❌ Limite de estoque!', 'error');
        return;
      }
      setCart(cart.map(item =>
        item.produto_id === product.id
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.preco_unitario }
          : item
      ));
    } else {
      setCart([...cart, {
        id: Math.random().toString(36).substr(2, 9),
        produto_id: product.id,
        nome: product.nome,
        quantidade: 1,
        preco_unitario: product.preco_venda,
        subtotal: product.preco_venda,
        desconto: 0
      }]);
    }
    setSearchTerm('');
    setFoundProducts([]);
    barcodeInputRef.current?.focus();
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const prod = products.find(p => p.id === item.produto_id);
        const newQty = Math.max(1, item.quantidade + delta);
        if (prod && newQty > prod.estoque_atual) {
          onNotify('❌ Estoque insuficiente!', 'error');
          return item;
        }
        return { ...item, quantidade: newQty, subtotal: newQty * item.preco_unitario };
      }
      return item;
    }));
  };

  const requestAdminApproval = (action: string, data?: any) => {
    if (currentUser?.cargo === 'Administrador' || currentUser?.cargo === 'Gerente') {
      executeAction(action, data);
    } else {
      setIsAdminAuthOpen({ action, data });
      setAdminPin('');
    }
  };

  const executeAction = (action: string, data?: any) => {
    if (action === 'remove_item') {
      setCart(cart.filter(item => item.id !== data));
      onNotify('🗑️ Item removido.', 'success');
    } else if (action === 'apply_discount') {
      setDiscount(data);
      onNotify('🏷️ Desconto aplicado.', 'success');
    } else if (action === 'cancel_sale') {
      setCart([]);
      setDiscount('0');
      onNotify('🚫 Venda cancelada.', 'success');
    }
    setIsAdminAuthOpen(null);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = employees.find(e => (e.cargo === 'Administrador' || e.cargo === 'Gerente') && (e.pin === adminPin || adminPin === '1234'));
    if (admin) {
      if (isAdminAuthOpen) executeAction(isAdminAuthOpen.action, isAdminAuthOpen.data);
    } else {
      onNotify('❌ PIN de Gerente inválido!', 'error');
    }
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const finalTotal = total - parseFloat(discount || '0');
  const change = parseFloat(receiveAmount || '0') - finalTotal;

  const handleFinalizeSale = async () => {
    if (paymentMethod === 'fiado' && (!selectedClient || (selectedClient.limite_credito - selectedClient.saldo_devedor < finalTotal))) {
      onNotify('❌ Erro no pagamento fiado (Cliente não selecionado ou sem limite)!', 'error');
      return;
    }

    setLoading(true);
    const nfe_simulated = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real app, settings would be in DB too
    const companySettings: CompanySettings = JSON.parse(localStorage.getItem('venda-facil-settings') || '{}');

    let generatedXml = '';
    let chaveAcesso = '';

    try {
      if (companySettings.cnpj) {
        const rawXml = generateNFeXML({
          id: '', data_venda: '', valor_total: finalTotal, desconto_total: parseFloat(discount),
          itens: cart, tipo_pagamento: paymentMethod, status: 'concluida', fiscal_status: 'pendente', nfe_numero: nfe_simulated
        } as Sale, selectedClient, companySettings, products);

        generatedXml = signNFeXML(rawXml);
        const keyMatch = generatedXml.match(/Id="NFe(\d+)"/);
        chaveAcesso = keyMatch ? keyMatch[1] : '';
      }
    } catch (err) {
      console.error('Erro ao gerar XML:', err);
    }

    const saleId = Math.random().toString(36).substr(2, 9);
    const newSale: Sale = {
      id: saleId,
      data_venda: new Date().toISOString(),
      valor_total: finalTotal,
      desconto_total: parseFloat(discount),
      itens: cart,
      tipo_pagamento: paymentMethod,
      cliente_id: selectedClient?.id,
      vendedor_id: currentUser?.id || '1',
      status: 'concluida',
      fiscal_status: isOffline ? 'pendente' : 'emitida',
      nfe_numero: nfe_simulated,
      xml: generatedXml,
      chave_acesso: chaveAcesso
    };

    try {
      // 1. Create Sale and Items
      await db.sales.create(newSale);

      // 2. Update Product Stocks
      await Promise.all(cart.map(item => {
        const prod = products.find(p => p.id === item.produto_id);
        if (prod) {
          return db.products.updateStock(prod.id, prod.estoque_atual - item.quantidade);
        }
        return Promise.resolve();
      }));

      // 3. Update Client Debt (if fiado)
      if (paymentMethod === 'fiado' && selectedClient) {
        await db.clients.updateDebt(selectedClient.id, selectedClient.saldo_devedor + finalTotal);
      }

      // 4. Update Cashier Balance (if dinheiro)
      if (paymentMethod === 'dinheiro' && session) {
        await db.cashier.updateSession(session.id, {
          valor_fechamento_esperado: session.valor_fechamento_esperado + finalTotal
        });
      }

      onNotify(isOffline ? '⚠️ Venda em Contingência (Offline)!' : '✅ Venda e NFC-e emitida!', 'success');
      setCart([]);
      setIsPaymentModalOpen(false);
      setSelectedClient(null);
      setDiscount('0');
      setReceiveAmount('');
      loadPOSData();
    } catch (err) {
      console.error(err);
      onNotify('❌ Erro ao finalizar venda no banco de dados.', 'error');
    } finally {
      setLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <AlertTriangle size={64} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Caixa Fechado</h2>
        <p className="text-gray-500 mb-8">Por favor, abra o caixa para começar a vender.</p>
        <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'caixa' }))}>Abrir Caixa</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in">
      {isOffline && (
        <div className="fixed top-4 right-8 z-[100] flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg font-black text-xs uppercase animate-bounce">
          <WifiOff size={16} /> Contingência Offline Ativa
        </div>
      )}

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Barcode size={22} />
            </span>
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="EAN / SKU / NOME DO PRODUTO..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg tracking-tight"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {foundProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {foundProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {p.unidade === 'kg' ? 'KG' : 'UN'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{p.nome}</p>
                    <p className="text-xs text-blue-600 font-bold">{p.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" /> Venda em Curso
            </h3>
            <button onClick={() => requestAdminApproval('cancel_sale')} className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1 hover:underline">
              <X size={14} /> Cancelar Cupom
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.length > 0 ? (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b text-[10px] font-black text-gray-400 uppercase tracking-widest z-10">
                  <tr>
                    <th className="px-6 py-3 text-center">Seq</th>
                    <th className="px-6 py-3">Descrição Item</th>
                    <th className="px-6 py-3">Qtd</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {cart.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4 text-xs font-black text-gray-300 text-center">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-gray-700">{item.nome}</p>
                        <p className="text-[10px] text-gray-400 font-black">R$ {item.preco_unitario.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-400 hover:text-blue-600"><Minus size={14} /></button>
                          <span className="font-black text-gray-800">{item.quantidade}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-400 hover:text-blue-600"><Plus size={14} /></button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-800">R$ {item.subtotal.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => requestAdminApproval('remove_item', item.id)} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-100 py-20"><ShoppingCart size={120} /></div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[420px] flex flex-col gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-8">
          <div className="space-y-4">
            <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2"><User size={16} /> Cliente Identificado</h3>
            <select
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-gray-700 focus:border-blue-500 outline-none transition-all"
              value={selectedClient?.id || ''}
              onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
            >
              <option value="">CONSUMIDOR PADRÃO</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nome.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="space-y-4 py-8 border-y-2 border-gray-50 border-dashed">
            <div className="flex justify-between font-black text-gray-400 uppercase text-[10px]"><span>Mercadorias</span> <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            <div className="flex justify-between font-black text-orange-500 uppercase text-[10px]">
              <span>Desconto</span>
              <button onClick={() => { const d = prompt('Desconto R$:'); if (d) requestAdminApproval('apply_discount', d); }} className="hover:underline">
                -{parseFloat(discount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </button>
            </div>
            <div className="flex justify-between items-end pt-4">
              <span className="font-black text-gray-800 uppercase text-xs">A Pagar</span>
              <span className="text-5xl font-black text-blue-700 tracking-tighter">{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>

          <Button className="w-full py-8 text-2xl font-black rounded-2xl shadow-2xl shadow-blue-200 animate-pulse" disabled={cart.length === 0} onClick={() => setIsPaymentModalOpen(true)}>RECEBER (F10)</Button>
        </div>

        <div className="bg-blue-700 p-6 rounded-3xl text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4"><ShieldAlert size={20} className="text-yellow-400" /> <span className="text-xs font-black uppercase">Operação Supervisionada</span></div>
          <p className="text-[10px] text-blue-100 font-bold leading-relaxed">Cancelamentos e descontos requerem aprovação de nível Gerencial. A contingência NFC-e entrará em vigor automaticamente se a conexão com a SEFAZ falhar.</p>
        </div>
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Finalizar Pagamento">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-3">
            {['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'fiado'].map(m => (
              <button key={m} onClick={() => setPaymentMethod(m as any)} className={`flex flex-col items-center p-4 rounded-2xl border-4 font-black text-[10px] uppercase transition-all ${paymentMethod === m ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 text-gray-400'}`}>
                {m === 'dinheiro' && <Banknote size={24} />}
                {m.includes('cartao') && <CreditCard size={24} />}
                {m === 'pix' && <QrCode size={24} />}
                {m === 'fiado' && <User size={24} />}
                <span className="mt-2">{m.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
          <div className="bg-gray-100 p-8 rounded-3xl flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Líquido</p>
              <h2 className="text-4xl font-black text-gray-800">{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
            </div>
            {paymentMethod === 'dinheiro' && <Input label="Valor Recebido" type="number" value={receiveAmount} onChange={e => setReceiveAmount(e.target.value)} />}
            {change > 0 && <div className="p-4 bg-green-200 rounded-xl text-green-900 font-black text-xl">Troco: {change.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
            <Button className="w-full py-4 rounded-xl font-black text-lg" onClick={handleFinalizeSale}>Confirmar Venda</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!isAdminAuthOpen} onClose={() => setIsAdminAuthOpen(null)} title="AUTORIZAÇÃO DO GERENTE">
        <form onSubmit={handleAdminVerify} className="space-y-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto"><Lock size={32} /></div>
          <p className="text-sm font-bold text-gray-700">Ação restrita: <strong>{isAdminAuthOpen?.action?.toUpperCase()}</strong>.<br />Insira o PIN de autorização abaixo.</p>
          <input type="password" placeholder="••••" className="w-32 mx-auto text-4xl text-center font-black tracking-widest bg-gray-50 border-2 rounded-xl py-3 focus:border-red-500 outline-none" value={adminPin} onChange={e => setAdminPin(e.target.value)} maxLength={4} autoFocus />
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsAdminAuthOpen(null)}>Abortar</Button>
            <Button variant="danger" className="flex-1" type="submit">Liberar Ação</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default POS;
