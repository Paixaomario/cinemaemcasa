import { createClient } from '@/lib/supabase'

/**
 * Faz upload do avatar para o Supabase Storage
 * @param file Arquivo de imagem
 * @param userId ID do usuário
 * @returns URL pública do avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const sb = createClient()

  // Validar arquivo
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo deve ser uma imagem')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 5MB')
  }

  // Gerar nome único para o arquivo
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Fazer upload
  const { data, error } = await sb.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Erro ao fazer upload do avatar:', error)
    throw new Error('Erro ao fazer upload do avatar')
  }

  // Obter URL pública
  const { data: { publicUrl } } = sb.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Atualizar perfil do usuário com a nova URL do avatar
  const { error: updateError } = await sb
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (updateError) {
    console.error('Erro ao atualizar perfil:', updateError)
    throw new Error('Erro ao atualizar perfil')
  }

  return publicUrl
}

/**
 * Remove o avatar do usuário
 * @param userId ID do usuário
 * @param currentAvatarUrl URL atual do avatar
 */
export async function removeAvatar(userId: string, currentAvatarUrl: string): Promise<void> {
  const sb = createClient()

  // Extrair caminho do arquivo da URL
  const urlParts = currentAvatarUrl.split('/avatars/')
  if (urlParts.length < 2) {
    throw new Error('URL do avatar inválida')
  }
  const filePath = `avatars/${urlParts[1]}`

  // Remover do storage
  const { error } = await sb.storage
    .from('avatars')
    .remove([filePath])

  if (error) {
    console.error('Erro ao remover avatar:', error)
    throw new Error('Erro ao remover avatar')
  }

  // Atualizar perfil removendo a URL
  await sb
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId)
}
