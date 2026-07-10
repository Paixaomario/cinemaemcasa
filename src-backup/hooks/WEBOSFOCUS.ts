// src/hooks/useWebOSFocus.ts
// Hook para navegação com controle remoto LG WebOS

import { useEffect, useRef } from 'react'

interface FocusableElement {
  element: HTMLElement
  focusable: boolean
}

export function useWebOSFocus() {
  const focusableRefs = useRef<FocusableElement[]>([])
  const currentFocusIndex = useRef(0)

  useEffect(() => {
    // Recolher todos os elementos focáveis
    const focusableElements = document.querySelectorAll(
      'button, a, [tabindex]:not([tabindex="-1"]), input:not([type="hidden"])'
    )

    focusableRefs.current = Array.from(focusableElements).map(el => ({
      element: el as HTMLElement,
      focusable: true
    }))

    // Handler para setas do controle remoto
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e

      // Seta para baixo
      if (key === 'ArrowDown' || key === 'Enter') {
        e.preventDefault()
        moveFocus(1)
      }

      // Seta para cima
      if (key === 'ArrowUp') {
        e.preventDefault()
        moveFocus(-1)
      }

      // Seta para direita
      if (key === 'ArrowRight') {
        e.preventDefault()
        // Move para próximo item em grid (3 colunas)
        moveFocus(3)
      }

      // Seta para esquerda
      if (key === 'ArrowLeft') {
        e.preventDefault()
        // Move para item anterior em grid
        moveFocus(-3)
      }

      // Enter/OK para ativar
      if (key === 'Enter') {
        e.preventDefault()
        const current = focusableRefs.current[currentFocusIndex.current]
        if (current) {
          current.element.click()
        }
      }
    }

    // Adicionar listener
    document.addEventListener('keydown', handleKeyDown)

    // Focar primeiro elemento
    if (focusableRefs.current.length > 0) {
      focusableRefs.current[0].element.focus()
      focusableRefs.current[0].element.classList.add('focused')
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function moveFocus(direction: number) {
    // Remove foco atual
    const current = focusableRefs.current[currentFocusIndex.current]
    if (current) {
      current.element.blur()
      current.element.classList.remove('focused')
    }

    // Calcula novo índice
    let newIndex = currentFocusIndex.current + direction
    
    // Wrap around
    if (newIndex < 0) {
      newIndex = focusableRefs.current.length - 1
    } else if (newIndex >= focusableRefs.current.length) {
      newIndex = 0
    }

    currentFocusIndex.current = newIndex

    // Aplica novo foco
    const next = focusableRefs.current[newIndex]
    if (next) {
      next.element.focus()
      next.element.classList.add('focused')
      
      // Scroll para elemento se necessário
      next.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  return {
    moveFocus,
    currentFocusIndex: currentFocusIndex.current
  }
}

// ✅ USE NO SEU LAYOUT OU HOME PAGE:
// 
// const { moveFocus } = useWebOSFocus()
// 
// E adicione este CSS no globals.css:
// 
// /* Estilo de foco para WebOS */
// *:focus {
//   outline: 3px solid #FFD700;
//   outline-offset: 2px;
// }
// 
// .focused {
//   outline: 3px solid #FFD700;
//   outline-offset: 2px;
//   transform: scale(1.05);
//   transition: all 200ms ease-in-out;
// }
// 
// /* Cartão de filme/série */
// [role="button"],
// button,
// a {
//   cursor: pointer;
//   transition: all 200ms ease-in-out;
// }
// 
// [role="button"]:focus,
// button:focus,
// a:focus {
//   transform: scale(1.05);
//   box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
// }
