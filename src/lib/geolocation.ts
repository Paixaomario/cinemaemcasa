/**
 * Geolocation Module
 * Real-time location-based content suggestions with intelligent fallback
 * Works offline with cached location data
 * 
 * Features:
 * - Real-time geolocation (with user permission)
 * - Country/timezone-based fallback
 * - Regional content recommendations
 * - Offline support with cached location
 * - Privacy-first approach (no tracking, only suggestions)
 */

import { createClient } from './supabase'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  country?: string
  timezone?: string
  timestamp: number
}

export interface LocationSuggestion {
  id: string
  title: string
  description: string
  type: 'regional' | 'trending-in-region' | 'local-premiere'
  icon: string
  region: string
}

interface GeolocationConfig {
  enableRealtime: boolean
  timeoutMs: number
  maxLocationAge: number // ms
  fallbackToTimezone: boolean
  storagePrefix: string
}

const DEFAULT_CONFIG: GeolocationConfig = {
  enableRealtime: true,
  timeoutMs: 10000,
  maxLocationAge: 30 * 60 * 1000, // 30 minutos
  fallbackToTimezone: true,
  storagePrefix: 'cinema_location_'
}

const REGIONS = {
  BR: { name: 'Brasil', timezone: 'America/Sao_Paulo', defaultCategory: 'Drama' },
  US: { name: 'United States', timezone: 'America/New_York', defaultCategory: 'Ação' },
  MX: { name: 'México', timezone: 'America/Mexico_City', defaultCategory: 'Ação' },
  ES: { name: 'España', timezone: 'Europe/Madrid', defaultCategory: 'Drama' },
  PT: { name: 'Portugal', timezone: 'Europe/Lisbon', defaultCategory: 'Drama' },
  AR: { name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', defaultCategory: 'Drama' },
  FR: { name: 'France', timezone: 'Europe/Paris', defaultCategory: 'Drama' },
  DE: { name: 'Germany', timezone: 'Europe/Berlin', defaultCategory: 'Drama' },
  IT: { name: 'Italia', timezone: 'Europe/Rome', defaultCategory: 'Drama' },
  JP: { name: 'Japan', timezone: 'Asia/Tokyo', defaultCategory: 'Animação' },
  KR: { name: 'Korea', timezone: 'Asia/Seoul', defaultCategory: 'Drama' },
  IN: { name: 'India', timezone: 'Asia/Kolkata', defaultCategory: 'Drama' },
  AU: { name: 'Australia', timezone: 'Australia/Sydney', defaultCategory: 'Ação' },
  GB: { name: 'United Kingdom', timezone: 'Europe/London', defaultCategory: 'Drama' }
}

/**
 * Solicita localização em tempo real do dispositivo
 * Retorna null se usuário negar permissão
 */
export async function getRealtimeLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      resolve(null)
      return
    }

    const timeoutId = setTimeout(() => {
      resolve(null)
    }, DEFAULT_CONFIG.timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId)
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        })
      },
      () => {
        clearTimeout(timeoutId)
        resolve(null)
      },
      {
        timeout: DEFAULT_CONFIG.timeoutMs,
        enableHighAccuracy: false,
        maximumAge: DEFAULT_CONFIG.maxLocationAge
      }
    )
  })
}

/**
 * Detecta país/região baseado em timezone do sistema
 * Funciona offline
 */
export function getTimezoneRegion(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Mapeamento simplificado de timezone para país
    const timezoneMap: { [key: string]: string } = {
      'America/Sao_Paulo': 'BR',
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Anchorage': 'US',
      'America/Mexico_City': 'MX',
      'America/Argentina/Buenos_Aires': 'AR',
      'America/Toronto': 'CA',
      'Europe/Madrid': 'ES',
      'Europe/Lisbon': 'PT',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Rome': 'IT',
      'Europe/London': 'GB',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Shanghai': 'CN',
      'Asia/Kolkata': 'IN',
      'Australia/Sydney': 'AU'
    }

    return timezoneMap[timezone] || 'BR' // Default Brasil
  } catch {
    return 'BR'
  }
}

/**
 * Converte coordenadas para país usando API (com cache)
 */
export async function reverseGeocodeToCountry(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    // Usa OpenStreetMap Nominatim (grátis, open source)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        // Headers mínimos para respeitar ToS
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const countryCode = data.address?.country_code?.toUpperCase()
    
    // Valida se é um código de país conhecido
    return countryCode && REGIONS[countryCode as keyof typeof REGIONS] ? countryCode : null
  } catch (error) {
    console.warn('Reverse geocoding failed:', error)
    return null
  }
}

/**
 * Obtém dados de localização com fallback automático
 * Priority: Realtime GPS → Reverse Geocode → Timezone → Browser LocalStorage
 */
export async function getLocationWithFallback(): Promise<{
  region: string
  source: 'realtime' | 'reverse-geocode' | 'timezone' | 'cache'
  country?: string
  accuracy?: number
}> {
  // 1. Verificar cache local
  try {
    const cached = localStorage.getItem(`${DEFAULT_CONFIG.storagePrefix}latest`)
    if (cached) {
      const data = JSON.parse(cached)
      if (Date.now() - data.timestamp < DEFAULT_CONFIG.maxLocationAge) {
        return {
          region: data.region,
          source: 'cache',
          country: data.country,
          accuracy: data.accuracy
        }
      }
    }
  } catch {
    // Cache inválido, continua
  }

  // 2. Tentar geolocalização em tempo real
  const location = await getRealtimeLocation()
  if (location) {
    const country = await reverseGeocodeToCountry(location.latitude, location.latitude)
    const region = country || getTimezoneRegion()

    // Cachear resultado
    localStorage.setItem(
      `${DEFAULT_CONFIG.storagePrefix}latest`,
      JSON.stringify({ ...location, region, country })
    )

    return {
      region,
      source: country ? 'reverse-geocode' : 'timezone',
      country: country || undefined,
      accuracy: location.accuracy
    }
  }

  // 3. Fallback para timezone
  const timezoneRegion = getTimezoneRegion()
  localStorage.setItem(
    `${DEFAULT_CONFIG.storagePrefix}latest`,
    JSON.stringify({
      timestamp: Date.now(),
      region: timezoneRegion
    })
  )

  return {
    region: timezoneRegion,
    source: 'timezone'
  }
}

/**
 * Obtém sugestões de conteúdo baseadas em localização
 */
export async function getLocationBasedSuggestions(
  region: string = 'BR'
): Promise<LocationSuggestion[]> {
  try {
    const sb = createClient()
    const regionData = REGIONS[region as keyof typeof REGIONS] || REGIONS.BR

    // Buscar conteúdo marcado como "trending" ou "new release"
    const { data: trendingContent } = await sb
      .from('cinema')
      .select('id, titulo, category')
      .eq('region_featured', region)
      .order('created_at', { ascending: false })
      .limit(3)

    const suggestions: LocationSuggestion[] = []

    // Adicionar conteúdo em tendência na região
    if (trendingContent) {
      suggestions.push(
        ...trendingContent.map((content: any, idx: number) => ({
          id: `trending-${region}-${content.id}`,
          title: content.titulo,
          description: `Em tendência em ${regionData.name}`,
          type: 'trending-in-region' as const,
          icon: '🔥',
          region
        }))
      )
    }

    // Adicionar categoria padrão da região
    suggestions.push({
      id: `regional-${region}-${regionData.defaultCategory}`,
      title: `Populares em ${regionData.name}`,
      description: regionData.defaultCategory,
      type: 'regional',
      icon: '🌍',
      region
    })

    return suggestions
  } catch (error) {
    console.error('Error fetching location-based suggestions:', error)
    return []
  }
}

/**
 * Monitora mudanças de localização em tempo real
 * Chama callback quando localização muda significativamente (> 1km)
 */
export function watchLocation(
  callback: (location: LocationData) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported')
    return -1
  }

  let lastLocation: LocationData | null = null

  return navigator.geolocation.watchPosition(
    (position) => {
      const newLocation: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      }

      // Só chama callback se moveeu > 1km (aproximadamente)
      if (!lastLocation || hasMoved(lastLocation, newLocation, 1000)) {
        lastLocation = newLocation
        callback(newLocation)
      }
    },
    errorCallback,
    {
      enableHighAccuracy: false,
      timeout: DEFAULT_CONFIG.timeoutMs,
      maximumAge: DEFAULT_CONFIG.maxLocationAge
    }
  )
}

/**
 * Para monitoramento de localização
 */
export function stopWatchingLocation(watchId: number) {
  if (watchId >= 0) {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Calcula se usuário se moveu mais do que distanceMeters
 * Usa aproximação de Haversine
 */
function hasMoved(
  from: LocationData,
  to: LocationData,
  distanceMeters: number = 1000
): boolean {
  const R = 6371000 // Raio da Terra em metros
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180
  const dLon = ((to.latitude - from.latitude) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.asin(Math.sqrt(a))
  const distance = R * c

  return distance > distanceMeters
}

/**
 * Obtém região formatada para exibição
 */
export function getRegionDisplay(region: string): string {
  const regionData = REGIONS[region as keyof typeof REGIONS]
  return regionData ? regionData.name : region
}

/**
 * Limpa cache de localização (para testes ou reset)
 */
export function clearLocationCache() {
  try {
    localStorage.removeItem(`${DEFAULT_CONFIG.storagePrefix}latest`)
  } catch {
    // Ignorar erro if localStorage não disponível
  }
}
