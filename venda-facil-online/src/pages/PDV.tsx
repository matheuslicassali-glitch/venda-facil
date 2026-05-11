import { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard, 
  Banknote, QrCode, CheckCircle2, LayoutGrid, Tag, Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import type { Product, SaleItem, CashSession } from '../types';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function PDV() {
  // Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [session, setSession] = useState<CashSession | null>(null);
  
  // UI
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);
  const [installments, setInstallments] = useState(1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    checkSession();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFoundProducts([]);
        setIsCatalogModalOpen(false);
        setIsPaymentModalOpen(false);
      }
      if (e.key === 'F2') {
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    const { data: prods } = await supabase.from('produtos').select('*');
    const { data: clis } = await supabase.from('clientes').select('*');
    if (prods) setProducts(prods as any);
    if (clis) setClients(clis as any);
  };

  const checkSession = async () => {
    const { data } = await supabase.from('caixa_sessoes').select('*').eq('status', 'aberto').limit(1).single();
    if (data) setSession(data as any);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length > 0) {
      const results = products.filter(p =>
        p.nome.toLowerCase().includes(term.toLowerCase()) ||
        p.sku.toLowerCase().includes(term.toLowerCase())
      );
      setFoundProducts(results);
    } else {
      setFoundProducts([]);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.produto_id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.produto_id === product.id
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.preco_unitario }
          : item
      ));
    } else {
      setCart([...cart, {
        id: uuidv4(),
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
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: newQty, subtotal: newQty * item.preco_unitario };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce((acc, i) => acc + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount + acrescimo);

  const finalizeSale = async () => {
    setLoading(true);
    try {
      const saleId = uuidv4();
      const saleData = {
        id: saleId,
        data_venda: new Date().toISOString(),
        valor_total: total,
        desconto_total: discount,
        acrescimo_total: acrescimo,
        tipo_pagamento: paymentMethod,
        parcelas: installments,
        cliente_id: selectedClient?.id,
        status: 'concluida',
        fiscal_status: 'pendente',
        sincronizado: true 
      };

      const { error: saleErr } = await supabase.from('vendas').insert(saleData);
      if (saleErr) throw saleErr;

      // Itens da venda
      const itemsData = cart.map(item => ({
        id: uuidv4(),
        venda_id: saleId,
        produto_id: item.produto_id,
        nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        sincronizado: true
      }));

      const { error: itemsErr } = await supabase.from('venda_itens').insert(itemsData);
      if (itemsErr) throw itemsErr;

      // Baixa de estoque
      for (const item of cart) {
        const prod = products.find(p => p.id === item.produto_id);
        if (prod) {
          await supabase.from('produtos').update({ 
            estoque_atual: prod.estoque_atual - item.quantidade 
          }).eq('id', prod.id);
        }
      }

      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      setCart([]);
      setDiscount(0);
      setAcrescimo(0);
      setInstallments(1);
      loadData();
    } catch (err) {
      alert('Erro ao finalizar venda: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
        <Package size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Caixa Fechado</h2>
        <p className="text-slate-500 mb-6">Você precisa abrir o caixa para iniciar as vendas.</p>
        <Button onClick={() => window.location.href = '/caixa'}>Ir para o Caixa</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Buscar por nome ou SKU..."
              className="w-full h-14 bg-white rounded-2xl border-none shadow-sm pl-12 pr-6 font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
            />
            {foundProducts.length > 0 && (
              <div className="absolute top-16 left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{foundProducts.length} Produtos Encontrados</span>
                  <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 font-mono shadow-sm">ESC para fechar</kbd>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {foundProducts.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => addToCart(p)} 
                      className="w-full flex items-center gap-4 p-4 hover:bg-primary-50/50 text-left transition-all border-b border-slate-50 last:border-0 group"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-primary-500 transition-all shadow-sm">
                        <Package size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm group-hover:text-primary-700 transition-colors">{p.nome}</p>
                        <p className="text-[10px] text-slate-400 font-medium">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary-600">R$ {p.preco_venda.toFixed(2)}</p>
                        <p className={`text-[10px] font-bold ${p.estoque_atual <= 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                          {p.estoque_atual} {p.unidade} em estoque
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button variant="secondary" className="h-14 px-8" onClick={() => setIsCatalogModalOpen(true)}>
            <LayoutGrid size={20} className="mr-2" /> Catálogo
          </Button>
        </div>

        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><ShoppingCart size={18} /> Pedido Atual</h3>
            <span className="text-xs font-bold text-slate-400 uppercase bg-white px-3 py-1 rounded-full shadow-sm">{cart.length} Itens</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                <ShoppingCart size={48} className="mb-4" />
                <p className="font-bold uppercase text-xs tracking-widest">Carrinho Vazio</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-primary-200 transition-all">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{item.nome}</p>
                    <p className="text-xs text-slate-500 font-medium">R$ {item.preco_unitario.toFixed(2)} / un</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all"><Minus size={14}/></button>
                    <span className="font-bold text-slate-800 w-4 text-center">{item.quantidade}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600 transition-all"><Plus size={14}/></button>
                  </div>
                  <p className="w-24 text-right font-bold text-slate-800">R$ {item.subtotal.toFixed(2)}</p>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl relative z-10 h-screen overflow-hidden">
        {/* Top: Cliente (Fixo) */}
        <div className="p-6 border-b border-slate-50 bg-slate-50/20">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cliente</h4>
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500 shadow-sm"><User size={20}/></div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-slate-800 text-sm truncate">{selectedClient?.nome || 'Consumidor Final'}</p>
              <button 
                onClick={() => setIsClientModalOpen(true)}
                className="text-[10px] text-primary-600 font-bold uppercase tracking-tight hover:underline"
              >
                Vincular Cliente
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Totais e Ajustes (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Desconto (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-red-500 outline-none focus:ring-1 focus:ring-red-200 transition-all"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Acréscimo (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-emerald-600 outline-none focus:ring-1 focus:ring-emerald-200 transition-all"
                  value={acrescimo}
                  onChange={e => setAcrescimo(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Package size={14} className="text-primary-500" />
              <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">Resumo do Pedido</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {cart.length} itens no carrinho. 
              {cart.length === 0 && " Adicione produtos para liberar o pagamento."}
            </p>
          </div>
        </div>

        {/* Bottom: Total e Botão Finalizar (Fixo - Movido para cima) */}
        <div className="p-6 pb-24 bg-slate-50/80 backdrop-blur-md border-t border-slate-200 space-y-4">
          <div>
            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Total do Pedido</p>
            <h2 className="text-4xl font-black text-slate-800">
              <span className="text-lg font-normal text-slate-400 mr-2">R$</span>
              {total.toFixed(2).replace('.', ',')}
            </h2>
          </div>
          
          <Button 
            size="lg" 
            className={`w-full h-16 text-base font-black uppercase tracking-widest shadow-2xl transition-all ${cart.length > 0 ? 'hover:translate-y-[-2px] active:translate-y-0' : 'opacity-50 grayscale'}`}
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <CheckCircle2 className="mr-2" /> {cart.length === 0 ? 'Carrinho Vazio' : 'Finalizar Venda'}
          </Button>
        </div>
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Finalizar Pagamento" maxWidth="max-w-md">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'dinheiro', icon: <Banknote />, label: 'Dinheiro' },
              { id: 'cartao_credito', icon: <CreditCard />, label: 'C. Crédito' },
              { id: 'cartao_debito', icon: <CreditCard />, label: 'C. Débito' },
              { id: 'pix', icon: <QrCode />, label: 'PIX' },
              { id: 'fiado', icon: <User />, label: 'Fiado' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-50 text-slate-500 hover:bg-slate-50'}`}
              >
                <div className={`${paymentMethod === m.id ? 'text-primary-500' : 'text-slate-300'}`}>{m.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'cartao_credito' && (
            <div className="bg-slate-50 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Parcelamento</label>
              <select 
                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                value={installments}
                onChange={e => setInstallments(Number(e.target.value))}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n}>{n}x de R$ {(total / n).toFixed(2)}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-slate-900 p-6 rounded-3xl text-center shadow-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total a Receber</p>
            <p className="text-4xl font-black text-white">R$ {total.toFixed(2).replace('.', ',')}</p>
          </div>
          
          <Button className="w-full h-14 text-lg font-black uppercase tracking-widest" disabled={loading} onClick={finalizeSale}>
            {loading ? 'Processando...' : 'Confirmar e Receber'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)} title="📦 Catálogo de Produtos">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {products.map(p => (
            <button key={p.id} onClick={() => { addToCart(p); setIsCatalogModalOpen(false); }} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-300 hover:bg-white transition-all flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><Tag size={20} /></div>
              <p className="font-bold text-slate-700 text-xs text-center line-clamp-2 h-8">{p.nome}</p>
              <p className="text-primary-600 font-bold text-sm">R$ {p.preco_venda.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="👤 Vincular Cliente">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            <button 
              onClick={() => { setSelectedClient(null); setIsClientModalOpen(false); }}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-primary-300 transition-all"
            >
              <span className="font-bold text-slate-700 text-sm">Consumidor Final</span>
              <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">Default</span>
            </button>
            {clients.map(c => (
              <button 
                key={c.id} 
                onClick={() => { setSelectedClient(c); setIsClientModalOpen(false); }}
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-primary-300 transition-all"
              >
                <div className="text-left">
                  <p className="font-bold text-slate-700 text-sm">{c.nome}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{c.documento}</p>
                </div>
                <Plus size={16} className="text-primary-500" />
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="✅ Venda Concluída">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Venda Finalizada com Sucesso!</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">A transação foi registrada na nuvem, o estoque atualizado e o comprovante está pronto para impressão.</p>
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1" onClick={() => setIsSuccessModalOpen(false)}>Imprimir Cupom</Button>
            <Button variant="primary" className="flex-1" onClick={() => setIsSuccessModalOpen(false)}>Nova Venda</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
