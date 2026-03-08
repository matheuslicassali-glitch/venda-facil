
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
        const windowPrint = window.open('', '', 'width=400,height=600');
        if (windowPrint && printContent) {
            windowPrint.document.write(`
        <html>
          <head>
            <title>Impressão de Cupom</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { 
                width: 80mm; 
                margin: 0; 
                padding: 10px; 
                font-family: 'Courier New', Courier, monospace; 
                font-size: 12px;
                color: #000;
              }
              .receipt-container { width: 100%; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-black { font-weight: bold; }
              .uppercase { text-transform: uppercase; }
              .border-dashed { border-bottom: 1px dashed #000; }
              .my-2 { margin-top: 8px; margin-bottom: 8px; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: 1fr 1fr; }
              .grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
              .col-span-2 { grid-column: span 2; }
              .col-span-3 { grid-column: span 3; }
              .col-span-5 { grid-column: span 5; }
              .leading-tight { line-height: 1.2; }
              .text-lg { font-size: 14px; }
              .text-xl { font-size: 16px; }
              .text-2xl { font-size: 20px; }
              .space-y-1 > * + * { margin-top: 4px; }
              table { width: 100%; border-collapse: collapse; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .w-40 { width: 160px; }
              .break-all { word-break: break-all; }
              @media print {
                body { margin: 0; padding: 5mm; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
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
                        <ArrowLeft size={18} /> Voltar
                    </Button>
                    <Button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600">
                        <Printer size={18} /> Imprimir na Epson T20
                    </Button>
                </div>

                <div ref={printRef} className="bg-white p-6 border mx-auto font-mono text-gray-900 leading-tight w-[320px]">
                    <div className="text-center space-y-1 mb-4">
                        <h2 className="text-lg font-bold uppercase">{company?.nome_fantasia || 'VENDA FÁCIL LTDA'}</h2>
                        <p className="text-[10px] uppercase">{company?.endereco.logradouro}, {company?.endereco.numero}</p>
                        <p className="text-[10px] uppercase">{company?.endereco.cidade} - {company?.endereco.uf}</p>
                        <div className="text-[10px] mt-2 border-t border-b border-dashed py-1">
                            <p>CNPJ: {company?.cnpj || '00.000.000/0000-00'}</p>
                            <p>IE: {company?.inscricao_estadual || 'ISENTO'}</p>
                            <p>IM: 08641569  -  {new Date(selectedSale.data_venda).toLocaleDateString()} {new Date(selectedSale.data_venda).toLocaleTimeString()}</p>
                        </div>
                    </div>

                    <div className="text-center mb-4 border-b border-dashed pb-1">
                        <h3 className="text-sm font-bold uppercase">
                            {selectedSale.xml ? 'Cupom Fiscal NFC-e' : 'Cupom Não Fiscal'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-12 text-[9px] font-bold border-b border-dashed pb-1 mb-2">
                        <div className="col-span-2">ITEM</div>
                        <div className="col-span-2">CÓD</div>
                        <div className="col-span-5">DESC</div>
                        <div className="col-span-3 text-right">VALOR</div>
                    </div>

                    <div className="space-y-1 mb-4">
                        {selectedSale.itens.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 text-[9px] leading-none">
                                <div className="col-span-2">{String(idx + 1).padStart(3, '0')}</div>
                                <div className="col-span-2">{item.produto_id.slice(0, 4)}</div>
                                <div className="col-span-5 uppercase">{item.nome}</div>
                                <div className="col-span-3 text-right">{item.subtotal.toFixed(2)}</div>
                                <div className="col-span-12 text-[8px] text-gray-500 pl-4">
                                    {item.quantidade} UN X {item.preco_unitario.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed pt-2 space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="uppercase">Total R$</span>
                            <span className="text-lg">{selectedSale.valor_total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] uppercase">
                            <span>{selectedSale.tipo_pagamento.replace('_', ' ')}</span>
                            <span>R$ {selectedSale.valor_total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] uppercase">
                            <span>Troco</span>
                            <span>R$ 0,00</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed text-[9px] uppercase space-y-1 text-center font-bold text-gray-600">
                        {selectedSale.chave_acesso ? (
                            <>
                                <p className="break-all font-normal">Chave de Acesso:</p>
                                <p className="break-all font-bold">{selectedSale.chave_acesso.match(/.{1,4}/g)?.join(' ')}</p>
                                <p className="mt-2">Protocolo: 135240008745214</p>
                            </>
                        ) : (
                            <p>*** DOCUMENTO SEM VALOR FISCAL ***</p>
                        )}
                        <div className="mt-4 opacity-50 font-normal">
                            <p>VENDA FACIL SFT - BEMATECH MP-40 / EPSON T20</p>
                            <p>{new Date(selectedSale.data_venda).toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Notas de Venda</h1>
                <p className="text-gray-600">Histórico de vendas e emissão de cupons</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar nota..."
                            className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Nº Venda</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-700">#{sale.nfe_numero || sale.id.slice(0, 6)}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(sale.data_venda).toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-black">
                                        {sale.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" className="text-blue-600 font-bold" onClick={() => setSelectedSale(sale)}>
                                            Gerar Cupom
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommonSales;
