
import React, { useState, useEffect, useMemo } from 'react';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Calendar,
    Search,
    Plus,
    Filter,
    CheckCircle2,
    Clock,
    TrendingUp,
    Receipt
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Sale, Employee, FinancialAccount } from '../types';
import { db } from '../utils/databaseService';

interface FinanceProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
}

const Finance: React.FC<FinanceProps> = ({ onNotify }) => {
    const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        tipo: 'pagar' as 'pagar' | 'receber',
        vencimento: new Date().toISOString().split('T')[0],
        categoria: 'Outros'
    });

    useEffect(() => {
        loadFinanceData();
    }, []);

    const loadFinanceData = async () => {
        setLoading(true);
        try {
            const [accs, salesData, emps] = await Promise.all([
                db.finance.list(),
                db.sales.list(),
                db.employees.list()
            ]);
            setAccounts(accs);
            setSales(salesData);
            setEmployees(emps);
        } catch (err) {
            console.error(err);
            onNotify('❌ Erro ao carregar dados financeiros.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveToStorage = (newAccounts: FinancialAccount[]) => {
        setAccounts(newAccounts);
        localStorage.setItem('venda-facil-finance', JSON.stringify(newAccounts));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const newAcc: FinancialAccount = {
            id: Math.random().toString(36).substr(2, 9),
            descricao: formData.descricao,
            valor: parseFloat(formData.valor),
            tipo: formData.tipo,
            vencimento: formData.vencimento,
            status: 'pendente',
            categoria: formData.categoria
        };

        try {
            await db.finance.upsert(newAcc);
            onNotify('✅ Lançamento financeiro registrado!', 'success');
            setIsModalOpen(false);
            loadFinanceData();
        } catch (err) {
            onNotify('❌ Erro ao salvar lançamento.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (account: FinancialAccount) => {
        const newStatus = account.status === 'pago' ? 'pendente' : 'pago';
        try {
            await db.finance.upsert({ ...account, status: newStatus as any });
            onNotify('Status atualizado!', 'success');
            loadFinanceData();
        } catch (err) {
            onNotify('❌ Erro ao atualizar status.', 'error');
        }
    };

    const totals = useMemo(() => {
        const receitaVendas = sales.reduce((acc, s) => acc + s.valor_total, 0);
        const contasAReceber = accounts.filter(a => a.tipo === 'receber' && a.status === 'pendente').reduce((acc, a) => acc + a.valor, 0);
        const contasAPagar = accounts.filter(a => a.tipo === 'pagar' && a.status === 'pendente').reduce((acc, a) => acc + a.valor, 0);
        const comissoes = sales.reduce((acc, s) => acc + (s.valor_total * 0.05), 0); // Simulated 5%

        const byPayment = sales.reduce((acc, s) => {
            acc[s.tipo_pagamento] = (acc[s.tipo_pagamento] || 0) + s.valor_total;
            return acc;
        }, {} as Record<string, number>);

        return {
            receitaTotal: receitaVendas + accounts.filter(a => a.tipo === 'receber' && a.status === 'pago').reduce((acc, a) => acc + a.valor, 0),
            pendenteReceber: contasAReceber,
            pendentePagar: contasAPagar,
            saldoPrevisto: (receitaVendas + contasAReceber) - (contasAPagar + comissoes),
            comissoesTotal: comissoes,
            byPayment
        };
    }, [sales, accounts]);

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Financeiro e Contas</h1>
                    <p className="text-gray-600">Fluxo de caixa, DRE simplificada e comissões</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> <span>Novo Lançamento</span>
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Receita Operacional', value: totals.receitaTotal, icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Contas a Pagar', value: totals.pendentePagar, icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Comissões Vendedores', value: totals.comissoesTotal, icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Saldo Previsto', value: totals.saldoPrevisto, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className={`${item.bg} ${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}><item.icon size={20} /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                        <h4 className="text-xl font-black text-gray-800">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Recebimentos por Forma de Pagamento</h3>
                        <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            { label: 'Dinheiro', key: 'dinheiro', color: 'bg-green-500' },
                            { label: 'Cartão de Crédito', key: 'cartao_credito', color: 'bg-blue-500' },
                            { label: 'Cartão de Débito', key: 'cartao_debito', color: 'bg-indigo-500' },
                            { label: 'PIX', key: 'pix', color: 'bg-cyan-500' },
                            { label: 'Fiado / Convênio', key: 'fiado', color: 'bg-orange-500' }
                        ].map((m) => (
                            <div key={m.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${m.color}`}></div>
                                    <span className="text-sm font-bold text-gray-600">{m.label}</span>
                                </div>
                                <span className="text-sm font-black text-gray-800">
                                    {(totals.byPayment[m.key] || 0) ? (totals.byPayment[m.key] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Resumo de Operações</h3>
                        <TrendingUp size={16} className="text-gray-400" />
                    </div>
                    <div className="p-6 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-3xl font-black text-blue-600">{sales.length}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendas Realizadas</p>
                        </div>
                        <div className="w-px h-12 bg-gray-100 mx-8"></div>
                        <div className="text-center">
                            <p className="text-3xl font-black text-green-600">
                                {sales.length > 0 ? (sales.reduce((acc, s) => acc + s.valor_total, 0) / sales.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                            </p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Médio</p>
                        </div>
                    </div>
                </div>
            </div>


            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Próximos Lançamentos (Contas a Pagar/Receber)</h3>
                    <div className="flex gap-2 text-[10px] font-black uppercase">
                        <span className="flex items-center gap-1 text-green-600"><TrendingUp size={12} /> Receitas</span>
                        <span className="flex items-center gap-1 text-red-600"><TrendingUp size={12} className="rotate-180" /> Despesas</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Vencimento</th>
                                <th className="px-6 py-4">Descrição / Categoria</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {accounts.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()).map(a => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        {a.status === 'pago'
                                            ? <span className="flex items-center gap-1 text-xs text-green-600 font-black uppercase"><CheckCircle2 size={14} /> Liquidado</span>
                                            : <span className="flex items-center gap-1 text-xs text-orange-600 font-black uppercase"><Clock size={14} /> Pendente</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.vencimento).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-black text-gray-700">{a.descricao}</p>
                                        <p className="text-[10px] text-gray-400 font-black uppercase">{a.categoria}</p>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black ${a.tipo === 'pagar' ? 'text-red-500' : 'text-green-600'}`}>
                                        {a.tipo === 'pagar' ? '-' : '+'}{a.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => toggleStatus(a)} className="text-[10px] font-black text-blue-600 uppercase hover:underline">
                                            {a.status === 'pago' ? 'Estornar' : 'Baixar Pagamento'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {accounts.length === 0 && <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic">Nenhum lançamento financeiro pendente.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento Financeiro">
                <form onSubmit={handleSave} className="space-y-4 pt-2">
                    <Input label="Descrição do Lançamento" placeholder="Ex: Aluguel Loja, Conta de Luz" required
                        value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Valor R$" type="number" step="0.01" required
                            value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</label>
                            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-black text-gray-700 outline-none"
                                value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}>
                                <option value="pagar">CONTA A PAGAR (Saída)</option>
                                <option value="receber">CONTA A RECEBER (Entrada)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Vencimento" type="date" required
                            value={formData.vencimento} onChange={e => setFormData({ ...formData, vencimento: e.target.value })} />
                        <Input label="Categoria" placeholder="Ex: Operacional"
                            value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Registrar Lançamento'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Finance;
