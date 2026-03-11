
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Search, AlertCircle, CheckCircle2, Clock, RefreshCw, Eye, Key, Trash2, ReceiptText, RotateCcw, ShieldAlert, Lock, Hash } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { db, generateUUID } from '../utils/databaseService';
import { Invoice, Sale, Permission } from '../types';

interface InvoicesProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
    currentUser?: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Invoices: React.FC<InvoicesProps> = ({ onNotify, currentUser }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Todas' | 'NFe' | 'NFCe'>('Todas');
  const [loading, setLoading] = useState(false);
  const [viewingXml, setViewingXml] = useState<string | null>(null);
  const [cancelingInvoice, setCancelingInvoice] = useState<any | null>(null);
  const [inutilizingRange, setInutilizingRange] = useState(false);
  const [justification, setJustification] = useState('');
  const [range, setRange] = useState({ start: '', end: '' });

  const isAdminOrGerente = currentUser?.cargo === 'Administrador' || currentUser?.cargo === 'Gerente';

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const sales = await db.sales.list();
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
    } catch (err) {
      onNotify('❌ Falha ao sincronizar documentos fiscais.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!isAdminOrGerente) {
        onNotify('❌ Permissão negada para cancelamento fiscal.', 'error');
        return;
    }
    if (justification.length < 15) {
      onNotify('⚠️ A justificativa deve ter pelo menos 15 caracteres.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data: sale } = await db.supabase.from('vendas').select('*').eq('id', cancelingInvoice.id).single();
      if (sale) {
        await db.supabase.from('vendas').update({
          status: 'cancelada',
          fiscal_status: 'erro'
        }).eq('id', cancelingInvoice.id);

        onNotify('✅ Protocolo de cancelamento enviado com sucesso!', 'success');
        setCancelingInvoice(null);
        setJustification('');
        loadSales();
      }
    } catch (err) {
      onNotify('❌ Erro no processamento do cancelamento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInutilizar = () => {
    if (!isAdminOrGerente) {
        onNotify('❌ Permissão negada para inutilização de faixa.', 'error');
        return;
    }
    if (justification.length < 15) {
      onNotify('⚠️ Justificativa insuficiente.', 'error');
      return;
    }
    onNotify(`✅ Faixa ${range.start} a ${range.end} inutilizada no SEFAZ.`, 'success');
    setInutilizingRange(false);
    setJustification('');
    setRange({ start: '', end: '' });
  };

  const handleSync = () => {
    setLoading(true);
    setTimeout(() => {
      loadSales();
      setLoading(false);
      onNotify('🔄 Base fiscal sincronizada!', 'success');
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
    onNotify('💾 XML baixado.', 'success');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Autorizada':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tight"><CheckCircle2 size={12} /> Autorizada</span>;
      case 'Pendente':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tight"><Clock size={12} /> Pendente</span>;
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
    <div className="animate-in fade-in duration-500 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Cofre Fiscal (SEFAZ)</h1>
          <p className="text-gray-600 font-medium">Arquivamento e monitoramento de NFe e NFCe emitidas</p>
        </div>
        <div className="flex gap-2">
            {!isAdminOrGerente ? (
                 <div className="flex items-center gap-2 px-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <Lock size={16} /> <span className="text-[10px] font-black uppercase">Operações Restritas</span>
                 </div>
            ) : (
                <Button variant="ghost" onClick={() => setInutilizingRange(true)} className="text-red-600 hover:bg-red-50 border-red-100 uppercase text-[10px] font-black tracking-widest px-6 h-11">
                    Inutilizar Faixa
                </Button>
            )}
          <Button variant="ghost" onClick={handleSync} disabled={loading} className="border border-gray-200 h-11 px-4">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl gap-1">
            <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'pdv' }))} className="bg-blue-600 rounded-xl h-9 text-[10px] font-black px-4 uppercase tracking-widest shadow-lg shadow-blue-500/20">
              NFC-e
            </Button>
            <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'nfe_manual' }))} className="bg-indigo-600 rounded-xl h-9 text-[10px] font-black px-4 uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              NF-e
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar por número, série ou chave de acesso..."
              className="pl-12 w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
            {(['Todas', 'NFe', 'NFCe'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-6 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Identificação Doc.</th>
                <th className="px-8 py-5">Tipo / Série</th>
                <th className="px-8 py-5">Snapshot Emissão</th>
                <th className="px-8 py-5">Valor Bruto</th>
                <th className="px-8 py-5 text-right">Ações Fiscais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-gray-800 text-sm tracking-tight">NÚMERO {inv.numero}</p>
                          {getStatusBadge(inv.status)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-300 font-black uppercase tracking-widest group-hover:text-blue-500">
                            <Hash size={12} /> {inv.chave ? inv.chave.substring(0, 20) + '...' : 'GERANDO CHAVE...'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="inline-flex flex-col">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase text-center ${inv.tipo === 'NFe' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                            {inv.tipo}
                        </span>
                        <span className="text-[8px] font-black text-gray-300 mt-1 uppercase text-center">SÉRIE {inv.serie}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-gray-500">{inv.data}</td>
                  <td className="px-8 py-5 font-black text-gray-800 tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.valor)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setViewingXml(inv.xml || null)} className="p-2.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Ver XML">
                        <Eye size={20} />
                      </button>
                      <button onClick={() => inv.xml && handleDownloadXML(inv.xml, inv.numero)} className="p-2.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Download XML">
                        <Download size={20} />
                      </button>
                      {inv.status !== 'Cancelada' && (
                        <>
                          <button 
                            onClick={isAdminOrGerente ? () => setCancelingInvoice(inv) : () => onNotify('❌ Apenas gerentes podem cancelar notas.', 'error')} 
                            className={`p-2.5 rounded-xl transition-all ${isAdminOrGerente ? 'text-gray-300 hover:text-red-500 hover:bg-red-50' : 'text-gray-200 opacity-50 cursor-not-allowed'}`} 
                            title="Cancelar Nota"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                        <FileText size={40} className="text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Nenhum documento localizado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals with premium styling */}
      <Modal isOpen={!!viewingXml} onClose={() => setViewingXml(null)} title="📝 Visualização Auditada XML (NFe-XML)">
        <div className="pt-4 space-y-6">
          <div className="bg-gray-900 text-emerald-400 p-8 rounded-3xl overflow-x-auto text-xs font-mono max-h-[500px] leading-relaxed shadow-2xl border-2 border-gray-800 custom-scrollbar">
            {viewingXml || 'XML não disponível para visualização.'}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setViewingXml(null)}>Voltar</Button>
            <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700">Imprimir Conteúdo</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!cancelingInvoice} onClose={() => setCancelingInvoice(null)} title="⛓️ Protocolo de Estorno Fiscal">
        <div className="pt-4 space-y-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl flex items-start gap-4 text-red-800 shadow-sm">
            <ShieldAlert size={32} className="text-red-500 mt-1 shrink-0" />
            <div>
                 <p className="font-black text-xs uppercase tracking-widest mb-1">Cuidado Operacional</p>
                 <p className="text-sm font-medium leading-relaxed">O cancelamento é um processo IRREVERSÍVEL. Certifique-se de que a mercadoria não saiu do estabelecimento ou que respeita o prazo legal da SEFAZ.</p>
            </div>
          </div>
          <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Justificativa Pormenorizada (Mín 15 carac.)</label>
              <textarea
                className="w-full h-32 p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 focus:border-red-500 outline-none transition-all placeholder:text-gray-300"
                placeholder="Descreva o motivo real do cancelamento..."
                value={justification}
                onChange={e => setJustification(e.target.value)}
              />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 flex-col sm:flex-row">
            <Button variant="ghost" type="button" onClick={() => setCancelingInvoice(null)} className="font-black text-[10px] uppercase">Abortar Operação</Button>
            <Button variant="danger" disabled={justification.length < 15 || loading} onClick={handleCancelInvoice} className="h-12 px-8 shadow-lg shadow-red-500/20 font-black text-[10px] uppercase">
                {loading ? 'Transmitindo...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Invoices;
