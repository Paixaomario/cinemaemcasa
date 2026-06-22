-- Função Principal: Gerar Recomendações Personalizadas
CREATE OR REPLACE FUNCTION generate_user_recommendations(target_user_id UUID)
RETURNS void AS $$
DECLARE
    fav_genre TEXT;
BEGIN
    -- 1. Limpa recomendações antigas que ainda não foram visualizadas para manter o feed fresco
    DELETE FROM public.recommendations 
    WHERE user_id = target_user_id AND viewed = false;

    -- 2. Identifica o gênero mais assistido pelo usuário
    -- Cruzamos view_progress com search_catalog para entender a preferência
    SELECT sc.genero INTO fav_genre
    FROM public.view_progress vp
    JOIN public.search_catalog sc ON (
      -- Lida com a possibilidade de content_id ser o source_id (numérico como string) ou UUID
      vp.content_id = sc.source_id::text
    )
    WHERE vp.user_id = target_user_id
    GROUP BY sc.genero
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- Se o usuário não tiver histórico, não gera recomendações específicas (o fallback da Home cuida disso)
    IF fav_genre IS NULL THEN
        RETURN;
    END IF;

    -- 3. Insere novas recomendações baseadas no gênero favorito
    INSERT INTO public.recommendations (user_id, content_id, score, reason)
    SELECT 
        target_user_id,
        sc.source_id::text,
        0.95 as score, -- Score alto para match de gênero
        'Porque você assistiu muito ' || fav_genre as reason
    FROM public.search_catalog sc
    WHERE sc.genero = fav_genre
    -- Garante que não recomenda o que ele já viu
    AND NOT EXISTS (
        SELECT 1 FROM public.view_progress vp 
        WHERE vp.user_id = target_user_id 
        AND vp.content_id = sc.source_id::text
    )
    -- Limita a 10 recomendações por vez para não sobrecarregar
    ORDER BY sc.created_at DESC
    LIMIT 10
    ON CONFLICT (user_id, content_id) DO NOTHING;

END;
$$ LANGUAGE plpgsql;

-- Gatilho Inteligente: Atualiza recomendações sempre que um vídeo for finalizado
CREATE OR REPLACE FUNCTION trigger_refresh_recommendations()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o usuário terminou de assistir (is_finished), gera novas recomendações
    IF (NEW.is_finished = true AND OLD.is_finished = false) THEN
        PERFORM generate_user_recommendations(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica o gatilho na tabela view_progress
DROP TRIGGER IF EXISTS tr_refresh_recs ON public.view_progress;
CREATE TRIGGER tr_refresh_recs
AFTER UPDATE ON public.view_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_refresh_recommendations();

-- Comentário para documentação
COMMENT ON FUNCTION generate_user_recommendations IS 'Motor de IA que analisa o gênero mais assistido e sugere novos conteúdos não vistos.';