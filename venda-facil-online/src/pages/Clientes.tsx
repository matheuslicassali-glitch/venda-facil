import { useEffect, useState } from 'react';
import { Users, Search, CloudSync, Plus, Save, UserPlus, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    logradouro: '',
    cidade: '',
    uf: 'SP',
    limite_credito: '0'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('nome');
    if (data) setClientes(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('clientes').insert({
        id: uuidv4(),
        nome: formData.nome,
        documento: formData.documento,
        email: formData.email,
        telefone: formData.telefone,
        logradouro: formData.logradouro,
        cidade: formData.cidade,
        uf: formData.uf,
        limite_credito: Number(formData.limite_credito),
        sincronizado: true
      });

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ nome: '', documento: '', email: '', telefone: '', logradouro: '', cidade: '', uf: 'SP', limite_credito: '0' });
      loadData();
    } catch (err: any) {
      alert('Erro ao salvar cliente: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.documento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie sua base de clientes sincronizada na nuvem.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="mr-2" size={18} /> Novo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF/CNPJ..." 
            className="bg-transparent border-none focus:outline-none w-full text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="p-20 flex justify-center"><CloudSync className="animate-spin text-primary-500 w-10 h-10" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center">
            <Users size={64} className="mb-4 text-slate-200" />
            <p className="font-bold">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Nome / Razão Social</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Localização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                          <Users size={16} />
                        </div>
                        <span className="font-bold text-slate-700">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{c.documento}</td>
                    <td className="px-6 py-4 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-slate-600"><Phone size={10} /> {c.telefone || '-'}</div>
                      <div className="flex items-center gap-1 text-slate-400"><Mail size={10} /> {c.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1"><MapPin size={10} /> {c.cidade ? `${c.cidade}/${c.uf}` : '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="👤 Cadastro de Cliente" maxWidth="max-w-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Completo / Razão Social</label>
              <input 
                required
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CPF / CNPJ</label>
              <input 
                required
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.documento}
                onChange={e => setFormData({...formData, documento: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Telefone</label>
              <input 
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">E-mail</label>
              <input 
                type="email"
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cidade</label>
                <input 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.cidade}
                  onChange={e => setFormData({...formData, cidade: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">UF</label>
                <input 
                  maxLength={2}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none uppercase"
                  value={formData.uf}
                  onChange={e => setFormData({...formData, uf: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : <><Save size={18} className="mr-2" /> Salvar Cliente</>}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
