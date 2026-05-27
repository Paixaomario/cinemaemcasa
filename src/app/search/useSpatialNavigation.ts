'use client'
import { useEffect } from 'react'

/**
 * Hook para habilitar navegação por setas (D-Pad) em Smart TVs
 * Centraliza a lógica para todas as telas do sistema PaixãoFlix
 */
export function useSpatialNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Mapeamento de teclas WebOS / Samsung / Common
      const key = e.key || e.keyCode
      
      // Lógica de navegação espacial baseada em foco nativo do navegador.
      // O navegador lidará com o movimento do foco entre elementos com tabIndex="0".
      
      // Tratamento especial para o botão "Voltar" (Back) do controle remoto LG (WebOS: 461)
      if (e.keyCode === 461 || e.key === 'Backspace') {
        const isInputActive = document.activeElement?.tagName === 'INPUT' || 
                             document.activeElement?.tagName === 'TEXTAREA'
        
        // Se não estiver digitando em um input, volta para a página anterior
        if (!isInputActive) {
          const isRoot = window.location.pathname === '/home' || window.location.pathname === '/'
          
          if (!isRoot) {
            e.preventDefault()
            window.history.back()
          } else {
            // Se estiver na Home e apertar voltar, exibe confirmação nativa (se disponível no WebOS)
            const confirmExit = window.confirm("Deseja sair do PaixãoFlix?")
            if (confirmExit && (window as any).webOS) {
              (window as any).webOS.terminate()
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}