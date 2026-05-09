
import React from 'react';
import { 
  Book, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Users, 
  Settings, 
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Truck
} from 'lucide-react';

const Manual: React.FC = () => {
  const sections = [
    {
      id: 'dashboard',
      title: 'Dashboard e Visão Geral',
      icon: <LayoutDashboard className="text-blue-500" />,
      content: 'O Dashboard é sua central de controle. Aqui você visualiza o faturamento diário, mensal, o ticket médio e os produtos mais vendidos. Utilize os gráficos para identificar tendências de venda e picos de movimento.'
    },
    {
      id: 'produtos',
      title: 'Gestão de Produtos',
      icon: <Package className="text-amber-500" />,
      content: 'No módulo de Produtos, você pode cadastrar itens com código de barras, SKU, preços de custo e venda. É possível definir estoque mínimo para receber alertas e configurar tributações (NCM, CEST, CFOP) essenciais para emissão fiscal.'
    },
    {
      id: 'pdv',
      title: 'Ponto de Venda (PDV)',
      icon: <ShoppingCart className="text-emerald-500" />,
      content: 'O PDV foi desenhado para agilidade. Use atalhos como F2 para abrir o PDV. Você pode buscar produtos por nome ou código de barras, aplicar descontos, selecionar clientes e finalizar vendas em diversas formas de pagamento (Dinheiro, Cartão, PIX, Fiado).'
    },
    {
      id: 'fiscal',
      title: 'Emissão de Notas (NF-e / NFC-e)',
      icon: <FileText className="text-purple-500" />,
      content: 'O sistema suporta a emissão de Nota Fiscal Eletrônica e Nota Fiscal de Consumidor. Certifique-se de que o certificado digital (.pfx) está configurado corretamente nas configurações fiscais para garantir a autorização junto à SEFAZ.'
    },
    {
      id: 'financeiro',
      title: 'Financeiro e Caixa',
      icon: <CreditCard className="text-rose-500" />,
      content: 'Controle o fluxo de caixa abrindo e fechando sessões diariamente. Registre sangrias (retiradas) e suprimentos (entradas extras). O módulo financeiro permite gerir contas a pagar e a receber para um controle total do seu negócio.'
    },
    {
      id: 'clientes',
      title: 'Clientes e Fornecedores',
      icon: <Users className="text-indigo-500" />,
      content: 'Mantenha um cadastro atualizado de seus clientes para fidelização e vendas no "Fiado" (Limite de Crédito). Cadastre fornecedores para agilizar a entrada de mercadorias e gestão de compras.'
    },
    {
      id: 'config',
      title: 'Configurações e Licença',
      icon: <Settings className="text-slate-500" />,
      content: 'Ajuste os dados da sua empresa, configure o ambiente fiscal (Homologação ou Produção) e gerencie sua licença de uso. Mantenha seus dados de contato atualizados para suporte e comunicações importantes.'
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <Book size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Manual do Sistema</h1>
          <p className="text-slate-500 font-medium">Guia completo para dominar o Venda Fácil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {sections.map((section) => (
          <div key={section.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-50 transition-all group cursor-default">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {section.icon}
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-3 uppercase tracking-tight">{section.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              {section.content}
            </p>
            <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest">
              Saiba Mais <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <HelpCircle size={200} />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
            <ShieldCheck size={16} /> Suporte Prioritário
          </div>
          <h2 className="text-3xl font-black mb-4">Precisa de ajuda adicional?</h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Nossa equipe técnica está pronta para auxiliar você em qualquer dúvida ou configuração avançada do sistema.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">WhatsApp</p>
              <p className="font-bold text-lg">(11) 99999-9999</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">E-mail</p>
              <p className="font-bold text-lg">suporte@vendafacil.com</p>
            </div>
          </div>

          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/40 flex items-center gap-3 active:scale-95"
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
          >
            Abrir Chamado de Suporte
            <TrendingUp size={20} />
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
          <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
            <Info size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 uppercase text-xs mb-1">Dica de Agilidade</h4>
            <p className="text-slate-600 text-xs leading-relaxed">Utilize o leitor de código de barras em qualquer campo de busca para localizar produtos instantaneamente.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
          <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 uppercase text-xs mb-1">Segurança de Dados</h4>
            <p className="text-slate-600 text-xs leading-relaxed">O sistema realiza backups automáticos locais para garantir que suas informações estejam sempre seguras.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
          <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm">
            <Truck size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 uppercase text-xs mb-1">Atualizações</h4>
            <p className="text-slate-600 text-xs leading-relaxed">Verifique regularmente por atualizações para receber novas funcionalidades e melhorias de performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
