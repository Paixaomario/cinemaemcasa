'use client';

import { createContext, useContext, useRef, useState } from 'react';

export interface PreviaFoco {
  id: string | number;
  titulo: string;
  imagem: string | null;
  trailer: string | null;
  tmdbId: number | null;
  tipo: 'movie' | 'series' | null;
  descricao?: string | null;
  ano?: number | null;
  duracao?: string | null;
  classificacao?: string | null;
}

interface ContextoPrevia {
  previa: PreviaFoco | null;
  definirPrevia: (item: PreviaFoco | null) => void;
}

const HeroPreviewContext = createContext<ContextoPrevia | null>(null);

/**
 * Agente de Home/Filmes/Séries — padrão HBO Max confirmado por
 * pesquisa (documentação de apps de TV descreve exatamente isso: "faded
 * banner que toca trailer automaticamente após o foco, só em apps de
 * tela grande"). Em vez de cada capa tocar seu próprio trailer (o que
 * sobrecarrega o sistema com um vídeo/iframe por capa focada e
 * multiplica chamadas ao TMDB/Supabase), só o BANNER HERO no topo da
 * página mostra o trailer — e ele muda pra refletir a capa que está
 * com foco no momento, com um pequeno atraso (evita disparar a cada
 * capa que só "passa voando" durante a navegação rápida).
 */
export function HeroPreviewProvider({ children }: { children: React.ReactNode }) {
  const [previa, setPrevia] = useState<PreviaFoco | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const definirPrevia = (item: PreviaFoco | null) => {
    if (timer.current) clearTimeout(timer.current);

    if (item === null) {
      // Sai da capa: espera um pouco antes de voltar pro hero padrão,
      // pra não "piscar" entre uma capa e outra durante a navegação.
      timer.current = setTimeout(() => setPrevia(null), 400);
      return;
    }

    timer.current = setTimeout(() => setPrevia(item), 300);
  };

  return (
    <HeroPreviewContext.Provider value={{ previa, definirPrevia }}>
      {children}
    </HeroPreviewContext.Provider>
  );
}

export function useHeroPreview() {
  const ctx = useContext(HeroPreviewContext);
  // Fora de um Provider (ex: página sem hero), vira um no-op seguro.
  return ctx || { previa: null, definirPrevia: () => {} };
}
