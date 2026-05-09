import React, { useState } from 'react';
import { ShoppingCart, Users, Package, BarChart3, CloudSync, LayoutDashboard, Search, Bell, Settings } from 'lucide-react';

function App() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200/50">
          <div className="bg-primary-600 p-2 rounded-xl text-white shadow-lg">
            <ShoppingCart size={24} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
            Venda Fácil <span className="text-sm font-medium text-slate-500">Cloud</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" active />
          <SidebarItem icon={<ShoppingCart size={20} />} text="PDV Online" />
          <SidebarItem icon={<Package size={20} />} text="Produtos" />
          <SidebarItem icon={<Users size={20} />} text="Clientes" />
          <SidebarItem icon={<BarChart3 size={20} />} text="Relatórios" />
          <SidebarItem icon={<CloudSync size={20} />} text="Sincronização" />
        </nav>
        
        <div className="p-4 border-t border-slate-200/50">
          <SidebarItem icon={<Settings size={20} />} text="Configurações" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 glass-panel m-4 ml-0 md:ml-4 mb-0 flex items-center justify-between px-6">
          <div className="flex items-center bg-white/50 rounded-lg px-3 py-2 border border-slate-200 w-96 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar produtos, clientes..." 
              className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-white/50 transition-colors">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md">
                JD
              </div>
              <div className="hidden lg:block text-sm">
                <p className="font-medium text-slate-800">João Doe</p>
                <p className="text-slate-500 text-xs">Administrador</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
              <p className="text-slate-500 text-sm mt-1">Acompanhe suas vendas e sincronizações em tempo real.</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <CloudSync size={18} />
              Sincronizar Agora
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Vendas Hoje" value="R$ 4.250,00" trend="+12.5%" isPositive={true} />
            <StatCard title="Produtos Ativos" value="1.240" trend="+4" isPositive={true} />
            <StatCard title="Clientes Registrados" value="854" trend="+12" isPositive={true} />
            <StatCard title="Status de Sincronia" value="Atualizado" subtitle="Há 5 minutos" icon={<CloudSync size={24} className="text-green-500" />} />
          </div>

          {/* Charts/Tables Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Vendas Recentes (Online + Offline)</h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white/30">
                <p className="text-slate-400">Gráfico de vendas será renderizado aqui</p>
              </div>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Log de Sincronização</h3>
              <div className="space-y-4">
                <SyncLogItem time="10:45" device="Caixa 01 (Desktop)" status="success" />
                <SyncLogItem time="09:30" device="Caixa 02 (Desktop)" status="success" />
                <SyncLogItem time="08:15" device="PDV Mobile" status="warning" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, text, active = false }: { icon: React.ReactNode, text: string, active?: boolean }) {
  return (
    <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-primary-50 text-primary-700 font-medium' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}>
      {icon}
      <span>{text}</span>
    </a>
  );
}

function StatCard({ title, value, trend, isPositive, subtitle, icon }: any) {
  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        {icon && icon}
      </div>
      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-slate-800">{value}</h2>
        {trend && (
          <div className={`flex items-center mt-2 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '↑' : '↓'} {trend} desde ontem
          </div>
        )}
        {subtitle && <p className="text-slate-500 text-sm mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}

function SyncLogItem({ time, device, status }: { time: string, device: string, status: 'success' | 'warning' | 'error' }) {
  const statusColors = {
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-rose-100 text-rose-600'
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-800">{device}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
      <div className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
        {status === 'success' ? 'Sincronizado' : status === 'warning' ? 'Pendente' : 'Falhou'}
      </div>
    </div>
  );
}

export default App;
