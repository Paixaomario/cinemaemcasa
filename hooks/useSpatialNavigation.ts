'use client';

import { useEffect } from 'react';

type Direcao = 'up' | 'down' | 'left' | 'right';

function getFocusaveis(container: ParentNode | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('.focusable')).filter(
    (el) => el.offsetParent !== null // ignora elementos escondidos (display:none)
  );
}

function maisProximoNoTopo(elementos: HTMLElement[]): HTMLElement | null {
  if (elementos.length === 0) return null;
  return [...elementos].sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    if (Math.abs(ra.top - rb.top) > 4) return ra.top - rb.top;
    return ra.left - rb.left;
  })[0];
}

/**
 * Navegação espacial por D-pad (setas do controle remoto / teclado).
 *
 * Regras explícitas de transição entre o menu lateral e o conteúdo da
 * página (evitam que o foco fique "preso" no menu):
 *  - Estando em qualquer item do menu lateral, seta para a DIREITA leva
 *    direto para a primeira linha/primeira coluna do conteúdo da página.
 *  - Estando na PRIMEIRA COLUNA do conteúdo, seta para a ESQUERDA volta
 *    para o ícone Início do menu lateral (o que também expande o menu,
 *    já que a expansão usa :focus-within).
 *
 * Fora dessas transições, o foco se move para o elemento `.focusable`
 * mais próximo na direção pressionada, com base na posição real na
 * tela — dentro da mesma região (menu OU conteúdo) para não pular de
 * um pro outro no meio do caminho.
 */
export function useSpatialNavigation() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const map: Record<string, Direcao> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const direction = map[e.key];
      if (!direction) return;

      const current = document.activeElement as HTMLElement | null;
      if (!current) return;

      const aside = document.querySelector<HTMLElement>('aside');
      const main = document.querySelector<HTMLElement>('main');
      const emMenu = !!aside && aside.contains(current);
      const emConteudo = !!main && main.contains(current);

      // Regra 1: do menu lateral, direita -> primeira linha/coluna do conteúdo.
      if (direction === 'right' && emMenu) {
        const alvo = maisProximoNoTopo(getFocusaveis(main));
        if (alvo) {
          e.preventDefault();
          alvo.focus();
          alvo.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
          return;
        }
      }

      // Regra 2: da primeira coluna do conteúdo, esquerda -> ícone Início do menu.
      if (direction === 'left' && emConteudo) {
        const focaveisConteudo = getFocusaveis(main);
        const currentRect = current.getBoundingClientRect();
        const menorEsquerda = Math.min(...focaveisConteudo.map((el) => el.getBoundingClientRect().left));
        const primeiraColuna = currentRect.left - menorEsquerda < 8;

        if (primeiraColuna) {
          const inicio = aside?.querySelector<HTMLElement>('a[href="/"]');
          if (inicio) {
            e.preventDefault();
            inicio.focus();
            return;
          }
        }
      }

      // Navegação genérica: restrita à própria região (menu OU conteúdo)
      // para não pular de uma pra outra fora das regras acima.
      const pool = emMenu ? getFocusaveis(aside) : emConteudo ? getFocusaveis(main) : getFocusaveis(document.body);

      const currentRect = current.getBoundingClientRect();
      let melhor: HTMLElement | null = null;
      let melhorDistancia = Infinity;

      for (const el of pool) {
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
