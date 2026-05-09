
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  X,
  Package,
  AlertTriangle,
  Calendar,
  HelpCircle
} from 'lucide-react';
import { View, Product } from '../types';
import { db } from '../utils/databaseService';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  userName: string;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, userName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const products = await db.products.list();
      const lowStock = products.filter(p => p.estoque_atual <= 10).map(p => ({
        id: `stock-${p.id}`,
        type: 'stock',
        title: 'Estoque Baixo',
        message: `O produto ${p.nome} está com apenas ${p.estoque_atual} un. no estoque.`,
        date: new Date().toISOString()
      }));
      setNotifications(lowStock);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      try {
        const products = await db.products.list();
        const results = products.filter(p => 
          p.nome.toLowerCase().includes(term.toLowerCase()) || 
          p.codigo_barras?.includes(term)
        );
        setSearchResults(results.slice(0, 5));
        setShowSearch(true);
      } catch (err) {
        console.error('Erro na busca:', err);
      }
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  return (
    <header className="h-20 bg-card text-card-foreground/80 backdrop-blur-md border-b border-border/50 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-10">
        <nav className="flex items-center gap-8">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'relatorios', label: 'Relatórios' },
            { id: 'pdv', label: 'PDV' },
            { id: 'configuracoes', label: 'Configurações' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as View)}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
                currentView === item.id 
                  ? 'text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary text-primary-foreground after:rounded-full' 
                  : 'text-muted-foreground hover:text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar produtos..." 
            className="pl-10 pr-4 py-2.5 bg-muted text-muted-foreground border-none rounded-xl text-xs w-72 focus:outline-none focus:ring-4 focus:ring-ring/10 focus:bg-card text-card-foreground transition-all font-bold placeholder:text-muted-foreground shadow-inner"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setShowSearch(true)}
          />

          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-3 w-full bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden z-50 animate-in-up">
               <div className="p-3 border-b border-slate-50 flex items-center justify-between bg-background text-foreground/50">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-2 italic">Resultados Encontrados</span>
                  <button onClick={() => setShowSearch(false)} className="p-1 hover:bg-muted text-muted-foreground rounded-lg transition-colors"><X size={14} className="text-slate-300" /></button>
               </div>
               {searchResults.map(p => (
                 <button 
                  key={p.id}
                  className="w-full p-4 flex items-center gap-4 hover:bg-blue-50/50 transition-colors text-left group"
                  onClick={() => {
                    onNavigate('produtos');
                    setShowSearch(false);
                  }}
                 >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Package size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground uppercase leading-none">{p.nome}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Estoque: {p.estoque_atual} un.</p>
                    </div>
                 </button>
               ))}
            </div>
          )}
        </div>
        
        <button 
          className={`p-2.5 transition-all rounded-xl ${currentView === 'manual' ? 'text-primary bg-blue-50 shadow-inner' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`}
          onClick={() => onNavigate('manual')}
          title="Manual do Sistema"
        >
          <HelpCircle size={20} />
        </button>

        <div className="relative">
          <button 
            className={`relative p-2.5 transition-all rounded-xl ${showNotifications ? 'text-primary bg-blue-50 shadow-inner' : 'text-muted-foreground hover:text-primary hover:bg-muted text-muted-foreground'}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-red-500/30">
                 <span className="text-[8px] font-black text-white">{notifications.length}</span>
              </div>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-card text-card-foreground rounded-[2rem] shadow-2xl border border-border overflow-hidden z-50 animate-in-up">
               <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-background text-foreground/50">
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest italic">Notificações</span>
                  <span className="text-[9px] font-black text-primary bg-blue-100 px-3 py-1 rounded-full uppercase">{notifications.length} Alertas</span>
               </div>
               <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                       <div className="w-16 h-16 bg-background text-foreground rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-border">
                         <Bell size={24} className="text-slate-200" />
                       </div>
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Tudo limpo por aqui</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-5 border-b border-slate-50 last:border-0 hover:bg-background text-foreground/50 transition-all flex gap-4">
                         <div className={`mt-1 p-2.5 rounded-xl shrink-0 ${n.type === 'stock' ? 'bg-amber-50 text-amber-500 shadow-sm shadow-amber-500/10' : 'bg-red-50 text-red-500 shadow-sm shadow-red-500/10'}`}>
                            {n.type === 'stock' ? <AlertTriangle size={18} /> : <Calendar size={18} />}
                         </div>
                         <div>
                            <p className="text-[11px] font-black text-foreground uppercase leading-tight">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-medium">{n.message}</p>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-[10px] font-black text-foreground uppercase tracking-tight leading-none">{userName}</p>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic">Administrador</p>
          </div>
          <div className="w-11 h-11 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center text-muted-foreground border border-border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
            <User size={22} />
          </div>
        </div>
      </div>
    </header>
  );
};
