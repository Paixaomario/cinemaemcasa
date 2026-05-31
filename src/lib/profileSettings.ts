import { createClient } from '@/lib/supabase'

export interface ProfileSettings {
  language?: string
  subtitles?: string
  video_quality?: string
  data_saver?: boolean
}

/**
 * Salva as configurações do perfil no banco
 * @param userId ID do usuário
 * @param settings Configurações a serem salvas
 */
export async function saveProfileSettings(userId: string, settings: ProfileSettings): Promise<void> {
  const sb = createClient()

  const { error } = await sb
    .from('profile_settings')
    .upsert({
      user_id: userId,
    language: settings.language || 'pt-BR',
    subtitles: settings.subtitles || 'off',
    video_quality: settings.video_quality || 'auto',
    data_saver: settings.data_saver || false,
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Erro ao salvar configurações:', error)
    throw new Error('Erro ao salvar configurações')
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
      data_saver: false,
    }
  }

  return {
    language: data.language,
    subtitles: data.subtitles,
    video_quality: data.video_quality,
    data_saver: data.data_saver,
  }
}
