import { createClient } from '@/lib/supabase'

export interface ProfileSettings {
  language?: string
  subtitles?: string
  video_quality?: string
  autoplay?: boolean
  auto_next_episode?: boolean
  data_saver?: boolean
}

/**
 * Salva as configurações do perfil no banco
 * @param userId ID do usuário
 * @param settings Configurações a serem salvas
 */
export async function saveProfileSettings(userId: string, settings: ProfileSettings): Promise<void> {
  const sb = createClient()

  // Verificar se já existe configuração para o usuário
  const { data: existing } = await sb
    .from('profile_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const settingsData = {
    language: settings.language || 'pt-BR',
    subtitles: settings.subtitles || 'off',
    video_quality: settings.video_quality || 'auto',
    autoplay: settings.autoplay !== undefined ? settings.autoplay : true,
    auto_next_episode: settings.auto_next_episode !== undefined ? settings.auto_next_episode : true,
    data_saver: settings.data_saver || false,
  }

  if (existing) {
    // Atualizar configuração existente
    const { error } = await sb
      .from('profile_settings')
      .update(settingsData)
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao atualizar configurações:', error)
      throw new Error('Erro ao atualizar configurações')
    }
  } else {
    // Criar nova configuração
    const { error } = await sb
      .from('profile_settings')
      .insert({
        user_id: userId,
        ...settingsData
      })

    if (error) {
      console.error('Erro ao criar configurações:', error)
      throw new Error('Erro ao criar configurações')
    }
  }
}

/**
 * Busca as configurações do perfil
 * @param userId ID do usuário
 * @returns Configurações do perfil
 */
export async function getProfileSettings(userId: string): Promise<ProfileSettings> {
  const sb = createClient()

  const { data, error } = await sb
    .from('profile_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar configurações:', error)
    throw new Error('Erro ao buscar configurações')
  }

  if (!data) {
    // Retornar configurações padrão
    return {
      language: 'pt-BR',
      subtitles: 'off',
      video_quality: 'auto',
      autoplay: true,
      auto_next_episode: true,
      data_saver: false,
    }
  }

  return {
    language: data.language,
    subtitles: data.subtitles,
    video_quality: data.video_quality,
    autoplay: data.autoplay,
    auto_next_episode: data.auto_next_episode,
    data_saver: data.data_saver,
  }
}
