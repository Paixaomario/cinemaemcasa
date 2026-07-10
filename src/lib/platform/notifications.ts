import { supabase } from '@/lib/supabase'

// Resto do código...
export async function requestPushPermission(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      await syncSubscriptionWithServer(subscription)
    }
  } catch (error) {
    console.error('[Push] Erro:', error)
  }
}

async function syncSubscriptionWithServer(subscription: PushSubscription): Promise<void> {
  try {
    const sb = supabase
    console.log('[Push] Sincronizando com servidor...')
  } catch (error) {
    console.error('[Push] Erro ao sincronizar:', error)
  }
}

export interface PushNotification {
  id?: string
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
}
