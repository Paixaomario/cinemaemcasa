/**
 * Configurações por Plataforma
 * Define comportamentos específicos para cada plataforma
 * Cloud-based: Fácil de atualizar sem redeploy
 */

import { PlatformType, DeviceType } from './platformDetect' // Assumindo que Tizen será adicionado aqui

export interface PlatformConfig {
  // UI/UX
  enableSpatialNavigation: boolean
  enableMagicRemote: boolean
  enableVoiceSearch: boolean
  enableGamepad: boolean

  // Performance
  preloadThreshold: number // px antes do viewport para preload
  imageOptimization: 'aggressive' | 'balanced' | 'minimal'
  networkQuality: 'low' | 'medium' | 'high'

  // Notificações
  notificationsEnabled: boolean
  pushNotificationsEnabled: boolean
  toastDuration: number // ms

  // Vídeo
  videoBufferAhead: number // seconds
  videoAutoPlay: boolean
  videoDefaultQuality: 'auto' | '480p' | '720p' | '1080p' | '4k'
  videoDefaultAudio: string // ex: 'pt-BR'

  // Armazenamento
  useLocalStorage: boolean
  useCacheAPI: boolean
  storageQuota: number // bytes

  // Segurança
  requireHTTPS: boolean
  enableCSP: boolean
  enableSRI: boolean
}

/**
 * Configurações padrão (Web Desktop)
 */
const BASE_CONFIG: PlatformConfig = {
  enableSpatialNavigation: false,
  enableMagicRemote: false,
  enableVoiceSearch: false,
  enableGamepad: false,

  preloadThreshold: 500,
  imageOptimization: 'balanced',
  networkQuality: 'high',

  notificationsEnabled: true,
  pushNotificationsEnabled: true,
  toastDuration: 3000,

  videoBufferAhead: 10,
  videoAutoPlay: true,
  videoDefaultQuality: '1080p',
  videoDefaultAudio: 'pt-BR',

  useLocalStorage: true,
  useCacheAPI: true,
  storageQuota: 50 * 1024 * 1024, // 50MB

  requireHTTPS: true,
  enableCSP: true,
  enableSRI: true,
}

/**
 * Configurações específicas por plataforma
 */
const PLATFORM_CONFIGS: Record<string, Partial<PlatformConfig>> = {
  // LG WebOS - Otimizado para Smart TV
  webos: {
    enableSpatialNavigation: true,
    enableMagicRemote: true,
    enableVoiceSearch: true,
    enableGamepad: true,

    preloadThreshold: 1000,
    imageOptimization: 'aggressive', // TVs têm menos RAM
    networkQuality: 'medium',

    notificationsEnabled: true,
    pushNotificationsEnabled: true,
    toastDuration: 5000, // Mais tempo para ler na TV

    videoBufferAhead: 30, // Mais buffering para conexões instáveis
    videoAutoPlay: true,
    videoDefaultQuality: '720p', // Padrão conservador
    videoDefaultAudio: 'pt-BR',

    useLocalStorage: true,
    useCacheAPI: true,
    storageQuota: 20 * 1024 * 1024, // 20MB (TVs têm menos espaço)

    requireHTTPS: false, // Muitas TVs têm problemas com HTTPS
    enableCSP: true,
    enableSRI: false, // TVs antigas podem ter problemas
  },

  // Samsung Tizen - Otimizado para Smart TV
  tizen: {
    enableSpatialNavigation: true,
    enableMagicRemote: false, // Samsung usa D-Pad padrão
    enableVoiceSearch: true,
    enableGamepad: true,

    preloadThreshold: 800,
    imageOptimization: 'aggressive',
    networkQuality: 'medium',

    notificationsEnabled: true,
    pushNotificationsEnabled: false, // Tizen requer integração específica via Samsung Account
    toastDuration: 4000,

    videoBufferAhead: 45, // Tizen se beneficia de buffers maiores
    videoAutoPlay: true,
    videoDefaultQuality: '720p',

    useLocalStorage: true,
    useCacheAPI: true,
    storageQuota: 15 * 1024 * 1024, // Tizen é mais restrito (15MB)

    requireHTTPS: true,
    enableCSP: true,
    enableSRI: false,
  },

  // Web (browsers comuns)
  web: {
    preloadThreshold: 500,
    imageOptimization: 'balanced',
    networkQuality: 'high',
    videoDefaultQuality: '1080p',
  },

  // Web Desktop
  desktop: {
    preloadThreshold: 500,
    imageOptimization: 'balanced',
    networkQuality: 'high',
    videoDefaultQuality: '1080p',
  },

  // iOS
  ios: {
    enableGamepad: false, // iOS não tem bom suporte a gamepad
    imageOptimization: 'aggressive',
    networkQuality: 'medium',
    videoDefaultQuality: '720p',
    storageQuota: 10 * 1024 * 1024, // iOS tem restrições
  },

  // Android
  android: {
    enableGamepad: true,
    imageOptimization: 'aggressive',
    networkQuality: 'medium',
    videoDefaultQuality: '720p',
    storageQuota: 20 * 1024 * 1024,
  },

  // Outro
  unknown: {
    imageOptimization: 'aggressive',
    networkQuality: 'low',
    videoDefaultQuality: '480p',
  },
}

/**
 * Configurações específicas por device type
 */
const DEVICE_TYPE_CONFIGS: Record<DeviceType, Partial<PlatformConfig>> = {
  tv: {
    enableSpatialNavigation: true,
    enableGamepad: true,
    preloadThreshold: 1000,
    imageOptimization: 'aggressive',
    toastDuration: 5000,
    videoBufferAhead: 30,
  },

  mobile: {
    enableGamepad: false,
    preloadThreshold: 300,
    imageOptimization: 'aggressive',
    networkQuality: 'low',
    videoDefaultQuality: '720p',
    storageQuota: 10 * 1024 * 1024,
  },

  tablet: {
    enableGamepad: true,
    preloadThreshold: 500,
    imageOptimization: 'balanced',
    networkQuality: 'medium',
    videoDefaultQuality: '1080p',
  },

  desktop: {
    preloadThreshold: 500,
    imageOptimization: 'balanced',
    networkQuality: 'high',
  },
}

/**
 * Obtém configuração para plataforma específica
 */
export function getPlatformConfig(platformType: PlatformType, deviceType?: DeviceType): PlatformConfig {
  const config = { ...BASE_CONFIG }

  // Aplica configurações de plataforma
  if (PLATFORM_CONFIGS[platformType]) {
    Object.assign(config, PLATFORM_CONFIGS[platformType])
  }

  // Aplica configurações de tipo de device (tem prioridade)
  if (deviceType && DEVICE_TYPE_CONFIGS[deviceType]) {
    Object.assign(config, DEVICE_TYPE_CONFIGS[deviceType])
  }

  return config
}

/**
 * Verifica se recurso está habilitado
 */
export function isFeatureEnabled(
  feature: keyof PlatformConfig,
  platformType: PlatformType,
  deviceType?: DeviceType
): boolean {
  const config = getPlatformConfig(platformType, deviceType)
  const value = config[feature]

  // Se for boolean
  if (typeof value === 'boolean') {
    return value
  }

  return false
}

/**
 * Obtém valor de configuração
 */
export function getConfigValue<K extends keyof PlatformConfig>(
  key: K,
  platformType: PlatformType,
  deviceType?: DeviceType
): PlatformConfig[K] {
  const config = getPlatformConfig(platformType, deviceType)
  return config[key]
}

/**
 * Atualiza configurações dynamicamente (cloud-based)
 * Permite mudar comportamentos sem redeploy
 */
const CUSTOM_CONFIGS: Map<string, Partial<PlatformConfig>> = new Map()

export function setCustomConfig(key: string, config: Partial<PlatformConfig>) {
  CUSTOM_CONFIGS.set(key, config)
}

export function getCustomConfig(key: string): Partial<PlatformConfig> | null {
  return CUSTOM_CONFIGS.get(key) || null
}

/**
 * Limpa configurações customizadas
 */
export function clearCustomConfig(key?: string) {
  if (key) {
    CUSTOM_CONFIGS.delete(key)
  } else {
    CUSTOM_CONFIGS.clear()
  }
}
