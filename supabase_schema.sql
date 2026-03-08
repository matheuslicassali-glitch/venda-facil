-- SCRIPT COMPLETO PARA VENDA FÁCIL (TABELAS + POLÍTICAS RLS)
-- Limpar tabelas existentes (Ordem correta para evitar erros de chave estrangeira)
DROP TABLE IF EXISTS venda_itens CASCADE;
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS caixa_movimentacoes CASCADE;
DROP TABLE IF EXISTS caixa_sessoes CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS financeiro_contas CASCADE;
DROP TABLE IF EXISTS fornecedores CASCADE;
DROP TABLE IF EXISTS empresa_configuracoes CASCADE;

-- Ativar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  validade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  razao_social TEXT,
  documento TEXT UNIQUE NOT NULL,
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

-- 3. Tabela de Funcionários
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Ativo',
  comissao DECIMAL(5,2) DEFAULT 0,
  pin TEXT,
  permissoes TEXT[],
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

-- 5. Tabela de Movimentações de Caixa
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

-- 8. Contas Financeiras
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
  id INTEGER PRIMARY KEY CHECK (id = 1),
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

-- CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- Ativar RLS em todas as tabelas
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_configuracoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso anônimo (Necessário para login manual e PDV)
CREATE POLICY "Allow all anon" ON produtos FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON clientes FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON funcionarios FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON vendas FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON venda_itens FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON caixa_sessoes FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON caixa_movimentacoes FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON financeiro_contas FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON fornecedores FOR ALL TO anon USING (true);
CREATE POLICY "Allow all anon" ON empresa_configuracoes FOR ALL TO anon USING (true);

-- Criar também políticas para usuários autenticados (Futuro)
CREATE POLICY "Allow all auth" ON produtos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all auth" ON clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all auth" ON funcionarios FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all auth" ON vendas FOR ALL TO authenticated USING (true);

-- Inserir configuração inicial da empresa e um Funcionário Admin para login
INSERT INTO empresa_configuracoes (id, status_licenca) VALUES (1, 'ativo') ON CONFLICT DO NOTHING;

-- ATENÇÃO: Verifique se o e-mail abaixo é o que você deseja para o login MASTER
INSERT INTO funcionarios (nome, cargo, cpf, email, status, pin, permissoes) 
VALUES ('Administrador Master', 'Administrador', '000.000.000-00', 'matheuslicassali@gmail.com', 'Ativo', '1234', '{"all"}')
ON CONFLICT DO NOTHING;
