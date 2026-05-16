/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from 'next'
import './globals.css'
import Script from 'next/script'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export const metadata: Metadata = {
  title: { default: 'PAIXAOFLIX', template: '%s | PAIXAOFLIX' },
  description: 'Sua plataforma de streaming pessoal',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PAIXAOFLIX' },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Open+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Clappr Player */}
        <Script src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/clappr-hls-playback@latest/dist/clappr-hls-playback.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/dash-shaka-playback@latest/dist/dash-shaka-playback.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/clappr-level-selector-plugin@latest/dist/level-selector.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/clappr-playback-speed-plugin@latest/dist/clappr-playback-speed-plugin.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/clappr-markers-plugin@latest/dist/clappr-markers-plugin.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/clappr-subtitle-plugin@latest/dist/clappr-subtitle-plugin.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@clappr/chromecast-plugin@latest/dist/clappr-chromecast-plugin.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/clappr-thumbnails-plugin@latest/dist/clappr-thumbnails-plugin.js" strategy="beforeInteractive" />
        {/* Google Cast SDK para compartilhamento de tela */}
        <Script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1" strategy="lazyOnload" />
      </head>
      <body>
        <SupabaseProvider>
          {children}
          <MobileBottomNav />
        </SupabaseProvider>
      </body>
    </html>
  )
}
