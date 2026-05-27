'use client'
import { useEffect, useState } from 'react'

/**
 * Hook para proteger telas OLED (Smart TVs) contra burn-in
 * Escurece a tela após inatividade
 */
export function useBurnInProtection(timeoutMinutes: number = 5) {
  useEffect(() => {
    let timer: NodeJS.Timeout

    const resetTimer = () => {
      document.body.style.opacity = '1'
      document.body.style.transition = 'opacity 0.5s ease'
      clearTimeout(timer)
      timer = setTimeout(() => {
        // Escurece a tela para 20% após inatividade
        if (window.location.pathname !== '/watch') { // Não escurece se estiver assistindo
          document.body.style.opacity = '0.2'
        }
      }, timeoutMinutes * 60 * 1000)
    }

    // Monitora interações que indicam atividade
    const events = ['keydown', 'mousemove', 'mousedown', 'touchstart']
    events.forEach(event => window.addEventListener(events[0], resetTimer))

    resetTimer()

    return () => {
      clearTimeout(timer)
      document.body.style.opacity = '1'
      events.forEach(event => window.removeEventListener(events[0], resetTimer))
    }
  }, [timeoutMinutes])
}