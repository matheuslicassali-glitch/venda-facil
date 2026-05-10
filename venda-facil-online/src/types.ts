
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
  ncm: string;
  cest?: string;
  origem: string;
  cfop: string;
  cst_csosn: string;
  pis_cst?: string;
  pis_aliquota?: number;
  cofins_cst?: string;
  cofins_aliquota?: number;
  icms_aliquota?: number;
}

export interface Client {
  id: string;
  nome: string;
  razao_social?: string;
  documento: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  limite_credito: number;
  saldo_devedor: number;
  endereco: string;
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
  acrescimo_total: number;
  itens: SaleItem[];
  tipo_pagamento: string;
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

export interface Employee {
  id: string;
  nome: string;
  cargo: 'Administrador' | 'Vendedor' | 'Estoquista' | 'Gerente';
  cpf: string;
  email: string;
  status: 'Ativo' | 'Inativo';
  comissao?: number;
  pin?: string;
  permissoes: string[];
}
