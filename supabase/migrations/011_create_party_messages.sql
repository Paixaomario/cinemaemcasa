-- Tabela para mensagens do chat de assistir juntos
CREATE TABLE IF NOT EXISTS public.party_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id VARCHAR(20) NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_party_messages_room ON public.party_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_created ON public.party_messages(created_at);

-- RLS
ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "party_messages_select" ON public.party_messages;
DROP POLICY IF EXISTS "party_messages_insert" ON public.party_messages;

CREATE POLICY "party_messages_select" ON public.party_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "party_messages_insert" ON public.party_messages FOR INSERT TO authenticated WITH CHECK (true);
