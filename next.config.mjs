/** @type {import('next').NextConfig} */
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'image.tmdb.org' }
    ]
  }
};

// Monitoramento de erros (Sentry, plano gratuito). Sem
// SENTRY_ORG/SENTRY_PROJECT configurados no ambiente, o wrapper não
// falha o build — só não faz upload de source maps.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableLogger: true,
  sourcemaps: {
    // Evita publicar os source maps (mapeamento pro código-fonte
    // original) publicamente — eles são enviados pro Sentry (útil pra
    // depurar erros) e depois apagados do build final.
    deleteSourcemapsAfterUpload: true
  }
});
