-- ================================================================
-- SCHEMA COMPLETO PARA SUPABASE (VENDA FÁCIL)
-- Execute este script no SQL Editor do seu Supabase
-- ================================================================

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Fornecedores
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

-- 3. Tabela de Financeiro (Contas a Pagar/Receber)
CREATE TABLE IF NOT EXISTS financeiro_contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    tipo TEXT NOT NULL, -- 'pagar' ou 'receber'
    descricao TEXT NOT NULL,
    valor NUMERIC(15,2) NOT NULL DEFAULT 0,
    vencimento TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    categoria TEXT
);

-- 4. Tabela de Sessões de Caixa
CREATE TABLE IF NOT EXISTS caixa_sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    funcionario_id UUID,
    data_abertura TIMESTAMPTZ DEFAULT NOW(),
    data_fechamento TIMESTAMPTZ,
    saldo_inicial NUMERIC(15,2) DEFAULT 0,
    saldo_final NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'aberto'
);

-- 5. Tabela de Movimentações de Caixa (Sangria/Suprimento)
CREATE TABLE IF NOT EXISTS caixa_movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    caixa_id UUID REFERENCES caixa_sessoes(id),
    tipo TEXT NOT NULL, -- 'sangria' ou 'suprimento'
    valor NUMERIC(15,2) NOT NULL,
    motivo TEXT,
    data TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Configurações da Empresa
CREATE TABLE IF NOT EXISTS empresa_configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    cnpj TEXT UNIQUE NOT NULL,
    razao_social TEXT,
    nome_fantasia TEXT,
    inscricao_estadual TEXT,
    crt TEXT,
    email_contato TEXT,
    telefone_contato TEXT,
    logradouro TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    cep TEXT,
    status_licenca TEXT DEFAULT 'ativo'
);

-- 7. Ativar RLS em todas as novas tabelas
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_configuracoes ENABLE ROW LEVEL SECURITY;

-- 8. Criar Políticas de Acesso Total (ANON para sincronização desktop)
CREATE POLICY "anon_full_fornecedores" ON fornecedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_financeiro" ON financeiro_contas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_caixa_sessoes" ON caixa_sessoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_caixa_mov" ON caixa_movimentacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_config" ON empresa_configuracoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_financeiro_updated_at BEFORE UPDATE ON financeiro_contas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_caixa_sessoes_updated_at BEFORE UPDATE ON caixa_sessoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_caixa_mov_updated_at BEFORE UPDATE ON caixa_movimentacoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON empresa_configuracoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
