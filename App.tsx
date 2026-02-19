
import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Invoices from './pages/Invoices';
import Suppliers from './pages/Suppliers';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import Cashier from './pages/Cashier';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import CommonSales from './pages/CommonSales';
import { View } from './types';
import { Toast } from './components/ui/Toast';
// Fix: Import missing Button component
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Simple authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string, name: string } | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('venda-facil-auth');
    const userData = localStorage.getItem('venda-facil-user');
    if (auth === 'true') {
      setIsAuthenticated(true);
      setView('dashboard');
      if (userData) setUser(JSON.parse(userData));
    }

    const handleGlobalNav = (e: any) => setView(e.detail);
    window.addEventListener('navigate', handleGlobalNav);
    return () => window.removeEventListener('navigate', handleGlobalNav);
  }, []);

  const handleLogin = (userData?: { email: string, name: string }) => {
    setIsAuthenticated(true);
    setView('dashboard');
    localStorage.setItem('venda-facil-auth', 'true');
    if (userData) {
      setUser(userData);
      localStorage.setItem('venda-facil-user', JSON.stringify(userData));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView('login');
    setUser(null);
    localStorage.removeItem('venda-facil-auth');
    localStorage.removeItem('venda-facil-user');
    showToast('Sessão encerrada.', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'produtos': return <Products onNotify={showToast} />;
      case 'pdv': return <POS onNotify={showToast} />;
      case 'relatorios': return <Reports />;
      case 'nfe': return <Invoices />;
      case 'fornecedores': return <Suppliers onNotify={showToast} />;
      case 'funcionarios': return <Employees onNotify={showToast} />;
      case 'estoque': return <Inventory onNotify={showToast} />;
      case 'clientes': return <Clients onNotify={showToast} />;
      case 'caixa': return <Cashier onNotify={showToast} />;
      case 'financeiro': return <Finance onNotify={showToast} />;
      case 'configuracoes': return <Settings onNotify={showToast} />;
      case 'venda_comum': return <CommonSales />;
      default: return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-400">Módulo em Ajuste</h2>
          <p className="text-gray-500">A funcionalidade <strong>{view.toUpperCase()}</strong> está sendo calibrada para seu negócio.</p>
          <Button variant="primary" className="mt-6" onClick={() => setView('dashboard')}>Voltar ao Início</Button>
        </div>
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} onNotify={showToast} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Sidebar
        currentView={view}
        onNavigate={setView}
        onLogout={handleLogout}
      />

      <main className="pl-64 min-h-screen transition-all duration-300">
        <div className="p-8 max-w-[1400px] mx-auto">
          <div className="flex justify-end mb-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase leading-none mb-0.5">Operador</p>
                <span className="text-sm font-semibold text-gray-700">{user?.name || 'Usuário'}</span>
              </div>
            </div>
          </div>
          {renderView()}
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
