'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Captura qualquer erro não tratado em qualquer página e manda pro
// Sentry, mostrando uma tela de erro simples em vez da tela branca
// padrão do navegador.
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-black text-white flex items-center justify-center min-h-screen">
        <div className="text-center px-6">
          <p className="text-lg font-medium mb-2">Algo deu errado</p>
          <p className="text-sm text-textmuted mb-5">
            O erro já foi registrado. Você pode tentar de novo.
          </p>
          <button
            onClick={reset}
            className="bg-accent text-white text-sm font-medium rounded-card px-5 py-2.5"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
