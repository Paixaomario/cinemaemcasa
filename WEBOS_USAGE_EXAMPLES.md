/**
 * EXEMPLOS DE USO - WebOS e Notificações Push
 * 
 * Este arquivo mostra como usar as novas funcionalidades
 * em seus componentes React.
 */

// ============================================
// 1. DETECTAR PLATAFORMA
// ============================================

import { isWebOS, isMobile, isTV, getPlatformInfo } from '@/lib/platform/platformDetect'

function MyComponent() {
  if (isWebOS()) {
    return <div>🎬 WebOS TV Detectado!</div>
  }

  if (isMobile()) {
    return <div>📱 Mobile Detectado</div>
  }

  if (isTV()) {
    return <div>📺 Smart TV Detectado</div>
  }

  return <div>💻 Desktop</div>
}

// ============================================
// 2. USAR CONFIGURAÇÕES POR PLATAFORMA
// ============================================

import { getPlatformConfig, isFeatureEnabled } from '@/lib/platform/platformConfig'

function VideoPlayer() {
  const platform = getPlatformInfo()
  const config = getPlatformConfig(platform.type, platform.deviceType)

  // Usa configuração apropriada
  return (
    <video
      src="video.mp4"
      controls={isFeatureEnabled('enableSpatialNavigation', platform.type)}
      autoPlay={config.videoAutoPlay}
      // ... mais props
    />
  )
}

// ============================================
// 3. USAR API WebOS
// ============================================

import { getDeviceInfo, getAppInfo, requestFullscreen } from '@/lib/platform/webosAdapter'

async function SetupWebOS() {
  // Obter informações do device
  const deviceInfo = await getDeviceInfo()
  console.log('TV Model:', deviceInfo?.modelName)
  console.log('WebOS Version:', deviceInfo?.osVersion)

  // Obter info da app
  const appInfo = await getAppInfo()
  console.log('App Version:', appInfo?.version)

  // Solicitar fullscreen
  requestFullscreen()
}

// ============================================
// 4. REGISTRAR NOTIFICAÇÕES PUSH
// ============================================

import { registerPushNotifications, updateNotificationPreferences } from '@/lib/platform/notifications'

function NotificationSetup() {
  const handleEnable = async () => {
    const success = await registerPushNotifications()
    if (success) {
      console.log('✅ Notificações habilitadas!')

      // Salvar preferências
      const userId = 'user-123'
      await updateNotificationPreferences(userId, {
        enableNotifications: true,
        enableNewContent: true,
        enablePersonalRecommendations: true,
        preferredTime: '19:00', // 7 PM UTC
        language: 'pt-BR',
      })
    }
  }

  return <button onClick={handleEnable}>Ativar Notificações</button>
}

// ============================================
// 5. MOSTRAR NOTIFICAÇÕES LOCAIS
// ============================================

import { showLocalNotification } from '@/lib/platform/notifications'

function NotifyNewMovie() {
  const handleNewMovie = () => {
    showLocalNotification({
      id: '1',
      title: '🎬 Novo Filme!',
      body: 'Filme incrível foi adicionado à biblioteca',
      icon: '/logo.png',
      tag: 'new-movie', // Agrupa notificações similares
      data: {
        contentId: 'movie-123',
        action: 'open_content',
      },
    })
  }

  return <button onClick={handleNewMovie}>Testar Notificação</button>
}

// ============================================
// 6. USAR HOOK DE NOTIFICAÇÕES
// ============================================

import { usePushNotifications } from '@/lib/platform/notifications'

function NotificationToggle() {
  const { isEnabled, isLoading, enable, disable } = usePushNotifications()

  return (
    <div>
      <p>Status: {isEnabled ? '✅ Ativado' : '❌ Desativado'}</p>
      <button onClick={isEnabled ? disable : enable} disabled={isLoading}>
        {isLoading ? 'Carregando...' : isEnabled ? 'Desativar' : 'Ativar'}
      </button>
    </div>
  )
}

// ============================================
// 7. NAVEGAÇÃO WebOS SÓ CONTROLE REMOTO
// ============================================

import { useWebOSNavigation } from '@/hooks/useWebOSNavigation'

function NavigationExample() {
  const { focusedRef } = useWebOSNavigation()

  return (
    <div>
      {/* Elementos com tabindex=0 são focáveis */}
      <button tabIndex={0}>Filme 1</button>
      <button tabIndex={0}>Filme 2</button>
      <button tabIndex={0}>Filme 3</button>

      {/* Use D-Pad (setas) para navegar */}
      {/* Use Enter/OK para selecionar */}
      {/* Use Back (←) para voltar */}
    </div>
  )
}

// ============================================
// 8. CONDICIONAL POR PLATAFORMA
// ============================================

import { onPlatform, onDeviceType } from '@/lib/platform/platformDetect'

function AdaptiveUI() {
  // Apenas em WebOS
  onPlatform('webos', () => {
    console.log('Executar algo apenas em WebOS')
  })

  // Apenas em TV (qualquer plataforma)
  onDeviceType('tv', () => {
    console.log('Executar algo em TV')
  })

  // Em múltiplas plataformas
  onPlatform(['webos', 'android'], () => {
    console.log('WebOS ou Android')
  })

  return <div>UI Adaptativa</div>
}

// ============================================
// 9. MONITORAR ESTADO DO APP
// ============================================

import { onAppStateChange } from '@/lib/platform/webosAdapter'

function AppLifecycle() {
  React.useEffect(() => {
    const unsubscribe = onAppStateChange((state) => {
      if (state === 'foreground') {
        console.log('App voltou do background')
        // Resumir reprodução, recarregar dados, etc
      } else {
        console.log('App entrou em background')
        // Pausar vídeo, salvar estado, etc
      }
    })

    return unsubscribe || (() => {})
  }, [])

  return <div>App Lifecycle Handler</div>
}

// ============================================
// 10. EXEMPLO COMPLETO: Página de Perfil
// ============================================

import React from 'react'
import { isWebOS, getPlatformInfo } from '@/lib/platform/platformDetect'
import { usePushNotifications } from '@/lib/platform/notifications'
import { useWebOSNavigation } from '@/hooks/useWebOSNavigation'

export function ProfileExample() {
  const platform = getPlatformInfo()
  const { isEnabled, enable, disable } = usePushNotifications()
  useWebOSNavigation()

  return (
    <div className="profile-container">
      {/* Header adaptativo */}
      <header className={isWebOS() ? 'webos-mode' : 'web-mode'}>
        <h1>Meu Perfil</h1>
        {isWebOS() && <p>📺 Modo WebOS TV</p>}
      </header>

      {/* Seção de Notificações */}
      <section>
        <h2>Notificações</h2>
        <p>Receba alertas sobre novos filmes e séries</p>

        <button
          tabIndex={0}
          onClick={isEnabled ? disable : enable}
          className="btn-toggle-notifications"
        >
          {isEnabled ? '✅ Notificações Ativas' : '❌ Notificações Desativadas'}
        </button>
      </section>

      {/* Informações do device */}
      <section>
        <h2>Seu Dispositivo</h2>
        <p>Plataforma: {platform.type}</p>
        <p>Tipo: {platform.deviceType}</p>
        {platform.isWebOS && <p>WebOS Versão: {platform.webOSVersion}</p>}
      </section>

      {/* Botões focáveis para TV */}
      <div className="button-group">
        <button tabIndex={0}>Editar Perfil</button>
        <button tabIndex={0}>Minhas Listas</button>
        <button tabIndex={0}>Dispositivos</button>
        <button tabIndex={0}>Sobre</button>
      </div>
    </div>
  )
}

// ============================================
// RESUMO DE IMPORTS PRINCIPAIS
// ============================================

export const IMPORTS = `
// Detecção de Plataforma
import { 
  isWebOS, 
  isMobile, 
  isTV, 
  getPlatformInfo,
  onPlatform,
  onDeviceType 
} from '@/lib/platform/platformDetect'

// Configuração por Plataforma
import { 
  getPlatformConfig, 
  isFeatureEnabled,
  getConfigValue 
} from '@/lib/platform/platformConfig'

// API WebOS
import { 
  getDeviceInfo, 
  getAppInfo,
  requestFullscreen,
  onAppStateChange 
} from '@/lib/platform/webosAdapter'

// Notificações Push
import { 
  registerPushNotifications, 
  showLocalNotification,
  updateNotificationPreferences,
  usePushNotifications 
} from '@/lib/platform/notifications'

// Navegação WebOS
import { 
  useWebOSNavigation,
  useFocusableElement 
} from '@/hooks/useWebOSNavigation'
`
