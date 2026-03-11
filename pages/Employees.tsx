
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, BadgeCheck, ShieldCheck, UserCircle, Lock, UserPlus, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Employee, Permission } from '../types';
import { db } from '../utils/databaseService';
import { formatCPF, validateCPF } from '../utils/validation';

interface EmployeesProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
  currentUser: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Employees: React.FC<EmployeesProps> = ({ onNotify, currentUser }) => {
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
    pin: '',
    permissoes: [] as Permission[]
  });

  const isSuperAdmin = currentUser?.cargo === 'Administrador';
  const isGerente = currentUser?.cargo === 'Gerente';

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

  const handleOpenModal = (emp: Employee | null = null) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({
        nome: emp.nome,
        cargo: emp.cargo,
        cpf: emp.cpf,
        email: emp.email,
        comissao: emp.comissao?.toString() || '0',
        pin: emp.pin || '',
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
        pin: '',
        permissoes: roleDefaults['Vendedor']
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!validateCPF(formData.cpf)) {
        onNotify('⚠️ CPF Inválido!', 'error');
        return;
    }

    if (formData.cargo === 'Administrador' && !isSuperAdmin) {
        onNotify('❌ Apenas Administradores podem promover outros a Administrador.', 'error');
        return;
    }

    if (formData.cargo === 'Gerente' && formData.pin.length < 4) {
        onNotify('⚠️ Gerentes devem possuir um PIN de pelo menos 4 dígitos para aprovações.', 'error');
        return;
    }

    setLoading(true);

    const empData: Employee = {
      id: editingEmp ? editingEmp.id : undefined as any,
      nome: formData.nome,
      cargo: formData.cargo as any,
      cpf: formData.cpf,
      email: formData.email,
      status: editingEmp ? editingEmp.status : 'Ativo',
      comissao: parseFloat(formData.comissao) || 0,
      pin: formData.pin,
      permissoes: formData.cargo === 'Administrador' ? ['all'] : formData.permissoes
    };

    try {
      await db.employees.save(empData, !!editingEmp);
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
    if (empToDelete.id === currentUser?.id) {
        onNotify('❌ Você não pode excluir seu próprio usuário.', 'error');
        setIsDeleteModalOpen(false);
        return;
    }
    setLoading(true);
    try {
      const { error } = await db.supabase.from('funcionarios').delete().eq('id', empToDelete.id);
      if (error) throw error;
      onNotify('🗑️ Colaborador desligado com sucesso.', 'success');
      setIsDeleteModalOpen(false);
      setEmpToDelete(null);
      loadEmployees();
    } catch (err) {
      onNotify('❌ Erro ao remover colaborador.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (emp: Employee) => {
    if (emp.id === currentUser?.id) {
        onNotify('❌ Você não pode desativar seu próprio acesso.', 'error');
        return;
    }
    const newStatus = emp.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      await db.employees.save({ ...emp, status: newStatus as any }, true);
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
    if (cargo === 'Administrador') return <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tighter shadow-sm"><ShieldCheck size={12} /> Admin Sup.</span>;
    if (cargo === 'Gerente') return <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter shadow-sm"><BadgeCheck size={12} /> Gestão</span>;
    return <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter shadow-sm"><UserCircle size={12} /> {cargo}</span>;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Equipe e Segurança</h1>
          <p className="text-gray-600 font-medium">Gestão de colaboradores e privilégios de acesso</p>
        </div>
        {(isSuperAdmin || isGerente) && (
            <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
            <UserPlus size={20} />
            <span>Adicionar Colaborador</span>
            </Button>
        )}
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar colaborador..."
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
                <th className="px-6 py-4">Informações do Colaborador</th>
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4">Ganhos / Metas</th>
                <th className="px-6 py-4">Status do Acesso</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-inner">
                        {emp.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{emp.nome}</p>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] text-gray-400 font-black tracking-tighter bg-gray-100 px-1 rounded">{emp.cpf}</span>
                             <span className="text-[10px] text-gray-400 font-bold lowercase">{emp.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getBadge(emp.cargo)}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {emp.cargo === 'Administrador' ? (
                          <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Sistema Total</span>
                      ) : emp.permissoes?.slice(0, 3).map(p => (
                        <span key={p} className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">{p}</span>
                      ))}
                      {emp.permissoes && emp.permissoes.length > 3 && (
                          <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">+{emp.permissoes.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                        <span className="text-base font-black text-gray-800">{emp.comissao}%</span>
                        <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Comissão</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(emp)}
                      disabled={emp.id === currentUser?.id}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          emp.status === 'Ativo' 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } ${emp.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {emp.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(emp)} className="p-2.5 text-gray-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50 group-hover:shadow-sm" title="Editar Permissões">
                      <Edit size={18} />
                    </button>
                    {(isSuperAdmin || isGerente) && emp.id !== currentUser?.id && (
                        <button onClick={() => { setEmpToDelete(emp); setIsDeleteModalOpen(true); }} className="p-2.5 text-gray-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50 group-hover:shadow-sm" title="Excluir Colaborador">
                        <Trash2 size={18} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                      <Users size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Acelere sua equipe contratando talentos</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmp ? "⚙️ Gerenciar Nível de Acesso" : "🛡️ Cadastrar Novo Operador/Gestor"}>
        <form onSubmit={handleSave} className="space-y-8 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-5">
             <div className="flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><UserCircle size={20} /></div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Informações Pessoais</h3>
            </div>

            <Input label="Nome Completo do Colaborador" placeholder="Ex: Lucas Henrique Silva" required maxLength={100} value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="CPF (Fisco/Login)" placeholder="000.000.000-00" required value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} />
              <Input label="E-mail Corporativo" type="email" placeholder="acesso@empresa.com" required maxLength={100} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Função no Sistema</label>
                    <div className="relative">
                        <select
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all shadow-sm"
                            value={formData.cargo}
                            disabled={editingEmp?.cargo === 'Administrador' && !isSuperAdmin}
                            onChange={e => {
                                const newCargo = e.target.value;
                                setFormData({
                                    ...formData,
                                    cargo: newCargo,
                                    permissoes: roleDefaults[newCargo] || []
                                });
                            }}
                        >
                            <option value="Vendedor">VENDEDOR OPERACIONAL</option>
                            <option value="Gerente">GERENTE DE UNIDADE</option>
                            <option value="Estoquista">ESTOQUISTA / LOGÍSTICA</option>
                            {isSuperAdmin && <option value="Administrador">ADMINISTRADOR TOTAL</option>}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                             <ShieldCheck size={16} />
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Input label="Comissão (%)" type="number" step="0.5" placeholder="5" value={formData.comissao} onChange={e => setFormData({ ...formData, comissao: e.target.value })} />
                </div>
            </div>
            
            {(formData.cargo === 'Gerente' || formData.cargo === 'Administrador') && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700">
                        <Key size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Segurança de Supervisor</span>
                    </div>
                    <Input 
                        label="PIN de Aprovação (Mín. 4 dígitos)" 
                        type="password" 
                        maxLength={6} 
                        placeholder="••••" 
                        required 
                        value={formData.pin} 
                        onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} 
                    />
                    <p className="text-[9px] text-amber-600 font-bold leading-tight">Este código será solicitado para liberar descontos, cancelamentos e sangrias no PDV.</p>
                </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Lock size={20} /></div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Permissões Detalhadas</h3>
            </div>
            
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50/50 p-4 rounded-3xl border-2 border-dashed border-gray-100 ${formData.cargo === 'Administrador' ? 'opacity-50 pointer-events-none' : ''}`}>
              {[
                { id: 'produtos', label: 'Cadastro Produtos' },
                { id: 'pdv', label: 'Terminal Vendas' },
                { id: 'estoque', label: 'Movimentar Estoque' },
                { id: 'caixa', label: 'Gestão de Caixa' },
                { id: 'financeiro', label: 'Contas Pagar/Rec' },
                { id: 'clientes', label: 'Carteira Clientes' },
                { id: 'funcionarios', label: 'Gerir Equipe' },
                { id: 'fornecedores', label: 'Fornecedores' },
                { id: 'relatorios', label: 'Relatórios Gerenc.' },
                { id: 'configuracoes', label: 'Config. Sistema' },
                { id: 'nfe', label: 'Faturamento NF-e' }
              ].map(p => (
                <label key={p.id} className="flex items-center gap-3 cursor-pointer group p-3 bg-white rounded-2xl border border-gray-100 hover:border-emerald-500 transition-all shadow-sm">
                  <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        className="peer hidden"
                        checked={formData.cargo === 'Administrador' || formData.permissoes.includes(p.id as Permission)}
                        onChange={(e) => {
                            const perms = e.target.checked
                                ? [...formData.permissoes, p.id as Permission]
                                : formData.permissoes.filter(item => item !== p.id);
                            setFormData({ ...formData, permissoes: perms });
                        }}
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-lg peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-sm opacity-0 peer-checked:opacity-100 transition-all"></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-gray-700 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{p.label}</span>
                </label>
              ))}
              {formData.cargo === 'Administrador' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-3xl z-10">
                      <div className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-black shadow-xl shadow-red-500/40 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={16} /> Acesso Total Master
                      </div>
                  </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t sticky bottom-0 bg-white pb-2 z-20">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="px-10 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                {loading ? 'Salvando...' : 'Finalizar Cadastro'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="🚨 Atenção: Desligamento de Colaborador">
        <div className="p-4 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg group-hover:rotate-0 transition-transform">
                <Trash2 size={40} />
            </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Revogar Acessos?</h2>
          <p className="text-gray-500 mb-10 leading-relaxed text-sm">
            Você está removendo as credenciais de <strong>{empToDelete?.nome}</strong>. 
            Todas as sessões ativas deste usuário serão derrubadas e ele não poderá mais realizar vendas ou acessar dados.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="danger" fullWidth onClick={handleDelete} className="h-14 text-base font-black shadow-xl shadow-red-500/30">Sim, Confirmar Remoção</Button>
            <Button variant="ghost" fullWidth onClick={() => setIsDeleteModalOpen(false)} className="h-12">Não, manter na equipe</Button>
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

export default Employees;
