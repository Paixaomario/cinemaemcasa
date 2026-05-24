-- Modificar a tabela favorites para aceitar tanto UUID quanto IDs numéricos
-- Isso permite favoritar conteúdo das tabelas legadas (series, cinema)

-- 1. Adicionar coluna para ID numérico (opcional)
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS legacy_id BIGINT;

-- 2. Remover a constraint NOT NULL de content_id para permitir null quando usar legacy_id
ALTER TABLE public.favorites ALTER COLUMN content_id DROP NOT NULL;

-- 3. Adicionar constraint para garantir que pelo menos um dos dois esteja presente
ALTER TABLE public.favorites ADD CONSTRAINT check_content_or_legacy 
  CHECK (content_id IS NOT NULL OR legacy_id IS NOT NULL);

-- 4. Atualizar a política RLS para permitir operações com legacy_id
DROP POLICY IF EXISTS "favorites_own" ON public.favorites;

CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
