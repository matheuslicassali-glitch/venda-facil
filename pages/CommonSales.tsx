
import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, FileText, ArrowLeft, Building2, User, Calendar, Tag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Sale, CompanySettings, Client, Product } from '../types';

const CommonSales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [company, setCompany] = useState<CompanySettings | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedSales = JSON.parse(localStorage.getItem('venda-facil-sales') || '[]');
        setSales(savedSales.sort((a: any, b: any) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()));
        setCompany(JSON.parse(localStorage.getItem('venda-facil-settings') || 'null'));
    }, []);

    const handlePrint = () => {
        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'width=900,height=650');
        if (windowPrint && printContent) {
            windowPrint.document.write('<html><head><title>Nota de Venda</title>');
            windowPrint.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
            windowPrint.document.write('</head><body>');
            windowPrint.document.write(printContent.innerHTML);
            windowPrint.document.write('</body></html>');
            windowPrint.document.close();
            windowPrint.focus();
            setTimeout(() => {
                windowPrint.print();
                windowPrint.close();
            }, 500);
        }
    };

    const filteredSales = sales.filter(s =>
        s.nfe_numero?.includes(searchTerm) ||
        s.id.includes(searchTerm)
    );

    if (selectedSale) {
        return (
            <div className="animate-in slide-in-from-right duration-500 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" onClick={() => setSelectedSale(null)} className="flex items-center gap-2">
                        <ArrowLeft size={18} /> Voltar para a lista
                    </Button>
                    <Button onClick={handlePrint} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                        <Printer size={18} /> Imprimir Nota de Venda
                    </Button>
                </div>

                {/* Receipt Container for Printing */}
                <div ref={printRef} className="bg-white p-10 rounded-xl shadow-lg border border-gray-100 font-sans text-gray-800">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-blue-700 tracking-tighter uppercase">{company?.nome_fantasia || 'VENDA FÁCIL'}</h2>
                            <div className="text-sm font-bold text-gray-500 space-y-1">
                                <p className="flex items-center gap-2"><Building2 size={14} /> {company?.razao_social || 'Empresa de Teste LTDA'}</p>
                                <p>CNPJ: {company?.cnpj || '00.000.000/0000-00'} | IE: {company?.inscricao_estadual || 'ISENTO'}</p>
                                <p>{company?.endereco.logradouro}, {company?.endereco.numero} - {company?.endereco.bairro}</p>
                                <p>{company?.endereco.cidade} - {company?.endereco.uf} | CEP: {company?.endereco.cep}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-blue-50 px-4 py-2 rounded-lg inline-block mb-2">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Documento Não Fiscal</span>
                                <span className="text-xl font-black text-blue-700">NOTA Nº {selectedSale.nfe_numero || selectedSale.id.slice(0, 6)}</span>
                            </div>
                            <p className="text-xs font-bold text-gray-400 mt-1 flex items-center justify-end gap-1">
                                <Calendar size={12} /> {new Date(selectedSale.data_venda).toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <User size={14} className="text-blue-500" /> Identificação do Cliente
                        </h3>
                        {selectedSale.cliente_id ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Nome / Razão Social</p>
                                    <p className="font-bold text-gray-700">CLIENTE IDENTIFICADO (ID: {selectedSale.cliente_id})</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Documento</p>
                                    <p className="font-bold text-gray-700">CPF/CNPJ NÃO INFORMADO</p>
                                </div>
                            </div>
                        ) : (
                            <p className="font-bold text-gray-500 italic">CONSUMIDOR FINAL (NÃO IDENTIFICADO)</p>
                        )}
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="py-3 text-left">CÓDIGO</th>
                                <th className="py-3 text-left">DESCRIÇÃO DOS PRODUTOS</th>
                                <th className="py-3 text-center">QTD</th>
                                <th className="py-3 text-right">UN</th>
                                <th className="py-3 text-right">PREÇO UNIT.</th>
                                <th className="py-3 text-right">TOTAL BRUTO</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {selectedSale.itens.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-50 group">
                                    <td className="py-4 font-mono text-xs text-gray-400">{item.produto_id.slice(0, 8)}</td>
                                    <td className="py-4 font-bold text-gray-700">{item.nome}</td>
                                    <td className="py-4 text-center font-black">{item.quantidade}</td>
                                    <td className="py-4 text-right uppercase text-xs font-bold text-gray-400">un</td>
                                    <td className="py-4 text-right font-medium">R$ {item.preco_unitario.toFixed(2)}</td>
                                    <td className="py-4 text-right font-black">R$ {item.subtotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="flex justify-end pt-4 border-t-2 border-gray-100 border-dashed">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                <span>Subtotal Itens</span>
                                <span>R$ {(selectedSale.valor_total + (selectedSale.desconto_total || 0)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-orange-600 uppercase">
                                <span>Desconto Total</span>
                                <span>- R$ {(selectedSale.desconto_total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                                <span className="text-sm font-black text-gray-800 uppercase">Vlr. Total Líquido</span>
                                <span className="text-3xl font-black text-blue-700 tracking-tighter">R$ {selectedSale.valor_total.toFixed(2)}</span>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Tag size={10} /> Forma de Pagamento
                                </p>
                                <p className="text-sm font-black text-blue-800 uppercase">{selectedSale.tipo_pagamento.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] border-t pt-8">
                        <p>OBRIGADO POR COMPRAR CONOSCO - VENDA FÁCIL SISTEMAS</p>
                        <p className="mt-1 italic">Este documento não possui valor fiscal para fins de crédito de ICMS.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Notas de Venda (Não Fiscal)</h1>
                <p className="text-gray-600">Histórico de vendas comuns e emissão de comprovantes</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por número da nota..."
                            className="pl-10 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Nº Venda</th>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Valor Total</th>
                                <th className="px-6 py-4">Pagamento</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {filteredSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                                                <FileText size={16} />
                                            </div>
                                            <span className="font-bold text-gray-700">#{sale.nfe_numero || sale.id.slice(0, 6)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(sale.data_venda).toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-black text-gray-800">
                                        {sale.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 capitalize text-xs text-gray-400">{sale.tipo_pagamento.replace('_', ' ')}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" className="text-blue-600 font-black text-[10px] uppercase" onClick={() => setSelectedSale(sale)}>
                                            Gerar Nota
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Nenhuma venda encontrada</p>
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

export default CommonSales;
