import { useState } from 'react';
import { CloudSync, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sincronizacao() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function verificar() {
    setLoading(true);
    const [{ count: p }, { count: c }, { count: v }] = await Promise.all([
      supabase.from('produtos').select('*', { count: 'exact', head: true }),
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('vendas').select('*', { count: 'exact', head: true }),
    ]);
    const [{ count: pSync }, { count: cSync }, { count: vSync }] = await Promise.all([
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('sincronizado', true),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('sincronizado', true),
      supabase.from('vendas').select('*', { count: 'exact', head: true }).eq('sincronizado', true),
    ]);
    setStatus({ produtos: { total: p, sync: pSync }, clientes: { total: c, sync: cSync }, vendas: { total: v, sync: vSync } });
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Status de Sincronização</h2>
          <p className="text-slate-500 text-sm mt-1">Verifique quais dados do Desktop foram sincronizados com a nuvem.</p>
        </div>
        <button onClick={verificar} disabled={loading} className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Verificando...' : 'Verificar Agora'}
        </button>
      </div>

      <div className="glass-panel p-8 mb-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <CloudSync size={48} className="text-primary-500" />
          <h3 className="text-lg font-semibold text-slate-800">Como funciona a sincronização?</h3>
          <p className="text-slate-500 max-w-lg text-sm leading-relaxed">
            O <strong>Venda Fácil Desktop</strong> envia os dados automaticamente para o Supabase a cada <strong>1 minuto</strong> em segundo plano.
            O painel online (este site) lê esses dados em tempo real, permitindo que você acompanhe vendas, estoque e clientes de qualquer lugar.
          </p>
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.entries(status).map(([key, val]: any) => {
            const pct = val.total > 0 ? Math.round((val.sync / val.total) * 100) : 0;
            const ok = pct === 100;
            return (
              <div key={key} className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 capitalize">{key}</h3>
                  {ok ? <CheckCircle className="text-emerald-500" size={20} /> : <AlertCircle className="text-amber-500" size={20} />}
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">{val.sync}/{val.total}</p>
                <p className="text-xs text-slate-500 mb-3">registros sincronizados</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-sm font-semibold mt-2 ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}% sincronizado</p>
              </div>
            );
          })}
        </div>
      )}

      {!status && !loading && (
        <div className="glass-panel p-12 text-center text-slate-400">
          <p>Clique em "Verificar Agora" para checar o status de sincronização.</p>
        </div>
      )}
    </div>
  );
}
