import { useEffect, useState } from 'react';
import { ShoppingCart, Search, CloudSync, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Vendas() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValor, setTotalValor] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('vendas')
          .select('*, clientes(nome)')
          .order('data_venda', { ascending: false })
          .limit(100);
          
        if (error) {
          console.error('Supabase error fetching vendas:', error);
          return;
        }

        if (data) {
          setVendas(data);
          setTotalValor(data.reduce((acc, v) => acc + Number(v.valor_total), 0));
        }
      } catch (err) {
        console.error('Unexpected fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR');

  const statusColor: Record<string, string> = {
    concluida: 'bg-emerald-100 text-emerald-700',
    cancelada: 'bg-rose-100 text-rose-700',
    pendente: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Vendas</h2>
          <p className="text-slate-500 text-sm mt-1">Todas as vendas sincronizadas do PDV Desktop.</p>
        </div>
        <div className="glass-panel px-6 py-4 flex items-center gap-3">
          <TrendingUp size={20} className="text-emerald-500" />
          <div>
            <p className="text-xs text-slate-500">Total Acumulado</p>
            <p className="font-bold text-slate-800 text-lg">{fmt(totalValor)}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Buscar vendas..." className="bg-transparent border-none focus:outline-none w-full text-sm" />
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><CloudSync className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : vendas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <ShoppingCart size={48} className="text-slate-300" />
            <p>Nenhuma venda sincronizada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs border-b border-slate-200/50">
                  <th className="p-4">Data/Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Pagamento</th>
                  <th className="p-4">Desconto</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Fiscal</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => (
                  <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs text-slate-500">{fmtDate(v.data_venda)}</td>
                    <td className="p-4 text-sm">{v.clientes?.nome || <span className="text-slate-400 italic">Consumidor Final</span>}</td>
                    <td className="p-4 text-sm text-slate-600">{v.tipo_pagamento || '-'}</td>
                    <td className="p-4 text-sm text-rose-500">{v.desconto_total > 0 ? `- ${fmt(v.desconto_total)}` : '-'}</td>
                    <td className="p-4 font-semibold text-emerald-600">{fmt(v.valor_total)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor[v.status] || 'bg-slate-100 text-slate-600'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">{v.fiscal_status}</td>
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
