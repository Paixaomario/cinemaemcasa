'use client'
import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
const ROW_TOLERANCE = 150
const COLUMN_TOLERANCE = 200

type Direction = 'up' | 'down' | 'left' | 'right'

function getSpatialGroup(element: HTMLElement | null) {
  return element?.getAttribute('data-spatial-group') || 'default'
}

function getFocusableElements() {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    const tabIndex = el.getAttribute('tabindex')
    return (
      el.tabIndex !== -1 &&
      !el.hasAttribute('disabled') &&
      (el.offsetParent !== null || el === document.body) &&
      (tabIndex === null || tabIndex !== '-1') &&
      el.getAttribute('data-spatial-nav') !== 'false'
    )
  })
}

function getScore(activeRect: DOMRect, rect: DOMRect, direction: Direction) {
  const dx = rect.left - activeRect.left
  const dy = rect.top - activeRect.top

  switch (direction) {
    case 'right':
      return dx > 0 ? dx * 5 + Math.abs(dy) * 2 : Number.POSITIVE_INFINITY
    case 'left':
      return dx < 0 ? Math.abs(dx) * 5 + Math.abs(dy) * 2 : Number.POSITIVE_INFINITY
    case 'down':
      return dy > 0 ? dy * 5 + Math.abs(dx) * 2 : Number.POSITIVE_INFINITY
    case 'up':
      return dy < 0 ? Math.abs(dy) * 5 + Math.abs(dx) * 2 : Number.POSITIVE_INFINITY
    default:
      return Number.POSITIVE_INFINITY
  }
}

/**
 * Hook para habilitar navegação por setas (D-Pad) em Smart TVs
 * Centraliza a lógica para todas as telas do sistema PaixãoFlix
 */
export function useSpatialNavigation() {
  useEffect(() => {
    const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target && target.getAttribute('tabindex') === '0') {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }

    const findNextFocusable = (active: HTMLElement | null, direction: Direction) => {
      const allCandidates = getFocusableElements()
      if (!active || active === document.body) {
        return allCandidates[0] || null
      }

      const activeGroup = getSpatialGroup(active)
      const activeRect = active.getBoundingClientRect()
      let best: HTMLElement | null = null
      let bestScore = Number.POSITIVE_INFINITY

      // Special handling for sidebar navigation
      if (activeGroup === 'sidebar') {
        if (direction === 'right') {
          // From sidebar right: go to first content element (top-left)
          const contentElements = allCandidates.filter((c) => getSpatialGroup(c) === 'content')
          if (contentElements.length > 0) {
            // Find the top-left content element
            let topLeft = contentElements[0]
            let minScore = Number.POSITIVE_INFINITY
            for (const candidate of contentElements) {
              const rect = candidate.getBoundingClientRect()
              const score = rect.left + rect.top
              if (score < minScore) {
                minScore = score
                topLeft = candidate
              }
            }
            return topLeft
          }
        }
      }

      // Special handling for first column navigation to left
      if (activeGroup === 'content' && direction === 'left') {
        const sidebarElements = allCandidates.filter((c) => getSpatialGroup(c) === 'sidebar')
        if (sidebarElements.length > 0) {
          // Check if we're in the first column (leftmost content elements)
          const contentElements = allCandidates.filter((c) => getSpatialGroup(c) === 'content')
          const minX = Math.min(...contentElements.map((c) => c.getBoundingClientRect().left))
          if (Math.abs(activeRect.left - minX) < 50) {
            // We're in first column, go to sidebar
            return sidebarElements[0]
          }
        }
      }

      // For content navigation, use row/column tolerance for better grid navigation
      if (activeGroup === 'content') {
        // NOVA LÓGICA: Ao navegar para cima/baixo, focar no primeiro item da linha de destino.
        if (direction === 'up' || direction === 'down') {
          const candidates = allCandidates.filter(c => {
            if (c === active) return false;
            const rect = c.getBoundingClientRect();
            const dy = rect.top - activeRect.top;
            return getSpatialGroup(c) === 'content' && (direction === 'down' ? dy > 20 : dy < -20);
          });

          if (candidates.length === 0) return null;

          // Agrupa os candidatos por linha (usando o valor 'top')
          const rows = new Map<number, HTMLElement[]>();
          candidates.forEach(c => {
            const top = Math.round(c.getBoundingClientRect().top);
            if (!rows.has(top)) rows.set(top, []);
            rows.get(top)?.push(c);
          });

          // Encontra a linha mais próxima na direção desejada
          let closestRowY = direction === 'down' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
          for (const y of rows.keys()) {
            if (direction === 'down' && y < closestRowY) closestRowY = y;
            if (direction === 'up' && y > closestRowY) closestRowY = y;
          }

          const targetRow = rows.get(closestRowY);
          if (!targetRow || targetRow.length === 0) return null;

          // Retorna o primeiro item (o mais à esquerda) da linha de destino
          return targetRow.reduce((first, current) => 
            current.getBoundingClientRect().left < first.getBoundingClientRect().left ? current : first
          );
        }

        // Lógica antiga mantida para navegação esquerda/direita
        const candidates = allCandidates.filter((candidate) => {
          if (candidate === active) return false
          return getSpatialGroup(candidate) === 'content'
        })

        // A lógica para 'up' e 'down' já foi tratada.
        // Aqui, filtramos apenas para navegação horizontal.
        const pool = candidates.filter((candidate) => {
          const rect = candidate.getBoundingClientRect()
          return Math.abs(rect.top - activeRect.top) <= ROW_TOLERANCE
        })

        for (const candidate of pool) {
          const rect = candidate.getBoundingClientRect()
          const dx = rect.left - activeRect.left
          const dy = rect.top - activeRect.top

          const isInDirection =
            (direction === 'right' && dx > 0) ||
            (direction === 'left' && dx < 0)

          if (!isInDirection) continue

          const score = getScore(activeRect, rect, direction)
          if (score < bestScore) {
            bestScore = score
            best = candidate
          }
        }

        return best
      }

      // Default: use all candidates for other groups
      const pool = allCandidates.filter((candidate) => candidate !== active)

      for (const candidate of pool) {
        const rect = candidate.getBoundingClientRect()
        const dx = rect.left - activeRect.left
        const dy = rect.top - activeRect.top

        const isInDirection =
          (direction === 'right' && dx > 0) ||
          (direction === 'left' && dx < 0) ||
          (direction === 'down' && dy > 0) ||
          (direction === 'up' && dy < 0)

        if (!isInDirection) continue

        const score = getScore(activeRect, rect, direction)
        if (score < bestScore) {
          bestScore = score
          best = candidate
        }
      }

      return best
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const key = e.key || String(e.keyCode)
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '37', '38', '39', '40'].includes(key)
      const directionMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        '37': 'left',
        '38': 'up',
        '39': 'right',
        '40': 'down',
      }

      if (isArrowKey) {
        const direction = directionMap[key]
        const next = findNextFocusable(active, direction)
        if (next) {
          e.preventDefault()
          next.focus()
          next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
          return
        }
      }

      if (isWebOS && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        document.body.classList.add('using-keyboard')
        if (!document.activeElement || document.activeElement === document.body) {
          const firstFocusable = document.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
          firstFocusable?.focus()
        }
      }

      if (e.keyCode === 461 || e.keyCode === 10009 || e.key === 'Backspace') {
        const activeElement = document.activeElement
        const isInputActive = activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable)

        if (!isInputActive) {
          e.preventDefault()
          const openModal = document.querySelector('[role="dialog"], .modal-open')

          if (openModal) {
            const isPlayer = !!document.querySelector('.vds-video')
            if (isPlayer) {
              window.history.back()
              return
            }

            const closeButton = openModal.querySelector('button[aria-label*="Fechar"], button[class*="close"], .btn-close') as HTMLElement
            if (closeButton instanceof HTMLElement) {
              closeButton.click()
              return
            }
          }

          const isRoot = window.location.pathname === '/home' || window.location.pathname === '/'
          if (!isRoot) {
            if (window.history.length > 1) {
              window.history.back()
            } else {
              window.location.replace('/home')
            }
          } else {
            const webOS = (window as any).webOS
            if (isWebOS) {
              if (typeof webOS.terminate === 'function') {
                webOS.terminate()
              } else if (webOS.app && typeof webOS.app.close === 'function') {
                webOS.app.close()
              }
            } else if (window.confirm('Deseja sair do PaixãoFlix?')) {
              window.close()
            }
          }
        }
      }

      if (isWebOS) {
        switch (e.keyCode) {
          case 403:
            document.dispatchEvent(new CustomEvent('magicremote:red'))
            break
          case 404:
            document.dispatchEvent(new CustomEvent('magicremote:green'))
            break
          case 405:
            document.dispatchEvent(new CustomEvent('magicremote:yellow'))
            break
          case 406:
            document.dispatchEvent(new CustomEvent('magicremote:blue'))
            break
        }
      }

      if (e.key === 'MediaPlayPause' || e.key === 'MediaPlay' || e.key === 'MediaPause') {
        document.dispatchEvent(new CustomEvent('magicremote:playpause'))
      }
    }

    document.addEventListener('focusin', handleFocus)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocus)
    }
  }, [])
}