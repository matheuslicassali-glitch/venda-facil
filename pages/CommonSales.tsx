
import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, ArrowLeft, Trash2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../utils/databaseService';
import { Sale, CompanySettings } from '../types';
import { ReceiptPrint } from '../components/ReceiptPrint';

const CommonSales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [company, setCompany] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesData, settingsData, productsData] = await Promise.all([
                db.sales.list(),
                db.settings.get(),
                db.products.list()
            ]);
            setSales(salesData);
            setCompany(settingsData);
            setProducts(productsData);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSale = async (id: string) => {
        if (!window.confirm('Deseja realmente CANCELAR esta venda? O estoque será devolvido.')) return;
        
        try {
            await (db.sales as any).cancel(id); // Using our new cancel route if exists
            loadData();
            alert('✅ Venda cancelada com sucesso!');
        } catch (err) {
            alert('❌ Erro ao cancelar venda.');
        }
    };

    const filteredSales = sales.filter(s =>
        s.nfe_numero?.includes(searchTerm) ||
        s.id.includes(searchTerm)
    );

    if (selectedSale && company) {
        return (
            <div className="animate-in slide-in-from-right duration-500 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" onClick={() => setSelectedSale(null)} className="flex items-center gap-2">
                        <ArrowLeft size={18} /> Voltar
                    </Button>
                    <div className="flex gap-2">
                        {selectedSale.status !== 'cancelada' && (
                            <Button variant="danger" onClick={() => handleCancelSale(selectedSale.id)} className="flex items-center gap-2">
                                <XCircle size={18} /> Cancelar Venda
                            </Button>
                        )}
                        <Button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-primary-foreground">
                            <Printer size={18} /> Imprimir Cupom
                        </Button>
                    </div>
                </div>

                <div className="bg-card text-card-foreground p-12 rounded-3xl border shadow-xl flex justify-center">
                   <div className="opacity-50">Visualização do Cupom (Imprima para ver o layout final)</div>
                   {/* O ReceiptPrint será renderizado aqui apenas para o window.print() via CSS print styles embutidos no componente */}
                   <ReceiptPrint sale={selectedSale} company={company} products={products} />
                </div>
                
                <style>{`
                    @media screen {
                        #receipt-print-area { display: block !important; border: 1px solid #eee; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-2xl font-black text-foreground tracking-tight">Histórico de Movimentações</h1>
                <p className="text-gray-600 font-medium font-inter">Gestão de notas emitidas, cancelamentos e segunda via de cupons</p>
            </header>

            <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="p-5 border-b border-border bg-muted text-muted-foreground/50 flex justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por Nº ou ID da venda..."
                            className="pl-10 w-full px-4 py-2.5 bg-card text-card-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-bold transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" onClick={loadData} disabled={loading} className="font-black text-[10px] uppercase">Atualizar Lista</Button>
                </div>

                <div className="overflow-x-auto text-inter">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted text-muted-foreground border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Protocolo/Nº</th>
                                <th className="px-6 py-4">Valor Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-bold">
                            {filteredSales.map((sale) => (
                                <tr key={sale.id} className={`hover:bg-muted text-muted-foreground transition-colors ${sale.status === 'cancelada' ? 'opacity-50 grayscale' : ''}`}>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(sale.data_venda).toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-mono text-xs tracking-tighter">#{sale.nfe_numero || sale.id.slice(0, 13).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-foreground">
                                        {sale.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            sale.status === 'cancelada' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                            {sale.status || 'CONCLUÍDA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <Button 
                                            variant="secondary" 
                                            className="font-black text-[10px] uppercase h-9 rounded-xl" 
                                            onClick={() => setSelectedSale(sale)}
                                        >
                                            Ver Cupom
                                        </Button>
                                        {sale.status !== 'cancelada' && (
                                            <button 
                                                onClick={() => handleCancelSale(sale.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-all"
                                                title="Cancelar Venda"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center opacity-30 font-black uppercase text-xs tracking-widest">Nenhuma movimentação localizada</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommonSales;
