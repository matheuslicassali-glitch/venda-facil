import { useEffect, useState } from 'react';
import { Users, Search, CloudSync } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('funcionarios').select('*').order('nome');
      if (data) setFuncionarios(data);
      setLoading(false);
    }
    load();
  }, []);

  const statusColor: Record<string, string> = {
    Ativo: 'bg-emerald-100 text-emerald-700',
    Inativo: 'bg-slate-100 text-slate-500',
    Afastado: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Funcionários</h2>
          <p className="text-slate-500 text-sm mt-1">Equipe cadastrada e sincronizada na nuvem.</p>
        </div>
      </div>
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Buscar funcionários..." className="bg-transparent border-none focus:outline-none w-full text-sm" />
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : funcionarios.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Users size={48} className="text-slate-300" />
            <p>Nenhum funcionário sincronizado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs border-b border-slate-200/50">
                  <th className="p-4">Nome</th><th className="p-4">Cargo</th><th className="p-4">CPF</th>
                  <th className="p-4">E-mail</th><th className="p-4">Comissão</th><th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map(f => (
                  <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4 font-semibold">{f.nome}</td>
                    <td className="p-4 text-slate-600">{f.cargo}</td>
                    <td className="p-4 text-xs text-slate-500 font-mono">{f.cpf}</td>
                    <td className="p-4 text-sm text-slate-500">{f.email}</td>
                    <td className="p-4 text-sm">{f.comissao ? `${f.comissao}%` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor[f.status] || 'bg-slate-100 text-slate-600'}`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
