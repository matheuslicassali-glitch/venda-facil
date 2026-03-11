
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, CreditCard, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Client, Permission } from '../types';
import { db } from '../utils/databaseService';
import { formatCPF, formatCNPJ, formatPhone, formatCEP, validateCPF, validateCNPJ } from '../utils/validation';

interface ClientsProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
    currentUser: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Clients: React.FC<ClientsProps> = ({ onNotify, currentUser }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        razao_social: '',
        documento: '',
        inscricao_estadual: '',
        email: '',
        telefone: '',
        limite_credito: '0',
        saldo_devedor: '0',
        endereco: '', // combined
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        ibge_cidade: ''
    });

    const isVendedor = currentUser?.cargo === 'Vendedor';

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setLoading(true);
        try {
            const data = await db.clients.list();
            setClients(data);
        } catch (err) {
            onNotify('❌ Erro ao carregar clientes.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (client: Client | null = null) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                nome: client.nome,
                razao_social: client.razao_social || '',
                documento: client.documento,
                inscricao_estadual: client.inscricao_estadual || '',
                email: client.email,
                telefone: client.telefone,
                limite_credito: client.limite_credito.toString(),
                saldo_devedor: (client.saldo_devedor || 0).toString(),
                endereco: client.endereco,
                logradouro: client.logradouro || '',
                numero: client.numero || '',
                bairro: client.bairro || '',
                cidade: client.cidade || '',
                uf: client.uf || '',
                cep: client.cep || '',
                ibge_cidade: client.ibge_cidade || ''
            });
        } else {
            setEditingClient(null);
            setFormData({
                nome: '',
                razao_social: '',
                documento: '',
                inscricao_estadual: '',
                email: '',
                telefone: '',
                limite_credito: '0',
                saldo_devedor: '0',
                endereco: '',
                logradouro: '',
                numero: '',
                bairro: '',
                cidade: '',
                uf: '',
                cep: '',
                ibge_cidade: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const rawDoc = formData.documento.replace(/\D/g, '');
        if (rawDoc.length !== 11 && rawDoc.length !== 14) {
            onNotify('⚠️ Documento (CPF/CNPJ) inválido!', 'error');
            return;
        }

        if (formData.email && !formData.email.includes('@')) {
            onNotify('⚠️ E-mail inválido!', 'error');
            return;
        }

        setLoading(true);

        const clientData: Client = {
            id: editingClient ? editingClient.id : undefined as any,
            nome: formData.nome,
            razao_social: formData.razao_social,
            documento: formData.documento,
            inscricao_estadual: formData.inscricao_estadual,
            email: formData.email,
            telefone: formData.telefone,
            limite_credito: parseFloat(formData.limite_credito) || 0,
            saldo_devedor: parseFloat(formData.saldo_devedor) || 0,
            endereco: formData.endereco || `${formData.logradouro}, ${formData.numero}, ${formData.bairro} - ${formData.cidade}/${formData.uf}`,
            logradouro: formData.logradouro,
            numero: formData.numero,
            bairro: formData.bairro,
            cidade: formData.cidade,
            uf: formData.uf,
            cep: formData.cep,
            ibge_cidade: formData.ibge_cidade
        };

        try {
            await db.clients.save(clientData, !!editingClient);
            onNotify(`✅ Cliente ${editingClient ? 'atualizado' : 'cadastrado'}!`, 'success');
            setIsModalOpen(false);
            loadClients();
        } catch (err) {
            onNotify('❌ Erro ao salvar cliente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!clientToDelete) return;
        if (isVendedor) {
            onNotify('❌ Vendedores não podem excluir clientes.', 'error');
            return;
        }
        setLoading(true);
        try {
            const { error } = await db.supabase.from('clientes').delete().eq('id', clientToDelete.id);
            if (error) throw error;
            onNotify('🗑️ Cliente removido.', 'success');
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
            loadClients();
        } catch (err) {
            onNotify('❌ Erro ao remover cliente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documento.includes(searchTerm)
    );

    const handleDocChange = (val: string) => {
        const raw = val.replace(/\D/g, '');
        if (raw.length <= 11) {
            setFormData({ ...formData, documento: formatCPF(raw) });
        } else {
            setFormData({ ...formData, documento: formatCNPJ(raw) });
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Clientes</h1>
                    <p className="text-gray-600 font-medium font-medium">Gestão de carteira e limites de crédito</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={20} />
                    <span>Novo Cliente</span>
                </Button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF/CNPJ..."
                            className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Cliente / Documento</th>
                                <th className="px-6 py-4">Contato / Localização</th>
                                <th className="px-6 py-4">Crédito / Saldo</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClients.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-inner">
                                                {c.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{c.nome}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter bg-gray-100 px-1 rounded">{c.documento}</span>
                                                    {c.razao_social && <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter border-l pl-2 truncate max-w-[150px]">{c.razao_social}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                <Mail size={12} className="text-indigo-400" /> {c.email || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                <Phone size={12} className="text-indigo-400" /> {c.telefone || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                                                <MapPin size={10} className="text-gray-300" /> {c.cidade} / {c.uf}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 inline-block min-w-[150px]">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[8px] text-gray-400 font-black uppercase">Limite:</span>
                                                <span className="text-xs font-black text-gray-700">{c.limite_credito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] text-gray-400 font-black uppercase">Dívida:</span>
                                                <span className={`text-xs font-black ${c.saldo_devedor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {c.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                            {c.limite_credito > 0 && (
                                                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${c.saldo_devedor > c.limite_credito ? 'bg-red-600' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min(100, (c.saldo_devedor / c.limite_credito) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-1">
                                        <button onClick={() => handleOpenModal(c)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                        {!isVendedor && (
                                            <button onClick={() => { setClientToDelete(c); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Remover">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <Users size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Acelere seu negócio cadastrando clientes</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "👤 Editar Perfil do Cliente" : "🤝 Novo Relacionamento com Cliente"}>
                <form onSubmit={handleSave} className="space-y-8 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b-2 border-indigo-100 pb-2">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserCheck size={20} /></div>
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Identificação e Contato</h3>
                        </div>
                        
                        <Input label="Nome Completo / Fantasia" placeholder="Nome do cliente" required maxLength={100} value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Input label="CPF ou CNPJ" placeholder="000..." required value={formData.documento} onChange={e => handleDocChange(e.target.value)} />
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter px-1">Insira apenas números</p>
                            </div>
                            <Input label="Inscrição Estadual" placeholder="Isento" maxLength={20} value={formData.inscricao_estadual} onChange={e => setFormData({ ...formData, inscricao_estadual: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="E-mail" type="email" placeholder="email@exemplo.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <Input label="Telefone / WhatsApp" placeholder="(00) 00000-0000" required value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} />
                        </div>

                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <Input 
                                    label="Limite de Crédito (Fiado)" 
                                    type="number" 
                                    step="0.01" 
                                    disabled={isVendedor && !!editingClient}
                                    value={formData.limite_credito} 
                                    onChange={e => setFormData({ ...formData, limite_credito: e.target.value })} 
                                />
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter px-1 mt-1">Limite máx. de compras a prazo</p>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600 font-black">
                                <CreditCard size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b-2 border-orange-100 pb-2">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><MapPin size={20} /></div>
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Localização e Notas</h3>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                                <Input label="CEP" placeholder="00000-000" required value={formData.cep} onChange={e => setFormData({ ...formData, cep: formatCEP(e.target.value) })} />
                            </div>
                            <div className="col-span-2">
                                <Input label="Logradouro" placeholder="Rua, Av..." required maxLength={100} value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} />
                            </div>
                            <div className="col-span-1">
                                <Input label="Nº" placeholder="S/N" required maxLength={10} value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Bairro" placeholder="Central" required maxLength={50} value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                            <Input label="Cidade" placeholder="Cidade" required maxLength={50} value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">UF</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-700"
                                    value={formData.uf} 
                                    onChange={e => setFormData({ ...formData, uf: e.target.value })}
                                >
                                    <option value="">UF</option>
                                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Input label="Referência / Razão Social Secundária" placeholder="Ex: Próximo à padaria" maxLength={150} value={formData.razao_social} onChange={e => setFormData({ ...formData, razao_social: e.target.value })} />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t sticky bottom-0 bg-white pb-2 z-10">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="px-10 h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30">
                            {loading ? 'Salvando...' : 'Concluir Cadastro'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="🔥 Atenção: Excluir Cliente">
                <div className="p-4 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Trash2 size={32} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800 mb-2">Remover Histórico?</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                        Tem certeza que deseja apagar o registro de <strong>{clientToDelete?.nome}</strong>?
                        {clientToDelete?.saldo_devedor && clientToDelete.saldo_devedor > 0 && (
                            <span className="block mt-2 font-black text-red-600 uppercase text-[10px] animate-bounce">Aviso: Este cliente ainda possui uma dívida de {clientToDelete.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        )}
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button variant="danger" fullWidth onClick={handleDelete} className="h-12 text-base font-black shadow-lg shadow-red-500/20">Sim, Confirmar Exclusão</Button>
                        <Button variant="ghost" fullWidth onClick={() => setIsDeleteModalOpen(false)}>Não, manter registro</Button>
                    </div>
                </div>
            </Modal>

             <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Clients;
