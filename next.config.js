/** @type {import('next').NextConfig} */
const nextConfig = {
  // Usar src-new como diretório de origem
  dir: './src-new',
  reactStrictMode: true,
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
  },
  // Otimizações para Vercel
  compress: true,
  // Aumentar timeout para builds lentos
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Headers para permitir acesso ao manifest.json
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;