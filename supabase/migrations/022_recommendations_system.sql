-- Migration: Setup Personalized Recommendations System
-- Description: Table for AI-driven or manual content recommendations per user

CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL,
  content_id text NOT NULL,
  score numeric NULL,
  reason text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  viewed boolean NULL DEFAULT false,
  CONSTRAINT recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT recommendations_user_content_unique UNIQUE (user_id, content_id),
  CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Índices para performance (Busca rápida por usuário e ranking de score)
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON public.recommendations USING btree (score DESC);

-- Habilitar Segurança RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias recomendações
CREATE POLICY "Users can view own recommendations" ON public.recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.recommendations IS 'Tabela de recomendações personalizadas geradas por IA ou tendências para o usuário.';