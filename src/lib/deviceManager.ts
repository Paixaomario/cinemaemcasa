import { createClient } from '@/lib/supabase'

export interface Device {
  id: string
  name: string
  type: 'tv' | 'mobile' | 'tablet' | 'desktop' | 'console'
  last_active: string
  is_current: boolean
}

/**
 * Registra um dispositivo para o usuário
 */
export async function registerDevice(userId: string, deviceInfo: { name: string; type: string; userAgent?: string; ipAddress?: string }): Promise<void> {
  const sb = createClient()
  const deviceId = generateDeviceId()

  // Verificar se já existe um dispositivo com o mesmo ID
  const { data: existing } = await sb
    .from('connected_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .maybeSingle()

  if (existing) {
    // Atualizar último acesso
    await sb
      .from('connected_devices')
      .update({ last_active: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    // Criar novo dispositivo
    await sb
      .from('connected_devices')
      .insert({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceInfo.name,
        device_type: deviceInfo.type,
        user_agent: deviceInfo.userAgent,
        ip_address: deviceInfo.ipAddress,
        last_active: new Date().toISOString(),
        is_current: true,
      })
  }
}

/**
 * Busca todos os dispositivos conectados do usuário
 */
export async function getUserDevices(userId: string): Promise<Device[]> {
  const sb = createClient()

  const { data, error } = await sb
    .from('connected_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_active', { ascending: false })

  if (error) {
    console.error('Erro ao buscar dispositivos:', error)
    return []
  }

  return (data || []).map(device => ({
    id: device.id,
    name: device.device_name,
    type: device.device_type as any,
    last_active: device.last_active,
    is_current: device.is_current,
  }))
}

/**
 * Faz logout de um dispositivo específico
 */
export async function logoutDevice(userId: string, deviceDbId: string): Promise<void> {
  const sb = createClient()

  // Remover dispositivo
  const { error } = await sb
    .from('connected_devices')
    .delete()
    .eq('id', deviceDbId)
    .eq('user_id', userId)

  if (error) {
    console.error('Erro ao fazer logout do dispositivo:', error)
    throw new Error('Erro ao fazer logout do dispositivo')
  }

  // Remover sessões ativas do dispositivo
  await sb
    .from('active_sessions')
    .delete()
    .eq('device_id', deviceDbId)
}

/**
 * Faz logout de todos os dispositivos exceto o atual
 */
export async function logoutAllOtherDevices(userId: string, currentDeviceId: string): Promise<void> {
  const sb = createClient()

  const { error } = await sb
    .from('connected_devices')
    .delete()
    .eq('user_id', userId)
    .neq('id', currentDeviceId)

  if (error) {
    console.error('Erro ao fazer logout de outros dispositivos:', error)
    throw new Error('Erro ao fazer logout de outros dispositivos')
  }
}

/**
 * Gera um ID único para o dispositivo
 */
function generateDeviceId(): string {
  // Usar localStorage para persistir o ID do dispositivo
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }
  return crypto.randomUUID()
}

/**
 * Detecta o tipo de dispositivo baseado no user agent
 */
export function detectDeviceType(userAgent: string): 'tv' | 'mobile' | 'tablet' | 'desktop' | 'console' {
  const ua = userAgent.toLowerCase()

  // Consoles
  if (ua.includes('playstation') || ua.includes('xbox') || ua.includes('nintendo')) {
    return 'console'
  }

  // Smart TVs
  if (ua.includes('smarttv') || ua.includes('tv') || ua.includes('roku') || ua.includes('chromecast')) {
    return 'tv'
  }

  // Tablets
  if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
    return 'tablet'
  }

  // Mobile
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile'
  }

  // Desktop (padrão)
  return 'desktop'
}

/**
 * Detecta o nome do dispositivo
 */
export function detectDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase()

  if (ua.includes('iphone')) return 'iPhone'
  if (ua.includes('ipad')) return 'iPad'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('windows')) return 'Windows PC'
  if (ua.includes('mac')) return 'Mac'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('playstation')) return 'PlayStation'
  if (ua.includes('xbox')) return 'Xbox'
  if (ua.includes('nintendo')) return 'Nintendo'

  return 'Dispositivo Desconhecido'
}
