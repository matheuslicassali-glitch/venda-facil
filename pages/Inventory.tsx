
import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertTriangle, ArrowUpDown, History, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../utils/databaseService';
import { Product } from '../types';

interface InventoryProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
}

const Inventory: React.FC<InventoryProps> = ({ onNotify }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'todos' | 'baixo' | 'esgotado'>('todos');
    const [loading, setLoading] = useState(false);

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

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm);
        if (!matchesSearch) return false;

        if (filter === 'baixo') return p.estoque_atual > 0 && p.estoque_atual < 10;
        if (filter === 'esgotado') return p.estoque_atual <= 0;
        return true;
    });

    const getStockStatus = (estoque: number) => {
        if (estoque <= 0) return { label: 'Esgotado', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
        if (estoque < 10) return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
        return { label: 'Normal', color: 'bg-green-100 text-green-700', icon: Boxes };
    };

    return (
        <div className="animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
                    <p className="text-gray-600">Monitore níveis de inventário e alertas de reposição</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary">
                        <History size={18} />
                        <span>Histórico</span>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total de Itens', value: products.length, icon: Package, color: 'text-blue-600' },
                    { label: 'Estoque Baixo', value: products.filter(p => p.estoque_atual > 0 && p.estoque_atual < 10).length, icon: AlertTriangle, color: 'text-yellow-600' },
                    { label: 'Esgotados', value: products.filter(p => p.estoque_atual <= 0).length, icon: AlertTriangle, color: 'text-red-600' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">{stat.label}</p>
                            <h4 className="text-xl font-black text-gray-800">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar SKU ou nome..."
                            className="pl-10 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['todos', 'baixo', 'esgotado'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Estoque Atual</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredProducts.map((p) => {
                                const status = getStockStatus(p.estoque_atual);
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-800">{p.nome}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">SKU: {p.sku}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase uppercase tracking-tighter">
                                                {p.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-black ${p.estoque_atual < 10 ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {p.estoque_atual}
                                                </span>
                                                <span className="text-gray-400 text-xs">unid.</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${status.color}`}>
                                                <StatusIcon size={12} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors title='Ajustar Estoque'">
                                                <ArrowUpDown size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Boxes size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-gray-500 font-medium">Nenhum item encontrado no estoque.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
