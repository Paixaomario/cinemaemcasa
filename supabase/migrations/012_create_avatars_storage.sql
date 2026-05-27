-- Criar bucket de avatares no Supabase Storage
-- Nota: Este comando precisa ser executado manualmente no painel do Supabase
-- ou via SQL se o Supabase suportar criação de buckets via SQL

-- Inserir políticas de acesso para o bucket de avatares (RLS)
-- Nota: Estas políticas precisam ser configuradas no painel do Supabase Storage

-- Tabela de avatares pré-definidos do sistema
CREATE TABLE IF NOT EXISTS system_avatars (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'default',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir avatares pré-definidos do sistema (estilo streamings oficiais)
INSERT INTO system_avatars (name, url, category) VALUES
  -- Avatares Padrão
  ('Avatar Padrão Azul', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default-blue&backgroundColor=b6e3f4', 'default'),
  ('Avatar Padrão Verde', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default-green&backgroundColor=c0aede', 'default'),
  ('Avatar Padrão Roxo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default-purple&backgroundColor=ffdfbf', 'default'),
  ('Avatar Padrão Laranja', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default-orange&backgroundColor=ffd5dc', 'default'),
  
  -- Avatares de Cinema
  ('Diretor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=director&clothing=blazerAndShirt', 'cinema'),
  ('Crítico', 'https://api.dicebear.com/7.x/avataaars/svg?seed=critic&clothing=shirtCrewNeck', 'cinema'),
  ('Cineasta', 'https://api.dicebear.com/7.x/avataaars/svg?seed=filmmaker&clothing=hoodie', 'cinema'),
  ('Produtor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=producer&clothing=blazerAndShirt&accessories=roundGlasses', 'cinema'),
  
  -- Avatares de Personagens
  ('Herói', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hero&clothing=overall', 'characters'),
  ('Vilão', 'https://api.dicebear.com/7.x/avataaars/svg?seed=villain&clothing=blazerAndShirt&accessories=sunglasses', 'characters'),
  ('Aventureiro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=adventurer&clothing=shirtCrewNeck', 'characters'),
  ('Explorador', 'https://api.dicebear.com/7.x/avataaars/svg?seed=explorer&clothing=hoodie&accessories=prescription02', 'characters'),
  
  -- Avatares Animais
  ('Gato', 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat&top=longHairBigHair', 'animals'),
  ('Cachorro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dog&top=shortHairShortFlat', 'animals'),
  ('Panda', 'https://api.dicebear.com/7.x/avataaars/svg?seed=panda&top=hat', 'animals'),
  ('Raposa', 'https://api.dicebear.com/7.x/avataaars/svg?seed=fox&top=longHairFrida', 'animals'),
  
  -- Avatares Abstratos
  ('Abstrato 1', 'https://api.dicebear.com/7.x/shapes/svg?seed=abstract1&backgroundColor=ffdfbf', 'abstract'),
  ('Abstrato 2', 'https://api.dicebear.com/7.x/shapes/svg?seed=abstract2&backgroundColor=c0aede', 'abstract'),
  ('Abstrato 3', 'https://api.dicebear.com/7.x/shapes/svg?seed=abstract3&backgroundColor=b6e3f4', 'abstract'),
  ('Abstrato 4', 'https://api.dicebear.com/7.x/shapes/svg?seed=abstract4&backgroundColor=ffd5dc', 'abstract'),
  
  -- Avatares Profissionais
  ('Engenheiro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=engineer&clothing=blazerAndShirt&accessories=roundGlasses', 'professional'),
  ('Designer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer&clothing=shirtCrewNeck&top=longHairFrida', 'professional'),
  ('Desenvolvedor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer&clothing=hoodie&accessories=kurt', 'professional'),
  ('Artista', 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist&clothing=shirtCrewNeck&top=longHairBigHair', 'professional')
ON CONFLICT DO NOTHING;

-- Adicionar coluna para avatar selecionado do sistema na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS system_avatar_id INTEGER REFERENCES system_avatars(id);

-- Criar índice para busca rápida de avatares
CREATE INDEX IF NOT EXISTS idx_system_avatars_category ON system_avatars(category);
CREATE INDEX IF NOT EXISTS idx_system_avatars_active ON system_avatars(is_active);

-- Habilitar RLS na tabela system_avatars
ALTER TABLE system_avatars ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública dos avatares do sistema
DROP POLICY IF EXISTS "Avatares do sistema são públicos" ON system_avatars;
CREATE POLICY "Avatares do sistema são públicos"
  ON system_avatars FOR SELECT
  TO public
  USING (true);

-- Política para permitir que usuários selecionem avatares
DROP POLICY IF EXISTS "Usuários podem selecionar avatares" ON system_avatars;
CREATE POLICY "Usuários podem selecionar avatares"
  ON system_avatars FOR UPDATE
  TO authenticated
  USING (true);
