// Padrão atual do Next.js 14 para inicializar o Sentry no servidor e no
// edge runtime — substitui os arquivos sentry.server.config.ts e
// sentry.edge.config.ts (removidos), que geravam um aviso de
// depreciação no build. Sem SENTRY_DSN configurado nas variáveis de
// ambiente, isso simplesmente não faz nada (não quebra o app).
export async function register() {
  const Sentry = await import('@sentry/nextjs');

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.2,
      debug: false
    });
  }
}
