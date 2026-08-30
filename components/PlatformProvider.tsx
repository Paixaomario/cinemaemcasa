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

  // IMPORTANTE: não focamos nada proativamente aqui. Nenhuma capa deve
  // aparecer com o visual de "selecionada" assim que a página abre —
  // o foco só nasce na PRIMEIRA seta que o usuário apertar (ver
  // hooks/useSpatialNavigation.ts), que já é uma ação do usuário, não
  // algo acontecendo sozinho no carregamento.

  const isTV = ehSmartTV(plataforma);

  // Navegação por D-pad é útil em qualquer ambiente sem toque (TV e
  // também desktop com teclado); em mobile o toque já resolve.
  useSpatialNavigation();

  // Burn-in só importa em TV (onde o app pode ficar horas parado na
  // mesma tela). Passar intervalMs=0 desativa o hook.
  useBurnInProtection(isTV ? 120_000 : 0);

  return <>{children}</>;
}

