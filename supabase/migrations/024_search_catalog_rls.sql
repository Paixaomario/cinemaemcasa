-- Migration: Fix Search Catalog Visibility
-- Description: Habilita RLS e permite que usuários leiam o catálogo de busca

-- 1. Habilitar RLS
ALTER TABLE public.search_catalog ENABLE ROW LEVEL SECURITY;

-- 2. Criar Política de Leitura Pública
DROP POLICY IF EXISTS "Permitir leitura pública do catálogo" ON public.search_catalog;
CREATE POLICY "Permitir leitura pública do catálogo"
  ON public.search_catalog
  FOR SELECT TO public USING (true);