import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  QrCode,
  AlertTriangle,
  X,
  Barcode,
  ShieldAlert,
  WifiOff,
  Lock,
  Printer,
  CheckCircle2,
  ArrowRight,
  LayoutGrid,
  Tag,
  Clock,
  UserCircle,
  ChevronDown,
  Power,
  Package,
  Calendar,
  Settings as SettingsIcon,
  Bell
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Product, Sale, SaleItem, Client, CashSession, Employee, CompanySettings } from '../types';
import { db, generateUUID } from '../utils/databaseService';
import { ReceiptPrint } from '../components/ReceiptPrint';

interface POSProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
  currentUser: any;
}

const POS: React.FC<POSProps> = ({ onNotify, currentUser }) => {
  // Estados de Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [session, setSession] = useState<CashSession | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // Estados de UI
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<{ action: string, data?: any } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estados de Pagamento
  const [payments, setPayments] = useState<{ 
    id: string, 
    method: string, 
    amount: number,
    bandeira?: string,
    parcelas?: number 
  }[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'fiado'>('dinheiro');
  const [selectedBrand, setSelectedBrand] = useState<string>('VISA');
  const [installments, setInstallments] = useState<number>(1);
  const [amountInput, setAmountInput] = useState<string>('');
  
  // Diversos
  const [discount, setDiscount] = useState('0');
  const [surcharge, setSurcharge] = useState('0');
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSaleConfirmed, setLastSaleConfirmed] = useState<Sale | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<string>('1');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ unidade: 'un', estoque_atual: 0, preco_venda: 0, preco_custo: 0 });
  const [newClient, setNewClient] = useState<Partial<Client>>({ saldo_devedor: 0, limite_credito: 0 });

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Init
  useEffect(() => {
    loadPOSData();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); barcodeInputRef.current?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) openPaymentModal(); }
      if (e.key === 'F4') { e.preventDefault(); setIsCatalogModalOpen(true); }
      if (e.key === 'F10') { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' })); }
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setIsAdminAuthOpen(null);
        setIsCatalogModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    barcodeInputRef.current?.focus();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(timer);
    };
  }, [cart]);

  const loadPOSData = async () => {
    try {
      const [prods, clis, emps, activeSession, settingsData] = await Promise.all([
        db.products.list(),
        db.clients.list(),
        db.employees.list(),
        db.cashier.getActiveSession(),
        db.settings.get()
      ]);
      setProducts(prods);
      setClients(clis);
      setEmployees(emps);
      setSession(activeSession);
      setCompanySettings(settingsData);
    } catch (err) {
      onNotify('❌ Erro ao carregar dados do PDV.', 'error');
    }
  };

  // Logica de Carrinho
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
    const qty = parseFloat(qtyToAdd) || 1;
    if (product.estoque_atual < qty) {
      onNotify('❌ Estoque insuficiente!', 'error');
      return;
    }
    const existing = cart.find(item => item.produto_id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.produto_id === product.id
          ? { ...item, quantidade: item.quantidade + qty, subtotal: (item.quantidade + qty) * item.preco_unitario }
          : item
      ));
    } else {
      setCart([...cart, {
        id: generateUUID(),
        produto_id: product.id,
        nome: product.nome,
        quantidade: qty,
        preco_unitario: product.preco_venda,
        subtotal: product.preco_venda * qty,
        desconto: 0
      }]);
    }
    setSearchTerm('');
    setQtyToAdd('1');
    barcodeInputRef.current?.focus();
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const prod = products.find(p => p.id === item.produto_id);
        const newQty = Math.max(1, item.quantidade + delta);
        if (prod && newQty > prod.estoque_atual) return item;
        return { ...item, quantidade: newQty, subtotal: newQty * item.preco_unitario };
      }
      return item;
    }));
  };

  // Administrativo
  const requestAdminApproval = (action: string, data?: any) => {
    if (currentUser?.cargo === 'Administrador' || currentUser?.cargo === 'Gerente') {
      executeAction(action, data);
    } else {
      setIsAdminAuthOpen({ action, data });
    }
  };

  const executeAction = (action: string, data?: any) => {
    if (action === 'remove_item') setCart(cart.filter(item => item.id !== data));
    if (action === 'cancel_sale') { setCart([]); setDiscount('0'); }
    if (action === 'apply_discount') setDiscount(data);
    setIsAdminAuthOpen(null);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = employees.find(e => (e.cargo === 'Administrador' || e.cargo === 'Gerente') && e.pin === adminPin);
    if (admin) executeAction(isAdminAuthOpen!.action, isAdminAuthOpen!.data);
    else onNotify('❌ PIN Inválido', 'error');
    setAdminPin('');
  };

  // Cálculos de Pagamento
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - parseFloat(discount || '0') + parseFloat(surcharge || '0'));
  const totalPago = payments.reduce((acc, p) => acc + p.amount, 0);
  const saldoRestante = Math.max(0, total - totalPago);
  const troco = Math.max(0, totalPago - total);

  const openPaymentModal = () => {
    setPayments([]);
    setAmountInput(total.toString());
    setIsPaymentModalOpen(true);
  };

  const addPaymentRow = () => {
    const cleanInput = amountInput.replace(',', '.');
    const amount = parseFloat(cleanInput) || 0;
    if (amount <= 0) return;
    
    setPayments([...payments, {
      id: generateUUID(),
      method: activePaymentMethod,
      amount: amount,
      bandeira: (activePaymentMethod.includes('cartao')) ? selectedBrand : undefined,
      parcelas: (activePaymentMethod === 'cartao_credito') ? installments : 1
    }]);
    setAmountInput('');
  };

  const removePaymentRow = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleFinalizeSale = async () => {
    if (totalPago < total) {
      onNotify('❌ Valor pago insuficiente!', 'error');
      return;
    }
    setLoading(true);
    try {
      const salePayload: Sale = {
        id: generateUUID(),
        data_venda: new Date().toISOString(),
        valor_total: total,
        desconto_total: parseFloat(discount || '0'),
        acrescimo_total: parseFloat(surcharge || '0'),
        itens: cart,
        tipo_pagamento: payments.map(p => p.method).join(' + '),
        // Ensure IDs are valid UUIDs or send undefined
        cliente_id: (selectedClient?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedClient.id)) ? selectedClient.id : undefined,
        vendedor_id: (currentUser?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)) ? currentUser.id : undefined,
        status: 'concluida',
        fiscal_status: 'pendente',
        nfe_numero: Math.floor(100000 + Math.random() * 900000).toString()
      };

      // 1. Create Sale (Backend handles stock deduction automatically in a transaction)
      await db.sales.create(salePayload);
      
      // 2. Update Cashier Session (Only Cash part)
      const cashAmount = payments.filter(p => p.method === 'dinheiro').reduce((acc, p) => acc + p.amount, 0);
      if (cashAmount > 0 && session) {
        const netCash = cashAmount - troco;
        await (db.cashier as any).updateSession(session.id, {
          valor_fechamento_esperado: session.valor_fechamento_esperado + netCash
        });
      }

      setLastSaleConfirmed(salePayload);
      setCart([]);
      setDiscount('0');
      setSurcharge('0');
      setPayments([]);
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      loadPOSData();
      onNotify('✅ Venda finalizada com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao finalizar venda:', err);
      onNotify(`❌ Falha ao finalizar: ${err.message || 'Verifique a conexão'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nome || !newProduct.preco_venda) {
      onNotify('❌ Nome e Preço são obrigatórios.', 'error');
      return;
    }
    try {
      const p: Product = {
        id: generateUUID(),
        nome: newProduct.nome || '',
        sku: newProduct.sku || generateUUID().slice(0,8).toUpperCase(),
        codigo_barras: newProduct.codigo_barras,
        preco_venda: Number(newProduct.preco_venda),
        preco_custo: Number(newProduct.preco_custo || 0),
        estoque_atual: Number(newProduct.estoque_atual || 0),
        estoque_minimo: 5,
        unidade: (newProduct.unidade as any) || 'un',
        categoria: 'Geral',
        ncm: '00000000',
        origem: '0',
        cfop: '5102',
        cst_csosn: '102'
      };
      await db.products.save(p);
      onNotify('✅ Produto cadastrado!', 'success');
      setIsAddProductModalOpen(false);
      setNewProduct({ unidade: 'un', estoque_atual: 0, preco_venda: 0, preco_custo: 0 });
      loadPOSData();
    } catch (err) {
      onNotify('❌ Erro ao cadastrar produto.', 'error');
    }
  };

  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nome || !newClient.documento) {
      onNotify('❌ Nome e Documento são obrigatórios.', 'error');
      return;
    }
    try {
      const c: Client = {
        id: generateUUID(),
        nome: newClient.nome || '',
        documento: newClient.documento || '',
        email: newClient.email || '',
        telefone: newClient.telefone || '',
        endereco: '',
        limite_credito: 0,
        saldo_devedor: 0
      };
      await db.clients.save(c);
      onNotify('✅ Cliente cadastrado!', 'success');
      setSelectedClient(c);
      setIsAddClientModalOpen(false);
      setNewClient({ saldo_devedor: 0, limite_credito: 0 });
      loadPOSData();
    } catch (err) {
      onNotify('❌ Erro ao cadastrar cliente.', 'error');
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-foreground">
        <ShieldAlert size={64} className="text-orange-500 mb-4" />
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Terminal Bloqueado</h2>
        <p className="text-muted-foreground mb-8 font-bold">O caixa precisa ser aberto para operar o PDV.</p>
        <Button size="lg" className="bg-slate-900 border-none font-black" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'caixa' }))}>IR PARA ABERTURA DE CAIXA</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden text-foreground font-sans">
      {/* HEADER PREMIUM */}
      <div className="h-20 bg-card text-card-foreground border-b border-border flex items-center px-8 gap-6 shrink-0 shadow-sm relative z-20">
        <div className="relative flex-1 group">
           <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#006d77] transition-colors" />
           <input 
             ref={barcodeInputRef}
             type="text" 
             placeholder="ESCANEE O PRODUTO OU DIGITE O NOME..."
             className="w-full h-12 bg-background text-foreground border border-border rounded-xl pl-14 pr-6 text-foreground font-bold text-base outline-none focus:ring-2 focus:ring-[#006d77]/10 focus:border-[#006d77] placeholder:text-slate-300 transition-all hover:bg-card text-card-foreground"
             value={searchTerm}
             onChange={e => handleSearch(e.target.value)}
           />
           {foundProducts.length > 0 && (
             <div className="absolute top-14 left-0 w-full bg-card text-card-foreground rounded-2xl shadow-2xl border border-border z-50 overflow-hidden animate-in fade-in duration-200">
               {foundProducts.map(p => (
                 <button key={p.id} onClick={() => addToCart(p)} className="w-full flex items-center gap-5 p-4 hover:bg-background text-foreground text-left border-b border-slate-50 group transition-all">
                   <div className="w-10 h-10 bg-muted text-muted-foreground flex items-center justify-center rounded-lg font-black text-xs text-muted-foreground group-hover:bg-[#006d77] group-hover:text-white transition-all uppercase">{p.unidade}</div>
                   <div className="flex-1">
                     <p className="font-bold text-foreground text-sm uppercase">{p.nome}</p>
                     <p className="text-xs font-black text-[#006d77]">R$ {p.preco_venda.toFixed(2)}</p>
                   </div>
                 </button>
               ))}
             </div>
           )}
        </div>

        <button onClick={() => setIsAddProductModalOpen(true)} className="h-12 px-6 border-2 border-border rounded-xl font-black text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 hover:bg-background text-foreground transition-all">
           <Plus size={18} /> Cadastrar Produto
        </button>

        <button onClick={() => setIsCatalogModalOpen(true)} className="bg-[#006d77] text-white h-12 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#005a63] shadow-lg shadow-[#006d77]/20 transition-all">
           <LayoutGrid size={18} /> Catálogo [F4]
        </button>

        <div className="flex items-center gap-5 pl-5 border-l border-border text-muted-foreground">
           <Bell size={22} className="cursor-pointer hover:text-[#006d77] transition-colors" />
           <SettingsIcon size={22} className="cursor-pointer hover:text-[#006d77] transition-colors" />
        </div>
      </div>

      {/* ÁREA CENTRAL */}
      <div className="flex flex-1 overflow-hidden p-6 gap-6 relative z-10">
        {/* LISTA DE PEDIDO */}
        <div className="flex-1 bg-card text-card-foreground rounded-3xl border border-border overflow-hidden flex flex-col shadow-sm">
          <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-[#006d77] flex items-center gap-3 text-xs uppercase tracking-widest"><ShoppingCart size={18} /> Lista de Pedido</h3>
            <span className="text-[10px] font-black text-muted-foreground uppercase bg-background text-foreground px-3 py-1 rounded-full">{cart.length} Itens</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="bg-background text-foreground/50 sticky top-0 z-10">
                  <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="px-8 py-4 text-left">Produto</th>
                    <th className="px-8 py-4 text-center">Qtd</th>
                    <th className="px-8 py-4 text-left">Preço</th>
                    <th className="px-8 py-4 text-left">Subtotal</th>
                    <th className="px-8 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cart.map((item) => (
                    <tr key={item.id} className="hover:bg-background text-foreground/50 transition-all">
                      <td className="px-8 py-5">
                         <p className="font-bold text-foreground uppercase text-sm">{item.nome}</p>
                         <p className="text-[10px] text-muted-foreground">Cod: {item.produto_id.slice(0,8)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:border-red-100 transition-all"><Minus size={14}/></button>
                          <span className="font-black text-base text-foreground w-6 text-center">{item.quantidade}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-[#006d77] hover:border-[#006d77] transition-all"><Plus size={14}/></button>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-muted-foreground text-sm">R$ {item.preco_unitario.toFixed(2)}</td>
                      <td className="px-8 py-5 font-black text-foreground text-base">R$ {item.subtotal.toFixed(2)}</td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => requestAdminApproval('remove_item', item.id)} className="text-slate-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 bg-background text-foreground rounded-full flex items-center justify-center mb-6">
                   <ShoppingCart size={40} className="text-slate-200" />
                </div>
                <p className="font-black uppercase text-sm tracking-widest text-slate-300">Lista Vazia</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Comece a adicionar itens</p>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO */}
        <div className="w-[420px] flex flex-col gap-6">
          {/* CLIENTE */}
          <div className="bg-card text-card-foreground p-8 rounded-3xl border border-border shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fidelização</h4>
                <button onClick={() => setIsAddClientModalOpen(true)} className="text-[#006d77] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                   <Plus size={14}/> Vincular Cliente
                </button>
             </div>
             
             <div className="flex items-center gap-4 bg-background text-foreground p-4 rounded-2xl border border-border">
                <div className="w-12 h-12 bg-card text-card-foreground rounded-xl flex items-center justify-center text-slate-300 shadow-sm"><User size={24}/></div>
                <div className="flex-1">
                   <p className="text-sm font-black text-foreground uppercase tracking-tight">{selectedClient?.nome || 'Consumidor Padrão'}</p>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selectedClient?.cpf || 'CPF não identificado'}</p>
                </div>
                <ChevronDown size={18} className="text-slate-300" />
             </div>
          </div>

          {/* RESUMO */}
          <div className="bg-card text-card-foreground p-8 rounded-3xl border border-border shadow-sm flex-1 flex flex-col">
             <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Resumo da Compra</h4>
             
             <div className="space-y-4">
               <div className="flex justify-between font-bold text-sm text-muted-foreground">
                  <span>Subtotal</span> 
                  <span>R$ {subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between font-bold text-sm text-red-400">
                  <span>Descontos</span>
                  <button onClick={() => { const d = prompt('R$ Desconto:'); if(d) requestAdminApproval('apply_discount', d); }}>
                    - R$ {parseFloat(discount).toFixed(2)}
                  </button>
               </div>
             </div>

             <div className="mt-auto">
                <p className="text-[10px] font-black text-[#006d77] uppercase tracking-widest mb-3">Total à Pagar</p>
                <div className="bg-[#e6f2f2] p-8 rounded-2xl text-center border-2 border-[#006d77]/10">
                   <h2 className="text-6xl font-black text-[#006d77] leading-none">
                     <span className="text-xl font-normal opacity-50 mr-2">R$</span>{total.toFixed(2).replace('.', ',')}
                   </h2>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="h-20 bg-card text-card-foreground border-t border-border px-8 flex items-center justify-between shrink-0">
         <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))}
            className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase hover:text-[#006d77] group transition-all"
         >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-50 group-hover:border-[#006d77]/20 group-hover:bg-[#006d77]/5 transition-all"><LayoutGrid size={20}/></div>
            Menu Principal [F10]
         </button>
         
         <div className="flex items-center gap-3">
            <div className="h-10 px-4 bg-background text-foreground rounded-xl border border-border flex items-center gap-3 text-muted-foreground">
               <Package size={16} className="text-[#006d77]" />
               <span className="text-[10px] font-black uppercase tracking-widest">Caixa {session?.id.slice(0,1)}</span>
            </div>
            <div className="h-10 px-4 bg-background text-foreground rounded-xl border border-border flex items-center gap-3 text-muted-foreground">
               <UserCircle size={16} className="text-[#006d77]" />
               <span className="text-[10px] font-black uppercase tracking-widest">Operador: {currentUser?.name}</span>
            </div>
            <div className="h-10 px-4 bg-background text-foreground rounded-xl border border-border flex items-center gap-3 text-muted-foreground">
               <Clock size={16} className="text-[#006d77]" />
               <span className="text-[10px] font-black uppercase tracking-widest">{currentTime.toLocaleDateString()} - {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
         </div>

         <div className="flex items-center gap-8">
            <button onClick={() => requestAdminApproval('cancel_sale')} className="text-red-500 font-black text-xs uppercase hover:underline tracking-widest">Cancelar [F4]</button>
            <button 
               disabled={cart.length === 0} 
               onClick={openPaymentModal}
               className="h-14 px-12 bg-[#006d77] text-white font-black text-sm uppercase rounded-2xl shadow-xl shadow-[#006d77]/20 hover:bg-[#005a63] transition-all disabled:opacity-50 flex items-center gap-4"
            >
              <CheckCircle2 size={22}/> Finalizar Venda [F2]
            </button>
         </div>
      </div>

      {/* MODAL DE PAGAMENTO MULTI-MÉTODO PREMIUM */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Finalizar Pagamento" maxWidth="max-w-5xl">
         <div className="flex flex-col min-h-[500px] max-h-[95vh] -m-6 overflow-hidden bg-card text-card-foreground">
            <div className="flex flex-1 divide-x divide-slate-100 overflow-hidden">
               {/* SIDEBAR */}
               <div className="w-[180px] bg-background text-foreground p-6 flex flex-col gap-3 shrink-0">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 text-center">Formas</p>
                  {[
                     { id: 'dinheiro', icon: <Banknote />, label: 'DINHEIRO' },
                     { id: 'cartao_credito', icon: <CreditCard />, label: 'CRÉDITO' },
                     { id: 'cartao_debito', icon: <CreditCard />, label: 'DÉBITO' },
                     { id: 'pix', icon: <QrCode />, label: 'PIX' },
                     { id: 'fiado', icon: <User />, label: 'FIADO' }
                  ].map(m => (
                     <button
                        key={m.id}
                        onClick={() => { setActivePaymentMethod(m.id as any); setAmountInput(saldoRestante.toString()); }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${activePaymentMethod === m.id ? 'bg-card text-card-foreground border-blue-600 text-primary shadow-md scale-105' : 'bg-transparent border-border text-muted-foreground opacity-70 hover:opacity-100'}`}
                     >
                        {m.icon}
                        <span className="text-[9px] font-black tracking-tighter uppercase">{m.label}</span>
                     </button>
                  ))}
               </div>

               {/* CONTEÚDO PAGAMENTO */}
               <div className="flex-1 flex flex-col bg-card text-card-foreground overflow-hidden">
                  <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                     <header className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                           <p className="text-[9px] font-black text-primary uppercase italic">Total a Receber</p>
                           <p className="text-2xl font-black text-blue-800">R$ {total.toFixed(2)}</p>
                        </div>
                        <div className={`p-4 rounded-2xl border ${saldoRestante > 0.01 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                           <p className={`text-[9px] font-black uppercase italic ${saldoRestante > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>Saldo Restante</p>
                           <p className={`text-2xl font-black ${saldoRestante > 0.01 ? 'text-red-700 animate-pulse' : 'text-emerald-700'}`}>R$ {saldoRestante.toFixed(2)}</p>
                        </div>
                     </header>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-orange-500 uppercase italic">Desconto (R$)</p>
                           <Input 
                              type="text" 
                              className="h-12 text-lg font-black bg-card text-card-foreground border-border text-foreground placeholder:text-slate-300 focus:ring-orange-500" 
                              value={discount} 
                              onChange={e => setDiscount(e.target.value.replace(',', '.'))} 
                           />
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-primary uppercase italic">Acréscimo (R$)</p>
                           <Input 
                              type="text" 
                              className="h-12 text-lg font-black bg-card text-card-foreground border-border text-foreground placeholder:text-slate-300 focus:ring-ring" 
                              value={surcharge} 
                              onChange={e => setSurcharge(e.target.value.replace(',', '.'))} 
                           />
                        </div>
                     </div>

                     <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-[2rem] space-y-8 shadow-inner">
                        <div className="flex gap-4">
                           <div className="flex-1 space-y-2">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Valor (R$)</p>
                              <Input 
                                 type="number" 
                                 className="h-14 text-2xl font-black bg-card text-card-foreground border-2 border-border" 
                                 value={amountInput} 
                                 onChange={e => setAmountInput(e.target.value)} 
                                 autoFocus
                              />
                           </div>

                           {activePaymentMethod.includes('cartao') && (
                              <div className="flex-1 space-y-2">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Bandeira</p>
                                 <div className="grid grid-cols-2 gap-2">
                                    {['VISA', 'MASTER', 'ELO', 'HIPER'].map(b => (
                                       <button 
                                          key={b} 
                                          onClick={() => setSelectedBrand(b)} 
                                          className={`h-11 rounded-xl text-[10px] font-black border transition-all ${selectedBrand === b ? 'bg-primary text-primary-foreground border-blue-600 text-white' : 'bg-card text-card-foreground border-border text-muted-foreground hover:border-blue-400'}`}
                                       >
                                          {b}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>

                        {activePaymentMethod === 'cartao_credito' && (
                           <div className="flex gap-4">
                              <div className="flex-1 space-y-2">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Parcelas</p>
                                 <select className="w-full h-12 bg-card text-card-foreground border border-border rounded-xl px-4 font-black text-xs" value={installments} onChange={e => setInstallments(Number(e.target.value))}>
                                    {[1,2,3,4,5,6,10,12].map(n => <option key={n} value={n}>{n}x {n === 1 ? 'À Vista' : 'Parcelado'}</option>)}
                                 </select>
                              </div>
                              <div className="flex-1 space-y-2">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Valor na Máquina (Conferência)</p>
                                 <Input 
                                    type="text" 
                                    className="h-12 border-border" 
                                    placeholder={amountInput || saldoRestante.toString()} 
                                 />
                              </div>
                           </div>
                        )}

                        <Button onClick={addPaymentRow} className="w-full h-12 bg-slate-900 font-black uppercase text-[10px] gap-2" disabled={saldoRestante <= 0}>
                           <Plus size={16}/> Adicionar Forma de Pagamento
                        </Button>
                     </div>

                     {payments.length > 0 && (
                        <div className="mt-8 space-y-3">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 italic"><Clock size={14}/> Histórico de Pagamentos</p>
                           {payments.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-4 bg-background text-foreground border border-border rounded-xl animate-in slide-in-from-right duration-300">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-black text-[10px]"><CheckCircle2 size={14}/></div>
                                    <div>
                                       <p className="text-[10px] font-black text-foreground uppercase leading-none">{p.method.replace('_', ' ')} {p.bandeira ? `(${p.bandeira})` : ''}</p>
                                       {p.parcelas && p.parcelas > 1 && <p className="text-[9px] font-bold text-muted-foreground uppercase">Parcelado em {p.parcelas}x</p>}
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="font-black text-blue-700">R$ {p.amount.toFixed(2)}</span>
                                    <button onClick={() => removePaymentRow(p.id)} className="text-red-300 hover:text-red-500 transition-colors"><X size={18}/></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
            
            {/* FOOTER - Spans whole width */}
            <div className="p-8 bg-[#fef6e4] border-t border-[#f3e5c2] flex items-center justify-between gap-4 shrink-0 shadow-lg">
               <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Venda Fácil Terminal v2.0.3</div>
               <div className="flex gap-4 flex-1 justify-end">
                  <Button variant="ghost" className="h-14 px-8 font-black uppercase text-xs text-muted-foreground hover:text-slate-600 border-border" onClick={() => setIsPaymentModalOpen(false)}>Refazer</Button>
                  <Button 
                     className="h-14 px-12 bg-primary text-primary-foreground font-black uppercase text-sm shadow-lg hover:bg-blue-700 transition-all disabled:opacity-20"
                     disabled={saldoRestante > 0.01 || loading || payments.length === 0}
                     onClick={handleFinalizeSale}
                  >
                     {loading ? 'Sincronizando...' : `CONCLUIR VENDA ${troco > 0.01 ? '(TROCO R$ '+troco.toFixed(2)+')' : '[F3]'}`}
                  </Button>
               </div>
            </div>
         </div>
      </Modal>

      {/* MODAL SUCESSO */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="✅ Venda Concluída">
         <div className="flex flex-col items-center py-10 text-center">
             <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl animate-in zoom-in duration-500">
                  <CheckCircle2 size={48} />
             </div>
             <h3 className="text-2xl font-black text-foreground mb-2">Transação Confirmada!</h3>
             <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest max-w-xs mb-8 italic">O cupom foi gerado e o estoque atualizado com sucesso.</p>
             <div className="flex gap-3 w-full max-w-sm">
                <Button className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 gap-3 font-black text-xs uppercase" onClick={() => window.print()}>
                   <Printer size={20} /> Imprimir Cupom
                </Button>
                <Button variant="ghost" className="flex-1 h-14 border-border font-black text-xs uppercase" onClick={() => setIsSuccessModalOpen(false)}>Nova Venda</Button>
             </div>
         </div>
      </Modal>

      {/* MODAL CATALOGO */}
      <Modal isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)} title="📦 Catálogo Rápido">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {products.map(p => (
               <button key={p.id} onClick={() => { addToCart(p); setIsCatalogModalOpen(false); }} className="p-4 bg-card text-card-foreground border border-border rounded-2xl hover:border-blue-500 transition-all flex flex-col items-center group">
                   <div className="w-12 h-12 bg-background text-foreground flex items-center justify-center rounded-xl mb-3 text-slate-300 group-hover:text-primary transition-colors"><Tag size={24}/></div>
                   <p className="font-black text-foreground text-[10px] uppercase leading-tight mb-1 text-center h-8 overflow-hidden">{p.nome}</p>
                   <p className="text-primary font-black text-xs italic">R$ {p.preco_venda.toFixed(2)}</p>
               </button>
            ))}
         </div>
      </Modal>

      {/* ADMIN AUTH */}
      <Modal isOpen={!!isAdminAuthOpen} onClose={() => setIsAdminAuthOpen(null)} title="🔑 Autorização Requerida">
         <form onSubmit={handleAdminVerify} className="space-y-6 pt-4 text-center">
            <Lock size={48} className="mx-auto text-red-500 animate-pulse" />
            <p className="text-xs font-black text-muted-foreground uppercase italic">Ação Restrita: {isAdminAuthOpen?.action}</p>
            <input 
              type="password" 
              placeholder="PIN" 
              className="w-full h-16 bg-background text-foreground border-2 rounded-2xl text-center text-4xl font-black tracking-[10px] focus:border-blue-500 outline-none" 
              value={adminPin} 
              onChange={e => setAdminPin(e.target.value)} 
              autoFocus 
            />
            <Button type="submit" className="w-full h-14 bg-slate-900 border-none font-black uppercase text-xs">Confirmar Liberação</Button>
         </form>
      </Modal>

      {/* QUICK ADD PRODUCT */}
      <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} title="➕ Cadastro Rápido de Produto">
         <form onSubmit={handleQuickAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Nome do Produto</label>
                  <Input value={newProduct.nome || ''} onChange={e => setNewProduct({...newProduct, nome: e.target.value})} placeholder="Ex: Coca-Cola 2L" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Preço Venda</label>
                  <Input type="number" step="0.01" value={newProduct.preco_venda || ''} onChange={e => setNewProduct({...newProduct, preco_venda: Number(e.target.value)})} placeholder="0.00" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Estoque Inicial</label>
                  <Input type="number" value={newProduct.estoque_atual || ''} onChange={e => setNewProduct({...newProduct, estoque_atual: Number(e.target.value)})} placeholder="0" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Código Barras</label>
                  <Input value={newProduct.codigo_barras || ''} onChange={e => setNewProduct({...newProduct, codigo_barras: e.target.value})} placeholder="Opcional" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Unidade</label>
                  <select className="w-full h-11 bg-background text-foreground border rounded-lg px-3 text-sm font-bold" value={newProduct.unidade} onChange={e => setNewProduct({...newProduct, unidade: e.target.value as any})}>
                     <option value="un">UN</option>
                     <option value="kg">KG</option>
                     <option value="lt">LT</option>
                     <option value="pc">PC</option>
                  </select>
               </div>
            </div>
            <Button type="submit" className="w-full bg-[#006d77] font-black uppercase text-xs">Salvar Produto</Button>
         </form>
      </Modal>

      {/* QUICK ADD CLIENT */}
      <Modal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} title="👤 Cadastro Rápido de Cliente">
         <form onSubmit={handleQuickAddClient} className="space-y-4">
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Nome Completo</label>
                  <Input value={newClient.nome || ''} onChange={e => setNewClient({...newClient, nome: e.target.value})} placeholder="Nome do cliente" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground">CPF / CNPJ</label>
                  <Input value={newClient.documento || ''} onChange={e => setNewClient({...newClient, documento: e.target.value})} placeholder="000.000.000-00" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-muted-foreground">Telefone</label>
                     <Input value={newClient.telefone || ''} onChange={e => setNewClient({...newClient, telefone: e.target.value})} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-muted-foreground">E-mail</label>
                     <Input value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="cliente@email.com" />
                  </div>
               </div>
            </div>
            <Button type="submit" className="w-full bg-[#006d77] font-black uppercase text-xs">Salvar e Vincular</Button>
         </form>
      </Modal>

      {/* IMPRESSÃO */}
      {lastSaleConfirmed && companySettings && (
        <div className="hidden">
           <ReceiptPrint sale={lastSaleConfirmed} company={companySettings} products={products} />
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default POS;
