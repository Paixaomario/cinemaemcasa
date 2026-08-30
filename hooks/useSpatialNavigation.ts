'use client';

import { useEffect, useRef } from 'react';

type Direcao = 'up' | 'down' | 'left' | 'right';

const INTERVALO_MINIMO_MS = 140;

function getFocusaveis(container: ParentNode | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('.focusable')).filter(
    (el) => el.offsetParent !== null && !el.closest('[data-nav-ignore]')
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
 * CORREÇÃO DE PERFORMANCE (LG webOS): a versão anterior, pra decidir
 * pra onde mover o foco em CIMA/BAIXO, buscava e calculava a posição
 * (getBoundingClientRect) de TODOS os elementos focáveis dentro de
 * `<main>` — com a rolagem infinita das categorias acumulando centenas
 * ou milhares de capas na página, isso virou uma varredura gigante a
 * cada aperto de seta, e o processador fraco de uma smart TV levava
 * segundos pra terminar (o "delay de quase 5s" relatado).
 *
 * Agora cada linha de capas é uma <section> (Home/Filmes/Séries já
 * renderizam assim). Pra cima/baixo, a busca fica restrita à seção
 * ANTERIOR/SEGUINTE (só a lista de <section> é escaneada primeiro —
 * leve, são dezenas, não milhares — e só DEPOIS os elementos DENTRO da
 * seção-alvo, que é só uma linha). Pra esquerda/direita, a busca fica
 * restrita à seção ATUAL. Isso reduz o trabalho por tecla de "milhares
 * de elementos" pra "uma ou duas dezenas", não importa quanto a
 * rolagem infinita tenha crescido em outras categorias.
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

      if (!current || current === document.body) {
        e.preventDefault();
        const main = document.querySelector<HTMLElement>('main');
        const primeiraSecao = main?.querySelector<HTMLElement>('section');
        const primeiro =
          maisProximoNoTopo(getFocusaveis(primeiraSecao || main)) ||
          document.querySelector<HTMLElement>('aside a[href="/"]');
        primeiro?.focus();
        primeiro?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        return;
      }

      processandoRef.current = true;
      ultimoProcessadoRef.current = agora;

      try {
        const aside = document.querySelector<HTMLElement>('aside');
        const main = document.querySelector<HTMLElement>('main');
        const emMenu = !!aside && aside.contains(current);
        const emConteudo = !!main && main.contains(current);
        const currentRect = current.getBoundingClientRect();

        // Regra 1: do menu lateral, direita -> primeira linha/coluna do conteúdo.
        if (direction === 'right' && emMenu) {
          const primeiraSecao = main?.querySelector<HTMLElement>('section');
          const alvo = maisProximoNoTopo(getFocusaveis(primeiraSecao || main));
          if (alvo) {
            e.preventDefault();
            alvo.focus();
            alvo.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
            return;
          }
        }

        // A seção (linha) onde o foco atual está — cada carrossel/grade
        // de capas é uma <section> própria. Usada pra restringir as
        // buscas abaixo, em vez de varrer a página inteira.
        const secaoAtual = emConteudo ? (current.closest('section') as HTMLElement | null) : null;

        // Regra 2: da primeira coluna do conteúdo, esquerda -> ícone Início do menu.
        if (direction === 'left' && emConteudo) {
          const focaveisSecao = getFocusaveis(secaoAtual || main);
          const menorEsquerda = Math.min(...focaveisSecao.map((el) => el.getBoundingClientRect().left));
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

        // Esquerda/direita: restrito à SEÇÃO ATUAL (uma linha só) —
        // nunca precisa olhar pra fora dela.
        if ((direction === 'left' || direction === 'right') && emConteudo) {
          const pool = getFocusaveis(secaoAtual || main);
          const candidatosNaDirecao = pool.filter((el) => {
            if (el === current) return false;
            const r = el.getBoundingClientRect();
            return direction === 'right' ? r.left > currentRect.left : r.left < currentRect.left;
          });

          let alvo: HTMLElement | null = null;
          if (candidatosNaDirecao.length > 0) {
            alvo = candidatosNaDirecao.sort(
              (a, b) =>
                Math.abs(a.getBoundingClientRect().left - currentRect.left) -
                Math.abs(b.getBoundingClientRect().left - currentRect.left)
            )[0];
          } else {
            // Chegou na ponta: dá a volta pro outro extremo DESSA MESMA seção.
            alvo = [...pool].sort((a, b) => {
              const ra = a.getBoundingClientRect().left;
              const rb = b.getBoundingClientRect().left;
              return direction === 'right' ? ra - rb : rb - ra;
            })[0];
          }

          if (alvo && alvo !== current) {
            e.preventDefault();
            alvo.focus();
            alvo.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
            return;
          }
        }

        // Cima/baixo: primeiro acha a seção anterior/seguinte (lista de
        // <section> é leve — dezenas, não milhares) e só then busca os
        // elementos DENTRO dela (de novo, uma linha só, não a página
        // inteira). É isso que elimina o delay de segundos na TV.
        if ((direction === 'up' || direction === 'down') && emConteudo && main) {
          const todasSecoes = Array.from(main.querySelectorAll<HTMLElement>('section'));
          const indiceAtual = secaoAtual ? todasSecoes.indexOf(secaoAtual) : -1;
          const indiceAlvo = direction === 'down' ? indiceAtual + 1 : indiceAtual - 1;
          const secaoAlvo = todasSecoes[indiceAlvo];

          if (secaoAlvo) {
            const focaveisAlvo = getFocusaveis(secaoAlvo);
            const alvo = focaveisAlvo.sort(
              (a, b) =>
                Math.abs(a.getBoundingClientRect().left - currentRect.left) -
                Math.abs(b.getBoundingClientRect().left - currentRect.left)
            )[0];

            if (alvo) {
              e.preventDefault();
              alvo.focus();
              alvo.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
              return;
            }
          }
        }

        // Navegação dentro do menu lateral (poucos itens — pode
        // continuar com a busca simples, sem custo perceptível).
        if (emMenu) {
          const pool = getFocusaveis(aside);
          let melhor: HTMLElement | null = null;
          let melhorDistancia = Infinity;

          for (const el of pool) {
            if (el === current) continue;
            const rect = el.getBoundingClientRect();
            const dy = rect.top - currentRect.top;
            const naDirecao =
              (direction === 'up' && dy < -4) || (direction === 'down' && dy > 4);
            if (!naDirecao) continue;
            const distancia = Math.abs(dy);
            if (distancia < melhorDistancia) {
              melhorDistancia = distancia;
              melhor = el;
            }
          }

          if (melhor) {
            e.preventDefault();
            melhor.focus();
          }
        }
      } finally {
        processandoRef.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
