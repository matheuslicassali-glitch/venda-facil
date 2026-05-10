import { useEffect, useState } from 'react';
import { BarChart3, CloudSync, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Relatorios() {
  const [stats, setStats] = useState({ vendas: 0, totalVendas: 0, produtos: 0, ticketMedio: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: vendas }, { count: produtos }] = await Promise.all([
        supabase.from('vendas').select('valor_total'),
        supabase.from('produtos').select('*', { count: 'exact', head: true }),
      ]);
      const totalVendas = vendas?.reduce((a, v) => a + Number(v.valor_total), 0) || 0;
      const qtdVendas = vendas?.length || 0;
      setStats({ vendas: qtdVendas, totalVendas, produtos: produtos || 0, ticketMedio: qtdVendas > 0 ? totalVendas / qtdVendas : 0 });
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) return <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-slate-400 w-8 h-8" /></div>;

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
        <p className="text-slate-500 text-sm mt-1">Análise de desempenho consolidada do sistema.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total em Vendas', value: fmt(stats.totalVendas), icon: <TrendingUp size={22} className="text-emerald-500" /> },
          { label: 'Nº de Vendas', value: stats.vendas, icon: <ShoppingCart size={22} className="text-primary-500" /> },
          { label: 'Ticket Médio', value: fmt(stats.ticketMedio), icon: <BarChart3 size={22} className="text-indigo-500" /> },
          { label: 'Produtos', value: stats.produtos, icon: <Package size={22} className="text-amber-500" /> },
        ].map((s, i) => (
          <div key={i} className="glass-panel p-5">
            <div className="mb-3">{s.icon}</div>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="glass-panel p-6 text-center text-slate-400">
        <BarChart3 size={48} className="mx-auto mb-3 text-slate-300" />
        <p>Gráficos detalhados em breve.</p>
        <p className="text-sm mt-1">Os dados acima já refletem o banco de dados em tempo real.</p>
      </div>
    </div>
  );
}
