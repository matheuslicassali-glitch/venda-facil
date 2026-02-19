
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Search, AlertCircle, CheckCircle2, Clock, RefreshCw, Eye, Key, Trash2, ReceiptText, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Invoice, Sale } from '../types';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Todas' | 'NFe' | 'NFCe'>('Todas');
  const [loading, setLoading] = useState(false);
  const [viewingXml, setViewingXml] = useState<string | null>(null);
  const [cancelingInvoice, setCancelingInvoice] = useState<any | null>(null);
  const [inutilizingRange, setInutilizingRange] = useState(false);
  const [justification, setJustification] = useState('');
  const [range, setRange] = useState({ start: '', end: '' });

  const loadSales = () => {
    const sales: Sale[] = JSON.parse(localStorage.getItem('venda-facil-sales') || '[]');
    const mapped = sales.map(s => ({
      id: s.id,
      numero: s.nfe_numero || '000.000.000',
      serie: '001',
      tipo: s.tipo_pagamento === 'dinheiro' ? 'NFCe' : 'NFe',
      data: new Date(s.data_venda).toLocaleString('pt-BR'),
      valor: s.valor_total,
      status: s.status === 'cancelada' ? 'Cancelada' : (s.fiscal_status === 'emitida' ? 'Autorizada' : 'Pendente'),
      xml: s.xml,
      chave: s.chave_acesso
    }));
    setInvoices(mapped);
  };

  const handleCancelInvoice = () => {
    if (justification.length < 15) {
      alert('A justificativa deve ter pelo menos 15 caracteres.');
      return;
    }
    const sales: Sale[] = JSON.parse(localStorage.getItem('venda-facil-sales') || '[]');
    const updated = sales.map(s => s.id === cancelingInvoice.id ? { ...s, status: 'cancelada' as any, fiscal_status: 'erro' as any } : s);
    localStorage.setItem('venda-facil-sales', JSON.stringify(updated));
    setCancelingInvoice(null);
    setJustification('');
    loadSales();
  };

  const handleInutilizar = () => {
    if (justification.length < 15) {
      alert('A justificativa deve ter pelo menos 15 caracteres.');
      return;
    }
    // In actual logic, this sends to SEFAZ. Here we just notify.
    alert(`Números ${range.start} até ${range.end} inutilizados com sucesso.`);
    setInutilizingRange(false);
    setJustification('');
    setRange({ start: '', end: '' });
  };

  const handleDevolucao = (saleId: string) => {
    if (!window.confirm('Deseja gerar uma nota de devolução para esta venda?')) return;
    const sales: Sale[] = JSON.parse(localStorage.getItem('venda-facil-sales') || '[]');
    const saleToReturn = sales.find(s => s.id === saleId);
    if (saleToReturn) {
      const returnSale: Sale = {
        ...saleToReturn,
        id: Math.random().toString(36).substr(2, 9),
        data_venda: new Date().toISOString(),
        tipo_operacao: 'devolucao',
        valor_total: -saleToReturn.valor_total,
        desconto_total: 0,
        status: 'concluida',
        fiscal_status: 'pendente',
        nfe_numero: Math.floor(100000 + Math.random() * 900000).toString(),
        xml: undefined,
        chave_acesso: undefined
      };
      localStorage.setItem('venda-facil-sales', JSON.stringify([...sales, returnSale]));
      alert('Nota de Devolução gerada com sucesso! Agora você pode emitir o XML.');
      loadSales();
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleSync = () => {
    setLoading(true);
    setTimeout(() => {
      loadSales();
      setLoading(false);
    }, 800);
  };

  const handleDownloadXML = (xml: string, numero: string) => {
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NFe_${numero}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Autorizada':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tight"><CheckCircle2 size={12} /> Autorizada</span>;
      case 'Pendente':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase tracking-tight"><Clock size={12} /> Pendente</span>;
      case 'Cancelada':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-tight"><AlertCircle size={12} /> Cancelada</span>;
      default: return null;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.numero.includes(searchTerm) || inv.serie.includes(searchTerm) || (inv.chave && inv.chave.includes(searchTerm));
    const matchesType = filterType === 'Todas' || inv.tipo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Documentos Fiscais</h1>
          <p className="text-gray-600">Gestão de NFe e NFCe emitida pela empresa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setInutilizingRange(true)} className="text-red-600 hover:bg-red-50 border-red-100 uppercase text-[10px] font-black">
            Inutilizar
          </Button>
          <Button variant="secondary" onClick={handleSync} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Sincronizar</span>
          </Button>
          <div className="flex items-center gap-1">
            <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'pdv' }))} className="bg-blue-600 rounded-r-none">
              NFC-e (PDV)
            </Button>
            <Button onClick={() => alert('Emissão Manual de NF-e (Modelo 55) em desenvolvimento')} className="bg-indigo-600 rounded-l-none">
              NF-e
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar por número ou chave..."
              className="pl-10 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['Todas', 'NFe', 'NFCe'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Documento / Chave</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Data Emissão</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-gray-800">#{inv.numero}</p>
                          {getStatusBadge(inv.status)}
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                          <Key size={10} /> {inv.chave ? inv.chave.match(/.{1,4}/g)?.join(' ') : 'GERANDO CHAVE...'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase">
                      {inv.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">{inv.data}</td>
                  <td className="px-6 py-4 font-black text-gray-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.valor)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setViewingXml(inv.xml || null)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Ver XML">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => inv.xml && handleDownloadXML(inv.xml, inv.numero)} className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Download XML">
                        <Download size={18} />
                      </button>
                      <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'venda_comum' }))} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Ver Nota de Venda Comum">
                        <ReceiptText size={18} />
                      </button>
                      {inv.status !== 'Cancelada' && (
                        <>
                          <button onClick={() => setCancelingInvoice(inv)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Cancelar Nota">
                            <Trash2 size={18} />
                          </button>
                          <button onClick={() => handleDevolucao(inv.id)} className="p-2 text-gray-400 hover:text-orange-600 transition-colors" title="Gerar Devolução">
                            <RotateCcw size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium">Nenhum documento encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!viewingXml} onClose={() => setViewingXml(null)} title="Conteúdo XML da NF-e (Assinado)">
        <div className="p-4">
          <pre className="bg-gray-900 text-blue-300 p-6 rounded-xl overflow-x-auto text-xs font-mono max-h-[500px] leading-relaxed">
            {viewingXml}
          </pre>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setViewingXml(null)}>Fechar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!cancelingInvoice} onClose={() => setCancelingInvoice(null)} title="Cancelar Documento Fiscal">
        <div className="p-4 space-y-4">
          <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle size={20} className="mt-0.5" />
            <p className="text-sm font-medium">O cancelamento é irreversível e exige uma justificativa clara de pelo menos 15 caracteres para a SEFAZ.</p>
          </div>
          <Input
            label="Justificativa do Cancelamento"
            placeholder="Ex: Erro no preenchimento dos dados do destinatário..."
            value={justification}
            onChange={e => setJustification(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setCancelingInvoice(null)}>Abortar</Button>
            <Button variant="danger" disabled={justification.length < 15} onClick={handleCancelInvoice}>Confirmar Cancelamento</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={inutilizingRange} onClose={() => setInutilizingRange(false)} title="Inutilizar Numeração (SEFAZ)">
        <div className="p-4 space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg flex items-start gap-3 text-orange-700">
            <AlertCircle size={20} className="mt-0.5" />
            <p className="text-sm font-medium">Inutilize intervalos de números que não serão emitidos devido a falhas técnicas ou saltos de sequência.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Número Inicial" type="number" value={range.start} onChange={e => setRange({ ...range, start: e.target.value })} />
            <Input label="Número Final" type="number" value={range.end} onChange={e => setRange({ ...range, end: e.target.value })} />
          </div>
          <Input
            label="Justificativa"
            placeholder="Ex: Quebra de sequencial por erro de sistema local..."
            value={justification}
            onChange={e => setJustification(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setInutilizingRange(false)}>Cancelar</Button>
            <Button variant="primary" disabled={justification.length < 15 || !range.start || !range.end} onClick={handleInutilizar}>Inutilizar Faixa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
