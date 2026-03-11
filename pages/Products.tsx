
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, Barcode, Calendar, DollarSign, PackageCheck, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Product, Permission } from '../types';
import { db } from '../utils/databaseService';
import { validateNCM } from '../utils/validation';

interface ProductsProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
  currentUser: { id: string, name: string, cargo: string, permissions: Permission[] } | null;
}

const Products: React.FC<ProductsProps> = ({ onNotify, currentUser }) => {
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

  const isVendedor = currentUser?.cargo === 'Vendedor';
  const isAdmin = currentUser?.cargo === 'Administrador' || currentUser?.cargo === 'Gerente';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await db.products.list();
      setProducts(data);
    } catch (err) {
      onNotify('❌ Erro ao carregar produtos.', 'error');
    } finally {
      setLoading(false);
    }
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Business Logic Validations
    const venda = parseFloat(formData.preco_venda) || 0;
    const custo = parseFloat(formData.preco_custo) || 0;

    if (venda < custo) {
      onNotify('⚠️ Valor de Venda não pode ser menor que o Valor de Custo!', 'error');
      return;
    }

    if (!validateNCM(formData.ncm)) {
      onNotify('⚠️ NCM inválido! Deve conter exatamente 8 dígitos numéricos.', 'error');
      return;
    }

    setLoading(true);

    const productData: Product = {
      id: editingProduct ? editingProduct.id : undefined as any,
      nome: formData.nome,
      sku: formData.sku,
      codigo_barras: formData.codigo_barras,
      preco_venda: venda,
      preco_custo: custo,
      estoque_atual: parseInt(formData.estoque_atual) || 0,
      estoque_minimo: parseInt(formData.estoque_minimo) || 0,
      unidade: formData.unidade as any,
      categoria: formData.categoria,
      validade: formData.validade,
      ncm: formData.ncm.replace(/\D/g, ''),
      cest: formData.cest,
      origem: formData.origem,
      cfop: formData.cfop,
      cst_csosn: formData.cst_csosn,
      pis_cst: formData.pis_cst,
      pis_aliquota: parseFloat(formData.pis_aliquota) || 0,
      cofins_cst: formData.cofins_cst,
      cofins_aliquota: parseFloat(formData.cofins_aliquota) || 0,
      icms_aliquota: parseFloat(formData.icms_aliquota) || 0
    };

    try {
      await db.products.save(productData, !!editingProduct);
      onNotify(`✅ Produto ${editingProduct ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      onNotify('❌ Erro ao salvar produto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    if (isVendedor) {
      onNotify('❌ Vendedores não têm permissão para excluir produtos.', 'error');
      return;
    }
    setLoading(true);
    try {
      await db.products.delete(productToDelete.id);
      onNotify('🗑️ Produto removido com sucesso!', 'success');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      loadProducts();
    } catch (err) {
      onNotify('❌ Erro ao remover produto.', 'error');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Produtos</h1>
          <p className="text-gray-600 font-medium">Catálogo completo de mercadorias e insumos</p>
        </div>
        {!isVendedor && (
            <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-blue-500/20">
            <Plus size={20} />
            <span>Novo Produto</span>
            </Button>
        )}
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou barras..."
              className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Informações do Produto</th>
                <th className="px-6 py-4">Valores (Custo/Venda)</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Validade / NCM</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black overflow-hidden shadow-inner">
                        {p.foto ? <img src={p.foto} alt="" className="w-full h-full object-cover" /> : <Package size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{p.nome}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter bg-gray-100 px-1 rounded">SKU: {p.sku}</span>
                          {p.codigo_barras && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-black uppercase tracking-tighter border-l pl-2">
                              <Barcode size={10} /> {p.codigo_barras}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-400 font-black uppercase">Custo: {p.preco_custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <p className="font-black text-gray-800 text-base">{p.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${p.estoque_atual < (p.estoque_minimo || 5) ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className="text-sm font-black text-gray-700">{p.estoque_atual} {p.unidade}</span>
                      </div>
                      <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${p.estoque_atual < (p.estoque_minimo || 5) ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, (p.estoque_atual / (p.estoque_minimo * 3 || 15)) * 100)}%` }}
                          ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black p-1 bg-orange-50 text-orange-600 rounded uppercase">NCM: {p.ncm}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                             <Calendar size={12} /> {p.validade || 'S/ VALIDADE'}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    {!isVendedor && (
                        <button
                        onClick={() => { setProductToDelete(p); setIsDeleteModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Excluir"
                        >
                        <Trash2 size={18} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                  <tr>
                      <td colSpan={5} className="py-20 text-center">
                          <Package size={48} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum produto cadastrado</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "✏️ Editar Produto" : "📦 Novo Cadastro de Produto"}>
        <form onSubmit={handleSaveProduct} className="space-y-8 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><PackageCheck size={20} /></div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Geral e Identificação</h3>
            </div>
            
            <Input label="Nome Comercial do Produto" placeholder="Ex: Arroz Agulhinha 5kg" required maxLength={100} value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Código SKU (Interno)" placeholder="Ex: PROD-001" required maxLength={30} value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              <Input label="Código de Barras (EAN)" placeholder="789..." maxLength={14} value={formData.codigo_barras} onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })} />
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Input 
                        label="Preço de Custo (R$)" 
                        type="number" 
                        step="0.01" 
                        required 
                        disabled={isVendedor && !!editingProduct}
                        value={formData.preco_custo} 
                        onChange={e => setFormData({ ...formData, preco_custo: e.target.value })} 
                    />
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter px-1">Seu valor pago ao fornecedor</p>
                </div>
                <div className="space-y-1">
                    <Input 
                        label="Preço de Venda (R$)" 
                        type="number" 
                        step="0.01" 
                        required 
                        disabled={isVendedor && !!editingProduct}
                        value={formData.preco_venda} 
                        onChange={e => setFormData({ ...formData, preco_venda: e.target.value })} 
                    />
                    <p className="text-[9px] font-bold text-green-500 uppercase tracking-tighter px-1">Margem: {(((parseFloat(formData.preco_venda) - parseFloat(formData.preco_custo)) / (parseFloat(formData.preco_venda) || 1)) * 100).toFixed(0)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Qtd. Inicial" type="number" placeholder="0" required value={formData.estoque_atual} onChange={e => setFormData({ ...formData, estoque_atual: e.target.value })} />
              <Input label="Qtd. Mínima" type="number" placeholder="5" value={formData.estoque_minimo} onChange={e => setFormData({ ...formData, estoque_minimo: e.target.value })} />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unidade</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                  value={formData.unidade}
                  onChange={e => setFormData({ ...formData, unidade: e.target.value })}
                >
                  <option value="un">UNIDADE</option>
                  <option value="kg">QUILO (KG)</option>
                  <option value="lt">LITRO (LT)</option>
                  <option value="pc">PEÇA</option>
                  <option value="cx">CAIXA</option>
                  <option value="par">PAR</option>
                  <option value="m2">MT QUADRADO</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Input label="Categoria" placeholder="Ex: Alimentícios" required value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} />
                <Input label="Validade" type="date" value={formData.validade} onChange={e => setFormData({ ...formData, validade: e.target.value })} />
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-orange-100 pb-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertCircle size={20} /></div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Classificação Fiscal (NFe/SEFAZ)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input label="NCM (Obrigatório - 8 dígitos)" placeholder="Ex: 22021000" required maxLength={8} value={formData.ncm} onChange={e => setFormData({ ...formData, ncm: e.target.value.replace(/\D/g, '') })} />
                <p className="text-[9px] font-bold text-gray-400 uppercase px-1">Classificação Comum do Mercocul</p>
              </div>
              <Input label="CEST (Opcional)" placeholder="Código Substituição" maxLength={7} value={formData.cest} onChange={e => setFormData({ ...formData, cest: e.target.value.replace(/\D/g, '') })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Origem do Produto</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 text-xs"
                  value={formData.origem}
                  onChange={e => setFormData({ ...formData, origem: e.target.value })}
                >
                  <option value="0">0 - Nacional</option>
                  <option value="1">1 - Estrangeira (Importação Direta)</option>
                  <option value="2">2 - Estrangeira (Adquirida no Int.)</option>
                  <option value="3">3 - Nac. (Conteúdo Imp. &gt; 40%)</option>
                </select>
              </div>
              <Input label="CFOP de Venda" placeholder="5102" required maxLength={4} value={formData.cfop} onChange={e => setFormData({ ...formData, cfop: e.target.value.replace(/\D/g, '') })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="CST / CSOSN ICMS" placeholder="102" required maxLength={3} value={formData.cst_csosn} onChange={e => setFormData({ ...formData, cst_csosn: e.target.value.replace(/\D/g, '') })} />
              <Input label="Alíquota ICMS (%)" type="number" step="0.01" value={formData.icms_aliquota} onChange={e => setFormData({ ...formData, icms_aliquota: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 underline">PIS</p>
                <Input label="CST PIS" placeholder="07" maxLength={2} value={formData.pis_cst} onChange={e => setFormData({ ...formData, pis_cst: e.target.value.replace(/\D/g, '') })} />
                <Input label="Alíq. PIS %" type="number" step="0.01" value={formData.pis_aliquota} onChange={e => setFormData({ ...formData, pis_aliquota: e.target.value })} />
              </div>
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-gray-400 underline">COFINS</p>
                <Input label="CST COFINS" placeholder="07" maxLength={2} value={formData.cofins_cst} onChange={e => setFormData({ ...formData, cofins_cst: e.target.value.replace(/\D/g, '') })} />
                <Input label="Alíq. COFINS %" type="number" step="0.01" value={formData.cofins_aliquota} onChange={e => setFormData({ ...formData, cofins_aliquota: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t sticky bottom-0 bg-white pb-2 z-10 scale-100">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Descartar Alterações</Button>
            <Button type="submit" disabled={loading} className="px-10 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                {loading ? 'Sincronizando...' : 'Concluir Cadastro'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="⚠️ Atenção: Excluir Produto">
        <div className="p-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
            </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">Confirmar Exclusão Definitiva?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed text-sm">
            Você está prestes a remover <strong>{productToDelete?.nome}</strong>. Esta ação é irreversível e impedirá futuras vendas deste item até que seja recadastrado.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="danger" fullWidth onClick={handleDelete} className="h-12 text-base font-black shadow-lg shadow-red-500/20">Sim, Confirmar Exclusão</Button>
            <Button variant="ghost" fullWidth onClick={() => setIsDeleteModalOpen(false)}>Não, cancelar agora</Button>
          </div>
        </div>
      </Modal>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default Products;
