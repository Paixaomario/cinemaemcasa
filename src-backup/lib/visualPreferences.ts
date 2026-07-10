import { createClient } from './supabase'

export interface VisualPreferences {
  theme: 'dark' | 'light' | 'auto'
  accent_color: string
  background_blur: boolean
  card_style: 'standard' | 'minimal' | 'detailed'
}

const defaultPrefs: VisualPreferences = {
  theme: 'dark',
  accent_color: '#00ADEF', // Azul Ciano Original
  background_blur: true,
  card_style: 'standard'
}

export async function getVisualPreferences(userId: string): Promise<VisualPreferences> {
  const sb = createClient()
  const { data, error } = await sb
    .from('visual_preferences')
    .select('theme, accent_color, background_blur, card_style')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar preferências visuais:', error)
    return defaultPrefs
  }

  return data || defaultPrefs
}

export async function saveVisualPreferences(userId: string, prefs: Partial<VisualPreferences>) {
  const sb = createClient()
  const { error } = await sb
    .from('visual_preferences')
    .upsert({
      user_id: userId,
      ...prefs,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) throw error
}