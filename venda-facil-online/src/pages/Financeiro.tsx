import { useEffect, useState } from 'react';
import { DollarSign, CloudSync, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Financeiro() {
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('financeiro_contas').select('*').order('vencimento');
      if (data) setContas(data);
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const receber = contas.filter(c => c.tipo === 'receber').reduce((a, c) => a + Number(c.valor), 0);
  const pagar = contas.filter(c => c.tipo === 'pagar').reduce((a, c) => a + Number(c.valor), 0);

  const statusColor: Record<string, string> = {
    pendente: 'bg-amber-100 text-amber-700',
    pago: 'bg-emerald-100 text-emerald-700',
    cancelado: 'bg-slate-100 text-slate-500',
    vencido: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
        <p className="text-slate-500 text-sm mt-1">Contas a pagar e receber sincronizadas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl"><TrendingUp className="text-emerald-600" size={24} /></div>
          <div>
            <p className="text-slate-500 text-sm">Total a Receber</p>
            <p className="text-2xl font-bold text-emerald-600">{fmt(receber)}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-xl"><TrendingDown className="text-rose-600" size={24} /></div>
          <div>
            <p className="text-slate-500 text-sm">Total a Pagar</p>
            <p className="text-2xl font-bold text-rose-600">{fmt(pagar)}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : contas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <DollarSign size={48} className="text-slate-300" />
            <p>Nenhuma conta sincronizada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs border-b border-slate-200/50">
                  <th className="p-4">Tipo</th><th className="p-4">Descrição</th><th className="p-4">Categoria</th>
                  <th className="p-4">Vencimento</th><th className="p-4">Valor</th><th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {contas.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.tipo === 'receber' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {c.tipo === 'receber' ? '↑ Receber' : '↓ Pagar'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{c.descricao}</td>
                    <td className="p-4 text-sm text-slate-500">{c.categoria || '-'}</td>
                    <td className="p-4 text-sm text-slate-500">{fmtDate(c.vencimento)}</td>
                    <td className={`p-4 font-semibold ${c.tipo === 'receber' ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(c.valor)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor[c.status] || 'bg-slate-100 text-slate-600'}`}>
                        {c.status}
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
