-- ============================================================
-- PAIXAOFLIX — RLS para tabela cinema
-- Cole no SQL Editor do Supabase
-- ============================================================

-- Habilitar RLS na tabela cinema
ALTER TABLE public.cinema ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "cinema_select_authenticated" ON public.cinema
  FOR SELECT TO authenticated USING (true);

-- Admins podem fazer tudo
CREATE POLICY "cinema_admin_all" ON public.cinema
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Se quiser leitura pública (sem login), adicione também:
-- CREATE POLICY "cinema_select_public" ON public.cinema
--   FOR SELECT TO anon USING (true);
