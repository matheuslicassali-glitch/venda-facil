import { useEffect, useState } from 'react';
import { Truck, Search, CloudSync } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('fornecedores').select('*').order('nome');
      if (data) setFornecedores(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fornecedores</h2>
          <p className="text-slate-500 text-sm mt-1">Fornecedores cadastrados e sincronizados na nuvem.</p>
        </div>
      </div>
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Buscar fornecedores..." className="bg-transparent border-none focus:outline-none w-full text-sm" />
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : fornecedores.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Truck size={48} className="text-slate-300" />
            <p>Nenhum fornecedor sincronizado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs border-b border-slate-200/50">
                  <th className="p-4">Nome</th><th className="p-4">CNPJ</th><th className="p-4">E-mail</th>
                  <th className="p-4">Telefone</th><th className="p-4">Endereço</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map(f => (
                  <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4 font-semibold">{f.nome}</td>
                    <td className="p-4 text-xs font-mono text-slate-500">{f.cnpj}</td>
                    <td className="p-4 text-sm text-slate-500">{f.email || '-'}</td>
                    <td className="p-4 text-sm text-slate-500">{f.telefone || '-'}</td>
                    <td className="p-4 text-sm text-slate-500">{f.endereco || '-'}</td>
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
