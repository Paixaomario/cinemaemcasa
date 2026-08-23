'use client';

import { useEffect, useState } from 'react';
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation';
import { useBurnInProtection } from '@/hooks/useBurnInProtection';
import { detectarPlataforma, ehSmartTV, type Plataforma } from '@/lib/platform/platformDetect';

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [plataforma, setPlataforma] = useState<Plataforma>('desktop');

  useEffect(() => {
    setPlataforma(detectarPlataforma());

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Falha silenciosa: o app funciona normalmente sem SW, só perde
        // o cache offline do shell.
      });
    }
  }, []);

  useEffect(() => {
    // Garante um ponto de partida para o D-pad: se nada estiver focado
    // ao carregar a página, foca o primeiro item focável do conteúdo
    // (e, na ausência dele, o ícone Início do menu).
    const t = setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      const main = document.querySelector<HTMLElement>('main');
      const primeiro =
        main?.querySelector<HTMLElement>('.focusable') ||
        document.querySelector<HTMLElement>('aside a[href="/"]');
      primeiro?.focus();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const isTV = ehSmartTV(plataforma);

  // Navegação por D-pad é útil em qualquer ambiente sem toque (TV e
  // também desktop com teclado); em mobile o toque já resolve.
  useSpatialNavigation();

  // Burn-in só importa em TV (onde o app pode ficar horas parado na
  // mesma tela). Passar intervalMs=0 desativa o hook.
  useBurnInProtection(isTV ? 120_000 : 0);

  return <>{children}</>;
}
