-- Tabela para gerenciar salas de assistir juntos
CREATE TABLE IF NOT EXISTS public.party_rooms (
  id VARCHAR(20) PRIMARY KEY,
  content_id VARCHAR(100) NOT NULL,
  content_type VARCHAR(10) NOT NULL, -- 'movie' ou 'serie'
  host_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_party_rooms_host ON public.party_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_party_rooms_active ON public.party_rooms(is_active);

-- RLS
ALTER TABLE public.party_rooms ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "party_rooms_select" ON public.party_rooms;
DROP POLICY IF EXISTS "party_rooms_insert" ON public.party_rooms;
DROP POLICY IF EXISTS "party_rooms_update" ON public.party_rooms;

CREATE POLICY "party_rooms_select" ON public.party_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "party_rooms_insert" ON public.party_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "party_rooms_update" ON public.party_rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id);
