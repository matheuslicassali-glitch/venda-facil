
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Client } from '../types';
import { db } from '../utils/databaseService';

interface ClientsProps {
    onNotify: (message: string, type: 'success' | 'error') => void;
}

const Clients: React.FC<ClientsProps> = ({ onNotify }) => {
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
        endereco: '', // combined
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        ibge_cidade: ''
    });

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

    const saveToStorage = (newClients: Client[]) => {
        setClients(newClients);
        localStorage.setItem('venda-facil-clients', JSON.stringify(newClients));
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
        setLoading(true);

        const clientData: Client = {
            id: editingClient ? editingClient.id : Math.random().toString(36).substr(2, 9),
            nome: formData.nome,
            razao_social: formData.razao_social,
            documento: formData.documento,
            inscricao_estadual: formData.inscricao_estadual,
            email: formData.email,
            telefone: formData.telefone,
            limite_credito: parseFloat(formData.limite_credito),
            saldo_devedor: editingClient ? editingClient.saldo_devedor : 0,
            endereco: formData.endereco,
            logradouro: formData.logradouro,
            numero: formData.numero,
            bairro: formData.bairro,
            cidade: formData.cidade,
            uf: formData.uf,
            cep: formData.cep,
            ibge_cidade: formData.ibge_cidade
        };

        try {
            await db.clients.upsert(clientData);
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
        setLoading(true);
        try {
            const { error } = await (db as any).supabase.from('clientes').delete().eq('id', clientToDelete.id);
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

    return (
        <div className="animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Clientes</h1>
                    <p className="text-gray-600">Gestão de carteira e limites de crédito</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    <span>Novo Cliente</span>
                </Button>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF/CNPJ..."
                            className="pl-10 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <th className="px-6 py-4">Cliente / Documento</th>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Crédito / Saldo</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClients.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black">
                                                {c.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{c.nome}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{c.documento}</span>
                                                    {c.razao_social && <span className="text-[10px] text-gray-300 font-bold uppercase border-l pl-2">{c.razao_social}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Mail size={12} className="text-gray-400" /> {c.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Phone size={12} className="text-gray-400" /> {c.telefone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 font-bold uppercase">Limite:</span>
                                                <span className="text-sm font-bold text-gray-700">{c.limite_credito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 font-bold uppercase">Dívida:</span>
                                                <span className={`text-sm font-black ${c.saldo_devedor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {c.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-1">
                                        <button onClick={() => handleOpenModal(c)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => { setClientToDelete(c); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Editar Cliente" : "Novo Cliente"}>
                <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest border-b pb-2">Identificação</h3>
                        <Input label="Nome Completo / Nome Fantasia" placeholder="Ex: João da Silva" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                        <Input label="Razão Social (Obrigatório p/ NF-e)" placeholder="Razão Social conforme CNPJ" value={formData.razao_social} onChange={e => setFormData({ ...formData, razao_social: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="CPF ou CNPJ" placeholder="000.000.000-00" required value={formData.documento} onChange={e => setFormData({ ...formData, documento: e.target.value })} />
                            <Input label="Inscrição Estadual" placeholder="Isento / Isento ou Número" value={formData.inscricao_estadual} onChange={e => setFormData({ ...formData, inscricao_estadual: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="E-mail" type="email" placeholder="cliente@exemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <Input label="Telefone / WhatsApp" placeholder="(00) 00000-0000" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
                        </div>
                        <Input label="Limite de Crédito (Pagamento a Prazo)" type="number" step="0.01" placeholder="R$ 0,00" value={formData.limite_credito} onChange={e => setFormData({ ...formData, limite_credito: e.target.value })} />
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest border-b pb-2">Endereço de Entrega / Fiscais</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Input label="Logradouro" placeholder="Ex: Rua das Flores" value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} />
                            </div>
                            <Input label="Número" placeholder="123" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Bairro" placeholder="Ex: Centro" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                            <Input label="CEP" placeholder="00000-000" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Input label="Cidade" placeholder="Nome da cidade" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                            </div>
                            <Input label="UF" placeholder="EX: SP" value={formData.uf} onChange={e => setFormData({ ...formData, uf: e.target.value })} />
                        </div>
                        <Input label="Código IBGE Município" placeholder="Ex: 3550308" value={formData.ibge_cidade} onChange={e => setFormData({ ...formData, ibge_cidade: e.target.value })} />
                        <Input label="Endereço (Texto livre / antigo)" placeholder="Rua, Número, Bairro, Cidade" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t sticky bottom-0 bg-white pb-2">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Cliente'}</Button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Remoção">
                <div className="p-4">
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Deseja realmente remover o cliente <strong>{clientToDelete?.nome}</strong>?
                        Contas em aberto podem ser perdidas.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete}>Remover Cliente</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Clients;
