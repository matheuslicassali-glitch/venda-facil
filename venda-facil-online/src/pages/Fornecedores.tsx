import { useEffect, useState } from 'react';
import { Truck, Search, CloudSync, Plus, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('fornecedores').select('*').order('nome');
    if (data) setFornecedores(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('fornecedores').insert({
        id: uuidv4(),
        nome: formData.nome,
        cnpj: formData.cnpj,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        sincronizado: true
      });
      if (error) throw error;
      setIsModalOpen(false);
      setFormData({ nome: '', cnpj: '', email: '', telefone: '', endereco: '' });
      loadData();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = fornecedores.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fornecedores</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie seus fornecedores na nuvem.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2" size={18} /> Novo Fornecedor
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar fornecedores..." 
            className="bg-transparent border-none focus:outline-none w-full text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="p-20 flex justify-center"><CloudSync className="animate-spin text-primary-500 w-10 h-10" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <Truck size={64} className="text-slate-200" />
            <p className="font-bold">Nenhum fornecedor encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CNPJ</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Endereço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-700">{f.nome}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{f.cnpj}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{f.email || f.telefone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]">{f.endereco || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="🚚 Cadastro de Fornecedor" maxWidth="max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome / Razão Social</label>
            <input required className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CNPJ</label>
              <input required className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Telefone</label>
              <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">E-mail</label>
            <input type="email" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Endereço Completo</label>
            <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Fornecedor'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
