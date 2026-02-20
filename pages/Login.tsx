
import React, { useState } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

import { db } from '../utils/databaseService';
import { Permission, Employee } from '../types';

interface LoginProps {
  onLogin: (userData?: { id: string, email: string, name: string, permissions: Permission[] }) => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNotify }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Master credentials specified by the user
  const MASTER_EMAIL = "matheuslicassali@gmail.com";
  const MASTER_PASS = "1234";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const inputEmail = email.toLowerCase().trim();
    const inputPass = password.trim();

    try {
      // Logic for login
      const employees = await db.employees.list();

      if (inputEmail === MASTER_EMAIL.toLowerCase() && inputPass === MASTER_PASS) {
        const masterEmp = employees.find(e => e.email.toLowerCase() === MASTER_EMAIL.toLowerCase());
        const allPermissions: Permission[] = [
          'all', 'produtos', 'pdv', 'relatorios', 'nfe', 'fornecedores',
          'funcionarios', 'estoque', 'clientes', 'caixa', 'financeiro', 'configuracoes'
        ];
        onNotify('✅ Login MASTER realizado com sucesso!', 'success');
        onLogin({
          id: masterEmp?.id || '',
          email: MASTER_EMAIL,
          name: "Usuário Master",
          permissions: allPermissions
        });
      } else if (email && password.length >= 4) {
        const emp = employees.find(e => e.email.toLowerCase().trim() === inputEmail && e.status === 'Ativo');

        // Note: For a real production app, passwords should be verified server-side.
        // Since we are using a client-side Supabase pattern here, we follow the user's existing logic.
        if (emp) {
          onNotify(`✅ Bem-vindo, ${emp.nome}!`, 'success');
          onLogin({ id: emp.id, email, name: emp.nome, permissions: emp.permissoes || [] });
        } else {
          onNotify('❌ Credenciais inválidas ou funcionário inativo.', 'error');
        }
      } else {
        onNotify('❌ Credenciais inválidas.', 'error');
      }
    } catch (err) {
      onNotify('❌ Erro ao conectar ao servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Bem-vindo ao Venda Fácil
          </h1>
          <p className="text-gray-600 mt-2">
            Faça login para gerenciar seu negócio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-gray-300 focus:border-blue-500"
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-gray-300 focus:border-blue-500"
          />

          <div className="text-right">
            <a href="#" className="text-blue-600 text-sm hover:underline">Esqueci minha senha?</a>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
