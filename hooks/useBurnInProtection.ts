'use client';

import { useEffect } from 'react';

/**
 * Proteção contra burn-in em telas OLED. Recriado do zero (o arquivo
 * original `useBurnInProtection.ts` foi substituído na reestruturação).
 *
 * Estratégia: a cada intervalo, desloca sutilmente todo o conteúdo da
 * tela por 1–2px em um padrão que não é perceptível para quem assiste,
 * mas evita que elementos estáticos (menu lateral, barra de progresso,
 * logo) queimem a mesma posição de pixel por horas seguidas — comum em
 * apps de streaming deixados abertos em TVs OLED.
 */
export function useBurnInProtection(intervalMs = 120_000) {
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;

    const positions = [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 1],
      [-1, -1]
    ];
    let index = 0;

    const shift = () => {
      index = (index + 1) % positions.length;
      const [x, y] = positions[index];
      document.body.style.transform = `translate(${x}px, ${y}px)`;
    };

    const id = setInterval(shift, intervalMs);
    return () => {
      clearInterval(id);
      document.body.style.transform = '';
    };
  }, [intervalMs]);
}
