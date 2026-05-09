
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, ShoppingBag, Receipt, Package,
  DollarSign, ShieldCheck, Lock, CheckCircle2, XCircle,
  CreditCard, Banknote, QrCode, User, Wallet, AlertTriangle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { db } from '../utils/databaseService';
import { Sale, Permission } from '../types';
import { printReport, fmtCurPrint } from '../utils/printUtils';
import { Button } from '../components/ui/Button';
import { Download } from 'lucide-react';

interface ReportsProps {
  currentUser?: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

type PeriodType = 'diario' | 'semanal' | 'mensal' | 'completo';

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  pix: 'PIX',
  fiado: 'Fiado',
};

const PAYMENT_COLORS: Record<string, string> = {
  dinheiro: '#22c55e',
  cartao_credito: '#6366f1',
  cartao_debito: '#3b82f6',
  pix: '#f59e0b',
  fiado: '#ef4444',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

const fmtCur = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR');

const Reports: React.FC<ReportsProps> = ({ currentUser }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashHistory, setCashHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('semanal');
  const [expandedCash, setExpandedCash] = useState<string | null>(null);
  const [cashTransactions, setCashTransactions] = useState<Record<string, any[]>>({});

  const isAdminOrGerente = currentUser?.cargo === 'Administrador' || currentUser?.cargo === 'Gerente';

  const handlePrintReports = () => {
    const tableSales = salesConcluidas.map(s => `
      <tr>
        <td>${fmtDate(s.data_venda)}</td>
        <td>${s.id?.substring(0, 8).toUpperCase()}</td>
        <td><span class="badge badge-blue">${PAYMENT_LABELS[s.tipo_pagamento] || s.tipo_pagamento}</span></td>
        <td class="text-center">${s.itens?.length || 0}</td>
        <td class="text-right">${fmtCurPrint(s.valor_total)}</td>
      </tr>
    `).join('');

    const cancelSales = salesCanceladas.map(s => `
      <tr>
        <td>${fmtDate(s.data_venda)}</td>
        <td>${s.id?.substring(0, 8).toUpperCase()}</td>
        <td class="text-right">${fmtCurPrint(s.valor_total)}</td>
      </tr>
    `).join('');

    const body = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Faturamento</div><div class="kpi-value">${fmtCurPrint(totalFaturamento)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Efetuadas</div><div class="kpi-value">${salesConcluidas.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Canceladas</div><div class="kpi-value">${salesCanceladas.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Ticket Medio</div><div class="kpi-value">${fmtCurPrint(ticketMedio)}</div></div>
      </div>
      <div class="section-title">Vendas Efetuadas</div>
      <table><thead><tr><th>Data</th><th>ID</th><th>PGTO</th><th class="text-center">Itens</th><th class="text-right">Total</th></tr></thead><tbody>${tableSales}</tbody></table>
      ${salesCanceladas.length > 0 ? `
        <div class="section-title">Vendas Canceladas</div>
        <table><thead><tr><th>Data</th><th>ID</th><th class="text-right">Valor</th></tr></thead><tbody>${cancelSales}</tbody></table>
      ` : ''}
    `;
    printReport('Relatorio de Vendas & Desempenho', body);
  };

  useEffect(() => {
    if (isAdminOrGerente) loadData();
  }, [isAdminOrGerente]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, cash] = await Promise.all([db.sales.list(), db.cashier.listHistory()]);
      setSales(s || []);
      setCashHistory(cash || []);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (items: any[], dateField: string) => {
    const now = new Date();
    return items.filter(item => {
      const d = new Date(item[dateField]);
      if (period === 'diario') return d.toDateString() === now.toDateString();
      if (period === 'semanal') {
        const w = new Date(); w.setDate(now.getDate() - 7);
        return d >= w;
      }
      if (period === 'mensal') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true; // completo
    });
  };

  const filteredSales = useMemo(() => filterByPeriod(sales, 'data_venda'), [sales, period]);

  // Separação por status
  const salesConcluidas = filteredSales.filter(s => s.status !== 'cancelada');
  const salesCanceladas = filteredSales.filter(s => s.status === 'cancelada');

  // KPIs
  const totalFaturamento = salesConcluidas.reduce((a, s) => a + (s.valor_total || 0), 0);
  const totalDesconto = salesConcluidas.reduce((a, s) => a + (s.desconto_total || 0), 0);
  const totalCancelado = salesCanceladas.reduce((a, s) => a + (s.valor_total || 0), 0);
  const ticketMedio = salesConcluidas.length > 0 ? totalFaturamento / salesConcluidas.length : 0;

  // Por forma de pagamento
  const byPayment = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    salesConcluidas.forEach(s => {
      const m = s.tipo_pagamento || 'outro';
      if (!map[m]) map[m] = { count: 0, total: 0 };
      map[m].count++;
      map[m].total += s.valor_total || 0;
    });
    return Object.entries(map).map(([key, val]) => ({
      name: PAYMENT_LABELS[key] || key,
      key,
      count: val.count,
      total: val.total,
    })).sort((a, b) => b.total - a.total);
  }, [salesConcluidas]);

  // Chart data faturamento por dia/hora/mês
  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap: Record<string, { name: string; faturamento: number; cancelado: number }> = {};

    if (period === 'diario') {
      for (let h = 0; h < 24; h++) {
        dataMap[String(h)] = { name: `${String(h).padStart(2, '0')}h`, faturamento: 0, cancelado: 0 };
      }
      filteredSales.forEach(s => {
        const h = String(new Date(s.data_venda).getHours());
        if (dataMap[h]) {
          if (s.status === 'cancelada') dataMap[h].cancelado += s.valor_total || 0;
          else dataMap[h].faturamento += s.valor_total || 0;
        }
      });
    } else if (period === 'semanal') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        dataMap[d.toDateString()] = { name: days[d.getDay()], faturamento: 0, cancelado: 0 };
      }
      filteredSales.forEach(s => {
        const k = new Date(s.data_venda).toDateString();
        if (dataMap[k]) {
          if (s.status === 'cancelada') dataMap[k].cancelado += s.valor_total || 0;
          else dataMap[k].faturamento += s.valor_total || 0;
        }
      });
    } else if (period === 'mensal') {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        dataMap[String(d)] = { name: String(d), faturamento: 0, cancelado: 0 };
      }
      filteredSales.forEach(s => {
        const k = String(new Date(s.data_venda).getDate());
        if (dataMap[k]) {
          if (s.status === 'cancelada') dataMap[k].cancelado += s.valor_total || 0;
          else dataMap[k].faturamento += s.valor_total || 0;
        }
      });
    } else {
      // completo - por mês
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      for (let m = 0; m < 12; m++) {
        dataMap[String(m)] = { name: months[m], faturamento: 0, cancelado: 0 };
      }
      filteredSales.forEach(s => {
        const k = String(new Date(s.data_venda).getMonth());
        if (dataMap[k]) {
          if (s.status === 'cancelada') dataMap[k].cancelado += s.valor_total || 0;
          else dataMap[k].faturamento += s.valor_total || 0;
        }
      });
    }
    return Object.values(dataMap);
  }, [filteredSales, period]);

  // Caixas filtrados
  const filteredCash = useMemo(() => filterByPeriod(cashHistory, 'aberto_em'), [cashHistory, period]);

  const loadCashTransactions = async (caixaId: string) => {
    if (cashTransactions[caixaId]) return;
    try {
      const txs = await db.cashier.getTransactions(caixaId);
      setCashTransactions(prev => ({ ...prev, [caixaId]: txs || [] }));
    } catch { }
  };

  const toggleCash = async (id: string) => {
    if (expandedCash === id) { setExpandedCash(null); return; }
    setExpandedCash(id);
    await loadCashTransactions(id);
  };

  const periodLabel: Record<PeriodType, string> = {
    diario: 'Hoje por Hora', semanal: 'Últimos 7 Dias', mensal: 'Este Mês', completo: 'Histórico Completo'
  };

  if (!isAdminOrGerente) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-inner border border-amber-100">
          <Lock size={48} />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Relatórios Privados</h2>
        <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-medium">
          Apenas <span className="text-amber-600">Administradores</span> e <span className="text-amber-600">Gerentes</span> podem acessar as métricas de faturamento global da empresa.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8 pb-20">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit mb-1">
            <ShieldCheck size={10} /> Canal de Dados Seguro
          </span>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Relatórios de Vendas & Caixa</h1>
          <p className="text-muted-foreground font-medium text-sm">Análise detalhada por período, forma de pagamento e movimentação de caixa</p>
        </div>
        <div className="flex bg-card text-card-foreground rounded-2xl border shadow-sm p-1.5 gap-1 flex-wrap">
          {(['diario', 'semanal', 'mensal', 'completo'] as PeriodType[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-[10px] font-black rounded-xl capitalize transition-all ${period === p ? 'bg-primary text-primary-foreground shadow-lg scale-105' : 'text-muted-foreground hover:text-gray-600'}`}>
              {p}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-100 mx-1 hidden sm:block self-center"></div>
          <button onClick={handlePrintReports}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-primary hover:bg-blue-50 transition-all rounded-xl border border-blue-100 ml-1">
            <Download size={14} /> 🖨️ Imprimir / PDF
          </button>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Faturamento Bruto', value: fmtCur(totalFaturamento), icon: TrendingUp, color: 'text-primary', bg: 'bg-blue-50' },
          { label: 'Vendas Efetuadas', value: salesConcluidas.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Vendas Canceladas', value: salesCanceladas.length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Ticket Médio', value: fmtCur(ticketMedio), icon: Receipt, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((item, idx) => (
          <div key={idx} className="bg-card text-card-foreground p-5 rounded-3xl shadow-sm border border-border hover:shadow-lg transition-all">
            <div className={`w-11 h-11 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 shadow-inner`}>
              <item.icon size={22} />
            </div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
            <h4 className="text-2xl font-black text-foreground tracking-tighter">{item.value}</h4>
          </div>
        ))}
      </div>

      {/* Valores de cancelado e desconto */}
      {(totalCancelado > 0 || totalDesconto > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {totalCancelado > 0 && (
            <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Total Cancelado (Perdido)</p>
                <p className="text-2xl font-black text-red-600 tracking-tighter mt-1">{fmtCur(totalCancelado)}</p>
              </div>
              <XCircle size={36} className="text-red-200" />
            </div>
          )}
          {totalDesconto > 0 && (
            <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Total em Descontos</p>
                <p className="text-2xl font-black text-orange-600 tracking-tighter mt-1">{fmtCur(totalDesconto)}</p>
              </div>
              <AlertTriangle size={36} className="text-orange-200" />
            </div>
          )}
        </div>
      )}

      {/* CHART + PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área Chart */}
        <div className="lg:col-span-2 bg-card text-card-foreground p-6 rounded-3xl shadow-sm border border-border">
          <h3 className="font-black text-foreground text-[10px] uppercase tracking-widest flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-primary" /> Faturamento × Cancelamentos — {periodLabel[period]}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 900 }} formatter={(v: any) => fmtCur(Number(v))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 900 }} />
                <Bar dataKey="faturamento" name="Efetuado" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cancelado" name="Cancelado" fill="#fca5a5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie por forma de pagamento */}
        <div className="bg-card text-card-foreground p-6 rounded-3xl shadow-sm border border-border">
          <h3 className="font-black text-foreground text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-primary" /> Por Forma de Pagamento
          </h3>
          {byPayment.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byPayment} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4}>
                      {byPayment.map((entry, i) => <Cell key={i} fill={PAYMENT_COLORS[entry.key] || PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmtCur(Number(v))} contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 900 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {byPayment.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PAYMENT_COLORS[p.key] || PIE_COLORS[i] }} />
                      <span className="font-black text-gray-600">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-foreground">{fmtCur(p.total)}</span>
                      <span className="text-muted-foreground ml-1">({p.count}x)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <CreditCard size={40} className="mb-2" />
              <p className="text-[10px] font-black uppercase">Sem dados no período</p>
            </div>
          )}
        </div>
      </div>

      {/* LISTA DE VENDAS EFETUADAS */}
      <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-emerald-50/30 flex items-center justify-between">
          <h3 className="font-black text-foreground text-[10px] uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" /> Vendas Efetuadas ({salesConcluidas.length})
          </h3>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">{fmtCur(totalFaturamento)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background text-foreground border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4">Data/Hora</th>
                <th className="px-5 py-4">ID Venda</th>
                <th className="px-5 py-4">Forma PGTO</th>
                <th className="px-5 py-4">Parcelas</th>
                <th className="px-5 py-4">Itens</th>
                <th className="px-5 py-4">Desconto</th>
                <th className="px-5 py-4">Acréscimo</th>
                <th className="px-5 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salesConcluidas.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-300 font-black text-[10px] uppercase">Nenhuma venda efetuada no período</td></tr>
              ) : (
                salesConcluidas.slice().reverse().map(s => (
                  <tr key={s.id} className="hover:bg-muted text-muted-foreground/80 transition-all">
                    <td className="px-5 py-3 text-xs font-bold text-muted-foreground">{fmtDate(s.data_venda)}</td>
                    <td className="px-5 py-3 font-black text-[9px] text-gray-300 font-mono">#{s.id?.substring(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase" style={{ background: PAYMENT_COLORS[s.tipo_pagamento] + '22', color: PAYMENT_COLORS[s.tipo_pagamento] || '#64748b' }}>
                        {PAYMENT_LABELS[s.tipo_pagamento] || s.tipo_pagamento}
                        {s.bandeira_cartao ? ` · ${s.bandeira_cartao.toUpperCase()}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-black text-muted-foreground">{s.tipo_pagamento === 'cartao_credito' ? `${s.parcelas || 1}x` : '—'}</td>
                    <td className="px-5 py-3 text-xs font-black text-muted-foreground">{s.itens?.length || 0}</td>
                    <td className="px-5 py-3 text-xs font-black text-orange-500">{s.desconto_total > 0 ? `-${fmtCur(s.desconto_total)}` : '—'}</td>
                    <td className="px-5 py-3 text-xs font-black text-orange-400">{(s as any).acrescimo_cartao > 0 ? `+${fmtCur((s as any).acrescimo_cartao)}` : '—'}</td>
                    <td className="px-5 py-3 text-right font-black text-foreground text-sm">{fmtCur(s.valor_total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LISTA DE VENDAS CANCELADAS */}
      {salesCanceladas.length > 0 && (
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-red-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50/30 flex items-center justify-between">
            <h3 className="font-black text-foreground text-[10px] uppercase tracking-widest flex items-center gap-2">
              <XCircle size={16} className="text-red-500" /> Vendas Canceladas ({salesCanceladas.length})
            </h3>
            <span className="text-[10px] font-black text-red-700 bg-red-100 px-3 py-1 rounded-full">{fmtCur(totalCancelado)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background text-foreground border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-4">Data/Hora</th>
                  <th className="px-5 py-4">ID Venda</th>
                  <th className="px-5 py-4">Forma PGTO</th>
                  <th className="px-5 py-4">Itens</th>
                  <th className="px-5 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salesCanceladas.slice().reverse().map(s => (
                  <tr key={s.id} className="hover:bg-red-50/30 transition-all">
                    <td className="px-5 py-3 text-xs font-bold text-muted-foreground">{fmtDate(s.data_venda)}</td>
                    <td className="px-5 py-3 font-black text-[9px] text-gray-300 font-mono">#{s.id?.substring(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-gray-100 text-muted-foreground">
                        {PAYMENT_LABELS[s.tipo_pagamento] || s.tipo_pagamento}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-black text-muted-foreground">{s.itens?.length || 0}</td>
                    <td className="px-5 py-3 text-right font-black text-red-500 text-sm line-through">{fmtCur(s.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RELATÓRIO DE CAIXA DETALHADO */}
      <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-blue-50/30 flex items-center gap-2">
          <Wallet size={16} className="text-primary" />
          <h3 className="font-black text-foreground text-[10px] uppercase tracking-widest">
            Caixas Diários Detalhados ({filteredCash.length})
          </h3>
        </div>
        {filteredCash.length === 0 ? (
          <div className="py-16 text-center text-gray-300 font-black text-[10px] uppercase">Nenhum caixa no período selecionado</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredCash.slice().reverse().map((caixa: any) => {
              const isOpen = expandedCash === caixa.id;
              const txs: any[] = cashTransactions[caixa.id] || [];
              const totalEntradas = txs.filter(t => t.tipo === 'suprimento').reduce((a, t) => a + (t.valor || 0), 0);
              const totalSaidas = txs.filter(t => t.tipo === 'sangria').reduce((a, t) => a + (t.valor || 0), 0);

              return (
                <div key={caixa.id}>
                  <button onClick={() => toggleCash(caixa.id)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted text-muted-foreground/50 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-8 rounded-full ${caixa.status === 'aberto' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      <div>
                        <p className="font-black text-sm text-foreground">
                          Abertura: {new Date(caixa.aberto_em).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          {caixa.status === 'aberto' ? '🟢 Caixa Aberto' : `Fechado: ${caixa.fechado_em ? new Date(caixa.fechado_em).toLocaleString('pt-BR') : '—'}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase">Abertura</p>
                        <p className="font-black text-gray-700">{fmtCur(caixa.valor_abertura || 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase">Esperado</p>
                        <p className="font-black text-primary">{fmtCur(caixa.valor_fechamento_esperado || 0)}</p>
                      </div>
                      {caixa.valor_fechamento_real != null && (
                        <div className="text-right">
                          <p className="text-[9px] font-black text-muted-foreground uppercase">Contado</p>
                          <p className="font-black text-emerald-600">{fmtCur(caixa.valor_fechamento_real)}</p>
                        </div>
                      )}
                      <div>{isOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}</div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="bg-muted text-muted-foreground/50 border-t border-border px-6 py-4 space-y-4">
                      {/* Sumário do caixa */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Valor Abertura', val: caixa.valor_abertura || 0, color: 'text-gray-700' },
                          { label: 'Entradas (Suprimentos)', val: totalEntradas, color: 'text-emerald-600' },
                          { label: 'Saídas (Sangrias)', val: totalSaidas, color: 'text-red-500' },
                          { label: 'Saldo Esperado', val: caixa.valor_fechamento_esperado || 0, color: 'text-blue-700' },
                        ].map((item, i) => (
                          <div key={i} className="bg-card text-card-foreground rounded-2xl p-3 border border-border">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                            <p className={`font-black text-sm mt-0.5 ${item.color}`}>{fmtCur(item.val)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Detalhamento por forma de pagamento do caixa */}
                      {(() => {
                        const cashSales = sales.filter(s => {
                          const d = new Date(s.data_venda);
                          const open = new Date(caixa.aberto_em);
                          const close = caixa.fechado_em ? new Date(caixa.fechado_em) : new Date();
                          return d >= open && d <= close && s.status !== 'cancelada';
                        });
                        const payMap: Record<string, number> = {};
                        cashSales.forEach(s => {
                          const m = s.tipo_pagamento || 'outro';
                          payMap[m] = (payMap[m] || 0) + (s.valor_total || 0);
                        });
                        return Object.keys(payMap).length > 0 ? (
                          <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Recebimentos por Forma de Pagamento</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Object.entries(payMap).map(([key, val]) => (
                                <div key={key} className="bg-card text-card-foreground rounded-xl p-3 border flex items-center justify-between gap-2">
                                  <span className="text-[9px] font-black text-muted-foreground uppercase">{PAYMENT_LABELS[key] || key}</span>
                                  <span className="font-black text-sm text-foreground">{fmtCur(val)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Movimentações */}
                      {txs.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Movimentações (Suprimentos / Sangrias)</p>
                          <table className="w-full text-left">
                            <thead className="text-[9px] font-black text-muted-foreground uppercase">
                              <tr>
                                <th className="pb-1">Data</th>
                                <th className="pb-1">Tipo</th>
                                <th className="pb-1">Descrição</th>
                                <th className="pb-1 text-right">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {txs.map((tx: any, i: number) => (
                                <tr key={i} className="text-xs">
                                  <td className="py-2 font-bold text-muted-foreground">{new Date(tx.data).toLocaleString('pt-BR')}</td>
                                  <td className="py-2">
                                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${tx.tipo === 'suprimento' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                      {tx.tipo}
                                    </span>
                                  </td>
                                  <td className="py-2 text-gray-600">{tx.descricao || '—'}</td>
                                  <td className={`py-2 text-right font-black ${tx.tipo === 'suprimento' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {tx.tipo === 'suprimento' ? '+' : '-'}{fmtCur(tx.valor || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {txs.length === 0 && (
                        <p className="text-[10px] text-muted-foreground font-black uppercase italic">Nenhuma movimentação manual neste caixa</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
