import React, { useState } from 'react';
import { 
  Zap, 
  Mail, 
  Lock, 
  ShoppingCart,
  Power,
  ShieldCheck
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';


import { db } from '../utils/databaseService';
import { Permission } from '../types';
import Logo from '../components/Logo';

interface LoginProps {
  onLogin: (userData?: { id: string, email: string, name: string, cargo: string, permissions: Permission[] }) => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNotify }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);


  const MASTER_EMAIL = "matheuslicassali@gmail.com";
  const MASTER_PASS = "1234";

  const exitSystem = async () => {
    setShowExitConfirm(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const inputEmail = email.toLowerCase().trim();
    const inputPass = password.trim();

    try {
      const employees = await db.employees.list();
      if (inputEmail === MASTER_EMAIL.toLowerCase() && inputPass === MASTER_PASS) {
        const allPermissions: Permission[] = ['all'];
        onNotify('✅ Login MASTER realizado com sucesso!', 'success');
        onLogin({ id: 'master', email: MASTER_EMAIL, name: "Usuário Master", cargo: "Administrador", permissions: allPermissions });
      } else if (email && password.length >= 4) {
        const emp = employees.find(e => e.email.toLowerCase().trim() === inputEmail && e.status === 'Ativo');
        if (emp) {
          onNotify(`✅ Bem-vindo, ${emp.nome}!`, 'success');
          onLogin({ id: emp.id, email, name: emp.nome, cargo: emp.cargo, permissions: emp.permissoes || [] });
        } else { onNotify('❌ Credenciais inválidas ou funcionário inativo.', 'error'); }
      } else { onNotify('❌ Credenciais inválidas.', 'error'); }
    } catch (err: any) {
      onNotify(`❌ Erro ao conectar ao servidor: ${err.message || err}`, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-primary text-primary-foreground/10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-indigo-600/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-[440px] z-10 space-y-8 animate-in-up">
        <div className="flex flex-col items-center mb-10 group">
          <Logo size={120} className="mb-6 group-hover:scale-110 transition-transform duration-500" />
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Venda Fácil</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-2 italic">Professional Edition</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-12 rounded-[3rem] shadow-premium-lg border border-border">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">E-mail de Acesso</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail size={20} />
                </span>
                <input
                  type="email"
                  placeholder="admin@venda.com"
                  className="w-full h-16 pl-14 pr-6 rounded-2xl bg-muted border-none font-bold text-foreground placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-ring/20 focus:bg-background outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">Chave de Segurança</label>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock size={20} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-16 pl-14 pr-6 rounded-2xl bg-muted border-none font-bold text-foreground placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-ring/20 focus:bg-background outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
                type="submit" 
                fullWidth 
                size="lg"
                disabled={loading} 
                className="h-16 rounded-[2rem] text-sm tracking-[0.2em]"
            >
              {loading ? 'Validando Acesso...' : 'Autenticar no Sistema'}
            </Button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-8">
           <button 
            onClick={exitSystem}
            className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-all font-black text-[10px] uppercase tracking-[0.3em] group"
           >
              <Power size={14} className="group-hover:scale-125 transition-transform" />
              Sair do Terminal
           </button>
           <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-emerald-500" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">v2.0.4 PRO STABLE &bull; Ssl Encrypted</p>
           </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={async () => {
          try { await fetch('http://localhost:3001/api/sistema/sair', { method: 'POST' }); }
          catch (e) { await fetch('/api/sistema/sair', { method: 'POST' }); }
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

export default Login;
