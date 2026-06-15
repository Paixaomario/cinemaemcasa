'use client'
import { useEffect } from 'react'

/**
 * Hook para habilitar navegação por setas (D-Pad) em Smart TVs
 * Centraliza a lógica para todas as telas do sistema PaixãoFlix
 */
export function useSpatialNavigation() {
  useEffect(() => {
    const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.getAttribute('tabindex') === '0') {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement;

      // Impede o scroll da página ao usar as setas (comum em TVs)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const isScrollable = active?.tagName === 'TEXTAREA';
        if (!isScrollable) e.preventDefault();
      }
      
      // Lógica de transição solicitada: Esquerda -> Menu Home
      if (e.key === 'ArrowLeft' && active) {
        const rect = active.getBoundingClientRect();
        if (rect.left < 100 && !active.closest('aside')) {
          const homeBtn = document.querySelector('aside [href="/home"], aside [href="/"]') as HTMLElement;
          homeBtn?.focus();
        }
      }

      // Lógica de transição solicitada: Menu -> Conteúdo (Direita)
      if (e.key === 'ArrowRight' && active?.closest('aside')) {
        const firstContent = document.querySelector('main [tabindex="0"]') as HTMLElement;
        firstContent?.focus();
      }

      // Impedir que o cursor do Magic Remote suma em momentos indesejados
      if (isWebOS && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        // Adiciona uma classe ao body para indicar que estamos em modo teclado
        // Isso ajuda o CSS a destacar o foco visualmente na TV
        document.body.classList.add('using-keyboard');
        
        // Se nada estiver focado, foca no primeiro elemento disponível
        if (!document.activeElement || document.activeElement === document.body) {
          const firstFocusable = document.querySelector('[tabindex="0"]') as HTMLElement;
          firstFocusable?.focus();
        }
      }
      
      // Lógica de navegação espacial baseada em foco nativo do navegador.
      // O navegador lidará com o movimento do foco entre elementos com tabIndex="0".
      
      // Tratamento para o botão "Voltar" (Back) do controle remoto LG (461) ou Backspace
      // Código 10009 é o padrão para o botão Return/Back nas TVs Samsung Tizen
      if (e.keyCode === 461 || e.keyCode === 10009 || e.key === 'Backspace') {
        const activeElement = document.activeElement;
        const isInputActive = activeElement?.tagName === 'INPUT' ||
                             activeElement?.tagName === 'TEXTAREA' ||
                             (activeElement instanceof HTMLElement && activeElement.isContentEditable);
        
        // Se não estiver digitando em um input, volta para a página anterior
        if (!isInputActive) {
          e.preventDefault();
          // Procuramos por elementos com role="dialog" ou classes de modal
          const openModal = document.querySelector('[role="dialog"], .modal-open');
          
          if (openModal) {
            // Se for o Player de vídeo, apenas fecha o player
            const isPlayer = !!document.querySelector('.vds-video');
            if (isPlayer) {
              // Lógica customizada para fechar player sem desempilhar histórico se necessário
              // Mas window.history.back() costuma ser o padrão esperado
              window.history.back();
              return;
            }

            // Tenta clicar no botão de fechar do modal automaticamente (X)
            const closeButton = openModal.querySelector('button[aria-label*="Fechar"], button[class*="close"], .btn-close') as HTMLElement;
            if (closeButton instanceof HTMLElement) {
              closeButton.click();
              return;
            }
          }

          const isRoot = window.location.pathname === '/home' || window.location.pathname === '/'
          
          if (!isRoot) {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.replace('/home'); // Use replace para não sujar o histórico
            }
          } else {
            // Prevenção de fechamento acidental em TVs - Só fecha se estiver na Home
            const webOS = (window as any).webOS;
            if (isWebOS) {
              if (typeof webOS.terminate === 'function') {
                webOS.terminate();
              } else if (webOS.app && typeof webOS.app.close === 'function') {
                webOS.app.close();
              }
            } else if (window.confirm("Deseja sair do PaixãoFlix?")) {
              window.close();
            }
          }
        }
      }

      // Suporte aos botões coloridos do Magic Remote LG
      if (isWebOS) {
        switch(e.keyCode) {
          case 403: // Vermelho
            document.dispatchEvent(new CustomEvent('magicremote:red'));
            break;
          case 404: // Verde
            document.dispatchEvent(new CustomEvent('magicremote:green'));
            break;
          case 405: // Amarelo
            document.dispatchEvent(new CustomEvent('magicremote:yellow'));
            break;
          case 406: // Azul
            document.dispatchEvent(new CustomEvent('magicremote:blue'));
            break;
        }
      }

      // Suporte a botões de mídia físicos (Play/Pause) comuns em controles de TV
      if (e.key === 'MediaPlayPause' || e.key === 'MediaPlay' || e.key === 'MediaPause') {
        document.dispatchEvent(new CustomEvent('magicremote:playpause'));
      }
    }

    document.addEventListener('focusin', handleFocus);
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [])
}