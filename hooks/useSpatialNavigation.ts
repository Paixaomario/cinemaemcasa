'use client';

import { useEffect } from 'react';

/**
 * Navegação espacial por D-pad (setas do controle remoto). Recriado do
 * zero após o antigo `src/hooks/useSpatialNavigation.ts` ter sido
 * substituído junto com a reestruturação do projeto — se você ainda tiver
 * o arquivo original em algum backup/versão anterior do Git, pode valer
 * comparar e portar lógicas específicas que ele tivesse.
 *
 * Como funciona: entre todos os elementos com a classe `.focusable`
 * visíveis na tela, calcula qual é o mais próximo na direção pressionada
 * (cima/baixo/esquerda/direita) com base na posição real na tela — não
 * na ordem do DOM — e move o foco do teclado para ele. Funciona em
 * qualquer smart TV (webOS, Tizen, Android TV) que emule teclado a partir
 * do controle remoto, e também com teclado normal no desktop.
 */
export function useSpatialNavigation() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const direction = map[e.key];
      if (!direction) return;

      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>('.focusable')
      );
      const current = document.activeElement as HTMLElement | null;
      if (!current || focusables.length === 0) return;

      const currentRect = current.getBoundingClientRect();
      let melhor: HTMLElement | null = null;
      let melhorDistancia = Infinity;

      for (const el of focusables) {
        if (el === current) continue;
        const rect = el.getBoundingClientRect();

        const dx = rect.left - currentRect.left;
        const dy = rect.top - currentRect.top;

        const naDirecao =
          (direction === 'up' && dy < -4) ||
          (direction === 'down' && dy > 4) ||
          (direction === 'left' && dx < -4) ||
          (direction === 'right' && dx > 4);

        if (!naDirecao) continue;

        // Penaliza desalinhamento no eixo perpendicular para preferir
        // elementos "na mesma linha/coluna" antes de pular pra outra.
        const distancia =
          direction === 'up' || direction === 'down'
            ? Math.abs(dy) + Math.abs(dx) * 2
            : Math.abs(dx) + Math.abs(dy) * 2;

        if (distancia < melhorDistancia) {
          melhorDistancia = distancia;
          melhor = el;
        }
      }

      if (melhor) {
        e.preventDefault();
        melhor.focus();
        melhor.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
