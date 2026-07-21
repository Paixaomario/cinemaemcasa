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

      // Lógica de navegação simplificada e otimizada para performance em TVs
      for (const candidate of allCandidates) {
        if (candidate === active) continue;

        const candidateGroup = getSpatialGroup(candidate);
        const rect = candidate.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - (activeRect.left + activeRect.width / 2);
        const dy = rect.top + rect.height / 2 - (activeRect.top + activeRect.height / 2);

        let isInDirection = false;
        switch (direction) {
          case 'right':
            isInDirection = dx > 0 && Math.abs(dy) < activeRect.height;
            break;
          case 'left':
            isInDirection = dx < 0 && Math.abs(dy) < activeRect.height;
            break;
          case 'down':
            isInDirection = dy > 0 && Math.abs(dx) < activeRect.width;
            break;
          case 'up':
            isInDirection = dy < 0 && Math.abs(dx) < activeRect.width;
            break;
        }

        // Lógica para pular para o primeiro item da linha ao navegar para cima/baixo
        if (activeGroup === 'content' && candidateGroup === 'content' && (direction === 'up' || direction === 'down')) {
          const isDifferentRow = Math.abs(rect.top - activeRect.top) > activeRect.height / 2;
          if (isDifferentRow) {
            const score = Math.abs(dy) * 2 + Math.abs(dx); // Prioriza a linha mais próxima
            if (score < bestScore) {
              bestScore = score;
              best = candidate;
            }
          }
        } else {
          // Lógica de pontuação padrão para outras navegações
          if (isInDirection) {
            const score = getScore(activeRect, rect, direction);
            if (score < bestScore) {
              bestScore = score;
              best = candidate;
            }
          }
        }
      }

      // Se a navegação vertical encontrou um item, vamos encontrar o primeiro daquela linha
      if (best && activeGroup === 'content' && (direction === 'up' || direction === 'down')) {
        const bestRect = best.getBoundingClientRect();
        const targetRowElements = allCandidates.filter(c => 
          getSpatialGroup(c) === 'content' && Math.abs(c.getBoundingClientRect().top - bestRect.top) < 10
        );
        if (targetRowElements.length > 0) {
          return targetRowElements.reduce((first, current) => 
            current.getBoundingClientRect().left < first.getBoundingClientRect().left ? current : first
          );
        }
      }

      // Fallback para a lógica de pontuação geral se a navegação de linha falhar ou não for aplicável
      if (!best) {
        bestScore = Number.POSITIVE_INFINITY;
        for (const candidate of allCandidates) {
          if (candidate === active) continue;
          const rect = candidate.getBoundingClientRect()
          const score = getScore(activeRect, rect, direction)
          if (score < bestScore) {
            bestScore = score
            best = candidate
          }
        }

      }
      return best;
    }

    // Configuração da Web Speech API para pesquisa por voz universal
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let recognition: any;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          console.log('Texto reconhecido (Web Speech API):', transcript);
          window.location.href = `/buscar?q=${encodeURIComponent(transcript)}`;
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
      };
    }

    const startVoiceSearch = () => {
      if (recognition) {
        try {
          recognition.start();
          console.log('Ouvindo...');
        } catch (error) {
          console.error('Não foi possível iniciar o reconhecimento de voz:', error);
        }
      }
    };

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
            // Aciona a pesquisa por voz universal com o botão verde
            startVoiceSearch();
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

    const handleVoiceSearch = (event: any) => {
      const recognizedText = event.detail?.voice_message
      if (recognizedText) {
        console.log('Pesquisa por voz reconhecida:', recognizedText)
        // Redireciona para a página de busca com o texto como query
        window.location.href = `/buscar?q=${encodeURIComponent(recognizedText)}`
      }
    }

    document.addEventListener('focusin', handleFocus)
    window.addEventListener('keydown', handleKeyDown)

    // Adiciona o listener para a pesquisa por voz do WebOS
    if (isWebOS) {
      document.addEventListener('webOSVoice', handleVoiceSearch)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocus)
      // Remove o listener ao desmontar o componente
      if (isWebOS) {
        document.removeEventListener('webOSVoice', handleVoiceSearch)
      }
    }
  }, [])
}