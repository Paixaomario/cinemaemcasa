import { createClient } from '@/lib/supabase'

export interface NotificationPreferences {
  id?: string
  user_id: string
  enable_notifications?: boolean
  enable_new_content?: boolean
  enable_personal_recommendations?: boolean
  enable_cinema_events?: boolean
  preferred_time?: string
  language?: string
  created_at?: string
  updated_at?: string
}

/**
 * Busca as preferências de notificação do usuário
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[NotificationPreferences] Erro ao buscar preferências:', error)
    return null
  }

  return data
}

/**
 * Cria ou atualiza as preferências de notificação do usuário
 */
export async function upsertNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> {
  const sb = createClient()
  
  const { data, error } = await sb
    .from('user_notification_preferences')
    .upsert({
      user_id: userId,
      ...preferences
    })
    .select()
    .single()

  if (error) {
    console.error('[NotificationPreferences] Erro ao salvar preferências:', error)
    return null
  }

  return data
}

/**
 * Verifica se o usuário tem notificações habilitadas
 */
export async function areNotificationsEnabled(userId: string): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId)
  return prefs?.enable_notifications ?? true // Default true
}
