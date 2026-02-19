
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
  ArrowRight
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
import { Sale, Product, Employee } from '../types';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensal'>('semanal');

  useEffect(() => {
    setSales(JSON.parse(localStorage.getItem('venda-facil-sales') || '[]'));
    setProducts(JSON.parse(localStorage.getItem('venda-facil-products') || '[]'));
    setEmployees(JSON.parse(localStorage.getItem('venda-facil-employees') || '[]'));
  }, []);

  const stats = useMemo(() => {
    const totalVendas = sales.length;
    const faturamentoTotal = sales.reduce((acc, s) => acc + s.valor_total, 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    const totalItens = sales.reduce((acc, s) => acc + s.itens.reduce((sum, item) => sum + item.quantidade, 0), 0);

    // Commissions (assuming average 5% if not specified)
    const comissaoTotal = sales.reduce((acc, s) => acc + (s.valor_total * 0.05), 0);

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
      s.itens.forEach(item => {
        if (!counts[item.produto_id]) {
          counts[item.produto_id] = { nome: item.nome, qtd: 0, valor: 0 };
        }
        counts[item.produto_id].qtd += item.quantidade;
        counts[item.produto_id].valor += item.subtotal;
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
        dataMap[dStr].faturamento += s.valor_total;
        dataMap[dStr].vendas += 1;
      }
    });

    return Object.values(dataMap);
  }, [sales]);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-gray-600">Visão analítica de faturamento e performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border shadow-sm p-1">
            {['diario', 'semanal', 'mensal'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-4 py-2 text-xs font-black rounded-lg capitalize transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="secondary" className="shadow-sm">
            <Download size={18} />
            <span>PDF</span>
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Total', value: stats.faturamentoTotal, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Vendas Realizadas', value: stats.totalVendas, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Ticket Médio', value: stats.ticketMedio, icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Comissão Estimada', value: stats.comissaoTotal, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group">
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
            <h4 className="text-2xl font-black text-gray-800">{item.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" /> Fluxo de Faturamento
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="faturamento" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorFat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2 mb-6">
            <Package size={18} className="text-orange-600" /> Produtos Mais Vendidos
          </h3>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 font-black flex items-center justify-center text-xs">#{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{p.nome}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{p.qtd} unidades vendidas</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-800">{p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${(p.valor / stats.faturamentoRaw) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-center text-gray-400 py-10 italic">Nenhum dado disponível.</p>}
          </div>
        </div>
      </div>

      {/* Detailed Sales List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
            <Receipt size={18} className="text-gray-400" /> Histórico Detalhado de Operações
          </h3>
          <button className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline">
            Ver tudo <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Cupom ID</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.slice(-10).reverse().map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">{new Date(s.data_venda).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-400">#{s.id.toUpperCase()}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-600 capitalize">{s.tipo_pagamento.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{s.itens.length} itens</td>
                  <td className="px-6 py-4 text-right font-black text-gray-800">{s.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 italic">Nenhuma venda registrada no período selecionado.</td>
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
