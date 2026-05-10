-- ================================================================
-- SUPER FIX V2: ALINHAMENTO TOTAL DE TABELAS E PERMISSÕES
-- Execute este script no SQL Editor do Supabase
-- ================================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    nome TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    codigo_barras TEXT,
    preco_venda NUMERIC(15,2) NOT NULL DEFAULT 0,
    preco_custo NUMERIC(15,2) DEFAULT 0,
    estoque_atual NUMERIC(15,2) DEFAULT 0,
    estoque_minimo NUMERIC(15,2) DEFAULT 0,
    unidade TEXT,
    categoria TEXT,
    foto TEXT,
    ncm TEXT,
    cest TEXT,
    origem TEXT,
    cfop TEXT,
    cst_csosn TEXT,
    pis_cst TEXT,
    pis_aliquota NUMERIC(15,2),
    cofins_cst TEXT,
    cofins_aliquota NUMERIC(15,2),
    icms_aliquota NUMERIC(15,2),
    validade TEXT
);
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_produtos" ON produtos;
CREATE POLICY "public_access_produtos" ON produtos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS set_timestamp_produtos ON produtos;
CREATE TRIGGER set_timestamp_produtos BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 2. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    nome TEXT NOT NULL,
    razao_social TEXT,
    documento TEXT UNIQUE NOT NULL,
    inscricao_estadual TEXT,
    email TEXT,
    telefone TEXT,
    limite_credito NUMERIC(15,2) DEFAULT 0,
    saldo_devedor NUMERIC(15,2) DEFAULT 0,
    endereco TEXT,
    logradouro TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    cep TEXT,
    ibge_cidade TEXT
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_clientes" ON clientes;
CREATE POLICY "public_access_clientes" ON clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS set_timestamp_clientes ON clientes;
CREATE TRIGGER set_timestamp_clientes BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3. FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Ativo',
    comissao NUMERIC(15,2) DEFAULT 0,
    pin TEXT,
    permissoes JSONB DEFAULT '[]'::jsonb
);
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_funcionarios" ON funcionarios;
CREATE POLICY "public_access_funcionarios" ON funcionarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS set_timestamp_funcionarios ON funcionarios;
CREATE TRIGGER set_timestamp_funcionarios BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 4. VENDAS
CREATE TABLE IF NOT EXISTS vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    data_venda TIMESTAMPTZ DEFAULT NOW(),
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    desconto_total NUMERIC(15,2) DEFAULT 0,
    acrescimo_total NUMERIC(15,2) DEFAULT 0,
    tipo_pagamento TEXT,
    cliente_id UUID REFERENCES clientes(id),
    vendedor_id UUID REFERENCES funcionarios(id),
    status TEXT DEFAULT 'concluida',
    fiscal_status TEXT DEFAULT 'pendente',
    nfe_numero TEXT,
    chave_acesso TEXT,
    xml TEXT,
    justificativa_cancelamento TEXT,
    bandeira_cartao TEXT,
    parcelas INTEGER DEFAULT 1,
    tipo_operacao TEXT DEFAULT 'venda'
);
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_vendas" ON vendas;
CREATE POLICY "public_access_vendas" ON vendas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS set_timestamp_vendas ON vendas;
CREATE TRIGGER set_timestamp_vendas BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 5. VENDA ITENS
CREATE TABLE IF NOT EXISTS venda_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    nome TEXT NOT NULL,
    quantidade NUMERIC(15,2) NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    desconto NUMERIC(15,2) DEFAULT 0,
    sku TEXT,
    ncm TEXT,
    cfop TEXT
);
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_venda_itens" ON venda_itens;
CREATE POLICY "public_access_venda_itens" ON venda_itens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. FINANCEIRO (CONTAS)
CREATE TABLE IF NOT EXISTS financeiro_contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    tipo TEXT NOT NULL, -- 'pagar', 'receber'
    descricao TEXT NOT NULL,
    valor NUMERIC(15,2) NOT NULL DEFAULT 0,
    vencimento TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pendente',
    categoria TEXT
);
ALTER TABLE financeiro_contas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_financeiro" ON financeiro_contas;
CREATE POLICY "public_access_financeiro" ON financeiro_contas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. FORNECEDORES
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    email TEXT,
    telefone TEXT,
    endereco TEXT
);
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_fornecedores" ON fornecedores;
CREATE POLICY "public_access_fornecedores" ON fornecedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. CAIXA SESSOES
CREATE TABLE IF NOT EXISTS caixa_sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    funcionario_id UUID REFERENCES funcionarios(id),
    data_abertura TIMESTAMPTZ DEFAULT NOW(),
    data_fechamento TIMESTAMPTZ,
    saldo_inicial NUMERIC(15,2) DEFAULT 0,
    saldo_final NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'aberto'
);
ALTER TABLE caixa_sessoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_caixa" ON caixa_sessoes;
CREATE POLICY "public_access_caixa" ON caixa_sessoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. EMPRESA CONFIGURACOES
CREATE TABLE IF NOT EXISTS empresa_configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    cnpj TEXT UNIQUE NOT NULL,
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
    certificado_vencimento TEXT,
    nfe_serie INTEGER,
    nfe_numero INTEGER,
    nfce_serie INTEGER,
    nfce_numero INTEGER,
    serial_chave TEXT,
    senha_master TEXT,
    email_master TEXT,
    status_licenca TEXT DEFAULT 'ativo',
    validade_uso TIMESTAMPTZ
);
ALTER TABLE empresa_configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_config" ON empresa_configuracoes;
CREATE POLICY "public_access_config" ON empresa_configuracoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 10. POLÍTICAS DE ACESSO PARA VISUALIZAÇÃO ONLINE (ANON KEY)
-- Garante que o painel online consiga ler tudo
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
