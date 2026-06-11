'use client'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from './SupabaseProvider'
import { playContent } from '@/lib/navigationHelper'

/**
 * CommandReceiverProvider
 * Escuta comandos remotos (Alexa/Mobile) via Supabase Realtime
 * e executa ações programáticas na TV.
 */
export function CommandReceiverProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!user) return

    // Subscreve em um canal único para o usuário (ex: commands:user_uuid)
    const channel = supabase.channel(`commands:${user.id}`)
      .on('broadcast', { event: 'remote_action' }, (payload) => {
        const { action, content_id } = payload.payload

        console.log('🤖 Comando recebido:', action, content_id)

        switch (action) {
          case 'play_movie':
            if (content_id) {
              // Executa a função de reprodução global
              playContent(router, content_id)
            }
            break
          
          case 'stop':
            // Exemplo: Alexa, parar Cinema em Casa
            window.history.back()
            break
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ TV pronta para receber comandos da Alexa')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, router, supabase])

  return <>{children}</>
}