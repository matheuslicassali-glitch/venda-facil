-- ============================================================
-- Venda Fácil - Tabela de Licenças (Supabase)
-- Execute este script no SQL Editor do seu Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS licencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Identificação do cliente
    nome_empresa TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    email_contato TEXT,
    responsavel TEXT,

    -- Controle da Licença
    chave_serial TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo', 'bloqueado', 'expirado', 'trial'
    motivo_bloqueio TEXT,

    -- Validade
    data_ativacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_expiracao TIMESTAMP WITH TIME ZONE,
    trial BOOLEAN DEFAULT false,

    -- Controle de uso
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    ip_ultimo_acesso TEXT,
    versao_app TEXT
);

-- Habilitar RLS
ALTER TABLE licencas ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode LER sua própria licença (por chave_serial)
CREATE POLICY "Leitura publica por chave_serial" ON licencas
    FOR SELECT USING (true);

-- Política: Somente o backend pode INSERIR/ATUALIZAR (via service_role)
-- (Remova a linha abaixo se quiser permitir INSERT via anon key no gerenciador)
CREATE POLICY "Service role gerencia licencas" ON licencas
    FOR ALL TO service_role USING (true);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_licencas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_licencas_updated_at
    BEFORE UPDATE ON licencas
    FOR EACH ROW EXECUTE PROCEDURE update_licencas_updated_at();

-- Dados de Exemplo (opcional, apague se não quiser)
-- INSERT INTO licencas (nome_empresa, cnpj, chave_serial, status, data_expiracao)
-- VALUES ('Minha Empresa', '00.000.000/0001-00', 'VF-XXXX-XXXX-XXXX', 'ativo', NOW() + INTERVAL '1 year');
