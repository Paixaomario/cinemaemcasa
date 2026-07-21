'use server'

import { supabase } from './supabase'

// ============================================================
// HISTÓRICO DE BUSCA DO USUÁRIO - user_search_history
// ============================================================

/**
 * Registra a busca de um usuário ou o clique em um resultado.
 * @param {string} query - O termo pesquisado.
 * @param {number} resultCount - A quantidade de resultados encontrados.
 * @param {string} [clickedResultId] - O ID do conteúdo clicado (opcional).
 */
export async function logUserSearch(
  query: string,
  resultCount: number,
  clickedResultId?: string
) {
  // Esta função precisa do ID do usuário, então usamos o Supabase Auth Helpers
  // para obter a sessão do usuário no lado do servidor de forma segura.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Não faz nada se o usuário não estiver logado.
    return
  }

  const searchEntry = {
    user_id: user.id,
    query: query.toLowerCase().trim(),
    created_date: new Date().toISOString().split('T')[0],
    result_count: resultCount,
    clicked_result_id: clickedResultId,
    clicked_at: clickedResultId ? new Date().toISOString() : null,
  }

  // A tabela tem um índice único em (user_id, query, created_date).
  // O 'upsert' garante que, se o usuário buscar o mesmo termo no mesmo dia,
  // o registro será atualizado (ex: com um clique) em vez de criar uma nova linha.
  const { error } = await supabase.from('user_search_history').upsert(searchEntry, {
    onConflict: 'user_id, query, created_date',
  })

  if (error) {
    console.error('Erro ao registrar histórico de busca do usuário:', error)
  }
}

// ============================================================
// PROGRESSO DE VISUALIZAÇÃO - view_progress
// ============================================================

/**
 * Obtém o progresso de visualização de um conteúdo para o usuário logado.
 * @param {string} contentId - O ID do filme ou episódio.
 * @returns {Promise<{last_position: number, is_finished: boolean} | null>}
 */
export async function getViewProgress(contentId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data, error } = await supabase
      .from('view_progress')
      .select('last_position, is_finished')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar progresso de visualização:', error)
    return null
  }
}

/**
 * Salva o progresso de visualização de um conteúdo para o usuário logado.
 * @param {string} contentId - O ID do filme ou episódio.
 * @param {number} lastPosition - A posição em segundos.
 * @param {boolean} [isFinished=false] - Se o conteúdo foi finalizado.
 */
export async function saveViewProgress(
  contentId: string,
  lastPosition: number,
  isFinished: boolean = false
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('view_progress').upsert({
    user_id: user.id,
    content_id: contentId,
    last_position: Math.round(lastPosition),
    is_finished: isFinished,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Erro ao salvar progresso de visualização:', error)
  }
}

// ============================================================
// PREFERÊNCIAS VISUAIS - visual_preferences
// ============================================================

/**
 * Atualiza as preferências visuais para o usuário logado.
 */
export async function updateVisualPreferences(updates: {
  theme?: string;
  accent_color?: string;
  background_blur?: boolean;
  card_style?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  try {
    const { data, error } = await supabase
      .from('visual_preferences')
      .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Erro ao atualizar preferências visuais:', error)
    return { error: 'Falha ao salvar preferências.' }
  }
}