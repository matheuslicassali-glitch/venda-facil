import { useState, useEffect } from 'react';
import { Unlock, Lock, TrendingUp, TrendingDown, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Caixa() {
  const [session, setSession] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isTransactionModal, setIsTransactionModal] = useState<{ isOpen: boolean, tipo: 'sangria' | 'suprimento' }>({ isOpen: false, tipo: 'sangria' });
  
  const [valorAbertura, setValorAbertura] = useState('0');
  const [valorFechamento, setValorFechamento] = useState('0');
  const [valorTransacao, setValorTransacao] = useState('0');
  const [motivoTransacao, setMotivoTransacao] = useState('');

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    setLoading(true);
    const { data } = await supabase.from('caixa_sessoes').select('*').eq('status', 'aberto').limit(1).single();
    if (data) {
      setSession(data);
      loadTransactions(data.id);
    } else {
      setSession(null);
    }
    setLoading(false);
  };

  const loadTransactions = async (caixaId: string) => {
    const { data } = await supabase.from('caixa_movimentacoes').select('*').eq('caixa_id', caixaId).order('data', { ascending: false });
    if (data) setTransactions(data);
  };

  const openCashier = async () => {
    const { data, error } = await supabase.from('caixa_sessoes').insert({
      id: uuidv4(),
      data_abertura: new Date().toISOString(),
      saldo_inicial: Number(valorAbertura),
      saldo_final: Number(valorAbertura),
      status: 'aberto',
      sincronizado: true
    }).select().single();

    if (error) alert(error.message);
    else {
      setSession(data);
      setIsOpeningModal(false);
    }
  };

  const closeCashier = async () => {
    const { error } = await supabase.from('caixa_sessoes').update({
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      saldo_final: Number(valorFechamento),
      sincronizado: true
    }).eq('id', session.id);

    if (error) alert(error.message);
    else {
      setSession(null);
      setIsClosingModal(false);
    }
  };

  const addTransaction = async () => {
    const valor = Number(valorTransacao);
    const { error } = await supabase.from('caixa_movimentacoes').insert({
      id: uuidv4(),
      caixa_id: session.id,
      tipo: isTransactionModal.tipo,
      valor: valor,
      motivo: motivoTransacao,
      data: new Date().toISOString(),
      sincronizado: true
    });

    if (error) alert(error.message);
    else {
      // Atualizar saldo do caixa
      const novoSaldo = isTransactionModal.tipo === 'suprimento' 
        ? session.saldo_final + valor 
        : session.saldo_final - valor;
      
      await supabase.from('caixa_sessoes').update({ saldo_final: novoSaldo }).eq('id', session.id);
      
      setIsTransactionModal({ ...isTransactionModal, isOpen: false });
      loadSession();
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controle de Caixa</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie aberturas, fechamentos e movimentações online.</p>
        </div>
        {!session ? (
          <Button onClick={() => setIsOpeningModal(true)}>
            <Unlock className="mr-2" size={18} /> Abrir Caixa
          </Button>
        ) : (
          <Button variant="danger" onClick={() => { setValorFechamento(session.saldo_final.toString()); setIsClosingModal(true); }}>
            <Lock className="mr-2" size={18} /> Fechar Caixa
          </Button>
        )}
      </div>

      {!session ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Lock size={64} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">O caixa está fechado no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status do Caixa */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Status Atual</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Saldo de Abertura</span>
                  <span className="font-bold text-slate-800">R$ {session.saldo_inicial.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="text-slate-500 text-sm">Saldo em Caixa</span>
                  <span className="text-2xl font-black text-primary-600">R$ {session.saldo_final.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="secondary" className="flex-1" onClick={() => { setIsTransactionModal({ isOpen: true, tipo: 'suprimento' }); setValorTransacao('0'); setMotivoTransacao(''); }}>
                <TrendingUp size={18} className="mr-2 text-emerald-500" /> Suprimento
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => { setIsTransactionModal({ isOpen: true, tipo: 'sangria' }); setValorTransacao('0'); setMotivoTransacao(''); }}>
                <TrendingDown size={18} className="mr-2 text-red-500" /> Sangria
              </Button>
            </div>
          </div>

          {/* Histórico de Movimentações */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18} /> Movimentações Recentes</h3>
              </div>
              <div className="overflow-x-auto">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-300">Nenhuma movimentação registrada.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3">Motivo</th>
                        <th className="px-6 py-3">Valor</th>
                        <th className="px-6 py-3">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${t.tipo === 'suprimento' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {t.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.motivo}</td>
                          <td className={`px-6 py-4 font-bold ${t.tipo === 'suprimento' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.tipo === 'suprimento' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(t.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais */}
      <Modal isOpen={isOpeningModal} onClose={() => setIsOpeningModal(false)} title="Abrir Caixa Online">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Valor Inicial em Dinheiro (Fundo de Troco)</label>
            <input 
              type="number" 
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-lg"
              value={valorAbertura}
              onChange={e => setValorAbertura(e.target.value)}
            />
          </div>
          <Button className="w-full h-12" onClick={openCashier}>Confirmar Abertura</Button>
        </div>
      </Modal>

      <Modal isOpen={isClosingModal} onClose={() => setIsClosingModal(false)} title="Fechar Caixa Online">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-700 text-sm mb-4">
            Confirme o saldo final em dinheiro antes de fechar a sessão.
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Saldo Final em Dinheiro</label>
            <input 
              type="number" 
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-lg"
              value={valorFechamento}
              onChange={e => setValorFechamento(e.target.value)}
            />
          </div>
          <Button variant="danger" className="w-full h-12" onClick={closeCashier}>Fechar Caixa Agora</Button>
        </div>
      </Modal>

      <Modal isOpen={isTransactionModal.isOpen} onClose={() => setIsTransactionModal({ ...isTransactionModal, isOpen: false })} title={isTransactionModal.tipo === 'sangria' ? 'Efetuar Sangria' : 'Efetuar Suprimento'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Valor da Operação</label>
            <input 
              type="number" 
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-lg"
              value={valorTransacao}
              onChange={e => setValorTransacao(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Motivo / Descrição</label>
            <input 
              type="text" 
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-medium"
              value={motivoTransacao}
              onChange={e => setMotivoTransacao(e.target.value)}
              placeholder="Ex: Retirada para pagamento de lanche"
            />
          </div>
          <Button className="w-full h-12" onClick={addTransaction}>Confirmar Operação</Button>
        </div>
      </Modal>
    </div>
  );
}
