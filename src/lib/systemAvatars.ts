import { createClient } from '@/lib/supabase'

export interface SystemAvatar {
  id: number
  name: string
  url: string
  category: string
  is_active: boolean
}

/**
 * Busca todos os avatares do sistema
 */
export async function getSystemAvatars(): Promise<SystemAvatar[]> {
  const sb = createClient()
  
  const { data, error } = await sb
    .from('system_avatars')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
  
  if (error) {
    console.error('Erro ao buscar avatares do sistema:', error)
    return []
  }
  
  return data || []
}

/**
 * Atualiza o avatar do usuário para um avatar do sistema
 */
export async function selectSystemAvatar(userId: string, avatarId: number): Promise<void> {
  const sb = createClient()
  
  // Buscar a URL do avatar do sistema
  const { data: avatar, error: avatarError } = await sb
    .from('system_avatars')
    .select('url')
    .eq('id', avatarId)
    .single()
  
  if (avatarError || !avatar) {
    throw new Error('Avatar não encontrado')
  }
  
  // Atualizar o perfil do usuário
  const { error: updateError } = await sb
    .from('profiles')
    .update({ 
      avatar_url: avatar.url,
      system_avatar_id: avatarId
    })
    .eq('id', userId)
  
  if (updateError) {
    console.error('Erro ao atualizar avatar:', updateError)
    throw new Error('Erro ao atualizar avatar')
  }
}

/**
 * Remove o avatar do usuário (volta para o padrão)
 */
export async function removeUserAvatar(userId: string): Promise<void> {
  const sb = createClient()
  
  const { error } = await sb
    .from('profiles')
    .update({ 
      avatar_url: null,
      system_avatar_id: null
    })
    .eq('id', userId)
  
  if (error) {
    console.error('Erro ao remover avatar:', error)
    throw new Error('Erro ao remover avatar')
  }
}
