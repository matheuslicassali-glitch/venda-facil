import { useEffect, useState } from 'react';
import { Package, Search, CloudSync, Plus, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    preco_venda: '',
    preco_custo: '',
    estoque_atual: '0',
    unidade: 'un',
    categoria: 'Geral'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('produtos').select('*').order('nome');
    if (data) setProdutos(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('produtos').insert({
        id: uuidv4(),
        nome: formData.nome,
        sku: formData.sku,
        preco_venda: Number(formData.preco_venda),
        preco_custo: Number(formData.preco_custo),
        estoque_atual: Number(formData.estoque_atual),
        unidade: formData.unidade,
        categoria: formData.categoria,
        sincronizado: true
      });

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ nome: '', sku: '', preco_venda: '', preco_custo: '', estoque_atual: '0', unidade: 'un', categoria: 'Geral' });
      loadData();
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catálogo de Produtos</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie seu estoque na nuvem em tempo real.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2" size={18} /> Novo Produto
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou SKU..." 
            className="bg-transparent border-none focus:outline-none w-full text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="p-20 flex justify-center"><CloudSync className="animate-spin text-primary-500 w-10 h-10" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center">
            <Package size={64} className="mb-4 text-slate-200" />
            <p className="font-bold">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                          <Package size={16} />
                        </div>
                        <span className="font-bold text-slate-700">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{p.sku}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      R$ {p.preco_venda.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.estoque_atual <= 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {p.estoque_atual} {p.unidade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="📦 Cadastro de Produto" maxWidth="max-w-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Produto</label>
              <input 
                required
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">SKU / Código</label>
              <input 
                required
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade</label>
              <select 
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.unidade}
                onChange={e => setFormData({...formData, unidade: e.target.value})}
              >
                <option value="un">Unidade (un)</option>
                <option value="kg">Quilo (kg)</option>
                <option value="pc">Peça (pc)</option>
                <option value="cx">Caixa (cx)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço de Venda</label>
              <input 
                type="number" step="0.01" required
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.preco_venda}
                onChange={e => setFormData({...formData, preco_venda: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço de Custo</label>
              <input 
                type="number" step="0.01"
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.preco_custo}
                onChange={e => setFormData({...formData, preco_custo: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : <><Save size={18} className="mr-2" /> Salvar Produto</>}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
