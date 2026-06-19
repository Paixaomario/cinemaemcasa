'use client'
import { useEffect, useState, useCallback } from 'react'

/**
 * Hook para proteger telas OLED (Smart TVs) contra burn-in
 * Escurece a tela após inatividade e implementa pixel shifting para LG WebOS
 */
export function useBurnInProtection(timeoutMinutes: number = 5) {
  const [isScreenDimmed, setIsScreenDimmed] = useState(false)
  const [pixelShiftEnabled, setPixelShiftEnabled] = useState(false)

  // Detecta se está rodando em LG WebOS
  const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

  useEffect(() => {
    let timer: NodeJS.Timeout
    let pixelShiftInterval: NodeJS.Timeout

    const resetTimer = () => {
      document.body.style.opacity = '1'
      document.body.style.transition = 'opacity 0.5s ease'
      setIsScreenDimmed(false)
      clearTimeout(timer)
      timer = setTimeout(() => {
        // Escurece a tela para 20% após inatividade
        if (window.location.pathname !== '/watch' && window.location.pathname !== '/assistir') {
          document.body.style.opacity = '0.2'
          setIsScreenDimmed(true)
        }
      }, timeoutMinutes * 60 * 1000)
    }

    // Pixel shifting para LG WebOS (move pixels levemente para prevenir burn-in)
    const enablePixelShifting = () => {
      if (!isWebOS) return

      let shiftX = 0
      let shiftY = 0
      const shiftAmount = 1 // 1 pixel

      pixelShiftInterval = setInterval(() => {
        shiftX = (shiftX + shiftAmount) % 3 // Cicla entre 0, 1, 2
        shiftY = (shiftY + shiftAmount) % 3

        // Aplica pequeno shift ao body
        document.body.style.transform = `translate(${shiftX}px, ${shiftY}px)`
      }, 30000) // A cada 30 segundos
    }

    // Monitora interações que indicam atividade
    const events = ['keydown', 'mousemove', 'mousedown', 'touchstart']
    const handler = () => resetTimer()

    events.forEach(event => window.addEventListener(event, handler))
    resetTimer()

    // Habilita pixel shifting em LG WebOS
    if (isWebOS) {
      enablePixelShifting()
      setPixelShiftEnabled(true)
    }

    return () => {
      clearTimeout(timer)
      clearInterval(pixelShiftInterval)
      document.body.style.opacity = '1'
      document.body.style.transform = 'none'
      events.forEach(event => window.removeEventListener(event, handler))
    }
  }, [timeoutMinutes, isWebOS])

  // Função para desabilitar temporariamente a proteção (ex: durante vídeo)
  const disableTemporarily = useCallback((durationMs: number = 300000) => {
    document.body.style.opacity = '1'
    setIsScreenDimmed(false)
    
    const timeout = setTimeout(() => {
      // Reabilita após o período
      document.body.style.opacity = '0.2'
      setIsScreenDimmed(true)
    }, durationMs)

    return () => clearTimeout(timeout)
  }, [])

  // Função para ajustar o timeout dinamicamente
  const setTimeoutMinutes = useCallback((minutes: number) => {
    // A implementação seria similar ao useEffect acima
    // Por simplicidade, o usuário pode desmontar e remontar com novo valor
  }, [])

  return {
    isScreenDimmed,
    pixelShiftEnabled,
    disableTemporarily,
    setTimeoutMinutes,
  }
}