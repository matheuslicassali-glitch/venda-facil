import { useEffect, useState } from 'react';
import { Users, Search, CloudSync, Plus, Save, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cargo: 'Vendedor',
    cpf: '',
    email: '',
    comissao: '0',
    status: 'Ativo',
    pin: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('funcionarios').select('*').order('nome');
    if (data) setFuncionarios(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('funcionarios').insert({
        id: uuidv4(),
        nome: formData.nome,
        cargo: formData.cargo,
        cpf: formData.cpf,
        email: formData.email,
        comissao: Number(formData.comissao),
        status: formData.status,
        pin: formData.pin,
        sincronizado: true
      });
      if (error) throw error;
      setIsModalOpen(false);
      setFormData({ nome: '', cargo: 'Vendedor', cpf: '', email: '', comissao: '0', status: 'Ativo', pin: '' });
      loadData();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusColor: Record<string, string> = {
    Ativo: 'bg-emerald-50 text-emerald-600',
    Inativo: 'bg-slate-50 text-slate-400',
    Afastado: 'bg-amber-50 text-amber-600',
  };

  const filtered = funcionarios.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Funcionários</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie sua equipe na nuvem.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2" size={18} /> Novo Funcionário
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar funcionários..." 
            className="bg-transparent border-none focus:outline-none w-full text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="p-20 flex justify-center"><CloudSync className="animate-spin text-primary-500 w-10 h-10" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <Users size={64} className="text-slate-200" />
            <p className="font-bold">Nenhum funcionário encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Comissão</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{f.nome}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{f.cpf}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <ShieldCheck size={14} className="text-primary-500" /> {f.cargo}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{f.comissao || 0}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColor[f.status] || 'bg-slate-50 text-slate-600'}`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="👥 Cadastro de Funcionário" maxWidth="max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
            <input required className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cargo</label>
              <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})}>
                <option value="Administrador">Administrador</option>
                <option value="Gerente">Gerente</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Estoquista">Estoquista</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CPF</label>
              <input required className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Comissão (%)</label>
              <input type="number" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.comissao} onChange={e => setFormData({...formData, comissao: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">PIN de Acesso</label>
              <input type="password" maxLength={4} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Funcionário'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
