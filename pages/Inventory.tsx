
import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertTriangle, ArrowUpDown, History, Package, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { db } from '../utils/databaseService';
import { Product, Permission } from '../types';

interface InventoryProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
    currentUser?: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Inventory: React.FC<InventoryProps> = ({ onNotify, currentUser }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'todos' | 'baixo' | 'esgotado'>('todos');
    const [loading, setLoading] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adjustValue, setAdjustValue] = useState('0');
    const [adjustType, setAdjustType] = useState<'entrada' | 'saida'>('entrada');

    const isVendedor = currentUser?.cargo === 'Vendedor';

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await db.products.list();
            setProducts(data);
        } catch (err) {
            onNotify('❌ Erro ao carregar estoque.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        if (isVendedor) {
            onNotify('❌ Vendedores não podem realizar ajustes manuais de estoque.', 'error');
            return;
        }

        const value = parseInt(adjustValue) || 0;
        if (value <= 0) {
            onNotify('⚠️ Valor do ajuste deve ser maior que zero.', 'error');
            return;
        }

        const newStock = adjustType === 'entrada' 
            ? selectedProduct.estoque_atual + value 
            : selectedProduct.estoque_atual - value;

        if (newStock < 0) {
            onNotify('⚠️ O estoque não pode ficar negativo.', 'error');
            return;
        }

        setLoading(true);
        try {
            await db.products.updateStock(selectedProduct.id, newStock);
            onNotify(`✅ Ajuste de ${adjustType === 'entrada' ? 'entrada' : 'saída'} realizado!`, 'success');
            setIsAdjustModalOpen(false);
            setAdjustValue('0');
            loadProducts();
        } catch (err) {
            onNotify('❌ Erro ao atualizar estoque.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'baixo') return p.estoque_atual > 0 && p.estoque_atual < (p.estoque_minimo || 5);
        if (filter === 'esgotado') return p.estoque_atual <= 0;
        return true;
    });

    const getStockStatus = (p: Product) => {
        if (p.estoque_atual <= 0) return { label: 'Esgotado', color: 'bg-red-100 text-red-600', icon: AlertTriangle };
        if (p.estoque_atual < (p.estoque_minimo || 5)) return { label: 'Reposição', color: 'bg-orange-100 text-orange-600', icon: AlertTriangle };
        return { label: 'Em Dia', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 };
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Painel de Inventário</h1>
                    <p className="text-gray-600 font-medium">Controle de entradas, saídas e rupturas de gôndola</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="border border-gray-200">
                        <History size={18} />
                        <span>Histórico Logístico</span>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Sortimento Ativo', value: products.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Crítico (Reposição)', value: products.filter(p => p.estoque_atual > 0 && p.estoque_atual < (p.estoque_minimo || 5)).length, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Ruptura (Sem Estoque)', value: products.filter(p => p.estoque_atual <= 0).length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <h4 className="text-2xl font-black text-gray-800 tracking-tighter">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Pesquisar por SKU ou descrição..."
                            className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
                        {(['todos', 'baixo', 'esgotado'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Ficha do Produto</th>
                                <th className="px-6 py-4">Classificação</th>
                                <th className="px-6 py-4 text-center">Nível Atual</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Ajuste Manual</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((p) => {
                                const status = getStockStatus(p);
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50/80 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center font-black">
                                                    <Package size={20} />
                                                 </div>
                                                 <div>
                                                    <p className="font-bold text-gray-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">{p.nome}</p>
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-0.5">SKU: {p.sku}</p>
                                                 </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                                                {p.categoria || 'DIVERSOS'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={`text-lg font-black ${p.estoque_atual < (p.estoque_minimo || 5) ? 'text-red-500' : 'text-gray-800'}`}>
                                                    {p.estoque_atual}
                                                </span>
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{p.unidade || 'UNID'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`mx-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${status.color}`}>
                                                <StatusIcon size={14} />
                                                {status.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!isVendedor && (
                                                <button 
                                                    onClick={() => { setSelectedProduct(p); setIsAdjustModalOpen(true); }}
                                                    className="p-2.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded-xl transition-all border border-blue-50 hover:shadow-lg shadow-blue-500/20"
                                                    title="Mudar Estoque"
                                                >
                                                    <ArrowUpDown size={20} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                            <Boxes size={32} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Inventário não localizado</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="⚖️ Ajuste Quantitativo de Inventário">
                <form onSubmit={handleAdjustStock} className="space-y-8 pt-4">
                    <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black"><Package size={28} /></div>
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Produto em Ajuste</p>
                            <h3 className="text-xl font-black text-gray-800 leading-none">{selectedProduct?.nome}</h3>
                            <p className="text-xs font-bold text-gray-500 mt-1">Saldo Atual: <span className="text-blue-600">{selectedProduct?.estoque_atual} {selectedProduct?.unidade}</span></p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setAdjustType('entrada')}
                            className={`flex-1 p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${adjustType === 'entrada' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-100 text-gray-400 opacity-60'}`}
                        >
                            <TrendingUp size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Entrada (Suprimento)</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAdjustType('saida')}
                            className={`flex-1 p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${adjustType === 'saida' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-100 text-gray-400 opacity-60'}`}
                        >
                            <TrendingDown size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Saída (Ajuste/Perda)</span>
                        </button>
                    </div>

                    <Input 
                        label={`Quantidade para ${adjustType === 'entrada' ? 'Adicionar' : 'Remover'}`} 
                        type="number" 
                        required 
                        placeholder="Ex: 10" 
                        value={adjustValue} 
                        onChange={e => setAdjustValue(e.target.value)} 
                    />

                    <div className="flex justify-end gap-3 mt-10 pt-6 border-t font-black">
                        <Button variant="ghost" type="button" onClick={() => setIsAdjustModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className={`px-10 h-11 ${adjustType === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'} shadow-lg`}>
                            {loading ? 'Sincronizando...' : 'Confirmar Movimentação'}
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

export default Inventory;
