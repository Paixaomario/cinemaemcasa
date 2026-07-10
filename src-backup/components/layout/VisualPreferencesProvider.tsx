'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './SupabaseProvider'
import { getVisualPreferences, VisualPreferences } from '@/lib/visualPreferences'

const VisualPreferencesContext = createContext<{
  prefs: VisualPreferences | null
  setPrefs: (p: VisualPreferences) => void
} | undefined>(undefined)

export function VisualPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<VisualPreferences | null>(null)

  useEffect(() => {
    if (user) {
      getVisualPreferences(user.id).then(setPrefs)
    }
  }, [user])

  useEffect(() => {
    if (prefs) {
      const root = document.documentElement
      // Aplica a cor de destaque em variáveis CSS para uso global
      root.style.setProperty('--brand-cyan', prefs.accent_color)
      root.style.setProperty('--media-brand', prefs.accent_color)
      root.style.setProperty('--media-focus-ring-color', prefs.accent_color)
      
      // Controle de Blur Moderno
      if (prefs.background_blur) {
        root.classList.add('enable-blur')
      } else {
        root.classList.remove('enable-blur')
      }

      // Atributos de dados para seletores CSS (Theme e Card Style)
      root.setAttribute('data-theme', prefs.theme)
      root.setAttribute('data-card-style', prefs.card_style)
    }
  }, [prefs])

  return (
    <VisualPreferencesContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </VisualPreferencesContext.Provider>
  )
}

export const useVisualPreferences = () => {
  const context = useContext(VisualPreferencesContext)
  if (!context) throw new Error('useVisualPreferences deve ser usado dentro de VisualPreferencesProvider')
  return context
}