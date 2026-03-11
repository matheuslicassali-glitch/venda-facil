
import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Package,
  Users,
  DollarSign,
  Calendar,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Lock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '../components/ui/Button';
import { db } from '../utils/databaseService';
import { Sale, Product, Employee, Permission } from '../types';

interface ReportsProps {
    currentUser?: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Reports: React.FC<ReportsProps> = ({ currentUser }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensal'>('semanal');
  const [loading, setLoading] = useState(false);

  const isAdminOrGerente = currentUser?.cargo === 'Administrador' || currentUser?.cargo === 'Gerente';

  useEffect(() => {
    if (isAdminOrGerente) {
        loadData();
    }
  }, [isAdminOrGerente]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p, e] = await Promise.all([
        db.sales.list(),
        db.products.list(),
        db.employees.list()
      ]);
      setSales(s);
      setProducts(p);
      setEmployees(e);
    } catch (err) {
      console.error('Erro ao carregar dados dos relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalVendas = sales.length;
    const faturamentoTotal = sales.reduce((acc, s) => acc + (s.valor_total || 0), 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    const totalItens = sales.reduce((acc, s) => acc + (s.itens?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0), 0);
    const comissaoTotal = sales.reduce((acc, s) => acc + ((s.valor_total || 0) * 0.05), 0);

    return {
      totalVendas,
      faturamentoTotal: faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      faturamentoRaw: faturamentoTotal,
      ticketMedio: ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalItens,
      comissaoTotal: comissaoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };
  }, [sales]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { nome: string, qtd: number, valor: number }> = {};
    sales.forEach(s => {
      s.itens?.forEach(item => {
        if (!counts[item.produto_id]) {
          counts[item.produto_id] = { nome: item.nome, qtd: 0, valor: 0 };
        }
        counts[item.produto_id].qtd += (item.quantidade || 0);
        counts[item.produto_id].valor += (item.subtotal || 0);
      });
    });
    return Object.values(counts).sort((a, b) => b.qtd - a.qtd).slice(0, 5);
  }, [sales]);

  const chartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dataMap: Record<string, { name: string, faturamento: number, vendas: number }> = {};

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = days[d.getDay()];
      dataMap[d.toDateString()] = { name: label, faturamento: 0, vendas: 0 };
    }

    sales.forEach(s => {
      const dStr = new Date(s.data_venda).toDateString();
      if (dataMap[dStr]) {
        dataMap[dStr].faturamento += (s.valor_total || 0);
        dataMap[dStr].vendas += 1;
      }
    });

    return Object.values(dataMap);
  }, [sales]);

  if (!isAdminOrGerente) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
            <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-inner border border-amber-100">
                <Lock size={48} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Relatórios Privados</h2>
            <p className="text-gray-500 max-w-sm mx-auto mt-2 font-medium">
                Apenas <span className="text-amber-600">Administradores</span> e <span className="text-amber-600">Gerentes</span> podem acessar as métricas de faturamento global da empresa.
            </p>
        </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-10 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={10} /> Canal de Dados Seguro
                </span>
            </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Inteligência de Negócio</h1>
          <p className="text-gray-600 font-medium">Análise de performance, ticket-médio e saúde financeira</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-2xl border shadow-sm p-1.5 gap-1">
            {(['diario', 'semanal', 'mensal'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 text-[10px] font-black rounded-xl capitalize transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="secondary" className="shadow-lg border-gray-100 h-11 px-6">
            <Download size={18} />
            <span className="font-black text-[10px] uppercase tracking-widest">Relatório Completo</span>
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Bruto', value: stats.faturamentoTotal, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Volume de Pedidos', value: stats.totalVendas, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ticket Médio', value: stats.ticketMedio, icon: Receipt, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Previsão Comissão', value: stats.comissaoTotal, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group hover:shadow-xl">
            <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-inner`}>
              <item.icon size={28} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">{item.label}</p>
            <h4 className="text-3xl font-black text-gray-800 tracking-tighter">{item.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" /> Curva de Crescimento (7 Dias)
            </h3>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '12px' }} />
                <Area type="monotone" dataKey="faturamento" stroke="#2563EB" strokeWidth={5} fillOpacity={1} fill="url(#colorFat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-8">
            <Package size={20} className="text-orange-600" /> Produtos Curva A (Mais Vendidos)
          </h3>
          <div className="space-y-6">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-5 p-4 hover:bg-gray-50/50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 font-black flex items-center justify-center text-xs shadow-inner">#{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-800 leading-tight">{p.nome}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">{p.qtd} saídas registradas</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600">{p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <div className="w-28 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${(p.valor / (stats.faturamentoRaw || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Package size={48} className="mb-2" />
                    <p className="font-black text-[10px] uppercase tracking-widest">Sem movimentação de estoque</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Sales List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Receipt size={20} className="text-gray-400" /> Snapshot de Operações Recentes
          </h3>
          <button className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
            Auditagem Completa <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Data/Hora Log</th>
                <th className="px-8 py-5">Identificador Fiscal</th>
                <th className="px-8 py-5">Forma PGTO</th>
                <th className="px-8 py-5">Volume</th>
                <th className="px-8 py-5 text-right">Montante Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.slice(-10).reverse().map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 transition-all group">
                  <td className="px-8 py-5 text-xs font-bold text-gray-500">{new Date(s.data_venda).toLocaleString()}</td>
                  <td className="px-8 py-5">
                      <div className="font-black text-[10px] text-gray-400 font-mono tracking-tighter uppercase group-hover:text-blue-600 transition-colors">
                        #{s.id.substring(0, 13).toUpperCase()}
                      </div>
                  </td>
                  <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {s.tipo_pagamento.replace('_', ' ')}
                      </span>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-gray-400">{(s.itens?.length || 0)} ITENS</td>
                  <td className="px-8 py-5 text-right font-black text-gray-800">{s.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                         <Receipt size={32} className="text-gray-200" />
                     </div>
                     <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Lote de dados vazio</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
