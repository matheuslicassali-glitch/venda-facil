
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
  const [range, setRange] = useState({ modelo: 55, serie: 1, start: '', end: '' });
  const [inutilizacoes, setInutilizacoes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Documentos' | 'Inutilizacoes'>('Documentos');

  const isAdminOrGerente = currentUser?.cargo === 'Administrador' || currentUser?.cargo === 'Gerente';

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const [sales, inuts] = await Promise.all([
        db.sales.list(),
        db.fiscal.listInutilizacoes()
      ]);
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
      setInutilizacoes(inuts || []);
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
      await db.sales.cancel(cancelingInvoice.id, justification);
      onNotify('✅ Protocolo de cancelamento enviado com sucesso!', 'success');
      setCancelingInvoice(null);
      setJustification('');
      loadSales();
    } catch (err) {
      onNotify('❌ Erro no processamento do cancelamento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInutilizar = async () => {
    if (!isAdminOrGerente) {
        onNotify('❌ Permissão negada para inutilização de faixa.', 'error');
        return;
    }
    if (justification.length < 15) {
      onNotify('⚠️ Justificativa insuficiente (Mín 15 carac).', 'error');
      return;
    }
    if (!range.start || !range.end) {
      onNotify('⚠️ Informe a faixa inicial e final.', 'error');
      return;
    }
    setLoading(true);
    try {
      await db.fiscal.inutilizar({
        modelo: range.modelo,
        serie: range.serie,
        numero_inicial: parseInt(range.start),
        numero_final: parseInt(range.end),
        justificativa: justification
      });
      onNotify(`✅ Faixa ${range.start} a ${range.end} inutilizada com sucesso!`, 'success');
      setInutilizingRange(false);
      setJustification('');
      setRange({ modelo: 55, serie: 1, start: '', end: '' });
      loadSales();
    } catch (err) {
      onNotify('❌ Falha na transmissão da inutilização.', 'error');
    } finally {
      setLoading(false);
    }
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-3xl border border-border shadow-sm mb-8">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-200">
                 <FileText size={18} />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Cofre Fiscal Inteligente</h1>
           </div>
          <p className="text-muted-foreground font-medium text-sm italic">Monitoramento em tempo real de emissões e obrigações SEFAZ</p>
        </div>
        <div className="flex gap-2">
            {!isAdminOrGerente ? (
                 <div className="flex items-center gap-2 px-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <Lock size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Acesso Restrito</span>
                 </div>
            ) : (
                <Button variant="ghost" onClick={() => setInutilizingRange(true)} className="text-red-500 hover:bg-red-50 border-red-100 uppercase text-[10px] font-black tracking-widest px-6 h-12 rounded-2xl">
                    Inutilizar Faixa
                </Button>
            )}
          <Button variant="ghost" onClick={handleSync} disabled={loading} className="border-border h-12 px-4 rounded-2xl hover:bg-background text-foreground">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <div className="flex items-center bg-muted text-muted-foreground p-1 rounded-2xl gap-1">
            <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'pdv' }))} className="bg-primary text-primary-foreground rounded-xl h-10 text-[10px] font-black px-5 uppercase tracking-widest shadow-lg shadow-blue-500/20">
              NFC-e
            </Button>
            <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'nfe_manual' }))} className="bg-indigo-600 text-white rounded-xl h-10 text-[10px] font-black px-5 uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              NF-e
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="p-5 border-b border-border bg-muted text-muted-foreground/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex bg-gray-200/50 p-1 rounded-2xl">
                {(['Documentos', 'Inutilizacoes'] as const).map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-card text-card-foreground text-primary shadow-sm' : 'text-muted-foreground hover:text-gray-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="h-8 w-[1px] bg-gray-200 mx-2" />
            <div className="relative flex-1 min-w-[300px]">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                <Search size={18} />
                </span>
                <input
                type="text"
                placeholder={activeTab === 'Documentos' ? "Pesquisar por número, série ou chave..." : "Pesquisar inutilizações..."}
                className="pl-12 w-full px-4 py-3 bg-card text-card-foreground border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring font-bold transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
          {activeTab === 'Documentos' && (
            <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
                {(['Todas', 'NFe', 'NFCe'] as const).map((t) => (
                <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-6 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${filterType === t ? 'bg-card text-card-foreground text-primary shadow-md scale-105' : 'text-muted-foreground hover:text-gray-600'}`}
                >
                    {t}
                </button>
                ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'Documentos' ? (
              <table className="w-full text-left">
                <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="px-8 py-6 text-white">Identificação Fiscal</th>
                    <th className="px-8 py-6 text-white text-center">Modelo / Série</th>
                    <th className="px-8 py-6 text-white">Snapshot de Emissão</th>
                    <th className="px-8 py-6 text-white">Valor do Documento</th>
                    <th className="px-8 py-6 text-right text-white">Auditoria / XML</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted text-muted-foreground transition-all group">
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-primary text-primary-foreground group-hover:text-white transition-all">
                            <FileText size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                            <p className="font-black text-foreground text-sm tracking-tight">NÚMERO {inv.numero}</p>
                            {getStatusBadge(inv.status)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-300 font-black uppercase tracking-widest group-hover:text-primary">
                                <Hash size={12} /> {inv.chave ? inv.chave.substring(0, 20) + '...' : 'GERANDO CHAVE...'}
                            </div>
                        </div>
                        </div>
                    </td>
                    <td className="px-8 py-5">
                        <div className="inline-flex flex-col">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase text-center ${inv.tipo === 'NFe' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-muted-foreground'}`}>
                                {inv.tipo}
                            </span>
                            <span className="text-[8px] font-black text-gray-300 mt-1 uppercase text-center">SÉRIE {inv.serie}</span>
                        </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-muted-foreground">{inv.data}</td>
                    <td className="px-8 py-5 font-black text-foreground tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.valor)}
                    </td>
                    <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                        <button onClick={() => setViewingXml(inv.xml || null)} className="p-2.5 text-gray-300 hover:text-primary hover:bg-blue-50 rounded-xl transition-all" title="Ver XML">
                            <Eye size={20} />
                        </button>
                        <button onClick={() => inv.xml && handleDownloadXML(inv.xml, inv.numero)} className="p-2.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Download XML">
                            <Download size={20} />
                        </button>
                        {(inv.status !== 'Cancelada' && inv.status !== 'Inutilizada') && (
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
                        <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border">
                            <FileText size={40} className="text-gray-200" />
                        </div>
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Nenhum documento localizado</p>
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
                <thead>
                <tr className="bg-muted text-muted-foreground/50 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="px-8 py-5">Modelo / Série</th>
                    <th className="px-8 py-5">Faixa Inutilizada</th>
                    <th className="px-8 py-5">Protocolo SEFAZ</th>
                    <th className="px-8 py-5">Justificativa</th>
                    <th className="px-8 py-5 text-right">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {inutilizacoes.map((inut) => (
                    <tr key={inut.id} className="hover:bg-muted text-muted-foreground transition-all">
                        <td className="px-8 py-5">
                            <div className="font-black text-foreground text-sm">MOD {inut.modelo} / SÉRIE {inut.serie}</div>
                            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{new Date(inut.created_at).toLocaleString('pt-BR')}</div>
                        </td>
                        <td className="px-8 py-5">
                            <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-black text-xs">
                                {inut.numero_inicial} até {inut.numero_final}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-xs font-mono font-bold text-gray-600">{inut.protocolo || 'PROCESSANDO...'}</td>
                        <td className="px-8 py-5">
                            <p className="text-xs text-muted-foreground font-medium max-w-xs truncate" title={inut.justificativa}>{inut.justificativa}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                             <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tight">Homologado</span>
                        </td>
                    </tr>
                ))}
                {inutilizacoes.length === 0 && (
                    <tr>
                    <td colSpan={5} className="py-24 text-center">
                        <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border">
                            <RotateCcw size={40} className="text-gray-200" />
                        </div>
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Nenhuma inutilização registrada</p>
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
          )}
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

      <Modal isOpen={inutilizingRange} onClose={() => setInutilizingRange(false)} title="🚫 Inutilização de Faixa Numérica">
        <div className="pt-4 space-y-8">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl flex items-start gap-4 text-amber-800 shadow-sm">
            <ShieldAlert size={32} className="text-amber-500 mt-1 shrink-0" />
            <div>
                 <p className="font-black text-xs uppercase tracking-widest mb-1">Atenção Fiscal</p>
                 <p className="text-sm font-medium leading-relaxed">A inutilização deve ser feita apenas para números que NUNCA foram usados em notas autorizadas, canceladas ou denegadas.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Modelo</label>
                <select 
                    className="w-full p-4 bg-muted text-muted-foreground border-2 border-border rounded-2xl font-black text-gray-700 outline-none"
                    value={range.modelo}
                    onChange={e => setRange({...range, modelo: parseInt(e.target.value)})}
                >
                    <option value={55}>55 - NF-e</option>
                    <option value={65}>65 - NFC-e</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Série</label>
                <input 
                    type="number"
                    className="w-full p-4 bg-muted text-muted-foreground border-2 border-border rounded-2xl font-black text-gray-700 outline-none"
                    value={range.serie}
                    onChange={e => setRange({...range, serie: parseInt(e.target.value)})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Número Inicial</label>
                <input 
                    type="number"
                    className="w-full p-4 bg-muted text-muted-foreground border-2 border-border rounded-2xl font-black text-gray-700 outline-none"
                    placeholder="Ex: 100"
                    value={range.start}
                    onChange={e => setRange({...range, start: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Número Final</label>
                <input 
                    type="number"
                    className="w-full p-4 bg-muted text-muted-foreground border-2 border-border rounded-2xl font-black text-gray-700 outline-none"
                    placeholder="Ex: 110"
                    value={range.end}
                    onChange={e => setRange({...range, end: e.target.value})}
                />
            </div>
          </div>

          <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Justificativa (Mín 15 carac.)</label>
              <textarea
                className="w-full h-32 p-5 bg-muted text-muted-foreground border-2 border-border rounded-3xl font-bold text-gray-700 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300"
                placeholder="Ex: Quebra de sequência numérica devido a erro de sistema..."
                value={justification}
                onChange={e => setJustification(e.target.value)}
              />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="ghost" type="button" onClick={() => setInutilizingRange(false)} className="font-black text-[10px] uppercase tracking-widest">Cancelar</Button>
            <Button disabled={justification.length < 15 || !range.start || !range.end || loading} onClick={handleInutilizar} className="h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20">
                {loading ? 'Transmitindo...' : 'Transmitir Inutilização'}
            </Button>
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
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Justificativa Pormenorizada (Mín 15 carac.)</label>
              <textarea
                className="w-full h-32 p-5 bg-muted text-muted-foreground border-2 border-border rounded-3xl font-bold text-gray-700 focus:border-red-500 outline-none transition-all placeholder:text-gray-300"
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
