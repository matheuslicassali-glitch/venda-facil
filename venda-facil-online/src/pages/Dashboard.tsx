import { useEffect, useState } from 'react';
import { CloudSync } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    vendasHoje: 0,
    vendasValor: 0,
    produtos: 0,
    clientes: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        console.log('Fetching dashboard data...');
        // Puxa total de clientes
        const { count: countClientes, error: errClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
        if (errClientes) console.error('Error fetching clientes:', errClientes);

        // Puxa total de produtos
        const { count: countProdutos, error: errProdutos } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
        if (errProdutos) console.error('Error fetching produtos:', errProdutos);
        
        // Puxa as vendas
        const { data: vendas, error: errVendas } = await supabase.from('vendas').select('valor_total');
        if (errVendas) console.error('Error fetching vendas:', errVendas);

        const totalVendasValor = vendas?.reduce((acc, curr) => acc + Number(curr.valor_total), 0) || 0;

        setStats({
          vendasHoje: vendas?.length || 0,
          vendasValor: totalVendasValor,
          produtos: countProdutos || 0,
          clientes: countClientes || 0
        });
      } catch (err) {
        console.error('Unexpected error in loadDashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-primary-500 w-8 h-8" /></div>;
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500 text-sm mt-1">Acompanhe suas vendas e sincronizações em tempo real diretamente do banco online.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total em Vendas" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.vendasValor)} />
        <StatCard title="Quantidade Vendas" value={stats.vendasHoje.toString()} />
        <StatCard title="Produtos Cadastrados" value={stats.produtos.toString()} />
        <StatCard title="Clientes Registrados" value={stats.clientes.toString()} />
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Sincronização em Tempo Real (Supabase)</h3>
        <p className="text-slate-600 mb-4">Seu painel Venda Fácil Cloud está escutando a base online na nuvem. Qualquer produto, cliente ou venda feita no caixa do Desktop será exibida aqui assim que sincronizada!</p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
      <h3 className="text-slate-500 text-sm font-medium relative z-10 mb-4">{title}</h3>
      <h2 className="text-3xl font-bold text-slate-800 relative z-10">{value}</h2>
    </div>
  );
}
