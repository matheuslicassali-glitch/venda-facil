
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, Barcode, Calendar, DollarSign, PackageCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Product } from '../types';

interface ProductsProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

const Products: React.FC<ProductsProps> = ({ onNotify }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    codigo_barras: '',
    preco_venda: '',
    preco_custo: '',
    estoque_atual: '',
    estoque_minimo: '5',
    unidade: 'un',
    categoria: '',
    validade: '',
    // Tax fields
    ncm: '',
    cest: '',
    origem: '0',
    cfop: '5102',
    cst_csosn: '102',
    pis_cst: '07',
    pis_aliquota: '0',
    cofins_cst: '07',
    cofins_aliquota: '0',
    icms_aliquota: '0'
  });

  useEffect(() => {
    const saved = localStorage.getItem('venda-facil-products');
    if (saved) {
      setProducts(JSON.parse(saved));
    }
  }, []);

  const saveToStorage = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('venda-facil-products', JSON.stringify(newProducts));
  };

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nome: product.nome,
        sku: product.sku,
        codigo_barras: product.codigo_barras || '',
        preco_venda: product.preco_venda.toString(),
        preco_custo: product.preco_custo.toString(),
        estoque_atual: product.estoque_atual.toString(),
        estoque_minimo: (product.estoque_minimo || 5).toString(),
        unidade: product.unidade || 'un',
        categoria: product.categoria,
        validade: product.validade || '',
        ncm: product.ncm || '',
        cest: product.cest || '',
        origem: product.origem || '0',
        cfop: product.cfop || '5102',
        cst_csosn: product.cst_csosn || '102',
        pis_cst: product.pis_cst || '07',
        pis_aliquota: (product.pis_aliquota || 0).toString(),
        cofins_cst: product.cofins_cst || '07',
        cofins_aliquota: (product.cofins_aliquota || 0).toString(),
        icms_aliquota: (product.icms_aliquota || 0).toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nome: '',
        sku: '',
        codigo_barras: '',
        preco_venda: '',
        preco_custo: '',
        estoque_atual: '',
        estoque_minimo: '5',
        unidade: 'un',
        categoria: '',
        validade: '',
        ncm: '',
        cest: '',
        origem: '0',
        cfop: '5102',
        cst_csosn: '102',
        pis_cst: '07',
        pis_aliquota: '0',
        cofins_cst: '07',
        cofins_aliquota: '0',
        icms_aliquota: '0'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const productData: Product = {
        id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
        nome: formData.nome,
        sku: formData.sku,
        codigo_barras: formData.codigo_barras,
        preco_venda: parseFloat(formData.preco_venda),
        preco_custo: parseFloat(formData.preco_custo),
        estoque_atual: parseInt(formData.estoque_atual),
        estoque_minimo: parseInt(formData.estoque_minimo),
        unidade: formData.unidade as any,
        categoria: formData.categoria,
        validade: formData.validade,
        ncm: formData.ncm,
        cest: formData.cest,
        origem: formData.origem,
        cfop: formData.cfop,
        cst_csosn: formData.cst_csosn,
        pis_cst: formData.pis_cst,
        pis_aliquota: parseFloat(formData.pis_aliquota),
        cofins_cst: formData.cofins_cst,
        cofins_aliquota: parseFloat(formData.cofins_aliquota),
        icms_aliquota: parseFloat(formData.icms_aliquota)
      };

      if (editingProduct) {
        const updated = products.map(p => p.id === editingProduct.id ? productData : p);
        saveToStorage(updated);
        onNotify('✅ Produto atualizado com sucesso!', 'success');
      } else {
        saveToStorage([...products, productData]);
        onNotify('✅ Produto cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      setLoading(false);
    }, 800);
  };

  const handleDelete = () => {
    if (!productToDelete) return;
    const updated = products.filter(p => p.id !== productToDelete.id);
    saveToStorage(updated);
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
    onNotify('🗑️ Produto removido com sucesso!', 'success');
  };

  const filteredProducts = products.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_barras?.includes(searchTerm)
  );

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Produtos</h1>
          <p className="text-gray-600">Catálogo completo de mercadorias e insumos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>Novo Produto</span>
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
              placeholder="Buscar por nome, SKU ou barras..."
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
                <th className="px-6 py-4">Informações do Produto</th>
                <th className="px-6 py-4">Valores (Custo/Venda)</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Validade</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{p.nome}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">SKU: {p.sku}</span>
                          {p.codigo_barras && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-bold uppercase border-l pl-2">
                              <Barcode size={10} /> {p.codigo_barras}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-400 font-medium">Custo: {p.preco_custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <p className="font-black text-gray-800">{p.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.estoque_atual < (p.estoque_minimo || 5) ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <span className="text-sm font-bold text-gray-700">{p.estoque_atual} {p.unidade}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      {p.validade || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => { setProductToDelete(p); setIsDeleteModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Editar Produto" : "Novo Produto"}>
        <form onSubmit={handleSaveProduct} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b pb-2">Informações Básicas</h3>
            <Input label="Nome do Produto" placeholder="Ex: Coca-Cola 350ml" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="SKU" placeholder="Identificador interno" required value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              <Input label="Código de Barras EAN" placeholder="Obrigatório se possuir" value={formData.codigo_barras} onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Preço de Custo" type="number" step="0.01" placeholder="R$ 0,00" required value={formData.preco_custo} onChange={e => setFormData({ ...formData, preco_custo: e.target.value })} />
              <Input label="Preço de Venda" type="number" step="0.01" placeholder="R$ 0,00" required value={formData.preco_venda} onChange={e => setFormData({ ...formData, preco_venda: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Estoque Atual" type="number" placeholder="0" required value={formData.estoque_atual} onChange={e => setFormData({ ...formData, estoque_atual: e.target.value })} />
              <Input label="Mínimo" type="number" placeholder="5" value={formData.estoque_minimo} onChange={e => setFormData({ ...formData, estoque_minimo: e.target.value })} />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unidade</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  value={formData.unidade}
                  onChange={e => setFormData({ ...formData, unidade: e.target.value })}
                >
                  <option value="un">UN</option>
                  <option value="kg">KG</option>
                  <option value="lt">LT</option>
                  <option value="pc">PC</option>
                  <option value="cx">CX</option>
                  <option value="par">PAR</option>
                  <option value="m2">M2</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest border-b pb-2">Classificação Fiscal (SEFAZ)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="NCM (8 dígitos)" placeholder="Ex: 22021000" required value={formData.ncm} onChange={e => setFormData({ ...formData, ncm: e.target.value })} />
              <Input label="CEST" placeholder="Opcional" value={formData.cest} onChange={e => setFormData({ ...formData, cest: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Origem</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  value={formData.origem}
                  onChange={e => setFormData({ ...formData, origem: e.target.value })}
                >
                  <option value="0">0 - Nacional</option>
                  <option value="1">1 - Estrangeira (Importação Direta)</option>
                  <option value="2">2 - Estrangeira (Adquirida no Mercado Interno)</option>
                  <option value="3">3 - Nacional (Conteúdo Importado &gt; 40%)</option>
                  <option value="4">4 - Nacional (Processos Básicos de Fabricação)</option>
                  <option value="5">5 - Nacional (Conteúdo Importado &le; 40%)</option>
                </select>
              </div>
              <Input label="CFOP Padrão" placeholder="Ex: 5102" required value={formData.cfop} onChange={e => setFormData({ ...formData, cfop: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="CST / CSOSN" placeholder="Ex: 102" required value={formData.cst_csosn} onChange={e => setFormData({ ...formData, cst_csosn: e.target.value })} />
              <Input label="Alíquota ICMS (%)" type="number" placeholder="0.00" value={formData.icms_aliquota} onChange={e => setFormData({ ...formData, icms_aliquota: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input label="PIS CST" placeholder="07" value={formData.pis_cst} onChange={e => setFormData({ ...formData, pis_cst: e.target.value })} />
                <Input label="PIS %" type="number" placeholder="0.00" value={formData.pis_aliquota} onChange={e => setFormData({ ...formData, pis_aliquota: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Input label="COFINS CST" placeholder="07" value={formData.cofins_cst} onChange={e => setFormData({ ...formData, cofins_cst: e.target.value })} />
                <Input label="COFINS %" type="number" placeholder="0.00" value={formData.cofins_aliquota} onChange={e => setFormData({ ...formData, cofins_aliquota: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t sticky bottom-0 bg-white pb-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Produto'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
        <div className="p-4">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Tem certeza que deseja remover o produto <strong>{productToDelete?.nome}</strong> do sistema?
            Esta ação removerá todos os registros associados e não poderá ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir Produto</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Products;
