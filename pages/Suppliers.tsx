
import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Building2, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { db } from '../utils/databaseService';
import { Supplier, Permission } from '../types';
import { formatCNPJ, formatPhone } from '../utils/validation';

interface SuppliersProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
  currentUser: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Suppliers: React.FC<SuppliersProps> = ({ onNotify, currentUser }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [supToDelete, setSupToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ 
    nome: '', 
    cnpj: '', 
    email: '', 
    telefone: '', 
    endereco: '' 
  });

  const isVendedor = currentUser?.cargo === 'Vendedor';

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await db.suppliers.list();
      setSuppliers(data);
    } catch (err) {
      onNotify('❌ Erro ao carregar fornecedores.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sup: Supplier | null = null) => {
    if (sup) {
      setEditingSup(sup);
      setFormData({ 
          nome: sup.nome, 
          cnpj: sup.cnpj, 
          email: sup.email, 
          telefone: sup.telefone, 
          endereco: sup.endereco 
      });
    } else {
      setEditingSup(null);
      setFormData({ 
          nome: '', 
          cnpj: '', 
          email: '', 
          telefone: '', 
          endereco: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const rawCnpj = formData.cnpj.replace(/\D/g, '');
    if (rawCnpj.length !== 14) {
        onNotify('⚠️ CNPJ Inválido! Deve conter 14 dígitos.', 'error');
        return;
    }

    setLoading(true);

    const supplierData: Supplier = {
      id: editingSup ? editingSup.id : undefined as any,
      ...formData
    };

    try {
      await db.suppliers.save(supplierData, !!editingSup);
      onNotify(`✅ Fornecedor ${editingSup ? 'atualizado' : 'cadastrado'}!`, 'success');
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      onNotify('❌ Erro ao salvar fornecedor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supToDelete) return;
    if (isVendedor) {
        onNotify('❌ Vendedores não possuem autorização para excluir fornecedores.', 'error');
        return;
    }
    setLoading(true);
    try {
      await db.suppliers.delete(supToDelete.id);
      onNotify('🗑️ Parceiro removido com sucesso!', 'success');
      setIsDeleteModalOpen(false);
      setSupToDelete(null);
      loadSuppliers();
    } catch (err) {
      onNotify('❌ Erro ao remover fornecedor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(sup =>
    sup.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.cnpj.includes(searchTerm)
  );

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Cadeia de Fornecedores</h1>
          <p className="text-gray-600 font-medium">Gestão de parceiros e insumos logísticos</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
          <Plus size={20} />
          <span>Novo Parceiro</span>
        </Button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Fornecedor / Sede</th>
                  <th className="px-6 py-4">Contatos Corporativos</th>
                  <th className="px-6 py-4">Documentação (CNPJ)</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-inner">
                          <Truck size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{sup.nome}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-black uppercase tracking-tighter truncate max-w-[250px]">
                            <MapPin size={10} className="text-blue-300" /> {sup.endereco || 'LOCAL NÃO INFORMADO'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                             <Mail size={12} className="text-blue-400" /> {sup.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                             <Phone size={12} className="text-blue-400" /> {sup.telefone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-sm font-black text-gray-700">
                            <Building2 size={14} className="text-gray-400" />
                            {sup.cnpj}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(sup)}
                        className="p-2.5 text-gray-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50"
                        title="Ficha Técnica"
                      >
                        <Edit size={18} />
                      </button>
                      {!isVendedor && (
                          <button
                          onClick={() => { setSupToDelete(sup); setIsDeleteModalOpen(true); }}
                          className="p-2.5 text-gray-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
                          title="Descontinuar Parceiro"
                          >
                          <Trash2 size={18} />
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                    <tr>
                        <td colSpan={4} className="py-24 text-center">
                            <Globe size={48} className="mx-auto text-gray-200 mb-4 animate-spin duration-[10s]" />
                            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Mapeie novos fornecedores globais</p>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSup ? "📝 Atualizar Dados do Parceiro" : "🚚 Novo Cadastro de Fornecedor"}>
        <form onSubmit={handleSave} className="space-y-8 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={20} /></div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Contrato Social e Identidade</h3>
            </div>

            <Input label="Razão Social Completa" placeholder="Ex: Atacadista Brasil de Alimentos LTDA" required maxLength={150} value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Input label="CNPJ Principal" placeholder="00.000.000/0000-00" required value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })} />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter px-1">Obrigatório p/ NF-e de entrada</p>
                </div>
                <Input label="E-mail de Pedidos" type="email" placeholder="vendas@fornecedor.com.br" maxLength={100} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Telefone / SAC Comercial" placeholder="(00) 0000-0000" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} />
                <Input label="Endereço Logístico Sede" placeholder="Logradouro, nº, Cidade - UF" maxLength={200} value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t sticky bottom-0 bg-white pb-2 z-10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Descartar Cadastro</Button>
            <Button type="submit" disabled={loading} className="px-10 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                {loading ? 'Processando...' : 'Finalizar Registro'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="⚠️ Remover do Fluxo de Compras?">
        <div className="p-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck size={32} />
            </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">Desvincular Fornecedor?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed text-sm">
            Tem certeza que deseja apagar os dados de <strong>{supToDelete?.nome}</strong> do sistema?
            Isso afetará o histórico de compras e entradas futuras até um novo cadastro.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="danger" fullWidth onClick={handleDelete} className="h-12 text-base font-black shadow-lg shadow-red-500/20">Remover Parceiro</Button>
            <Button variant="ghost" fullWidth onClick={() => setIsDeleteModalOpen(false)}>Manter Cadastro</Button>
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

export default Suppliers;
