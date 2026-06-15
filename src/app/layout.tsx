import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CommandReceiverProvider } from '@/components/layout/CommandReceiverProvider'
import { Inter, Montserrat } from 'next/font/google'
import { VisualPreferencesProvider } from '@/components/layout/VisualPreferencesProvider'
import { AppInitializer } from '@/app/AppInitializer'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-montserrat',
  weight: ['400', '700', '900'] 
})

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
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Garante que ao iniciar ou recarregar, o usuário seja levado para a Home
    if (pathname === '/') {
      router.replace('/home');
    }
  }, []);

  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://ebbuobnltsrvqxayrulk.supabase.co" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className="font-sans">
        <AppInitializer />
        <SupabaseProvider>
          <VisualPreferencesProvider>
            <CommandReceiverProvider>
              <Sidebar />
              <main className="min-h-screen">{children}</main>
              <MobileBottomNav />
            </CommandReceiverProvider>
          </VisualPreferencesProvider>
        </SupabaseProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
