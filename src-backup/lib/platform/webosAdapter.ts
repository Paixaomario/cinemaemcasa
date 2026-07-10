/**
 * Adaptador WebOS
 * Interface com a API nativa do LG WebOS
 * Implementação segura com fallback para web comum
 */

import { isWebOS } from './platformDetect'

export interface WebOSAppInfo {
  appId: string
  version: string
  subtitle?: string
}

export interface WebOSDevice {
  modelName?: string
  firmwareVersion?: string
  osVersion?: string
}

/**
 * Acesso seguro à API WebOS
 * Retorna null se WebOS não estiver disponível
 */
function getWebOSAPI() {
  if (!isWebOS() || typeof window === 'undefined') {
    return null
  }

  try {
    return (window as any).webOS
  } catch (error) {
    console.warn('Erro ao acessar WebOS API:', error)
    return null
  }
}

/**
 * Informações da aplicação
 */
export async function getAppInfo(): Promise<WebOSAppInfo | null> {
  const webOS = getWebOSAPI()
  if (!webOS) return null

  try {
    // webOS 3.0+
    if (typeof webOS.app?.getCurrentAppInfo === 'function') {
      return webOS.app.getCurrentAppInfo()
    }

    return null
  } catch (error) {
    console.warn('Erro ao obter app info:', error)
    return null
  }
}

/**
 * Informações do dispositivo
 */
export async function getDeviceInfo(): Promise<WebOSDevice | null> {
  const webOS = getWebOSAPI()
  if (!webOS) return null

  try {
    // webOS 3.0+ system info
    if (typeof webOS.systemInfo === 'function') {
      const info = webOS.systemInfo()
      return {
        modelName: info.modelName,
        firmwareVersion: info.firmwareVersion,
        osVersion: info.version,
      }
    }

    // Fallback: systemModel
    if (typeof webOS.systemModel === 'function') {
      const model = webOS.systemModel()
      return {
        modelName: model.model,
        firmwareVersion: model.version,
      }
    }

    return null
  } catch (error) {
    console.warn('Erro ao obter device info:', error)
    return null
  }
}

/**
 * Acessa armazenamento privado do app
 * WebOS fornece espaço isolado por aplicação
 */
export async function getAppStoragePath(): Promise<string | null> {
  const webOS = getWebOSAPI()
  if (!webOS) return null

  try {
    if (typeof webOS.app?.getAppBasePath === 'function') {
      return webOS.app.getAppBasePath()
    }

    // Fallback para localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return 'localStorage'
    }

    return null
  } catch (error) {
    console.warn('Erro ao obter caminho de armazenamento:', error)
    return null
  }
}

/**
 * Termina aplicação (com confirmação no browser)
 */
export function closeApp(): void {
  const webOS = getWebOSAPI()

  if (webOS && typeof webOS.app?.close === 'function') {
    // WebOS: fecha app diretamente
    webOS.app.close()
  } else if (typeof window !== 'undefined') {
    // Browser: pede confirmação
    if (window.confirm('Deseja sair do PaixãoFlix?')) {
      window.close()
    }
  }
}

/**
 * Abre URL em navegador nativo
 * Alguns WebOS podem usar browser nativo em vez de WebView
 */
export function openURL(url: string): boolean {
  const webOS = getWebOSAPI()

  try {
    if (webOS && typeof webOS.platform?.open === 'function') {
      webOS.platform.open(url)
      return true
    }

    // Fallback: window.open
    if (typeof window !== 'undefined') {
      window.open(url, '_blank')
      return true
    }

    return false
  } catch (error) {
    console.warn('Erro ao abrir URL:', error)
    return false
  }
}

/**
 * Request modo fullscreen
 */
export function requestFullscreen(): void {
  try {
    const elem = document.documentElement

    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen()
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen()
    }
  } catch (error) {
    console.warn('Erro ao solicitar fullscreen:', error)
  }
}

/**
 * Exit fullscreen
 */
export function exitFullscreen(): void {
  try {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else if ((document as any).webkitFullscreenElement) {
      (document as any).webkitExitFullscreen?.()
    } else if ((document as any).mozFullScreenElement) {
      (document as any).mozCancelFullScreen?.()
    }
  } catch (error) {
    console.warn('Erro ao sair de fullscreen:', error)
  }
}

/**
 * Registra intent para receber notificações/atalhos do sistema
 * Necessário para funcionar com notificações push
 */
export function registerNotificationIntent(): boolean {
  const webOS = getWebOSAPI()
  if (!webOS) return false

  try {
    // webOS 4.0+: Permite receber notificações do sistema
    if (typeof (webOS as any).service?.request === 'function') {
      (webOS as any).service.request('luna://com.webos.notification', {
        method: 'createAlert',
        parameters: {
          text: 'PaixãoFlix ativado para notificações',
        },
      })
      return true
    }

    return false
  } catch (error) {
    console.warn('Erro ao registrar intent de notificação:', error)
    return false
  }
}

/**
 * Obtém chave de dispositivo único
 * Usado para sincronizar entre dispositivos
 */
export async function getDeviceKey(): Promise<string | null> {
  try {
    // Tenta usar WebOS device ID
    const webOS = getWebOSAPI()
    if (webOS && typeof (webOS as any).deviceId === 'string') {
      return (webOS as any).deviceId
    }

    // Fallback: gera baseado em características do device
    if (typeof navigator !== 'undefined') {
      const data = `${navigator.userAgent}${screen.width}x${screen.height}`
      const hash = await generateHash(data)
      return hash
    }

    return null
  } catch (error) {
    console.warn('Erro ao obter device key:', error)
    return null
  }
}

/**
 * Gerando hash simples para device key
 */
async function generateHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    // Fallback simples
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }
}

/**
 * Ativa modo de economia de energia
 * Útil para TVs antigas ou com pouca RAM
 */
export function activatePowerSavingMode(): boolean {
  const webOS = getWebOSAPI()
  if (!webOS) return false

  try {
    // Reduz frame rate
    if (typeof (webOS as any).platform?.setDisplayFrameRate === 'function') {
      (webOS as any).platform.setDisplayFrameRate(30) // 30fps em vez de 60fps
      return true
    }

    return false
  } catch (error) {
    console.warn('Erro ao ativar modo economia de energia:', error)
    return false
  }
}

/**
 * Monitora mudanças de estado do app
 */
export function onAppStateChange(callback: (state: 'foreground' | 'background') => void): (() => void) | null {
  const webOS = getWebOSAPI()
  if (!webOS) {
    // Fallback: usa visibilitychange do browser
    const handleVisibilityChange = () => {
      callback(document.hidden ? 'background' : 'foreground')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  try {
    // webOS 4.0+
    if (typeof (webOS as any).platform?.onAppStateChange === 'function') {
      (webOS as any).platform.onAppStateChange((state: { appId: string; state: string }) => {
        callback(state.state === 'foreground' ? 'foreground' : 'background')
      })

      return () => {
        // Unsubscribe se necessário
      }
    }

    return null
  } catch (error) {
    console.warn('Erro ao monitorar estado do app:', error)
    return null
  }
}

/**
 * Obtém informações de rede do dispositivo
 */
export async function getNetworkInfo(): Promise<{ connected: boolean; type: 'wifi' | 'ethernet' | 'unknown' } | null> {
  try {
    // Navigator API padrão
    if ('connection' in navigator) {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (conn) {
        return {
          connected: navigator.onLine,
          type: conn.effectiveType || 'unknown',
        }
      }
    }

    // Fallback: apenas status online
    return {
      connected: navigator.onLine,
      type: 'unknown',
    }
  } catch (error) {
    console.warn('Erro ao obter informações de rede:', error)
    return null
  }
}
