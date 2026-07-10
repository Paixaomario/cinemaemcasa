/**
 * WebOS-Specific Navigation Hook
 * Otimizado para navegação com controle remoto LG Magic Remote
 * Funciona em qualquer platform via fallback
 */

'use client'
import { useEffect, useRef } from 'react'
import { isWebOS } from '@/lib/platform/platformDetect'

export interface NavigationElement {
  id: string
  element: HTMLElement
  focusable: boolean
}

/**
 * Hook para navegação espacial otimizada
 * Integra com D-Pad do controle remoto
 */
export function useWebOSNavigation() {
  const focusedRef = useRef<HTMLElement | null>(null)
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isWebOSEnv = isWebOS()

      // Impede scroll padrão
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (arrowKeys.includes(e.key)) {
        const elem = document.activeElement
        if (elem?.tagName !== 'INPUT' && elem?.tagName !== 'TEXTAREA') {
          e.preventDefault()
        }
      }

      // Trata botão voltar (Backspace ou chave 461)
      if (e.keyCode === 461 || e.key === 'Backspace') {
        const isInput = 
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'

        if (!isInput) {
          e.preventDefault()
          
          // Primeiro tenta fechar modal se houver
          const modal = document.querySelector('[role="dialog"]')
          if (modal) {
            const closeBtn = modal.querySelector('button[aria-label*="Fechar"], .close-btn')
            if (closeBtn instanceof HTMLElement) {
              closeBtn.click()
              return
            }
          }

          // Se não estiver na home, volta
          if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
            window.history.back()
          } else if (isWebOSEnv) {
            // Na home: termina app se WebOS
            try {
              if (typeof (window as any).webOS?.app?.close === 'function') {
                (window as any).webOS.app.close()
              } else if (typeof (window as any).webOS?.terminate === 'function') {
                (window as any).webOS.terminate()
              }
            } catch (err) {
              console.log('App close error:', err)
            }
          } else {
            // Web: pede confirmação
            if (window.confirm('Deseja sair do PaixãoFlix?')) {
              window.close()
            }
          }
        }
      }

      // Magic Remote: botão de cor vermelho = favorito
      if (e.keyCode === 403) {
        document.dispatchEvent(new CustomEvent('magicremote:red'))
      }

      // Magic Remote: botão de cor verde = play
      if (e.keyCode === 404) {
        document.dispatchEvent(new CustomEvent('magicremote:green'))
      }

      // Magic Remote: botão de cor amarelo = info
      if (e.keyCode === 405) {
        document.dispatchEvent(new CustomEvent('magicremote:yellow'))
      }

      // Magic Remote: botão de cor azul = subtitle
      if (e.keyCode === 406) {
        document.dispatchEvent(new CustomEvent('magicremote:blue'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { focusedRef, elementsRef }
}

/**
 * Registra elemento focável para navegação
 */
export function useFocusableElement(id: string, ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('tabindex', '0')
    }
  }, [ref])
}
