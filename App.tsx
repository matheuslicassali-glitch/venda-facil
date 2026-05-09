
import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import { db } from './utils/databaseService';
import { ShieldAlert, ShoppingCart, TrendingUp, Zap } from 'lucide-react';
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
import NFeManual from './pages/NFeManual';
import Manual from './pages/Manual';
import { View, Permission, Employee } from './types';
import { Toast } from './components/ui/Toast';
// Fix: Import missing Button component
import { Button } from './components/ui/Button';
import { Header } from './components/Header';

const App: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('venda-facil-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('venda-facil-theme', theme);
  }, [theme]);

  // Simple authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string, email: string, name: string, cargo: string, permissions: Permission[] } | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Theme and Initialization
  useEffect(() => {
    const handleGlobalNav = (e: any) => setView(e.detail);
    window.addEventListener('navigate', handleGlobalNav);
    
    // Forçar tela cheia pelo navegador (esconde a barra de tarefas)
    const forceFullScreen = () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch(e) {}
    };
    
    // Tenta forçar logo de início
    forceFullScreen();
    
    // Tenta forçar de novo ao clicar em qualquer lugar da tela
    document.addEventListener('click', forceFullScreen, { once: true });

    // Smooth loading transition - Runs only once
    const timer = setTimeout(() => setIsLoading(false), 2000);
    
    return () => {
      window.removeEventListener('navigate', handleGlobalNav);
      document.removeEventListener('click', forceFullScreen);
      clearTimeout(timer);
    };
  }, []);

  // Dismiss static HTML splash screen when React finishes loading
  useEffect(() => {
    if (!isLoading) {
      const splash = document.getElementById('splash-static');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
          if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 450);
      }
    }
  }, [isLoading]);

  // 2. Authentication & License Check
  useEffect(() => {
    const checkLicense = async () => {
      try {
        const settings = await db.settings.get();
        if (!settings) return;

        if (navigator.onLine) {
          try {
            const { data: remoteData, error } = await db.supabase
              .from('empresa_configuracoes')
              .select('status_licenca, validade_uso')
              .eq('cnpj', settings.cnpj.replace(/\D/g, ''))
              .single();

            if (!error && remoteData) {
              if (remoteData.status_licenca !== settings.status_licenca || remoteData.validade_uso !== settings.validade_uso) {
                 await db.settings.save({ 
                   ...settings, 
                   status_licenca: remoteData.status_licenca,
                   validade_uso: remoteData.validade_uso || settings.validade_uso
                 });
              }
            }
          } catch (supabaseErr) {
            console.warn('Falha na verificação online, mantendo verificação local.');
          }
        }

        const currentSettings = await db.settings.get(); // Refresh
        if (currentSettings?.status_licenca === 'bloqueado') {
          setIsBlocked(true);
        } else if (currentSettings?.validade_uso) {
          if (new Date() > new Date(currentSettings.validade_uso)) {
            setIsBlocked(true);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar licença:', err);
      }
    };

    const initAuth = () => {
      const auth = localStorage.getItem('venda-facil-auth');
      const userData = localStorage.getItem('venda-facil-user');
      if (auth === 'true') {
        setIsAuthenticated(true);
        setView('dashboard');
        if (userData) setUser(JSON.parse(userData));
      }
    };

    checkLicense();
    initAuth();
  }, []);

  // 3. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['F2', 'F3', 'F4'].includes(e.key)) {
        if (isAuthenticated && !isBlocked) {
          e.preventDefault();
          switch (e.key) {
            case 'F2': if (hasPermission('pdv')) setView('pdv'); break;
            case 'F3': if (hasPermission('produtos')) setView('produtos'); break;
            case 'F4': if (hasPermission('clientes')) setView('clientes'); break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, isBlocked, user]);

  const handleLogin = (userData?: { id: string, email: string, name: string, cargo: string, permissions: Permission[] }) => {
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

  const hasPermission = (v: View): boolean => {
    if (!user) return false;
    if (v === 'dashboard' || v === 'login' || v === 'manual') return true;
    if (!user.permissions) return false;
    if (user.permissions.includes('all')) return true;

    const viewToPermission: Record<string, Permission> = {
      'produtos': 'produtos',
      'pdv': 'pdv',
      'relatorios': 'relatorios',
      'nfe': 'nfe',
      'fornecedores': 'fornecedores',
      'funcionarios': 'funcionarios',
      'estoque': 'estoque',
      'clientes': 'clientes',
      'caixa': 'caixa',
      'financeiro': 'financeiro',
      'configuracoes': 'configuracoes',
      'venda_comum': 'pdv',
      'nfe_manual': 'nfe'
    };

    const required = viewToPermission[v] || (v as Permission);
    return user.permissions.includes(required);
  };



  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Sistema Bloqueado</h1>
          <p className="text-gray-500 mb-8">Detectamos que a licença do seu aplicativo expirou ou o pagamento não foi identificado.</p>
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">O que fazer?</p>
            <p className="text-gray-700 text-sm">Entre em contato com o suporte para regularizar sua situação e liberar o acesso.</p>
          </div>
          <Button
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
          >
            Falar com Suporte
          </Button>

          <Button
            variant="ghost"
            className="mt-4 w-full text-xs font-black uppercase text-gray-400 hover:text-blue-600"
            onClick={async () => {
              const email = prompt('E-mail Master:');
              const pass = prompt('Senha Master:');
              const settings = await db.settings.get();
              if (settings && email === settings.email_master && pass === settings.senha_master) {
                const serial = prompt('Novo Serial / Chave de Ativação:');
                if (serial) {
                   await db.settings.save({ ...settings, status_licenca: 'ativo', serial_chave: serial, validade_uso: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() });
                   alert('✅ Sistema Desbloqueado com Sucesso! Reiniciando...');
                   window.location.reload();
                }
              } else {
                alert('❌ Credenciais Master Inválidas!');
              }
            }}
          >
            Desbloquear Manual (Master)
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login 
          onLogin={handleLogin} 
          onNotify={showToast} 
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500 no-scrollbar">
      {view !== 'pdv' && (
        <Sidebar
          currentView={view}
          onNavigate={setView}
          onLogout={handleLogout}
          permissions={user?.permissions || []}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      )}

      <main className={`${view === 'pdv' ? 'pl-0 h-screen overflow-hidden bg-slate-950' : 'pl-64 min-h-screen'} transition-all duration-300 bg-slate-50`}>
        {view !== 'pdv' && (
          <Header 
            currentView={view} 
            onNavigate={setView} 
            userName={user?.name || 'Administrador'} 
          />
        )}
        <div className={view === 'pdv' ? 'h-full' : 'p-8 max-w-[1600px] mx-auto'}>
           {(() => {
             if (!hasPermission(view)) {
               return (
                 <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
                   <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                     <ShieldAlert size={40} />
                   </div>
                   <h2 className="text-2xl font-black text-gray-800 tracking-tight">Acesso Negado</h2>
                   <p className="text-gray-500 max-w-md mx-auto mt-2">Você não tem permissão para acessar o módulo <strong>{view.toUpperCase()}</strong>.</p>
                   <Button variant="primary" className="mt-8" onClick={() => setView('dashboard')}>Voltar ao Dashboard</Button>
                 </div>
               );
             }

             switch (view) {
               case 'dashboard': return <Dashboard />;
               case 'produtos': return <Products onNotify={showToast} currentUser={user} />;
               case 'pdv': return <POS onNotify={showToast} currentUser={user} />;
               case 'relatorios': return <Reports currentUser={user} />;
               case 'nfe': return <Invoices onNotify={showToast} currentUser={user} />;
               case 'fornecedores': return <Suppliers onNotify={showToast} currentUser={user} />;
               case 'funcionarios': return <Employees onNotify={showToast} currentUser={user} />;
               case 'estoque': return <Inventory onNotify={showToast} currentUser={user} />;
               case 'clientes': return <Clients onNotify={showToast} currentUser={user} />;
               case 'caixa': return <Cashier onNotify={showToast} currentUser={user} />;
               case 'financeiro': return <Finance onNotify={showToast} currentUser={user} />;
               case 'configuracoes': return <Settings onNotify={showToast} currentUser={user} />;
               case 'venda_comum': return <CommonSales />;
               case 'nfe_manual': return <NFeManual onNotify={showToast} currentUser={user} />;
               case 'manual': return <Manual />;
               default: return <Dashboard />;
             }
           })()}
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
