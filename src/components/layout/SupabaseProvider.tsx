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
      // Desabilita lógica de setas se estiver em campos de texto (Celular/Tablet)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

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

      let nearest: HTMLElement | null = null
      const isInSidebar = !!active.closest('aside')

      if (key === 'ArrowRight') {
        const toRight = focusable.filter(el => {
          const r = el.getBoundingClientRect()
          return r.left >= activeRect.right - 1 && Math.abs(r.top - activeRect.top) < 50
        })
        if (toRight.length > 0) {
          nearest = toRight.reduce((prev, curr) => 
            curr.getBoundingClientRect().left < prev.getBoundingClientRect().left ? curr : prev
          )
        } else if (!isInSidebar) {
          // Wrap around: se chegou no fim da linha, volta para a primeira coluna da mesma linha
          const rowElements = focusable.filter(el => !el.closest('aside') && Math.abs(el.getBoundingClientRect().top - activeRect.top) < 50)
          if (rowElements.length > 0) {
            nearest = rowElements.reduce((prev, curr) => 
              curr.getBoundingClientRect().left < prev.getBoundingClientRect().left ? curr : prev
            )
          }
        }
      } else if (key === 'ArrowLeft') {
        const toLeft = focusable.filter(el => {
          const r = el.getBoundingClientRect()
          return r.right <= activeRect.left + 1 && Math.abs(r.top - activeRect.top) < 50
        })
        if (toLeft.length > 0) {
          nearest = toLeft.reduce((prev, curr) => 
            curr.getBoundingClientRect().right > prev.getBoundingClientRect().right ? curr : prev
          )
        } else if (!isInSidebar) {
          // Na borda esquerda, move o foco diretamente para o menu "Início" na Sidebar
          nearest = focusable.find(el => {
            const href = el.getAttribute('href')
            return href === '/' && el.closest('aside')
          }) as HTMLElement || null
        }
      } else if (key === 'ArrowDown') {
        const below = focusable.filter(el => el.getBoundingClientRect().top >= activeRect.bottom - 1)
        if (below.length > 0) {
          const minTop = Math.min(...below.map(el => el.getBoundingClientRect().top))
          const nextRow = below.filter(el => Math.abs(el.getBoundingClientRect().top - minTop) < 50)
          
          if (isInSidebar) {
            nearest = nextRow.find(el => el.closest('aside')) || nextRow[0]
          } else {
            // Sempre foca na primeira coluna (extrema esquerda) da próxima linha
            nearest = nextRow.reduce((prev, curr) => 
              curr.getBoundingClientRect().left < prev.getBoundingClientRect().left ? curr : prev
            )
          }
        }
      } else if (key === 'ArrowUp') {
        const above = focusable.filter(el => el.getBoundingClientRect().bottom <= activeRect.top + 1)
        if (above.length > 0) {
          const maxBottom = Math.max(...above.map(el => el.getBoundingClientRect().bottom))
          const prevRow = above.filter(el => Math.abs(el.getBoundingClientRect().bottom - maxBottom) < 50)
          
          if (isInSidebar) {
            nearest = prevRow.find(el => el.closest('aside')) || prevRow[0]
          } else {
            // Sempre foca na primeira coluna (extrema esquerda) da linha acima
            nearest = prevRow.reduce((prev, curr) => 
              curr.getBoundingClientRect().left < prev.getBoundingClientRect().left ? curr : prev
            )
          }
        }
      }

      if (nearest) {
        const targetElement = nearest as HTMLElement
        targetElement.focus()
        // Algumas TVs antigas não suportam smooth behavior, adicionamos fallback
        try { targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch(e) { targetElement.scrollIntoView(false); }
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
