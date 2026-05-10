-- ================================================================
-- CORREÇÃO DAS POLÍTICAS RLS - Execute ANTES do supabase_schema.sql
-- ou rode diretamente se as tabelas já existirem
-- ================================================================

-- Remove políticas antigas que bloqueiam o anon key
DROP POLICY IF EXISTS "Permitir acesso total a produtos" ON produtos;
DROP POLICY IF EXISTS "Permitir acesso total a clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir acesso total a funcionarios" ON funcionarios;
DROP POLICY IF EXISTS "Permitir acesso total a vendas" ON vendas;
DROP POLICY IF EXISTS "Permitir acesso total a venda_itens" ON venda_itens;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON produtos;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON clientes;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON funcionarios;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON vendas;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON venda_itens;

-- Cria novas políticas que permitem ANON e AUTHENTICATED
-- (O anon key é necessário para o Desktop sincronizar sem login)
CREATE POLICY "anon_full_produtos" ON produtos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_clientes" ON clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_funcionarios" ON funcionarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_vendas" ON vendas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_venda_itens" ON venda_itens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Verifica que o RLS ainda está ativo (segurança mantida, mas acesso liberado por política)
-- ALTER TABLE produtos DISABLE ROW LEVEL SECURITY; -- NÃO USE ISSO - mantenha o RLS ativo

-- ================================================================
-- VERIFIQUE SE AS TABELAS EXISTEM - se não existir, rode supabase_schema.sql primeiro
-- ================================================================
