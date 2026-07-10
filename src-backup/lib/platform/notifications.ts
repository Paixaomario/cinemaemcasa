/**
 * Sistema de Notificações Push para Cinema em Casa
 * Cloud-based: Funciona em todas as plataformas
 * Integrado com Supabase para distribuir notificações
 */

import { createClient } from '@/lib/supabase'
import { isWebOS } from './platformDetect'

export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string // Para agrupar notificações
  action?: string
  data?: Record<string, any>
}

export interface NotificationPreferences {
  userId: string
  enableNotifications: boolean
  enableNewContent: boolean // Novos filmes/séries
  enablePersonalRecommendations: boolean
  enableCinemaEvents: boolean // Eventos especiais
  preferredTime?: string // HH:MM em UTC
  language: 'pt-BR' | 'en' | 'es'
}

/**
 * Registra o navegador para receber notificações push
 * Funciona em todas as plataformas (Web, iOS, Android, WebOS)
 */
export async function registerPushNotifications(): Promise<boolean> {
  try {
    // Verifica suporte a Service Workers e Push API
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications não suportadas neste dispositivo')
      return false
    }

    // Registra Service Worker se ainda não estiver
    const registration = await navigator.serviceWorker.ready

    // Se já tem subscription, retorna true
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await syncSubscriptionWithServer(subscription)
      return true
    }

    // Pede permissão ao usuário
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Permissão de notificação negada')
      return false
    }

    // Obtém chave VAPID pública (deve estar no env)
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.error('VAPID key não configurada. Ver .env.local')
      return false
    }

    // Cria nova subscription
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
    })

    // Sincroniza com servidor
    await syncSubscriptionWithServer(newSubscription)

    return true
  } catch (error) {
    console.error('Erro ao registrar notificações push:', error)
    return false
  }
}

/**
 * Converte VAPID key de Base64 URL para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Sincroniza subscription com servidor (Supabase)
 */
async function syncSubscriptionWithServer(subscription: PushSubscription): Promise<void> {
  try {
    const sb = createClient()

    // Obtém usuário atual
    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      console.warn('Usuário não autenticado, não sincronizando notificações')
      return
    }

    // Salva subscription no banco
    const subscriptionJson = subscription.toJSON()

    await sb
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription_data: subscriptionJson,
        device_type: isWebOS() ? 'webos_tv' : 'web',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
  } catch (error) {
    console.error('Erro ao sincronizar subscription:', error)
    throw error
  }
}

/**
 * Desinscreve de notificações push
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) return

    // Remove do servidor
    const sb = createClient()
    const {
      data: { user },
    } = await sb.auth.getUser()

    if (user) {
      await sb
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
    }

    // Desinscreve do push manager
    await subscription.unsubscribe()
  } catch (error) {
    console.error('Erro ao desinscrever de notificações:', error)
  }
}

/**
 * Atualiza preferências de notificação do usuário
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const sb = createClient()

    await sb
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error)
    throw error
  }
}

/**
 * Obtém preferências de notificação
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const sb = createClient()

    const { data, error } = await sb
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao obter preferências:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar preferências:', error)
    return null
  }
}

/**
 * Mostra notificação local no app
 * Funciona mesmo sem Push API
 */
export function showLocalNotification(data: PushNotification): void {
  try {
    // Tenta via Notification API (padrão web)
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
      })

      notification.onclick = () => {
        window.focus()
        if (data.action) {
          handleNotificationAction(data.action, data.data)
        }
      }
    }

    // WebOS: tenta usar notificação nativa
    if (isWebOS() && typeof (window as any).webOS !== 'undefined') {
      const webOS = (window as any).webOS

      if (typeof webOS.service?.request === 'function') {
        webOS.service.request('luna://com.webos.notification', {
          method: 'createAlert',
          parameters: {
            title: data.title,
            message: data.body,
            buttons: [{ label: 'OK', focus: true }],
          },
        })
      }
    }
  } catch (error) {
    console.error('Erro ao mostrar notificação:', error)
  }
}

/**
 * Manipula ação de notificação
 */
function handleNotificationAction(action: string, data?: Record<string, any>): void {
  try {
    // Navega para conteúdo se houver ID
    if (data?.contentId) {
      window.location.href = `/assistir/${data.contentId}`
    }

    if (action === 'open_app') {
      window.location.href = '/'
    }
  } catch (error) {
    console.error('Erro ao manipular ação:', error)
  }
}

/**
 * Hook para usar sistema de notificações (React)
 * Use em componentes cliente
 */
export function usePushNotifications() {
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsEnabled(!!subscription)
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      }
    }

    checkStatus()
  }, [])

  const enable = async () => {
    setIsLoading(true)
    try {
      const success = await registerPushNotifications()
      setIsEnabled(success)
    } finally {
      setIsLoading(false)
    }
  }

  const disable = async () => {
    setIsLoading(true)
    try {
      await unregisterPushNotifications()
      setIsEnabled(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isEnabled, isLoading, enable, disable }
}

// Necessário para usar React no hook
import React from 'react'
