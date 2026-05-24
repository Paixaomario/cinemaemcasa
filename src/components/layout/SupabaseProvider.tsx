'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface Ctx {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthCtx = createContext<Ctx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthCtx)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Lógica de Navegação Espacial para Smart TVs e Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e
      const selectors = 'a, button, input, select, textarea, [tabindex="0"]'
      const focusable = Array.from(document.querySelectorAll(selectors)).filter(el => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0
      }) as HTMLElement[]
      
      const active = document.activeElement as HTMLElement

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) return

      // Se nada estiver focado, foca no primeiro elemento disponível
      if (!active || active === document.body) {
        if (focusable.length > 0) focusable[0].focus()
        return
      }

      if (key === 'Enter') return // Enter nativo funciona em links/botões

      e.preventDefault()
      const activeRect = active.getBoundingClientRect()

      const getDistance = (a: DOMRect, b: DOMRect, dir: string) => {
        const aC = { x: a.left + a.width / 2, y: a.top + a.height / 2 }
        const bC = { x: b.left + b.width / 2, y: b.top + b.height / 2 }

        // Penalidade para desalinhamento (prioriza elementos retos na direção)
        const mult = 2 
        if (dir === 'ArrowRight') return (b.left - activeRect.right) + Math.abs(bC.y - aC.y) * mult
        if (dir === 'ArrowLeft') return (activeRect.left - b.right) + Math.abs(bC.y - aC.y) * mult
        if (dir === 'ArrowDown') return (b.top - activeRect.bottom) + Math.abs(bC.x - aC.x) * mult
        if (dir === 'ArrowUp') return (activeRect.top - b.bottom) + Math.abs(bC.x - aC.x) * mult
        return Infinity
      }

      let nearest: HTMLElement | null = null
      let minDist = Infinity

      focusable.forEach(el => {
        if (el === active) return
        const r = el.getBoundingClientRect()

        // Filtra apenas elementos que estão na direção correta
        if (key === 'ArrowRight' && r.left < activeRect.right - 1) return
        if (key === 'ArrowLeft' && r.right > activeRect.left + 1) return
        if (key === 'ArrowDown' && r.top < activeRect.bottom - 1) return
        if (key === 'ArrowUp' && r.bottom > activeRect.top + 1) return

        const d = getDistance(activeRect, r, key)
        if (d < minDist) {
          minDist = d
          nearest = el
        }
      })

      if (nearest) {
        const targetElement = nearest as HTMLElement
        targetElement.focus()
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const signOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
  }

  return (
    <AuthCtx.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}
