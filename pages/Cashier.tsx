
import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Lock, Unlock, History, DollarSign, Calculator } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { CashSession, CashTransaction } from '../types';

interface CashierProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
}

const Cashier: React.FC<CashierProps> = ({ onNotify }) => {
    const [session, setSession] = useState<CashSession | null>(null);
    const [transactions, setTransactions] = useState<CashTransaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<'abertura' | 'fechamento' | 'transacao' | null>(null);
    const [transType, setTransType] = useState<'sangria' | 'suprimento'>('sangria');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        valor: '',
        motivo: '',
        valor_informado: ''
    });

    useEffect(() => {
        const savedSession = localStorage.getItem('venda-facil-cash-session');
        const savedTransactions = localStorage.getItem('venda-facil-cash-transactions');

        if (savedSession) setSession(JSON.parse(savedSession));
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    }, []);

    const saveSession = (s: CashSession | null) => {
        setSession(s);
        if (s) localStorage.setItem('venda-facil-cash-session', JSON.stringify(s));
        else localStorage.removeItem('venda-facil-cash-session');
    };

    const saveTransactions = (t: CashTransaction[]) => {
        setTransactions(t);
        localStorage.setItem('venda-facil-cash-transactions', JSON.stringify(t));
    };

    const handleOpenCash = (e: React.FormEvent) => {
        e.preventDefault();
        const newSession: CashSession = {
            id: Math.random().toString(36).substr(2, 9),
            aberto_em: new Date().toISOString(),
            valor_abertura: parseFloat(formData.valor),
            valor_fechamento_esperado: parseFloat(formData.valor),
            status: 'aberto',
            vendedor_id: '1' // master
        };
        saveSession(newSession);
        setIsModalOpen(null);
        onNotify('🔓 Caixa aberto com sucesso!', 'success');
    };

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        const val = parseFloat(formData.valor);
        const newTrans: CashTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            caixa_id: session.id,
            tipo: transType,
            valor: val,
            motivo: formData.motivo,
            data: new Date().toISOString()
        };

        const updatedTrans = [...transactions, newTrans];
        saveTransactions(updatedTrans);

        const updatedSession = { ...session };
        if (transType === 'sangria') updatedSession.valor_fechamento_esperado -= val;
        else updatedSession.valor_fechamento_esperado += val;

        saveSession(updatedSession);
        setIsModalOpen(null);
        onNotify(`✅ ${transType === 'sangria' ? 'Sangria' : 'Suprimento'} realizada!`, 'success');
    };

    const handleCloseCash = (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        const valInformado = parseFloat(formData.valor_informado);
        const diff = valInformado - session.valor_fechamento_esperado;

        const closedSession = {
            ...session,
            fechado_em: new Date().toISOString(),
            valor_fechamento_informado: valInformado,
            status: 'fechado' as const
        };

        // Save to history (here we just remove active session)
        saveSession(null);
        setIsModalOpen(null);
        onNotify(`🔒 Caixa fechado. Diferença: ${diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, diff === 0 ? 'success' : 'error');
    };

    return (
        <div className="animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Fluxo de Caixa</h1>
                    <p className="text-gray-600">Abertura, fechamento e movimentações financeiras</p>
                </div>
                {!session ? (
                    <Button onClick={() => { setFormData({ ...formData, valor: '' }); setIsModalOpen('abertura'); }}>
                        <Unlock size={20} />
                        <span>Abrir Caixa</span>
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setTransType('suprimento'); setFormData({ valor: '', motivo: '' }); setIsModalOpen('transacao'); }}>
                            <ArrowUpCircle size={20} />
                            <span>Suprimento</span>
                        </Button>
                        <Button variant="secondary" onClick={() => { setTransType('sangria'); setFormData({ valor: '', motivo: '' }); setIsModalOpen('transacao'); }}>
                            <ArrowDownCircle size={20} />
                            <span>Sangria</span>
                        </Button>
                        <Button variant="danger" onClick={() => { setFormData({ ...formData, valor_informado: '' }); setIsModalOpen('fechamento'); }}>
                            <Lock size={20} />
                            <span>Fechar Caixa</span>
                        </Button>
                    </div>
                )}
            </header>

            {session ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Atual</p>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            <h3 className="text-lg font-bold text-gray-800">CAIXA ABERTO</h3>
                        </div>
                        <p className="text-xs text-gray-500">Iniciado em: {new Date(session.aberto_em).toLocaleString()}</p>
                    </div>

                    <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Saldo em Caixa (Esperado)</p>
                        <h2 className="text-3xl font-black">{session.valor_fechamento_esperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                        <p className="text-xs text-white/80 mt-2">Abertura: {session.valor_abertura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Suprimentos</span>
                            <span className="text-sm font-bold text-green-600">
                                +{transactions.filter(t => t.caixa_id === session.id && t.tipo === 'suprimento').reduce((a, b) => a + b.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase">Sangrias</span>
                            <span className="text-sm font-bold text-red-600">
                                -{transactions.filter(t => t.caixa_id === session.id && t.tipo === 'sangria').reduce((a, b) => a + b.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-20 text-center">
                    <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-500">Caixa Fechado</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mt-2">Abra o caixa para iniciar as vendas do dia e registrar as movimentações financeiras.</p>
                </div>
            )}

            {session && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <History size={18} className="text-gray-400" />
                        <h3 className="font-bold text-gray-800">Movimentações da Sessão</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Horário</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Motivo / Descrição</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.filter(t => t.caixa_id === session.id).reverse().map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{new Date(t.data).toLocaleTimeString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${t.tipo === 'sangria' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {t.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{t.motivo}</td>
                                        <td className={`px-6 py-4 text-right font-black ${t.tipo === 'sangria' ? 'text-red-600' : 'text-green-600'}`}>
                                            {t.tipo === 'sangria' ? '-' : '+'}{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.filter(t => t.caixa_id === session.id).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-gray-400 text-sm italic">Nenhuma movimentação registrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={isModalOpen === 'abertura'} onClose={() => setIsModalOpen(null)} title="Abertura de Caixa">
                <form onSubmit={handleOpenCash} className="space-y-4 pt-2">
                    <Input label="Valor Inicial em Caixa" type="number" step="0.01" placeholder="R$ 0,00" required value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                    <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">Informe o valor em dinheiro disponível na gaveta para troco no início do turno.</p>
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(null)}>Cancelar</Button>
                        <Button type="submit">Confirmar Abertura</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isModalOpen === 'transacao'} onClose={() => setIsModalOpen(null)} title={transType === 'sangria' ? "Nova Sangria (Retirada)" : "Novo Suprimento (Entrada)"}>
                <form onSubmit={handleTransaction} className="space-y-4 pt-2">
                    <Input label="Valor" type="number" step="0.01" placeholder="R$ 0,00" required value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                    <Input label="Motivo / Descrição" placeholder="Ex: Pagamento de frete" required value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} />
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(null)}>Cancelar</Button>
                        <Button type="submit">{transType === 'sangria' ? 'Efetuar Retirada' : 'Efetuar Entrada'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isModalOpen === 'fechamento'} onClose={() => setIsModalOpen(null)} title="Fechamento de Caixa (Conferência Cega)">
                <form onSubmit={handleCloseCash} className="space-y-4 pt-2">
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-4">
                        <h4 className="text-yellow-800 font-bold text-sm mb-1 flex items-center gap-2">Conferência Cega Ativada</h4>
                        <p className="text-xs text-yellow-700 leading-relaxed">Conte todo o dinheiro em caixa e informe o valor total abaixo. O sistema comparará com o esperado e gerará o relatório de quebra de caixa se houver divergência.</p>
                    </div>
                    <Input label="Valor Total em Dinheiro na Gaveta" type="number" step="0.01" placeholder="R$ 0,00" required value={formData.valor_informado} onChange={e => setFormData({ ...formData, valor_informado: e.target.value })} />
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(null)}>Cancelar</Button>
                        <Button variant="danger" type="submit">Confirmar Fechamento</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Cashier;
