import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Users, Package, LayoutDashboard, Search, Bell, Menu } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Clientes from './pages/Clientes';

function Layout() {
  const location = useLocation();

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
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} text="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/produtos" icon={<Package size={20} />} text="Produtos" active={location.pathname === '/produtos'} />
          <SidebarItem to="/clientes" icon={<Users size={20} />} text="Clientes" active={location.pathname === '/clientes'} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 glass-panel m-4 ml-0 md:ml-4 mb-0 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-slate-500"><Menu size={24}/></button>
            <div className="hidden sm:flex items-center bg-white/50 rounded-lg px-3 py-2 border border-slate-200 w-96 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm placeholder:text-slate-400"/>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-white/50 transition-colors">
              <Bell size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md">
                AD
              </div>
              <div className="hidden lg:block text-sm">
                <p className="font-medium text-slate-800">Admin</p>
                <p className="text-slate-500 text-xs">Venda Fácil Cloud</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/clientes" element={<Clientes />} />
        </Routes>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, text, active }: any) {
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-primary-50 text-primary-700 font-medium' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}>
      {icon}
      <span>{text}</span>
    </Link>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
