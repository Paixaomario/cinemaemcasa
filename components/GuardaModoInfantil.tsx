'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { estaEmModoInfantilCliente, contemTermoAdulto } from '@/lib/kidsMode';

interface Props {
  category: string | null;
  genre: string | null;
}

// Modo infantil (Agente de Perfil): fecha a brecha de alguém abrir
// direto a URL de um título adulto (link salvo, histórico, resultado
// de busca externa) sem passar pela listagem, onde já é filtrado.
export function GuardaModoInfantil({ category, genre }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!estaEmModoInfantilCliente()) return;
    if (contemTermoAdulto(category) || contemTermoAdulto(genre)) {
      router.replace('/');
    }
  }, [category, genre, router]);

  return null;
}
