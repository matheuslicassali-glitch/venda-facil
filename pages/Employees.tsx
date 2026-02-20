
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, BadgeCheck, ShieldCheck, UserCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Employee, Permission } from '../types';
import { db } from '../utils/databaseService';

interface EmployeesProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const Employees: React.FC<EmployeesProps> = ({ onNotify }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cargo: 'Vendedor',
    cpf: '',
    email: '',
    comissao: '5',
    permissoes: [] as Permission[]
  });

  const roleDefaults: Record<string, Permission[]> = {
    'Administrador': ['all'],
    'Gerente': ['produtos', 'pdv', 'relatorios', 'nfe', 'fornecedores', 'estoque', 'clientes', 'caixa', 'financeiro'],
    'Vendedor': ['pdv', 'clientes', 'caixa'],
    'Estoquista': ['produtos', 'estoque', 'fornecedores']
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await db.employees.list();
      setEmployees(data);
    } catch (err) {
      onNotify('❌ Erro ao carregar equipe.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveToStorage = (newEmps: Employee[]) => {
    setEmployees(newEmps);
    localStorage.setItem('venda-facil-employees', JSON.stringify(newEmps));
  };

  const handleOpenModal = (emp: Employee | null = null) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({
        nome: emp.nome,
        cargo: emp.cargo,
        cpf: emp.cpf,
        email: emp.email,
        comissao: emp.comissao?.toString() || '5',
        permissoes: emp.permissoes || []
      });
    } else {
      setEditingEmp(null);
      setFormData({
        nome: '',
        cargo: 'Vendedor',
        cpf: '',
        email: '',
        comissao: '5',
        permissoes: roleDefaults['Vendedor']
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const empData: Employee = {
      id: editingEmp ? editingEmp.id : Math.random().toString(36).substr(2, 9),
      nome: formData.nome,
      cargo: formData.cargo as any,
      cpf: formData.cpf,
      email: formData.email,
      status: editingEmp ? editingEmp.status : 'Ativo',
      comissao: parseFloat(formData.comissao),
      permissoes: formData.permissoes
    };

    try {
      await db.employees.upsert(empData);
      onNotify(`✅ Funcionário ${editingEmp ? 'atualizado' : 'cadastrado'}!`, 'success');
      setIsModalOpen(false);
      loadEmployees();
    } catch (err) {
      onNotify('❌ Erro ao salvar funcionário.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!empToDelete) return;
    setLoading(true);
    try {
      const { error } = await (db as any).supabase.from('funcionarios').delete().eq('id', empToDelete.id);
      if (error) throw error;
      onNotify('🗑️ Funcionário removido.', 'success');
      setIsDeleteModalOpen(false);
      setEmpToDelete(null);
      loadEmployees();
    } catch (err) {
      onNotify('❌ Erro ao remover funcionário.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      await db.employees.upsert({ ...emp, status: newStatus as any });
      onNotify('Status atualizado!', 'success');
      loadEmployees();
    } catch (err) {
      onNotify('❌ Erro ao atualizar status.', 'error');
    }
  };

  const filtered = employees.filter(emp =>
    emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf.includes(searchTerm)
  );

  const getBadge = (cargo: string) => {
    if (cargo === 'Administrador') return <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tighter"><ShieldCheck size={12} /> Admin</span>;
    if (cargo === 'Gerente') return <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter"><BadgeCheck size={12} /> Gerente</span>;
    return <span className="flex items-center gap-1 text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-tighter"><UserCircle size={12} /> {cargo}</span>;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Equipe e Segurança</h1>
          <p className="text-gray-600">Gestão de colaboradores e níveis de acesso ao sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>Contratar</span>
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
              placeholder="Buscar por nome ou CPF..."
              className="pl-10 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Cargo / Acesso</th>
                <th className="px-6 py-4">Comissão</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">
                        {emp.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{emp.nome}</p>
                        <p className="text-xs text-gray-400 font-medium">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getBadge(emp.cargo)}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {emp.permissoes?.map(p => (
                        <span key={p} className="text-[8px] bg-gray-100 text-gray-500 px-1 rounded font-bold uppercase">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-700">{emp.comissao}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(emp)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${emp.status === 'Ativo' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                    >
                      {emp.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(emp)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => { setEmpToDelete(emp); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 italic">Nenhum colaborador encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmp ? "Editar Colaborador" : "Novo Colaborador"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome Completo" placeholder="Ex: Maria Oliveira" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CPF" placeholder="000.000.000-00" required value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargo / Permissão</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cargo}
                onChange={e => {
                  const newCargo = e.target.value;
                  setFormData({
                    ...formData,
                    cargo: newCargo,
                    permissoes: roleDefaults[newCargo] || []
                  });
                }}
              >
                <option value="Vendedor">Vendedor</option>
                <option value="Gerente">Gerente</option>
                <option value="Administrador">Administrador</option>
                <option value="Estoquista">Estoquista</option>
              </select>
            </div>
          </div>
          <p className="text-[10px] text-blue-600 font-bold uppercase italic bg-blue-50 p-2 rounded">
            * Ao trocar o cargo, as permissões padrão são sugeridas automaticamente.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="E-mail" type="email" placeholder="maria@venda-facil.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <Input label="Comissão (%)" type="number" placeholder="5" value={formData.comissao} onChange={e => setFormData({ ...formData, comissao: e.target.value })} />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Permissões de Acesso</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {[
                { id: 'produtos', label: 'Produtos' },
                { id: 'pdv', label: 'PDV / Vendas' },
                { id: 'estoque', label: 'Estoque' },
                { id: 'caixa', label: 'Caixa' },
                { id: 'financeiro', label: 'Financeiro' },
                { id: 'clientes', label: 'Clientes' },
                { id: 'funcionarios', label: 'Funcionários' },
                { id: 'fornecedores', label: 'Fornecedores' },
                { id: 'relatorios', label: 'Relatórios' },
                { id: 'configuracoes', label: 'Configurações' },
                { id: 'nfe', label: 'NFe' },
                { id: 'all', label: 'Acesso Total' }
              ].map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.permissoes.includes(p.id as Permission)}
                    onChange={(e) => {
                      const perms = e.target.checked
                        ? [...formData.permissoes, p.id as Permission]
                        : formData.permissoes.filter(item => item !== p.id);
                      setFormData({ ...formData, permissoes: perms });
                    }}
                  />
                  <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors uppercase">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Cadastro'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Rescisão/Remoção">
        <div className="p-4">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Tem certeza que deseja remover <strong>{empToDelete?.nome}</strong> da equipe?
            O acesso ao sistema será revogado imediatamente.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Confirmar Remoção</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
