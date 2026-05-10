-- ================================================================
-- SUPER FIX: SINCRONIZAÇÃO TOTAL E ACESSO ONLINE
-- Execute este script completo no SQL Editor do Supabase
-- Ele garante que todas as tabelas e permissões estejam corretas
-- ================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar timestamp
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
    preco_venda NUMERIC(15,2) NOT NULL,
    preco_custo NUMERIC(15,2),
    estoque_atual NUMERIC(15,2) DEFAULT 0,
    unidade TEXT,
    categoria TEXT
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
    documento TEXT UNIQUE NOT NULL,
    email TEXT,
    telefone TEXT,
    endereco TEXT
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_clientes" ON clientes;
CREATE POLICY "public_access_clientes" ON clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS set_timestamp_clientes ON clientes;
CREATE TRIGGER set_timestamp_clientes BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3. VENDAS
CREATE TABLE IF NOT EXISTS vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    data_venda TIMESTAMPTZ DEFAULT NOW(),
    valor_total NUMERIC(15,2) NOT NULL,
    tipo_pagamento TEXT
);
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_vendas" ON vendas;
CREATE POLICY "public_access_vendas" ON vendas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS set_timestamp_vendas ON vendas;
CREATE TRIGGER set_timestamp_vendas BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 4. Venda Itens
CREATE TABLE IF NOT EXISTS venda_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id UUID,
    quantidade NUMERIC(15,2) NOT NULL,
    preco_unitario NUMERIC(15,2) NOT NULL
);
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_venda_itens" ON venda_itens;
CREATE POLICY "public_access_venda_itens" ON venda_itens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. FINANCEIRO
CREATE TABLE IF NOT EXISTS financeiro_contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    vencimento TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pendente',
    categoria TEXT
);
ALTER TABLE financeiro_contas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_financeiro" ON financeiro_contas;
CREATE POLICY "public_access_financeiro" ON financeiro_contas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS set_timestamp_financeiro ON financeiro_contas;
CREATE TRIGGER set_timestamp_financeiro BEFORE UPDATE ON financeiro_contas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 6. FORNECEDORES
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    email TEXT,
    telefone TEXT
);
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_fornecedores" ON fornecedores;
CREATE POLICY "public_access_fornecedores" ON fornecedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'Ativo'
);
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_funcionarios" ON funcionarios;
CREATE POLICY "public_access_funcionarios" ON funcionarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. CAIXA
CREATE TABLE IF NOT EXISTS caixa_sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    saldo_inicial NUMERIC(15,2) DEFAULT 0,
    saldo_final NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'aberto'
);
ALTER TABLE caixa_sessoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_caixa" ON caixa_sessoes;
CREATE POLICY "public_access_caixa" ON caixa_sessoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS empresa_configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    cnpj TEXT UNIQUE NOT NULL,
    razao_social TEXT,
    nome_fantasia TEXT,
    status_licenca TEXT DEFAULT 'ativo'
);
ALTER TABLE empresa_configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access_config" ON empresa_configuracoes;
CREATE POLICY "public_access_config" ON empresa_configuracoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
