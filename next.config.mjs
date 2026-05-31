/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' é o modo ideal para apps dinâmicos, garantindo compatibilidade global
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;