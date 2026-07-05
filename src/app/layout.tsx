import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CommandReceiverProvider } from '@/components/layout/CommandReceiverProvider'
// Removido: Google Fonts
import { VisualPreferencesProvider } from '@/components/layout/VisualPreferencesProvider'
import { AppInitializer } from '@/app/AppInitializer'
import { InitialLoadingScreen } from '@/components/InitialLoadingScreen'

// // // // export const metadata: Metadata = {
  title: 'Cinema em Casa',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cinema em Casa',
  },
  // Otimizações de performance
  other: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" >
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://ebbuobnltsrvqxayrulk.supabase.co" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        {/* Prefetch de páginas principais para navegação rápida */}
        <link rel="prefetch" href="/home" />
        <link rel="prefetch" href="/search" />
        <link rel="prefetch" href="/filmes" />
        <link rel="prefetch" href="/series" />
      </head>
      <body className="font-sans">
        {/* Temporariamente desabilitado para corrigir erro React #310 */}
        {/* <InitialLoadingScreen /> */}
        {/* <AppInitializer /> */}
        <SupabaseProvider>
          {/* Temporariamente desabilitado para corrigir erro React #310 */}
          {/* <VisualPreferencesProvider> */}
            {/* Temporariamente desabilitado para corrigir erro React #310 */}
            {/* <CommandReceiverProvider> */}
              {/* <Sidebar /> */}
              <main className="min-h-screen">{children}</main>
              {/* <MobileBottomNav /> */}
            {/* </CommandReceiverProvider> */}
          {/* </VisualPreferencesProvider> */}
        </SupabaseProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
;
;
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
