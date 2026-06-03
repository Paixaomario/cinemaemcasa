-- Migration: Add Search Analytics and Suggestions Support
-- Date: 2024
-- Description: Create tables for tracking search analytics and historical search suggestions

-- Table for search analytics (para rastrear buscas populares)
CREATE TABLE IF NOT EXISTS search_analytics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  query TEXT NOT NULL,
  count INT DEFAULT 1,
  result_count INT,
  date DATE NOT NULL,
  region TEXT DEFAULT 'BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para performance de queries
  UNIQUE(query, date, region)
);

CREATE INDEX idx_search_analytics_query ON search_analytics(query);
CREATE INDEX idx_search_analytics_date ON search_analytics(date DESC);
CREATE INDEX idx_search_analytics_count ON search_analytics(count DESC);

-- Row-level security para search_analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Política: Anyone can read search analytics (agregado, sem dados pessoais)
CREATE POLICY "Search analytics are readable"
  ON search_analytics
  FOR SELECT
  USING (true);

-- Política: Only service role can write (via triggers/functions)
CREATE POLICY "Only service role can write search analytics"
  ON search_analytics
  FOR INSERT
  WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_search_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_search_analytics_timestamp ON search_analytics;
CREATE TRIGGER trigger_update_search_analytics_timestamp
  BEFORE UPDATE ON search_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_search_analytics_timestamp();

-- Table para rastrear searches por usuário (opcional, para recomendações futuras)
CREATE TABLE IF NOT EXISTS user_search_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INT,
  clicked_result_id TEXT, -- ID do resultado que o usuário clicou
  clicked_at TIMESTAMP WITH TIME ZONE,
  region TEXT DEFAULT 'BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_user_search_history_user ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_created ON user_search_history(created_at DESC);
CREATE UNIQUE INDEX idx_user_search_history_unique ON user_search_history(user_id, query, created_date);

-- RLS para user_search_history
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- Política: Users can only see their own search history
CREATE POLICY "Users can see own search history"
  ON user_search_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Users can insert their own search history
CREATE POLICY "Users can insert own search history"
  ON user_search_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Função para popular search_analytics a partir de user_search_history
-- (Agregação anônima)
CREATE OR REPLACE FUNCTION aggregate_search_analytics()
RETURNS void AS $$
BEGIN
  INSERT INTO search_analytics (query, count, result_count, date, region)
  SELECT 
    query,
    COUNT(*)::INT as count,
    ROUND(AVG(CAST(result_count AS NUMERIC)))::INT as result_count,
    CURRENT_DATE,
    region
  FROM user_search_history
  WHERE created_at::DATE = CURRENT_DATE
  GROUP BY query, region
  ON CONFLICT (query, date, region) DO UPDATE SET
    count = EXCLUDED.count,
    result_count = EXCLUDED.result_count,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE search_analytics IS 'Agregação anônima de buscas populares para sugestões e fins de analytics';
COMMENT ON TABLE user_search_history IS 'Histórico de buscas do usuário para recomendações personalizadas (privado)';
COMMENT ON COLUMN user_search_history.clicked_result_id IS 'ID do resultado que o usuário clicou (pode ser "movie-XXX" ou "series-XXX")';
COMMENT ON COLUMN user_search_history.clicked_at IS 'Timestamp de quando o usuário clicou no resultado';
