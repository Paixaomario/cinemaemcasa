-- Tabela para lista de "Assistir Depois"
CREATE TABLE IF NOT EXISTS public.watch_later (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id TEXT NOT NULL, -- Suporta 'filme-123', 'serie-456' ou UUIDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Habilitar RLS
ALTER TABLE public.watch_later ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "watch_later_select_own" ON public.watch_later
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "watch_later_insert_own" ON public.watch_later
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watch_later_delete_own" ON public.watch_later
  FOR DELETE TO authenticated USING (auth.uid() = user_id);