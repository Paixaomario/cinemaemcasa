/**
 * Detecção de Plataforma e Ambiente
 * Identifica se a aplicação está rodando em WebOS, Web, Mobile, etc.
 * Seguro para usar em SSR/Server Components
 */

export type PlatformType = 'webos' | 'web' | 'ios' | 'android' | 'desktop' | 'unknown'
export type DeviceType = 'tv' | 'mobile' | 'tablet' | 'desktop'

export interface PlatformInfo {
  type: PlatformType
  deviceType: DeviceType
  isWebOS: boolean
  isTV: boolean
  webOSVersion?: string
  userAgent: string
}

/**
 * Detecta se está em ambiente WebOS
 * Seguro para executar tanto no cliente quanto no servidor
 */
function detectWebOS(): boolean {
  // Verifica se estamos no cliente
  if (typeof window === 'undefined') return false

  // LG WebOS expõe a API window.webOS
  return typeof (window as any).webOS !== 'undefined'
}

/**
 * Extrai a versão do WebOS
 */
function getWebOSVersion(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const webOS = (window as any).webOS
  if (!webOS) return undefined

  try {
    // WebOS 3.0+: usa webOS.systemModel()
    if (typeof webOS.systemModel === 'function') {
      const model = webOS.systemModel()
      if (model?.version) return model.version
    }

    // Fallback: tenta extrair do user agent
    const userAgent = navigator.userAgent
    const match = userAgent.match(/WebOS\/(\d+\.\d+)/)
    return match ? match[1] : undefined
  } catch (error) {
    console.warn('Erro ao obter versão WebOS:', error)
    return undefined
  }
}

/**
 * Detecta tipo de dispositivo pelo user agent
 */
function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase()

  // WebOS TV (prioridade alta)
  if (ua.includes('webos')) return 'tv'

  // Smart TV (outras plataformas)
  if (ua.includes('smarttv') || ua.includes('smart-tv') || ua.includes('googletv')) return 'tv'

  // Devices Amazon (Fire TV, etc)
  if (ua.includes('aftt') || ua.includes('kindle')) return 'tv'

  // Mobile
  if (ua.includes('iphone') || ua.includes('ipod')) return 'mobile'
  if (ua.includes('android')) return 'mobile'

  // Tablet
  if (ua.includes('ipad')) return 'tablet'
  if (ua.includes('android') && ua.includes('tablet')) return 'tablet'

  // Desktop é padrão
  return 'desktop'
}

/**
 * Detecta tipo de plataforma
 */
function detectPlatformType(userAgent: string, isWebOS: boolean): PlatformType {
  // WebOS tem precedência
  if (isWebOS) return 'webos'

  const ua = userAgent.toLowerCase()

  if (ua.includes('iphone') || ua.includes('ipod') || ua.includes('ipad')) return 'ios'
  if (ua.includes('android')) return 'android'
  if (ua.includes('win') || ua.includes('mac') || ua.includes('linux')) return 'desktop'

  return 'unknown'
}

/**
 * Obtém informações completas da plataforma
 * Pode ser chamado no cliente ou servidor (com fallback)
 */
export function getPlatformInfo(): PlatformInfo {
  // Fallback para SSR
  if (typeof window === 'undefined') {
    return {
      type: 'unknown',
      deviceType: 'desktop',
      isWebOS: false,
      isTV: false,
      userAgent: 'SSR',
    }
  }

  const userAgent = navigator.userAgent
  const isWebOS = detectWebOS()
  const deviceType = detectDeviceType(userAgent)
  const platformType = detectPlatformType(userAgent, isWebOS)

  return {
    type: platformType,
    deviceType,
    isWebOS,
    isTV: deviceType === 'tv' || platformType === 'webos',
    webOSVersion: isWebOS ? getWebOSVersion() : undefined,
    userAgent,
  }
}

/**
 * Verifica se é WebOS (helper simples)
 */
export function isWebOS(): boolean {
  if (typeof window === 'undefined') return false
  return detectWebOS()
}

/**
 * Verifica se é TV (qualquer plataforma)
 */
export function isTV(): boolean {
  if (typeof window === 'undefined') return false
  const info = getPlatformInfo()
  return info.isTV
}

/**
 * Verifica se é mobile (iOS ou Android)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  const info = getPlatformInfo()
  return info.type === 'ios' || info.type === 'android'
}

/**
 * Verifica se é desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return true
  const info = getPlatformInfo()
  return info.deviceType === 'desktop'
}

/**
 * Obtém versão mínima requerida do WebOS
 * Retorna undefined se não estiver em WebOS
 */
export function requireWebOSVersion(minVersion: string): boolean {
  if (typeof window === 'undefined') return false
  const info = getPlatformInfo()
  if (!info.isWebOS || !info.webOSVersion) return false

  try {
    const current = info.webOSVersion.split('.').map(Number)
    const required = minVersion.split('.').map(Number)

    for (let i = 0; i < Math.max(current.length, required.length); i++) {
      const c = current[i] || 0
      const r = required[i] || 0
      if (c > r) return true
      if (c < r) return false
    }
    return true
  } catch (error) {
    console.warn('Erro ao comparar versões WebOS:', error)
    return false
  }
}

/**
 * Executa callback somente em plataforma específica
 * Útil para lógica condicional
 */
export function onPlatform(
  platform: PlatformType | PlatformType[],
  callback: () => void
): void {
  if (typeof window === 'undefined') return

  const info = getPlatformInfo()
  const platforms = Array.isArray(platform) ? platform : [platform]

  if (platforms.includes(info.type)) {
    callback()
  }
}

/**
 * Executa callback somente em device type específico
 */
export function onDeviceType(
  deviceType: DeviceType | DeviceType[],
  callback: () => void
): void {
  if (typeof window === 'undefined') return

  const info = getPlatformInfo()
  const types = Array.isArray(deviceType) ? deviceType : [deviceType]

  if (types.includes(info.deviceType)) {
    callback()
  }
}
