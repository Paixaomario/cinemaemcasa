'use client';

import { useRouter } from 'next/navigation';

// Agente de página de detalhes: botão voltar presente em filmes e séries.
export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Voltar"
      className="focusable absolute top-5 left-5 z-50 w-11 h-11 rounded-full bg-black/75 flex items-center justify-center text-white"
    >
      <i className="ti ti-arrow-left text-xl" aria-hidden="true" />
    </button>
  );
}
