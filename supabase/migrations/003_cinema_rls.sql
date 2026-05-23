-- ============================================================
-- PAIXAOFLIX — RLS para tabela cinema
-- Cole no SQL Editor do Supabase
-- ============================================================

-- Habilitar RLS na tabela cinema
ALTER TABLE public.cinema ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública para todos (anon e authenticated)
CREATE POLICY "cinema_select_public" ON public.cinema
  FOR SELECT TO public USING (true);

-- Admins podem fazer tudo
CREATE POLICY "cinema_admin_all" ON public.cinema
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
