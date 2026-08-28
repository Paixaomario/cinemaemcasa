import * as Sentry from '@sentry/nextjs';

// Monitoramento de erros — plano gratuito do Sentry (sentry.io).
// Sem SENTRY_DSN configurado, isso simplesmente não faz nada (não
// quebra o app, só fica inativo).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  debug: false
});
