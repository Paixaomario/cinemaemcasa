-- ============================================
-- TABELAS ADICIONAIS PARA PERFIL PREMIUM
-- ============================================
-- Este SQL cria tabelas para suportar
-- funcionalidades avançadas de perfil
-- ============================================

-- Tabela de configurações do perfil
CREATE TABLE IF NOT EXISTS public.profile_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text DEFAULT 'pt-BR',
  subtitles text DEFAULT 'off',
  video_quality text DEFAULT 'auto',
  data_saver boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_settings_pkey PRIMARY KEY (id),
  CONSTRAINT profile_settings_user_id_key UNIQUE (user_id)
);

-- Tabela de favoritos (já existe, apenas para referência)
-- CREATE TABLE IF NOT EXISTS public.favorites (...)

-- Tabela de histórico de visualização detalhado
CREATE TABLE IF NOT EXISTS public.watch_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  content_type text NOT NULL, -- 'movie' ou 'series'
  title text NOT NULL,
  poster text,
  watched_at timestamp with time zone DEFAULT now(),
  duration_watched integer, -- segundos assistidos
  total_duration integer, -- duração total em segundos
  episode_number integer,
  season_number integer,
  CONSTRAINT watch_history_pkey PRIMARY KEY (id)
);

-- Tabela de dispositivos conectados
CREATE TABLE IF NOT EXISTS public.connected_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_type text NOT NULL, -- 'tv', 'mobile', 'tablet', 'desktop', 'console'
  device_id text NOT NULL, -- identificador único do dispositivo
  user_agent text,
  ip_address text,
  last_active timestamp with time zone DEFAULT now(),
  is_current boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT connected_devices_pkey PRIMARY KEY (id),
  CONSTRAINT connected_devices_user_device_unique UNIQUE (user_id, device_id)
);

-- Tabela de sessões ativas
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES connected_devices(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  content_id text,
  current_position integer, -- posição atual em segundos
  is_playing boolean DEFAULT false,
  started_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  CONSTRAINT active_sessions_pkey PRIMARY KEY (id)
);

-- Tabela de controle parental
CREATE TABLE IF NOT EXISTS public.parental_control (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text, -- hash do PIN
  max_rating text DEFAULT 'all', -- 'all', 'G', 'PG', 'PG-13', 'R', 'NC-17'
  block_adult_content boolean DEFAULT true,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parental_control_pkey PRIMARY KEY (id),
  CONSTRAINT parental_control_user_id_key UNIQUE (user_id)
);

-- Tabela de preferências de acessibilidade
CREATE TABLE IF NOT EXISTS public.accessibility_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtitle_size text DEFAULT 'medium', -- 'small', 'medium', 'large', 'extra-large'
  subtitle_color text DEFAULT 'white',
  subtitle_background text DEFAULT 'black',
  audio_description boolean DEFAULT false,
  high_contrast boolean DEFAULT false,
  reduced_motion boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accessibility_settings_pkey PRIMARY KEY (id),
  CONSTRAINT accessibility_settings_user_id_key UNIQUE (user_id)
);

-- Tabela de preferências visuais
CREATE TABLE IF NOT EXISTS public.visual_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'dark', -- 'dark', 'light', 'auto'
  accent_color text DEFAULT 'gold',
  background_blur boolean DEFAULT true,
  card_style text DEFAULT 'standard', -- 'standard', 'minimal', 'detailed'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visual_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT visual_preferences_user_id_key UNIQUE (user_id)
);

-- Tabela de estatísticas do perfil
CREATE TABLE IF NOT EXISTS public.profile_statistics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_watch_time integer DEFAULT 0, -- total em segundos
  movies_watched integer DEFAULT 0,
  series_watched integer DEFAULT 0,
  episodes_watched integer DEFAULT 0,
  last_watch_date timestamp with time zone,
  most_watched_genre text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_statistics_pkey PRIMARY KEY (id),
  CONSTRAINT profile_statistics_user_id_key UNIQUE (user_id)
);

-- Tabela de sincronização entre dispositivos
CREATE TABLE IF NOT EXISTS public.device_sync (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES connected_devices(id) ON DELETE CASCADE,
  sync_key text NOT NULL,
  last_sync timestamp with time zone DEFAULT now(),
  sync_status text DEFAULT 'active', -- 'active', 'pending', 'failed'
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT device_sync_pkey PRIMARY KEY (id),
  CONSTRAINT device_sync_user_device_unique UNIQUE (user_id, device_id)
);

-- Tabela de recomendações personalizadas
CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  score numeric, -- pontuação de relevância (0-1)
  reason text, -- motivo da recomendação
  created_at timestamp with time zone DEFAULT now(),
  viewed boolean DEFAULT false,
  CONSTRAINT recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT recommendations_user_content_unique UNIQUE (user_id, content_id)
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON watch_history(watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_connected_devices_user_id ON connected_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_devices_last_active ON connected_devices(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON recommendations(score DESC);

-- Função e Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers com DROP IF EXISTS para evitar erros
DROP TRIGGER IF EXISTS update_profile_settings_updated_at ON public.profile_settings;
CREATE TRIGGER update_profile_settings_updated_at BEFORE UPDATE ON public.profile_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parental_control_updated_at ON public.parental_control;
CREATE TRIGGER update_parental_control_updated_at BEFORE UPDATE ON public.parental_control
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accessibility_settings_updated_at ON public.accessibility_settings;
CREATE TRIGGER update_accessibility_settings_updated_at BEFORE UPDATE ON public.accessibility_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visual_preferences_updated_at ON public.visual_preferences;
CREATE TRIGGER update_visual_preferences_updated_at BEFORE UPDATE ON public.visual_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_statistics_updated_at ON public.profile_statistics;
CREATE TRIGGER update_profile_statistics_updated_at BEFORE UPDATE ON public.profile_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
