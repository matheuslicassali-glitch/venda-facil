import { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard, 
  Banknote, QrCode, X, CheckCircle2, LayoutGrid, Tag, Clock, Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Product, Sale, SaleItem, Client, CashSession } from '../types';

export default function PDV() {
  // Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [session, setSession] = useState<CashSession | null>(null);
  
  // UI
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [discount, setDiscount] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    checkSession();
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
        id: crypto.randomUUID(),
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
  const total = Math.max(0, subtotal - discount);

  const finalizeSale = async () => {
    setLoading(true);
    try {
      const saleId = crypto.randomUUID();
      const saleData = {
        id: saleId,
        data_venda: new Date().toISOString(),
        valor_total: total,
        desconto_total: discount,
        acrescimo_total: 0,
        tipo_pagamento: paymentMethod,
        cliente_id: selectedClient?.id,
        status: 'concluida',
        fiscal_status: 'pendente',
        sincronizado: true // Já está na nuvem
      };

      const { error: saleErr } = await supabase.from('vendas').insert(saleData);
      if (saleErr) throw saleErr;

      // Itens da venda
      const itemsData = cart.map(item => ({
        id: crypto.randomUUID(),
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

      // Baixa de estoque (simplificada no online)
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
        {/* Header de Busca */}
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
              <div className="absolute top-16 left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                {foundProducts.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 text-left transition-all border-b border-slate-50 last:border-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><Package size={18} /></div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{p.nome}</p>
                      <p className="text-xs text-primary-600 font-bold">R$ {p.preco_venda.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="secondary" className="h-14 px-8" onClick={() => setIsCatalogModalOpen(true)}>
            <LayoutGrid size={20} className="mr-2" /> Catálogo
          </Button>
        </div>

        {/* Lista de Pedido */}
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

      {/* Barra Lateral Direita */}
      <div className="w-96 bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl relative z-10">
        <div className="mb-8">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cliente</h4>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm"><User size={20}/></div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-slate-800 text-sm truncate">{selectedClient?.nome || 'Consumidor Final'}</p>
              <button className="text-[10px] text-primary-600 font-bold uppercase tracking-tight hover:underline">Vincular Cliente</button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end gap-6">
          <div className="space-y-3">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500 font-medium">
              <span>Descontos</span>
              <button onClick={() => { const d = prompt('Desconto (R$):'); if(d) setDiscount(Number(d)); }}>
                - R$ {discount.toFixed(2)}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Total do Pedido</p>
            <h2 className="text-4xl font-black text-slate-800 mb-8">
              <span className="text-lg font-normal text-slate-400 mr-2">R$</span>
              {total.toFixed(2).replace('.', ',')}
            </h2>
            
            <Button 
              size="lg" 
              className="w-full h-16 text-base" 
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <CheckCircle2 className="mr-2" /> Finalizar Venda
            </Button>
          </div>
        </div>
      </div>

      {/* Modais */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Finalizar Pagamento" maxWidth="max-w-md">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'dinheiro', icon: <Banknote />, label: 'Dinheiro' },
              { id: 'cartao_credito', icon: <CreditCard />, label: 'Cartão' },
              { id: 'pix', icon: <QrCode />, label: 'PIX' },
              { id: 'fiado', icon: <User />, label: 'Fiado' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${paymentMethod === m.id ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
              >
                {m.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl text-center">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total a Pagar</p>
            <p className="text-3xl font-black text-slate-800">R$ {total.toFixed(2)}</p>
          </div>
          <Button className="w-full h-14" disabled={loading} onClick={finalizeSale}>
            {loading ? 'Processando...' : 'Confirmar Venda'}
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

      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="✅ Venda Concluída">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Venda Finalizada com Sucesso!</h3>
          <p className="text-slate-500 text-sm mb-8">A transação foi registrada na nuvem e o estoque atualizado.</p>
          <Button variant="primary" className="w-full h-12" onClick={() => setIsSuccessModalOpen(false)}>Nova Venda</Button>
        </div>
      </Modal>
    </div>
  );
}
