import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  CalendarRange, 
  CalendarClock, 
  TrendingUp, 
  BarChart3, 
  ShoppingCart, 
  DollarSign,
  Zap,
  LayoutGrid,
  ChevronRight,
  Package,
  AlertTriangle
} from 'lucide-react';
import { db } from '../utils/databaseService';
import { Product, Sale } from '../types';

const nav = (view: string) => window.dispatchEvent(new CustomEvent('navigate', { detail: view }));

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ diario: 0, semanal: 0, mensal: 0 });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [allSales, allProducts] = await Promise.all([db.sales.list(), db.products.list()]);
      const now = new Date();

      const diario = allSales
        .filter(s => s.status !== 'cancelada' && new Date(s.data_venda).toDateString() === now.toDateString())
        .reduce((acc, s) => acc + s.valor_total, 0);

      const semanal = allSales
        .filter(s => s.status !== 'cancelada' && (now.getTime() - new Date(s.data_venda).getTime()) < 7 * 24 * 60 * 60 * 1000)
        .reduce((acc, s) => acc + s.valor_total, 0);

      const mensal = allSales
        .filter(s => s.status !== 'cancelada' && new Date(s.data_venda).getMonth() === now.getMonth() && new Date(s.data_venda).getFullYear() === now.getFullYear())
        .reduce((acc, s) => acc + s.valor_total, 0);

      setStats({ diario, semanal, mensal });
      setRecentSales(allSales.slice(0, 5));
      setLowStockProducts(allProducts.filter(p => p.estoque_atual < 10));
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const quickLinks = [
    { label: 'PDV (F2)', icon: ShoppingCart, view: 'pdv', color: 'bg-primary text-primary-foreground', desc: 'Vendas rápidas' },
    { label: 'FINANCEIRO', icon: DollarSign, view: 'financeiro', color: 'bg-slate-900', desc: 'Contas e Caixas' },
    { label: 'CADASTROS', icon: LayoutGrid, view: 'produtos', color: 'bg-indigo-600', desc: 'Produtos/Clientes' },
    { label: 'RELATÓRIOS', icon: BarChart3, view: 'relatorios', color: 'bg-emerald-600', desc: 'Análise de dados' },
  ];

  return (
    <div className="animate-in-up space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-card text-card-foreground p-12 rounded-[3rem] shadow-premium border border-border relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary text-primary-foreground/5 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:bg-primary text-primary-foreground/10 transition-colors duration-700"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="px-4 py-1.5 bg-blue-50 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border border-blue-100/50 shadow-sm">
                <div className="w-2 h-2 bg-primary text-primary-foreground rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
                Terminal Ativo
             </div>
             <span className="text-slate-300 font-bold text-[10px] uppercase tracking-widest leading-none">v2.0.4 Premium</span>
          </div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter mb-3 leading-none">Visão Geral do <br/><span className="text-primary">Seu Negócio</span></h1>
          <p className="text-muted-foreground font-medium text-lg tracking-tight">Gerencie suas vendas e estoque com inteligência em tempo real.</p>
        </div>

        <div className="relative z-10 flex gap-6">
            <div className="bg-background text-foreground/50 backdrop-blur-sm px-10 py-6 rounded-[2rem] border border-border flex flex-col items-end shadow-inner">
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Faturamento de Hoje</p>
               <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-foreground tracking-tighter leading-none">{formatCurrency(stats.diario)}</span>
                  <div className="w-12 h-12 bg-card text-card-foreground rounded-2xl flex items-center justify-center text-primary border border-border shadow-sm group-hover:scale-110 transition-transform">
                     <TrendingUp size={24} />
                  </div>
               </div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((q, i) => (
          <button key={i} onClick={() => nav(q.view)}
            className="bg-card text-card-foreground rounded-[2.5rem] border border-border p-8 flex flex-col gap-6 shadow-sm hover:shadow-premium-lg hover:border-blue-500/20 transition-all duration-300 hover:-translate-y-2 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 group-hover:scale-150 transition-all duration-500 text-primary">
               <q.icon size={120} />
            </div>
            <div className={`w-14 h-14 ${q.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-300`}>
               <q.icon size={28} />
            </div>
            <div>
               <span className="font-black text-xs uppercase tracking-[0.2em] block mb-1 text-foreground">{q.label}</span>
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{q.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Hoje', val: stats.diario, icon: CalendarDays, color: 'text-primary', bg: 'bg-blue-50', trend: '+14% vs ontem' },
          { label: '7 Dias', val: stats.semanal, icon: CalendarRange, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Desempenho Estável' },
          { label: 'Mensal', val: stats.mensal, icon: CalendarClock, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Meta em 85%' }
        ].map((s, i) => (
          <div key={i} className="bg-card text-card-foreground p-10 rounded-[2.5rem] shadow-premium border border-border relative overflow-hidden card-hover">
            <div className={`absolute top-0 right-0 p-8 opacity-5 ${s.color}`}>
              <s.icon size={64} />
            </div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              {s.label} <s.icon size={16} className={s.color} />
            </p>
            <h3 className="text-4xl font-black text-foreground tracking-tighter mb-3 leading-none">{formatCurrency(s.val)}</h3>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tight ${s.color}`}>
               <TrendingUp size={14} /> <span>{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card text-card-foreground rounded-[3rem] shadow-premium border border-border overflow-hidden flex flex-col">
          <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-background text-foreground/30">
            <h3 className="font-black text-xs text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
               <div className="p-2 bg-blue-100 rounded-lg text-primary"><DollarSign size={18} /></div> 
               Fluxo de Operações
            </h3>
            <button onClick={() => nav('relatorios')} className="bg-card text-card-foreground text-muted-foreground border border-border px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-primary hover:border-blue-200 transition-all shadow-sm">
              Análise Completa
            </button>
          </div>
          <div className="flex-1">
            {recentSales.length > 0 ? recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-10 py-7 border-b last:border-0 border-slate-50 group hover:bg-background text-foreground/50 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${sale.status === 'cancelada' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-primary'}`}>
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground tracking-tight uppercase leading-none mb-1.5">Venda #{sale.id?.substring(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      {new Date(sale.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} &bull; Sincronizado
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className={`text-xl font-black tracking-tighter ${sale.status === 'cancelada' ? 'text-red-400 line-through' : 'text-foreground'}`}>{formatCurrency(sale.valor_total)}</p>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center flex flex-col items-center justify-center grayscale opacity-30">
                 <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-6">
                   <ShoppingCart size={32} className="text-muted-foreground" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aguardando operações</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-[3rem] shadow-premium border border-border overflow-hidden flex flex-col">
          <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-background text-foreground/30">
            <h3 className="font-black text-xs text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
               <div className="p-2 bg-orange-100 rounded-lg text-orange-500"><Package size={18} /></div>
               Alertas de Estoque
            </h3>
            <button onClick={() => nav('estoque')} className="text-orange-500 text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
              Repor Estoque <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex-1">
            {lowStockProducts.length > 0 ? lowStockProducts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-10 py-7 border-b last:border-0 border-slate-50 hover:bg-orange-50/30 transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${p.estoque_atual <= 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {p.estoque_atual <= 0 ? <AlertTriangle size={24} /> : <Package size={24} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground tracking-tight uppercase leading-none mb-1.5 group-hover:text-orange-700 transition-colors">{p.nome}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Nível Crítico: {p.estoque_atual} {p.unidade} restantes</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className={`px-5 py-2 text-[9px] font-black rounded-xl uppercase tracking-[0.2em] shadow-lg ${p.estoque_atual <= 0 ? 'bg-red-600 text-white shadow-red-600/20' : 'bg-orange-500 text-white shadow-orange-500/20'}`}>
                     {p.estoque_atual <= 0 ? 'Esgotado' : 'Atenção'}
                   </span>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center flex flex-col items-center justify-center grayscale opacity-30">
                 <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-6">
                   <Package size={32} className="text-muted-foreground" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estoque Otimizado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
