
import React, { useState, useEffect } from 'react';
import { CalendarDays, CalendarRange, CalendarClock, TrendingUp, Users, Package, AlertTriangle } from 'lucide-react';
import { Product, Sale } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ diario: 0, semanal: 0, mensal: 0 });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load Sales
    const savedSales: Sale[] = JSON.parse(localStorage.getItem('venda-facil-sales') || '[]');
    const now = new Date();

    const diario = savedSales
      .filter(s => new Date(s.data_venda).toDateString() === now.toDateString())
      .reduce((acc, s) => acc + s.valor_total, 0);

    const matchWeek = (date: Date) => {
      const oneDay = 24 * 60 * 60 * 1000;
      return (now.getTime() - date.getTime()) < (7 * oneDay);
    };
    const semanal = savedSales
      .filter(s => matchWeek(new Date(s.data_venda)))
      .reduce((acc, s) => acc + s.valor_total, 0);

    const mensal = savedSales
      .filter(s => new Date(s.data_venda).getMonth() === now.getMonth() && new Date(s.data_venda).getFullYear() === now.getFullYear())
      .reduce((acc, s) => acc + s.valor_total, 0);

    setStats({ diario, semanal, mensal });
    setRecentSales(savedSales.slice(-5).reverse());

    // Load Products for stock alerts
    const savedProducts: Product[] = JSON.parse(localStorage.getItem('venda-facil-products') || '[]');
    setLowStockProducts(savedProducts.filter(p => p.estoque_atual < 10));
  }, []);

  const cards = [
    { title: 'Faturamento Diário', value: stats.diario, icon: CalendarDays, color: 'text-blue-500', trend: '+100%' },
    { title: 'Faturamento Semanal', value: stats.semanal, icon: CalendarRange, color: 'text-green-500', trend: '+100%' },
    { title: 'Faturamento Mensal', value: stats.mensal, icon: CalendarClock, color: 'text-purple-500', trend: '+100%' },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao Venda Fácil. Aqui está o resumo do seu dia.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">{card.title}</p>
              <h3 className="text-2xl font-black text-gray-800">{formatCurrency(card.value)}</h3>
              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-green-600">
                <TrendingUp size={14} />
                <span>Em crescimento</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg bg-gray-50 ${card.color}`}>
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Vendas Recentes</h3>
            <button className="text-blue-600 text-sm font-semibold hover:underline">Ver todas</button>
          </div>
          <div className="space-y-4">
            {recentSales.length > 0 ? recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Venda #{sale.id}</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(sale.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {sale.tipo_pagamento.toUpperCase()}
                    </p>
                  </div>
                </div>
                <p className="font-black text-gray-800">{formatCurrency(sale.valor_total)}</p>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-400">Nenhuma venda registrada hoje.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Alertas de Estoque</h3>
            <button className="text-blue-600 text-sm font-semibold hover:underline">Gerenciar</button>
          </div>
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.estoque_atual <= 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {p.estoque_atual <= 0 ? <AlertTriangle size={20} /> : <Package size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{p.nome}</p>
                    <p className="text-xs text-gray-500 font-medium">Restam apenas {p.estoque_atual} unidades</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${p.estoque_atual <= 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {p.estoque_atual <= 0 ? 'Esgotado' : 'Baixo'}
                </span>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-400">Todo o estoque está em dia!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
