
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
  ReceiptText
} from 'lucide-react';
import { View, Permission } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  permissions: Permission[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, permissions }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pdv', label: 'PDV', icon: ShoppingBag },
    { id: 'produtos', label: 'Produtos', icon: PackagePlus },
    { id: 'estoque', label: 'Estoque', icon: Boxes },
    { id: 'nfe', label: 'NFe/NFCE', icon: FileText },
    { id: 'caixa', label: 'Caixa', icon: Wallet },
    { id: 'financeiro', label: 'Financeiro', icon: BadgeDollarSign },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'clientes', label: 'Clientes', icon: Users2 },
    { id: 'funcionarios', label: 'Funcionários', icon: Users },
    { id: 'relatorios', label: 'Relatórios', icon: ChartBar },
    { id: 'venda_comum', label: 'Venda Comum', icon: ReceiptText },
    { id: 'configuracoes', label: 'Configurações', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-blue-700 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">Venda Fácil</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {menuItems.filter(item => {
          if (!permissions || !Array.isArray(permissions)) return item.id === 'dashboard';
          if (permissions.includes('all')) return true;
          if (item.id === 'dashboard') return true;

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

          return permissions.includes(viewToPermission[item.id] || item.id as Permission);
        }).map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${currentView === item.id
              ? 'bg-blue-800 text-white font-semibold shadow-inner'
              : 'hover:bg-blue-800 text-blue-100'
              }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-600">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-blue-100 hover:bg-blue-800 text-left"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
