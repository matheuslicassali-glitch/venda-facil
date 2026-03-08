
export interface Product {
  id: string;
  nome: string;
  sku: string;
  codigo_barras?: string;
  preco_venda: number;
  preco_custo: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: 'un' | 'kg' | 'lt' | 'pc' | 'cx' | 'par' | 'm2';
  categoria: string;
  foto?: string;
  validade?: string;
  // Tax fields
  ncm: string;
  cest?: string;
  origem: string; // 0 - Nacional, 1 - Estrangeira, etc.
  cfop: string;
  cst_csosn: string;
  pis_cst?: string;
  pis_aliquota?: number;
  cofins_cst?: string;
  cofins_aliquota?: number;
  icms_aliquota?: number;
  // Grid/Variants
  grade?: {
    cor?: string;
    tamanho?: string;
  };
}

export interface Client {
  id: string;
  nome: string;
  razao_social?: string;
  documento: string; // CPF or CNPJ
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  limite_credito: number;
  saldo_devedor: number;
  // Endereço Completo
  endereco: string; // Combined format for backward compatibility
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ibge_cidade?: string;
}

export interface SaleItem {
  id: string;
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  desconto: number;
}

export interface Sale {
  id: string;
  data_venda: string;
  valor_total: number;
  desconto_total: number;
  itens: SaleItem[];
  tipo_pagamento: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'fiado';
  cliente_id?: string;
  vendedor_id: string;
  status: 'concluida' | 'cancelada' | 'suspensa';
  fiscal_status: 'pendente' | 'emitida' | 'erro';
  nfe_numero?: string;
  xml?: string;
  chave_acesso?: string;
  tipo_operacao?: 'venda' | 'devolucao';
}

export interface CashSession {
  id: string;
  aberto_em: string;
  fechado_em?: string;
  valor_abertura: number;
  valor_fechamento_esperado: number;
  valor_fechamento_informado?: number;
  status: 'aberto' | 'fechado';
  vendedor_id: string;
}

export interface CashTransaction {
  id: string;
  caixa_id: string;
  tipo: 'sangria' | 'suprimento';
  valor: number;
  motivo: string;
  data: string;
}

export interface FinancialAccount {
  id: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'pago';
  categoria: string;
}

export interface Supplier {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
}

export type Permission = 'all' | 'produtos' | 'pdv' | 'relatorios' | 'nfe' | 'fornecedores' | 'funcionarios' | 'estoque' | 'clientes' | 'caixa' | 'financeiro' | 'configuracoes';

export interface Employee {
  id: string;
  nome: string;
  cargo: 'Administrador' | 'Vendedor' | 'Estoquista' | 'Gerente';
  cpf: string;
  email: string;
  status: 'Ativo' | 'Inativo';
  comissao?: number;
  pin?: string; // For manager approval
  permissoes: Permission[];
}

export interface Invoice {
  id: string;
  numero: string;
  serie: string;
  tipo: 'NFe' | 'NFCe';
  data: string;
  valor: number;
  status: 'Autorizada' | 'Pendente' | 'Cancelada';
  xml?: string;
  chave?: string;
  tipo_operacao?: 'venda' | 'devolucao';
}

export interface CompanySettings {
  cnpj: string;
  inscricao_estadual: string;
  razao_social: string;
  nome_fantasia: string;
  crt: '1' | '2' | '3'; // 1-Simples, 2-Simples Excess, 3-Normal
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    ibge_cidade: string;
  };
  contato: {
    email: string;
    telefone: string;
  };
  fiscal: {
    csc: string;
    csc_id: string;
    certificado_vencimento?: string;
    ambiente: 'homologacao' | 'producao';
    certificado_pfx?: string; // Base64 or path
    certificado_senha?: string;
    certificado_nome?: string;
  };
}

export type View = 'login' | 'dashboard' | 'produtos' | 'pdv' | 'relatorios' | 'nfe' | 'fornecedores' | 'funcionarios' | 'estoque' | 'clientes' | 'caixa' | 'financeiro' | 'configuracoes' | 'venda_comum' | 'nfe_manual';
