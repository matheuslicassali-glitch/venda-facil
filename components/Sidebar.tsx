import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PackagePlus,
  Boxes,
  FileText,
  Truck,
  Users,
  ChartBar,
  LogOut,
  Wallet,
  Users2,
  BadgeDollarSign,
  Settings as SettingsIcon,
  ReceiptText,
  Zap,
  Power,
  ShoppingCart as ShoppingCartIcon,
  HelpCircle,
} from 'lucide-react';
import { View, Permission } from '../types';
import Logo from './Logo';
import { ConfirmDialog } from './ui/ConfirmDialog';


interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  permissions: Permission[];
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, permissions, currentTheme = 'light', onThemeChange }) => {
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pdv', label: 'PDV', icon: ShoppingBag },
    { id: 'produtos', label: 'Produtos', icon: PackagePlus },
    { id: 'estoque', label: 'Estoque', icon: Boxes },
    { id: 'nfe', label: 'NFe / NFC-e', icon: FileText },
    { id: 'caixa', label: 'Caixa / POS', icon: Wallet },
    { id: 'financeiro', label: 'Financeiro', icon: BadgeDollarSign },
    { id: 'clientes', label: 'Clientes', icon: Users2 },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'funcionarios', label: 'Funcionários', icon: Users },
    { id: 'relatorios', label: 'Relatórios', icon: ChartBar },
    { id: 'venda_comum', label: 'Venda Geral', icon: ReceiptText },
    { id: 'configuracoes', label: 'Configurações', icon: SettingsIcon },
    { id: 'manual', label: 'Manual', icon: HelpCircle },
  ];

  const themes = [
    { id: 'light', label: 'Light', color: 'bg-slate-200' },
    { id: 'midnight', label: 'Midnight', color: 'bg-slate-900' },
    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
    { id: 'amber', label: 'Amber', color: 'bg-amber-500' },
    { id: 'rose', label: 'Rose', color: 'bg-rose-500' },
  ];

  return (
    <div className="w-64 bg-card text-card-foreground border-r border-border h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 overflow-hidden theme-transition">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary text-primary-foreground/10 blur-[80px] -z-10"></div>
      
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8 group">
          <Logo size={48} className="group-hover:scale-110 transition-transform duration-300" />
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tighter uppercase leading-none">Venda Fácil</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">Professional</span>
          </div>
        </div>

        <nav className="space-y-1 custom-scrollbar overflow-y-auto h-[calc(100vh-320px)] pr-2">
          {menuItems.filter(item => {
            if (!permissions || !Array.isArray(permissions)) return item.id === 'dashboard';
            if (permissions.includes('all')) return true;
            if (item.id === 'dashboard') return true;
            return permissions.includes(item.id as Permission);
          }).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left group relative ${
                currentView === item.id
                  ? 'bg-primary text-primary-foreground font-bold shadow-lg translate-x-1'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon size={18} className={currentView === item.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary transition-colors'} />
              <span className="text-[10px] uppercase font-black tracking-widest">{item.label}</span>
              {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-card text-card-foreground rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-border bg-card/50 backdrop-blur-sm">
        {onThemeChange && (
          <div className="p-4 border-b border-border flex justify-center gap-2">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                title={t.label}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${t.color} ${currentTheme === t.id ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:scale-110'}`}
              />
            ))}
          </div>
        )}
        <div className="p-4 space-y-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all text-left group"
          >
            <LogOut size={18} className="group-hover:text-red-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sair do Sistema</span>
          </button>
        <button 
          onClick={() => setShowExitConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left group border border-transparent hover:border-red-500/20"
        >
          <Power size={18} className="text-red-500/40 group-hover:text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Desligar Terminal</span>
        </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={async () => {
          try { await fetch('/api/sistema/sair', { method: 'POST' }); }
          catch(e) { await fetch('http://localhost:3001/api/sistema/sair', { method: 'POST' }); }
        }}
        title="Encerrar Sistema"
        message="Deseja realmente encerrar o sistema e fechar o terminal?"
        confirmLabel="Sim, Sair"
        cancelLabel="Voltar"
        type="danger"
      />
    </div>

  );
};

export default Sidebar;
