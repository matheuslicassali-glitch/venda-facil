import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Users, Package, LayoutDashboard, Search, Bell, Menu, BarChart3, CloudSync, DollarSign, Truck, UserCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Clientes from './pages/Clientes';
import Vendas from './pages/Vendas';
import Funcionarios from './pages/Funcionarios';
import Financeiro from './pages/Financeiro';
import Fornecedores from './pages/Fornecedores';
import Relatorios from './pages/Relatorios';
import Sincronizacao from './pages/Sincronizacao';
import PDV from './pages/PDV';
import Caixa from './pages/Caixa';

function Layout() {
  const location = useLocation();
  const p = location.pathname;

  const nav = [
    { to: '/', icon: <LayoutDashboard size={18} />, text: 'Dashboard' },
    { to: '/vendas', icon: <ShoppingCart size={18} />, text: 'Vendas' },
    { to: '/produtos', icon: <Package size={18} />, text: 'Produtos' },
    { to: '/clientes', icon: <Users size={18} />, text: 'Clientes' },
    { to: '/funcionarios', icon: <UserCheck size={18} />, text: 'Funcionários' },
    { to: '/financeiro', icon: <DollarSign size={18} />, text: 'Financeiro' },
    { to: '/fornecedores', icon: <Truck size={18} />, text: 'Fornecedores' },
    { to: '/relatorios', icon: <BarChart3 size={18} />, text: 'Relatórios' },
    { to: '/pdv', icon: <ShoppingCart size={18} />, text: 'PDV (Frente Loja)' },
    { to: '/caixa', icon: <Package size={18} />, text: 'Caixa' },
    { to: '/sincronizacao', icon: <CloudSync size={18} />, text: 'Sincronização' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200/50">
          <div className="bg-primary-600 p-2 rounded-xl text-white shadow-lg">
            <ShoppingCart size={22} />
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
            Venda Fácil <span className="text-sm font-medium text-slate-500">Cloud</span>
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(item => (
            <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
              p === item.to ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}>
              {item.icon}<span>{item.text}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 glass-panel m-4 ml-0 md:ml-4 mb-0 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-slate-500"><Menu size={22}/></button>
            <div className="hidden sm:flex items-center bg-white/50 rounded-lg px-3 py-2 border border-slate-200 w-64 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm placeholder:text-slate-400"/>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-white/50"><Bell size={18} className="text-slate-600" /></button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs shadow-md">AD</div>
              <span className="hidden lg:block text-sm font-medium text-slate-700">Admin</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/pdv" element={<PDV />} />
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/sincronizacao" element={<Sincronizacao />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return <Router><Layout /></Router>;
}

export default App;
