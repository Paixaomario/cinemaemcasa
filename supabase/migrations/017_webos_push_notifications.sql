/**
 * Migration: Criar tabelas de suporte para Push Notifications e WebOS
 * 
 * Executar em: Supabase SQL Editor
 * Ordem: Após todas as outras migrações
 */

-- Tabela de subscriptions para push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  device_type VARCHAR(50) DEFAULT 'web', -- 'webos_tv', 'web', 'mobile', etc
  device_name VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active BOOLEAN DEFAULT true,
  
  CONSTRAINT unique_user_device UNIQUE(user_id, subscription_data)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_type ON push_subscriptions(device_type);

-- Tabela de preferências de notificação por usuário
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_notifications BOOLEAN DEFAULT true,
  enable_new_content BOOLEAN DEFAULT true,
  enable_personal_recommendations BOOLEAN DEFAULT true,
  enable_cinema_events BOOLEAN DEFAULT true,
  preferred_time VARCHAR(5), -- HH:MM em UTC
  language VARCHAR(10) DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON user_notification_preferences(user_id);

-- Tabela de histórico de notificações enviadas
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  content_id VARCHAR(255), -- ID do filme/série relacionado
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  action_clicked BOOLEAN DEFAULT false,
  device_type VARCHAR(50),
  
  CONSTRAINT fk_content CHECK (content_id IS NOT NULL)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_read ON notification_history(read_at);

-- Tabela de conteúdo adicionado (para notificar usuários)
CREATE TABLE IF NOT EXISTS new_content_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(50), -- 'movie' ou 'series'
  title VARCHAR(255) NOT NULL,
  poster_url TEXT,
  genres TEXT[], -- array de gêneros
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'archived'
  
  CONSTRAINT unique_content_queue UNIQUE(content_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_new_content_status ON new_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_new_content_created ON new_content_queue(created_at);

-- RLS (Row Level Security) - Segurança

-- Push Subscriptions: cada usuário vê apenas suas próprias
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Notification Preferences: cada usuário vê e edita apenas suas
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas preferências" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas preferências" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas preferências" ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification History: apenas lê suas próprias notificações
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu histórico" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir no histórico" ON notification_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar histórico próprio" ON notification_history
  FOR UPDATE USING (auth.uid() = user_id);

-- New Content Queue: apenas admin pode modificar (sem RLS pública)
ALTER TABLE new_content_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver novos conteúdos" ON new_content_queue
  FOR SELECT USING (status = 'sent' OR status = 'pending');

-- Função para limpar subscriptions inativas (cleanup)
CREATE OR REPLACE FUNCTION clean_inactive_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM push_subscriptions
  WHERE updated_at < now() - interval '90 days' AND active = false;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
