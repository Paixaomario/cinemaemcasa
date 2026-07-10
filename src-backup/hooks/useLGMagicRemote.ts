'use client'
import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook para suporte completo ao LG Magic Remote
 * Implementa scroll, gestures e funcionalidades específicas do Magic Remote
 */
export function useLGMagicRemote() {
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const lastTouchY = useRef(0)
  const isScrolling = useRef(false)
  const scrollVelocity = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  // Detecta se está rodando em LG WebOS
  const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

  // Configura scroll com Magic Remote (pointing device)
  useEffect(() => {
    if (!isWebOS) return

    const handleScroll = (e: WheelEvent) => {
      const container = scrollContainerRef.current || document.body
      if (!container) return

      // Aumenta a velocidade do scroll para Magic Remote
      const scrollAmount = e.deltaY * 2
      container.scrollTop += scrollAmount

      // Detecta velocidade do scroll para gestures
      scrollVelocity.current = Math.abs(e.deltaY)
      
      // Reseta a velocidade após um período de inatividade
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
      scrollTimeout.current = setTimeout(() => {
        scrollVelocity.current = 0
      }, 100)
    }

    // Adiciona listener de scroll
    window.addEventListener('wheel', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [isWebOS])

  // Implementa gestures do Magic Remote (swipe)
  useEffect(() => {
    if (!isWebOS) return

    let touchStartY = 0
    let touchStartX = 0
    let touchEndY = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0].screenY
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].screenY
      touchEndX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaY = touchEndY - touchStartY
      const deltaX = touchEndX - touchStartX
      const minSwipeDistance = 50

      // Swipe vertical
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > minSwipeDistance) {
          // Swipe down
          document.dispatchEvent(new CustomEvent('magicremote:swipedown'))
        } else if (deltaY < -minSwipeDistance) {
          // Swipe up
          document.dispatchEvent(new CustomEvent('magicremote:swipeup'))
        }
      }
      // Swipe horizontal
      else {
        if (deltaX > minSwipeDistance) {
          // Swipe right
          document.dispatchEvent(new CustomEvent('magicremote:swiperight'))
        } else if (deltaX < -minSwipeDistance) {
          // Swipe left
          document.dispatchEvent(new CustomEvent('magicremote:swipeleft'))
        }
      }
    }

    // Adiciona listeners de touch
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isWebOS])

  // Implementa suporte ao botão OK do Magic Remote
  useEffect(() => {
    if (!isWebOS) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Código 13 é Enter/OK no Magic Remote
      if (e.keyCode === 13) {
        const activeElement = document.activeElement as HTMLElement
        
        // Se o elemento focado for clicável, simula o click
        if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A' || activeElement.getAttribute('role') === 'button')) {
          activeElement.click()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isWebOS])

  // Implementa suporte ao botão de voz do Magic Remote
  useEffect(() => {
    if (!isWebOS) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Código 405 é o botão de voz no Magic Remote
      if (e.keyCode === 405) {
        document.dispatchEvent(new CustomEvent('magicremote:voice'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isWebOS])

  // Implementa suporte ao botão Home do Magic Remote
  useEffect(() => {
    if (!isWebOS) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Código 461 é o botão Home no Magic Remote
      if (e.keyCode === 461) {
        document.dispatchEvent(new CustomEvent('magicremote:home'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isWebOS])

  // Função para definir o container de scroll
  const setScrollContainer = useCallback((element: HTMLElement | null) => {
    scrollContainerRef.current = element
  }, [])

  // Função para detectar se está usando Magic Remote
  const isUsingMagicRemote = useCallback(() => {
    return isWebOS
  }, [isWebOS])

  return {
    setScrollContainer,
    isUsingMagicRemote,
    scrollVelocity: scrollVelocity.current
  }
}
