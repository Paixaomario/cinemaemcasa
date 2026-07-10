import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CommandReceiverProvider } from '@/components/layout/CommandReceiverProvider'
import { VisualPreferencesProvider } from '@/components/layout/VisualPreferencesProvider'
import { AppInitializer } from '@/app/AppInitializer'
import { InitialLoadingScreen } from '@/components/InitialLoadingScreen'

export const metadata: Metadata = {
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
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://ebbuobnltsrvqxayrulk.supabase.co" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="prefetch" href="/home" />
        <link rel="prefetch" href="/search" />
        <link rel="prefetch" href="/filmes" />
        <link rel="prefetch" href="/series" />
      </head>
      <body>
        <SupabaseProvider>
          <CommandReceiverProvider>
            <VisualPreferencesProvider>
              <InitialLoadingScreen />
              <AppInitializer />
              <div className="flex min-h-screen bg-black text-white">
                <Sidebar />
                <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                  {children}
                </main>
                <MobileBottomNav />
              </div>
            </VisualPreferencesProvider>
          </CommandReceiverProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
