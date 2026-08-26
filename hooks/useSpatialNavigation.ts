'use client';

import { useEffect, useRef } from 'react';

type Direcao = 'up' | 'down' | 'left' | 'right';

// Intervalo mínimo entre duas navegações processadas. Controles remotos
// de smart TV costumam disparar vários eventos "keydown" repetidos
// enquanto o botão fica pressionado; sem esse limite, os eventos se
// acumulam numa fila e o app "trava" por vários segundos processando
// tudo de uma vez (o efeito de "delay de 10s" relatado na LG webOS).
const INTERVALO_MINIMO_MS = 140;

function getFocusaveis(container: ParentNode | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('.focusable')).filter(
    (el) =>
      el.offsetParent !== null && // ignora elementos escondidos (display:none)
      !el.closest('[data-nav-ignore]') // ignora clones do loop infinito dos carrosséis
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
 * página:
 *  - Do menu lateral, seta DIREITA leva direto para a primeira linha/
 *    primeira coluna do conteúdo.
 *  - Da PRIMEIRA COLUNA do conteúdo, seta ESQUERDA volta para o ícone
 *    Início do menu lateral (que também expande o menu, via
 *    :focus-within).
 *
 * Fora dessas transições, o foco vai para o elemento `.focusable` mais
 * próximo na direção pressionada, dentro da MESMA região (menu OU
 * conteúdo) — nunca pula de uma pra outra fora das regras acima.
 *
 * Otimizado para TVs mais lentas (LG webOS): throttle de eventos,
 * scroll instantâneo (sem animação) e cálculo de distância mais
 * assertivo pra evitar "pulos" errados de direção.
 */
export function useSpatialNavigation() {
  const ultimoProcessadoRef = useRef(0);
  const processandoRef = useRef(false);

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

      // Throttle: ignora eventos repetidos demais em sequência (evita
      // fila de eventos travando a TV) e eventos de "auto-repeat" do
      // navegador enquanto a tecla fica pressionada.
      const agora = performance.now();
      if (e.repeat || agora - ultimoProcessadoRef.current < INTERVALO_MINIMO_MS) {
        e.preventDefault();
        return;
      }
      if (processandoRef.current) {
        e.preventDefault();
        return;
      }

      const current = document.activeElement as HTMLElement | null;
      if (!current) return;

      processandoRef.current = true;
      ultimoProcessadoRef.current = agora;

      try {
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
            alvo.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
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

        // Navegação genérica: restrita à própria região (menu OU conteúdo).
        const pool = emMenu ? getFocusaveis(aside) : emConteudo ? getFocusaveis(main) : getFocusaveis(document.body);
        const currentRect = current.getBoundingClientRect();

        // Regra 3: dentro de uma linha de capas (esquerda/direita), o
        // foco nunca pula para outra linha sozinho — se não há vizinho
        // na mesma linha na direção pressionada, ele dá a volta para o
        // outro extremo DA MESMA LINHA. Só cima/baixo trocam de linha.
        if ((direction === 'left' || direction === 'right') && !emMenu) {
          const ALTURA_TOLERANCIA = 12;
          const mesmaLinha = pool.filter((el) => {
            if (el === current) return false;
            const r = el.getBoundingClientRect();
            return Math.abs(r.top - currentRect.top) < ALTURA_TOLERANCIA;
          });

          if (mesmaLinha.length > 0) {
            const candidatosNaDirecao = mesmaLinha.filter((el) => {
              const r = el.getBoundingClientRect();
              return direction === 'right' ? r.left > currentRect.left : r.left < currentRect.left;
            });

            let alvoLinha: HTMLElement | null = null;
            if (candidatosNaDirecao.length > 0) {
              alvoLinha = candidatosNaDirecao.sort(
                (a, b) => Math.abs(a.getBoundingClientRect().left - currentRect.left) -
                  Math.abs(b.getBoundingClientRect().left - currentRect.left)
              )[0];
            } else {
              // Chegou na ponta da linha: dá a volta para o outro extremo
              // DESSA MESMA LINHA (nunca pula para a linha de baixo/cima).
              alvoLinha = [...mesmaLinha].sort((a, b) => {
                const ra = a.getBoundingClientRect().left;
                const rb = b.getBoundingClientRect().left;
                return direction === 'right' ? ra - rb : rb - ra;
              })[0];
            }

            if (alvoLinha) {
              e.preventDefault();
              alvoLinha.focus();
              alvoLinha.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
              return;
            }
          }
        }

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

          // Penalidade maior no eixo perpendicular: favorece fortemente
          // o vizinho alinhado na mesma linha/coluna, evitando que o
          // foco "pule" pra direção errada em grades apertadas.
          const distancia =
            direction === 'up' || direction === 'down'
              ? Math.abs(dy) + Math.abs(dx) * 3
              : Math.abs(dx) + Math.abs(dy) * 3;

          if (distancia < melhorDistancia) {
            melhorDistancia = distancia;
            melhor = el;
          }
        }

        if (melhor) {
          e.preventDefault();
          melhor.focus();
          melhor.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      } finally {
        processandoRef.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
