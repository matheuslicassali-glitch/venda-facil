import { useEffect, useState } from 'react';
import { Users, Search, CloudSync } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('clientes').select('*').order('nome');
      if (data) setClientes(data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
          <p className="text-slate-500 text-sm mt-1">Sua base de clientes sincronizada na nuvem.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Buscar clientes online..." className="bg-transparent border-none focus:outline-none w-full text-sm" />
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : clientes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <Users size={48} className="mb-4 text-slate-300" />
            <p>Nenhum cliente sincronizado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-200/50">
                  <th className="p-4 font-medium">Nome / Razão Social</th>
                  <th className="p-4 font-medium">Documento</th>
                  <th className="p-4 font-medium">Contato</th>
                  <th className="p-4 font-medium">Cidade/UF</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{c.nome}</td>
                    <td className="p-4 text-slate-500 text-sm">{c.documento}</td>
                    <td className="p-4 text-slate-500 text-sm">{c.telefone || c.email || '-'}</td>
                    <td className="p-4 text-slate-500 text-sm">{c.cidade ? `${c.cidade}/${c.uf}` : '-'}</td>
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
