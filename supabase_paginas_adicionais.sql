-- ================================================================
-- SQL PARA MÓDULOS ADICIONAIS (FINANCEIRO, FORNECEDORES, CAIXA, ETC)
-- Execute no SQL Editor do Supabase para habilitar todas as páginas
-- ================================================================

-- 1. Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 2. Tabela de Financeiro (Contas a Pagar/Receber)
CREATE TABLE IF NOT EXISTS financeiro_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    tipo TEXT NOT NULL, -- 'pagar' ou 'receber'
    descricao TEXT NOT NULL,
    valor NUMERIC(15,2) NOT NULL DEFAULT 0,
    vencimento TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pendente',
    categoria TEXT
);

-- 3. Tabela de Funcionários (Caso não exista)
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Ativo',
    comissao NUMERIC(5,2) DEFAULT 0,
    pin TEXT,
    permissoes JSONB DEFAULT '[]'
);

-- 4. Tabela de Sessões de Caixa
CREATE TABLE IF NOT EXISTS caixa_sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 5. Tabela de Movimentações de Caixa
CREATE TABLE IF NOT EXISTS caixa_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sincronizado BOOLEAN DEFAULT FALSE,
    ultima_sincronizacao TIMESTAMPTZ,
    caixa_id UUID REFERENCES caixa_sessoes(id),
    tipo TEXT NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    motivo TEXT,
    data TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Configurações da Empresa (Fundamental para Licença)
CREATE TABLE IF NOT EXISTS empresa_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    serial_chave TEXT,
    status_licenca TEXT DEFAULT 'ativo',
    validade_uso TIMESTAMPTZ
);

-- 7. Ativar RLS em todas
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_configuracoes ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para acesso Desktop (ANON) e Painel Online (AUTHENTICATED)
CREATE POLICY "full_access_fornecedores" ON fornecedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_financeiro" ON financeiro_contas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_funcionarios" ON funcionarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_caixa_sessoes" ON caixa_sessoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_caixa_mov" ON caixa_movimentacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "full_access_config" ON empresa_configuracoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_fornecedores BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_financeiro BEFORE UPDATE ON financeiro_contas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_funcionarios BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_caixa_sessoes BEFORE UPDATE ON caixa_sessoes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_caixa_mov BEFORE UPDATE ON caixa_movimentacoes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_config BEFORE UPDATE ON empresa_configuracoes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
