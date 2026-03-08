-- SUPABASE DATABASE SCHEMA FOR VENDA FÁCIL
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Tabela de Produtos
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  codigo_barras TEXT,
  preco_venda DECIMAL(10,2) NOT NULL,
  preco_custo DECIMAL(10,2) NOT NULL,
  estoque_atual DECIMAL(10,2) DEFAULT 0,
  estoque_minimo DECIMAL(10,2) DEFAULT 0,
  unidade TEXT CHECK (unidade IN ('un', 'kg', 'lt', 'pc', 'cx', 'par', 'm2')),
  categoria TEXT,
  foto TEXT,
  ncm TEXT,
  cest TEXT,
  origem TEXT,
  cfop TEXT,
  cst_csosn TEXT,
  pis_cst TEXT,
  pis_aliquota DECIMAL(5,2),
  cofins_cst TEXT,
  cofins_aliquota DECIMAL(5,2),
  icms_aliquota DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  razao_social TEXT,
  documento TEXT UNIQUE NOT NULL, -- CPF ou CNPJ
  inscricao_estadual TEXT,
  email TEXT,
  telefone TEXT,
  limite_credito DECIMAL(10,2) DEFAULT 0,
  saldo_devedor DECIMAL(10,2) DEFAULT 0,
  endereco TEXT,
  logradouro TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  ibge_cidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Funcionários (Equipe)
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Ativo',
  comissao DECIMAL(5,2) DEFAULT 0,
  pin TEXT,
  permissoes TEXT[], -- Array de permissões
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Sessões de Caixa
CREATE TABLE caixa_sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aberto_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fechado_em TIMESTAMP WITH TIME ZONE,
  valor_abertura DECIMAL(10,2) NOT NULL,
  valor_fechamento_esperado DECIMAL(10,2) NOT NULL,
  valor_fechamento_informado DECIMAL(10,2),
  status TEXT DEFAULT 'aberto',
  vendedor_id UUID REFERENCES funcionarios(id)
);

-- 5. Tabela de Movimentações de Caixa (Sangria/Suprimento)
CREATE TABLE caixa_movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caixa_id UUID REFERENCES caixa_sessoes(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('sangria', 'suprimento')),
  valor DECIMAL(10,2) NOT NULL,
  motivo TEXT,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Vendas
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valor_total DECIMAL(10,2) NOT NULL,
  desconto_total DECIMAL(10,2) DEFAULT 0,
  tipo_pagamento TEXT,
  cliente_id UUID REFERENCES clientes(id),
  vendedor_id UUID REFERENCES funcionarios(id),
  status TEXT DEFAULT 'concluida',
  fiscal_status TEXT DEFAULT 'pendente',
  nfe_numero TEXT,
  chave_acesso TEXT,
  xml TEXT,
  tipo_operacao TEXT DEFAULT 'venda'
);

-- 7. Itens da Venda
CREATE TABLE venda_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  nome TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0
);

-- 8. Contas Financeiras (Pagar/Receber)
CREATE TABLE financeiro_contas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT CHECK (tipo IN ('pagar', 'receber')),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT DEFAULT 'pendente',
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Fornecedores
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Configurações da Empresa
CREATE TABLE empresa_configuracoes (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Apenas uma configuração por sistema
  cnpj TEXT,
  inscricao_estadual TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  crt TEXT,
  logradouro TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  ibge_cidade TEXT,
  email_contato TEXT,
  telefone_contato TEXT,
  fiscal_csc TEXT,
  fiscal_csc_id TEXT,
  fiscal_ambiente TEXT,
  certificado_vencimento DATE,
  status_licenca TEXT DEFAULT 'ativo'
);

-- Enable RLS (Row Level Security) - Opcional mas recomendado
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples para permitir acesso total (ajustar conforme necessário)
CREATE POLICY "Allow all for authenticated users" ON produtos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON funcionarios FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON vendas FOR ALL TO authenticated USING (true);
