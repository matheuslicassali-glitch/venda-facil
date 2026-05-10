import { useEffect, useState } from 'react';
import { Package, Search, CloudSync } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Produtos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('produtos').select('*').order('nome');
      if (data) setProdutos(data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catálogo de Produtos</h2>
          <p className="text-slate-500 text-sm mt-1">Todos os produtos sincronizados do PDV Desktop.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Buscar produtos online..." className="bg-transparent border-none focus:outline-none w-full text-sm" />
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : produtos.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <Package size={48} className="mb-4 text-slate-300" />
            <p>Nenhum produto sincronizado ainda.</p>
            <p className="text-sm mt-2">Abra o Venda Fácil Desktop para que a sincronização ocorra em segundo plano.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-200/50">
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">SKU</th>
                  <th className="p-4 font-medium">Preço Venda</th>
                  <th className="p-4 font-medium">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{p.nome}</td>
                    <td className="p-4 text-slate-500 text-sm">{p.sku}</td>
                    <td className="p-4 text-emerald-600 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco_venda)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${p.estoque_atual <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {p.estoque_atual} un
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
