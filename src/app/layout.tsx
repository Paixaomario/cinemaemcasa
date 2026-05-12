import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'

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
        {/* Google Cast SDK para compartilhamento de tela */}
        <script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1" defer></script>
      </head>
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  )
}
