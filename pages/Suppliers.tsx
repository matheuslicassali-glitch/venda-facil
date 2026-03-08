
import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { db } from '../utils/databaseService';
import { Supplier } from '../types';

interface SuppliersProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ onNotify }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [supToDelete, setSupToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ nome: '', cnpj: '', email: '', telefone: '', endereco: '' });

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
      setFormData({ nome: sup.nome, cnpj: sup.cnpj, email: sup.email, telefone: sup.telefone, endereco: sup.endereco });
    } else {
      setEditingSup(null);
      setFormData({ nome: '', cnpj: '', email: '', telefone: '', endereco: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supplierData: Supplier = {
      id: editingSup ? editingSup.id : Math.random().toString(36).substr(2, 9),
      ...formData
    };

    try {
      await db.suppliers.upsert(supplierData);
      onNotify(`✅ Fornecedor ${editingSup ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
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
    setLoading(true);
    try {
      await db.suppliers.delete(supToDelete.id);
      onNotify('🗑️ Fornecedor removido com sucesso!', 'success');
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
          <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>
          <p className="text-gray-600">Gestão de parceiros e fornecedores estratégicos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>Novo Fornecedor</span>
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
              placeholder="Buscar por nome ou CNPJ..."
              className="pl-10 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredSuppliers.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Fornecedor</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">CNPJ</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                          <Truck size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{sup.nome}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase overflow-hidden max-w-[200px] truncate">
                            <MapPin size={10} /> {sup.endereco}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600"><Mail size={14} className="text-gray-400" /> {sup.email}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-600"><Phone size={14} className="text-gray-400" /> {sup.telefone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{sup.cnpj}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(sup)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => { setSupToDelete(sup); setIsDeleteModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center">
              <Truck size={64} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum fornecedor encontrado</h3>
              <p className="text-gray-500 text-sm">Tente ajustar sua busca ou cadastrar um novo parceiro.</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSup ? "Editar Fornecedor" : "Cadastrar Fornecedor"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Razão Social" placeholder="Ex: Atacadista Brasil LTDA" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
          <Input label="CNPJ" placeholder="00.000.000/0000-00" required value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="E-mail" type="email" placeholder="contato@empresa.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <Input label="Telefone" placeholder="(00) 00000-0000" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
          </div>
          <Input label="Endereço Completo" placeholder="Rua, número, cidade - UF" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : (editingSup ? 'Salvar Alterações' : 'Salvar Fornecedor')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Remoção">
        <div className="p-4">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Deseja mesmo remover <strong>{supToDelete?.nome}</strong>?
            Esta ação não pode ser desfeita e os dados deste fornecedor serão apagados do sistema.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Remover Fornecedor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;
