-- REBUILD VENDA FÁCIL DATABASE STRUCTURE
-- Este script limpa e recria todas as tabelas com suporte total a UUID e tipos numéricos corretos.

-- 1. Habilitar extensão para UUIDs (se não estiver ativa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Limpar Tabelas Antigas (Cuidado: Isso apaga todos os dados!)
DROP TABLE IF EXISTS "caixa_movimentacoes" CASCADE;
DROP TABLE IF EXISTS "caixa_sessoes" CASCADE;
DROP TABLE IF EXISTS "venda_itens" CASCADE;
DROP TABLE IF EXISTS "vendas" CASCADE;
DROP TABLE IF EXISTS "produtos" CASCADE;
DROP TABLE IF EXISTS "clientes" CASCADE;
DROP TABLE IF EXISTS "fornecedores" CASCADE;
DROP TABLE IF EXISTS "funcionarios" CASCADE;
DROP TABLE IF EXISTS "financeiro_contas" CASCADE;
DROP TABLE IF EXISTS "empresa_configuracoes" CASCADE;

-- 3. Criar Tabela de Funcionários (Equipe/Segurança)
CREATE TABLE "funcionarios" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "cpf" TEXT UNIQUE NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'Vendedor', -- Vendedor, Gerente, Administrador, Estoquista
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "comissao" NUMERIC DEFAULT 0,
    "pin" TEXT, -- PIN de 4 a 6 dígitos para aprovações
    "permissoes" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar Tabela de Produtos (Estoque)
CREATE TABLE "produtos" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "sku" TEXT UNIQUE,
    "codigo_barras" TEXT,
    "unidade" TEXT DEFAULT 'UN',
    "preco_custo" NUMERIC NOT NULL DEFAULT 0,
    "preco_venda" NUMERIC NOT NULL DEFAULT 0,
    "estoque_atual" NUMERIC NOT NULL DEFAULT 0,
    "estoque_minimo" NUMERIC DEFAULT 5,
    "categoria" TEXT,
    "foto" TEXT,
    "ncm" TEXT, -- 8 dígitos
    "cest" TEXT,
    "origem" TEXT DEFAULT '0',
    "cfop" TEXT,
    "cst_csosn" TEXT,
    "pis_cst" TEXT,
    "pis_aliquota" NUMERIC DEFAULT 0,
    "cofins_cst" TEXT,
    "cofins_aliquota" NUMERIC DEFAULT 0,
    "icms_aliquota" NUMERIC DEFAULT 0,
    "validade" DATE,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar Tabela de Clientes (Carteira)
CREATE TABLE "clientes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "razao_social" TEXT,
    "documento" TEXT UNIQUE NOT NULL, -- CPF ou CNPJ
    "inscricao_estadual" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "limite_credito" NUMERIC DEFAULT 0,
    "saldo_devedor" NUMERIC DEFAULT 0,
    "endereco" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "ibge_cidade" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar Tabela de Fornecedores
CREATE TABLE "fornecedores" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "cnpj" TEXT UNIQUE NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Criar Tabela de Vendas
CREATE TABLE "vendas" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "data_venda" TIMESTAMPTZ DEFAULT NOW(),
    "valor_total" NUMERIC NOT NULL,
    "desconto_total" NUMERIC DEFAULT 0,
    "tipo_pagamento" TEXT NOT NULL, -- dinheiro, cartao_credito, cartao_debito, pix, fiado
    "cliente_id" UUID REFERENCES "clientes"("id") ON DELETE SET NULL,
    "vendedor_id" UUID REFERENCES "funcionarios"("id") ON DELETE SET NULL,
    "status" TEXT DEFAULT 'concluida',
    "fiscal_status" TEXT DEFAULT 'pendente', -- emitida, pendente, cancelada
    "nfe_numero" TEXT,
    "chave_acesso" TEXT,
    "xml" TEXT,
    "tipo_operacao" TEXT DEFAULT 'saida'
);

-- 8. Criar Tabela de Itens da Venda
CREATE TABLE "venda_itens" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "venda_id" UUID REFERENCES "vendas"("id") ON DELETE CASCADE,
    "produto_id" UUID REFERENCES "produtos"("id") ON DELETE SET NULL,
    "nome" TEXT, -- Snapshot do nome no momento da venda
    "quantidade" NUMERIC NOT NULL,
    "preco_unitario" NUMERIC NOT NULL,
    "subtotal" NUMERIC NOT NULL,
    "desconto" NUMERIC DEFAULT 0
);

-- 9. Criar Tabelas de Caixa (Sessões e Movimentações)
CREATE TABLE "caixa_sessoes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "aberto_em" TIMESTAMPTZ DEFAULT NOW(),
    "fechado_em" TIMESTAMPTZ,
    "valor_abertura" NUMERIC DEFAULT 0,
    "valor_fechamento_esperado" NUMERIC DEFAULT 0,
    "valor_fechamento_real" NUMERIC DEFAULT 0,
    "vendedor_id" UUID REFERENCES "funcionarios"("id"),
    "status" TEXT DEFAULT 'aberto'
);

CREATE TABLE "caixa_movimentacoes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "caixa_id" UUID REFERENCES "caixa_sessoes"("id") ON DELETE CASCADE,
    "tipo" TEXT NOT NULL, -- entrada (suprimento), saida (sangria)
    "valor" NUMERIC NOT NULL,
    "motivo" TEXT,
    "data" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Criar Tabela de Financeiro (Contas)
CREATE TABLE "financeiro_contas" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "descricao" TEXT NOT NULL,
    "valor" NUMERIC NOT NULL,
    "tipo" TEXT NOT NULL, -- pagar, receber
    "vencimento" DATE NOT NULL,
    "status" TEXT DEFAULT 'pendente', -- pago, pendente
    "categoria" TEXT DEFAULT 'Operacional',
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Criar Tabela de Configurações da Empresa
CREATE TABLE "empresa_configuracoes" (
    "id" BIGINT PRIMARY KEY DEFAULT 1,
    "cnpj" TEXT,
    "inscricao_estadual" TEXT,
    "razao_social" TEXT,
    "nome_fantasia" TEXT,
    "crt" TEXT DEFAULT '1',
    "logradouro" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "ibge_cidade" TEXT,
    "email_contato" TEXT,
    "telefone_contato" TEXT,
    "fiscal_csc" TEXT,
    "fiscal_csc_id" TEXT,
    "fiscal_ambiente" TEXT DEFAULT 'homologacao',
    "certificado_vencimento" DATE,
    "status_licenca" TEXT DEFAULT 'ativo'
);

-- 12. Inserir Usuário Administrador Mestre (Acesse com matheuslicassali@gmail.com / PIN: 1234)
INSERT INTO "funcionarios" ("nome", "email", "cpf", "cargo", "pin", "permissoes")
VALUES (
    'Matheus Administrador', 
    'matheuslicassali@gmail.com', 
    '000.000.000-00', 
    'Administrador', 
    '1234', 
    '["all"]'
) ON CONFLICT (email) DO NOTHING;

-- 13. Inserir Configuração Inicial da Empresa
INSERT INTO "empresa_configuracoes" ("id", "nome_fantasia", "status_licenca")
VALUES (1, 'Venda Fácil Master', 'ativo') ON CONFLICT (id) DO NOTHING;
