
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
    Receipt,
    History,
    FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Sale, Employee, FinancialAccount, Permission } from '../types';
import { db } from '../utils/databaseService';

interface FinanceProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
    currentUser: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Finance: React.FC<FinanceProps> = ({ onNotify, currentUser }) => {
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
        categoria: 'Operacional'
    });

    const isVendedor = currentUser?.cargo === 'Vendedor';

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isVendedor) {
            onNotify('❌ Operação não permitida para seu nível de acesso.', 'error');
            return;
        }

        setLoading(true);
        const newAcc: FinancialAccount = {
            id: undefined as any,
            descricao: formData.descricao,
            valor: parseFloat(formData.valor) || 0,
            tipo: formData.tipo,
            vencimento: formData.vencimento,
            status: 'pendente',
            categoria: formData.categoria
        };

        try {
            await db.finance.save(newAcc, false);
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
        if (isVendedor) {
            onNotify('❌ Vendedores não podem baixar pagamentos.', 'error');
            return;
        }
        const newStatus = account.status === 'pago' ? 'pendente' : 'pago';
        try {
            await db.finance.save({ ...account, status: newStatus as any }, true);
            onNotify(`✅ Status atualizado: ${newStatus === 'pago' ? 'Líquidado' : 'Estornado'}`, 'success');
            loadFinanceData();
        } catch (err) {
            onNotify('❌ Erro ao atualizar status.', 'error');
        }
    };

    const totals = useMemo(() => {
        const receitaVendas = sales.reduce((acc, s) => acc + s.valor_total, 0);
        const contasAReceber = accounts.filter(a => a.tipo === 'receber' && a.status === 'pendente').reduce((acc, a) => acc + a.valor, 0);
        const contasAPagar = accounts.filter(a => a.tipo === 'pagar' && a.status === 'pendente').reduce((acc, a) => acc + a.valor, 0);
        
        // Calculate commissions based on employees comissao %
        const comissoes = sales.reduce((acc, s) => {
            const vendor = employees.find(e => e.id === s.vendedor_id);
            const rate = (vendor?.comissao || 5) / 100;
            return acc + (s.valor_total * rate);
        }, 0);

        const byPayment = sales.reduce((acc, s) => {
            acc[s.tipo_pagamento] = (acc[s.tipo_pagamento] || 0) + s.valor_total;
            return acc;
        }, {} as Record<string, number>);

        const receitaFinal = receitaVendas + accounts.filter(a => a.tipo === 'receber' && a.status === 'pago').reduce((acc, a) => acc + a.valor, 0);

        return {
            receitaTotal: receitaFinal,
            pendenteReceber: contasAReceber,
            pendentePagar: contasAPagar,
            saldoPrevisto: (receitaFinal + contasAReceber) - (contasAPagar + comissoes),
            comissoesTotal: comissoes,
            byPayment
        };
    }, [sales, accounts, employees]);

    return (
        <div className="animate-in fade-in duration-500 space-y-10 pb-10">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Centro Financeiro</h1>
                    <p className="text-gray-600 font-medium font-medium font-medium">Fluxo de caixa consolidado, DRE e comissões</p>
                </div>
                {!isVendedor && (
                    <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 px-8">
                        <Plus size={20} /> <span>Novo Título</span>
                    </Button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Entradas Reais', value: totals.receitaTotal, icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Despesas Pendentes', value: totals.pendentePagar, icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Provisão Comissões', value: totals.comissoesTotal, icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Saldo de Tesouraria', value: totals.saldoPrevisto, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <div className={`${item.bg} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner`}><item.icon size={24} /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                        <h4 className="text-2xl font-black text-gray-800">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-1">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center text-gray-500">
                        <h3 className="font-black text-[10px] uppercase tracking-widest">Meios de Recebimento</h3>
                        <History size={16} />
                    </div>
                    <div className="p-6 space-y-5">
                        {[
                            { label: 'Dinheiro espécie', key: 'dinheiro', color: 'bg-green-500' },
                            { label: 'Crédito Parcelado', key: 'cartao_credito', color: 'bg-blue-500' },
                            { label: 'Cartão de Débito', key: 'cartao_debito', color: 'bg-indigo-500' },
                            { label: 'PIX Instantâneo', key: 'pix', color: 'bg-cyan-500' },
                            { label: 'Convênio / Fiado', key: 'fiado', color: 'bg-orange-500' }
                        ].map((m) => {
                            const val = totals.byPayment[m.key] || 0;
                            const totalVendas = (Object.values(totals.byPayment) as number[]).reduce((a, b) => a + b, 0) || 1;
                            const pct = (val / totalVendas) * 100;
                            
                            return (
                                <div key={m.key} className="space-y-1.5 transform transition-all hover:scale-[1.02]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${m.color}`}></div>
                                            <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">{m.label}</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-800">
                                            {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${m.color}`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center text-gray-500">
                        <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-500">Extrato de Movimentações Pendentes</h3>
                        <FileText size={16} />
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Compromisso</th>
                                    <th className="px-6 py-4">Vencimento</th>
                                    <th className="px-6 py-4 text-right">Montante</th>
                                    <th className="px-6 py-4 text-center">Ação Corretiva</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium">
                                {accounts.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()).map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50/80 transition-all group">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${a.tipo === 'pagar' ? 'bg-red-400' : 'bg-green-400'}`}></div>
                                            <div>
                                                <p className="font-black text-gray-800 text-sm leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase">{a.descricao}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{a.categoria}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-500">
                                                <Calendar size={12} />
                                                {new Date(a.vencimento).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-black text-base ${a.tipo === 'pagar' ? 'text-red-500' : 'text-green-600'}`}>
                                            {a.tipo === 'pagar' ? '−' : '+'}{a.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => toggleStatus(a)} 
                                                disabled={isVendedor}
                                                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    a.status === 'pago' 
                                                        ? 'bg-gray-100 text-gray-400 line-through' 
                                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-sm border border-blue-200'
                                                } ${isVendedor ? 'opacity-50' : ''}`}
                                            >
                                                {a.status === 'pago' ? 'Líquido' : 'Baixar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {accounts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <Receipt size={48} className="mx-auto text-gray-200 mb-4" />
                                            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Tesouraria equilibrada - nenhum pendente</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="💰 Novo Registro de Título Financeiro">
                <form onSubmit={handleSave} className="space-y-6 pt-4 custom-scrollbar">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                        <Input label="Descrição do Lançamento" placeholder="Ex: Aluguel da Loja Central" required maxLength={100}
                            value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                            
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Natureza do Título</label>
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-black text-gray-700 outline-none shadow-sm appearance-none"
                                    value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}>
                                    <option value="pagar">DESPESA (SAÍDA DE CAIXA)</option>
                                    <option value="receber">RECEITA (ENTRADA DE CAIXA)</option>
                                </select>
                            </div>
                            <Input label="Valor do Título (R$)" type="number" step="0.01" required placeholder="0.00"
                                value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Data de Vencimento" type="date" required
                            value={formData.vencimento} onChange={e => setFormData({ ...formData, vencimento: e.target.value })} />
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Centro de Custo / Cat.</label>
                            <input 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                                placeholder="Ex: Operacional"
                                list="categories"
                                value={formData.categoria} 
                                onChange={e => setFormData({ ...formData, categoria: e.target.value })} 
                            />
                            <datalist id="categories">
                                <option value="Operacional" />
                                <option value="Pessoal" />
                                <option value="Infraestrutura" />
                                <option value="Impostos" />
                                <option value="Marketing" />
                            </datalist>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-10 pt-6 border-t sticky bottom-0 bg-white">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="px-10 h-11 bg-green-600 hover:bg-green-700">
                            {loading ? 'Processando...' : 'Confirmar Lançamento'}
                        </Button>
                    </div>
                </form>
            </Modal>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Finance;
