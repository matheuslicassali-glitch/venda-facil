
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, ShoppingBag, User, ArrowLeft, Building2, Truck, Calculator } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { db } from '../utils/databaseService';
import { Client, Product, SaleItem, CompanySettings, Sale } from '../types';
import { generateNFeXML } from '../utils/nfeXmlService';
import { signNFeXML } from '../utils/signatureService';

interface NFeManualProps {
    onNotify: (msg: string, type: 'success' | 'error') => void;
}

const NFeManual: React.FC<NFeManualProps> = ({ onNotify }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [naturezaOperacao, setNaturezaOperacao] = useState('VENDA DE MERCADORIA');
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [foundProducts, setFoundProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [clis, prods] = await Promise.all([
                db.clients.list(),
                db.products.list()
            ]);
            setClients(clis);
            setProducts(prods);
        } catch (err) {
            onNotify('❌ Erro ao buscar dados iniciais.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchProduct = (term: string) => {
        setSearchTerm(term);
        if (term.length > 0) {
            const results = products.filter(p =>
                p.nome.toLowerCase().includes(term.toLowerCase()) ||
                p.sku.toLowerCase().includes(term.toLowerCase())
            );
            setFoundProducts(results);
        } else {
            setFoundProducts([]);
        }
    };

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.produto_id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.produto_id === product.id
                    ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.preco_unitario }
                    : item
            ));
        } else {
            setCart([...cart, {
                id: Math.random().toString(36).substr(2, 9),
                produto_id: product.id,
                nome: product.nome,
                quantidade: 1,
                preco_unitario: product.preco_venda,
                subtotal: product.preco_venda,
                desconto: 0
            }]);
        }
        setSearchTerm('');
        setFoundProducts([]);
    };

    const removeItem = (id: string) => {
        setCart(cart.filter(i => i.id !== id));
    };

    const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

    const handleEmit = async () => {
        if (!selectedClient) {
            onNotify('❌ Selecione um destinatário!', 'error');
            return;
        }
        if (cart.length === 0) {
            onNotify('❌ Adicione pelo menos um item!', 'error');
            return;
        }

        setLoading(true);

        try {
            const nfe_numero = Math.floor(100000 + Math.random() * 900000).toString();
            const companySettingsData = await db.settings.get();

            // Map db flat fields to settings object for XML service
            const companySettings: CompanySettings = {
                ...companySettingsData,
                endereco: {
                    logradouro: companySettingsData.logradouro,
                    numero: companySettingsData.numero,
                    bairro: companySettingsData.bairro,
                    cidade: companySettingsData.cidade,
                    uf: companySettingsData.uf,
                    cep: companySettingsData.cep,
                    ibge_cidade: companySettingsData.ibge_cidade
                },
                contato: {
                    email: companySettingsData.email_contato,
                    telefone: companySettingsData.telefone_contato
                },
                fiscal: {
                    csc: companySettingsData.fiscal_csc,
                    csc_id: companySettingsData.fiscal_csc_id,
                    ambiente: companySettingsData.fiscal_ambiente
                }
            };

            let generatedXml = '';
            let chaveAcesso = '';

            if (companySettings.cnpj) {
                const rawXml = generateNFeXML({
                    id: '', data_venda: new Date().toISOString(), valor_total: total, desconto_total: 0,
                    itens: cart, tipo_pagamento: 'dinheiro', status: 'concluida', fiscal_status: 'pendente', nfe_numero
                } as Sale, selectedClient, companySettings, products);

                generatedXml = signNFeXML(rawXml);
                const keyMatch = generatedXml.match(/Id="NFe(\d+)"/);
                chaveAcesso = keyMatch ? keyMatch[1] : '';
            }

            const newSale: Sale = {
                id: Math.random().toString(36).substr(2, 9),
                data_venda: new Date().toISOString(),
                valor_total: total,
                desconto_total: 0,
                itens: cart,
                tipo_pagamento: 'dinheiro',
                cliente_id: selectedClient.id,
                vendedor_id: 'manual',
                status: 'concluida',
                fiscal_status: 'emitida',
                nfe_numero,
                xml: generatedXml,
                chave_acesso: chaveAcesso,
                tipo_operacao: 'venda'
            };

            await db.sales.create(newSale);

            onNotify(`✅ NF-e #${nfe_numero} emitida com sucesso!`, 'success');
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'nfe' }));
        } catch (err) {
            console.error(err);
            onNotify('❌ Erro ao emitir NF-e.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Emissão Manual de NF-e</h1>
                    <p className="text-gray-600">Modelo 55 - Nota Fiscal Eletrônica</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'nfe' }))}>
                        <ArrowLeft size={18} /> Voltar
                    </Button>
                    <Button onClick={handleEmit} disabled={loading} className="bg-blue-600">
                        <Save size={18} /> {loading ? 'Emitindo...' : 'Emitir NF-e'}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados da Operação */}
                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calculator size={16} /> Dados da Operação
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Natureza da Operação"
                                value={naturezaOperacao}
                                onChange={e => setNaturezaOperacao(e.target.value)}
                            />
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Finalidade de Emissão</label>
                                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none font-medium">
                                    <option>1 - Normal</option>
                                    <option>4 - Devolução de Mercadoria</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Destinatário */}
                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User size={16} /> Destinatário
                        </h2>
                        <select
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none font-black text-gray-700"
                            value={selectedClient?.id || ''}
                            onChange={e => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
                        >
                            <option value="">SELECIONE O CLIENTE / DESTINATÁRIO</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.nome.toUpperCase()} ({c.documento})</option>
                            ))}
                        </select>
                        {selectedClient && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-xs grid grid-cols-2 gap-2 text-blue-700 font-medium">
                                <p>CNPJ/CPF: {selectedClient.documento}</p>
                                <p>Cidade: {selectedClient.cidade} - {selectedClient.uf}</p>
                                <p className="col-span-2">Logradouro: {selectedClient.endereco}</p>
                            </div>
                        )}
                    </section>

                    {/* Itens da Nota */}
                    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <ShoppingBag size={16} /> Itens da NF-e
                            </h2>
                            <div className="relative w-64">
                                <Input
                                    placeholder="Buscar produto..."
                                    value={searchTerm}
                                    onChange={e => handleSearchProduct(e.target.value)}
                                />
                                {foundProducts.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-white border shadow-xl rounded-b-lg z-50 max-h-48 overflow-y-auto">
                                        {foundProducts.map(p => (
                                            <button key={p.id} onClick={() => addToCart(p)} className="w-full p-2 text-left hover:bg-gray-50 border-b text-xs flex justify-between">
                                                <span>{p.nome}</span>
                                                <span className="font-bold">R$ {p.preco_venda.toFixed(2)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase border-b bg-gray-25">
                                    <th className="px-6 py-3">Cód</th>
                                    <th className="px-6 py-3">Descrição</th>
                                    <th className="px-6 py-3">Qtd</th>
                                    <th className="px-6 py-3">V. Unit</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {cart.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-3 font-mono text-gray-400">{item.produto_id.slice(0, 5)}</td>
                                        <td className="px-6 py-3 font-bold text-gray-700">{item.nome}</td>
                                        <td className="px-6 py-3">{item.quantidade}</td>
                                        <td className="px-6 py-3">R$ {item.preco_unitario.toFixed(2)}</td>
                                        <td className="px-6 py-3 font-black">R$ {item.subtotal.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cart.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-300 font-medium italic uppercase text-xs">Aguardando itens...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>
                </div>

                <div className="space-y-6">
                    {/* Totais */}
                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calculator size={16} /> Totais da Nota
                        </h2>
                        <div className="space-y-2 text-sm border-b pb-4">
                            <div className="flex justify-between text-gray-500"><span>Prod. e Serviços</span> <span>R$ {total.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-500"><span>Frete / Seguro</span> <span>R$ 0,00</span></div>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                            <span className="font-black text-gray-400 uppercase text-xs">Total NFe</span>
                            <span className="text-2xl font-black text-blue-700 tracking-tighter">R$ {total.toFixed(2)}</span>
                        </div>
                    </section>

                    {/* Transporte */}
                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Truck size={16} /> Transporte
                        </h2>
                        <select className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-xs outline-none">
                            <option>0 - Contratação por conta do Remetente (CIF)</option>
                            <option>1 - Contratação por conta do Destinatário (FOB)</option>
                            <option>9 - Sem Ocorrência de Transporte</option>
                        </select>
                    </section>

                    {/* Informações Complementares */}
                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} /> Info. Complementares
                        </h2>
                        <textarea
                            className="w-full p-3 bg-gray-50 border rounded-xl text-xs outline-none h-24"
                            placeholder="Ex: Documento emitido por ME ou EPP Optante pelo Simples Nacional..."
                        ></textarea>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default NFeManual;
