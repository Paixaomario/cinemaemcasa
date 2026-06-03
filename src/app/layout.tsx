import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CommandReceiverProvider } from '@/components/layout/CommandReceiverProvider'
import { Inter, Montserrat } from 'next/font/google'
import { VisualPreferencesProvider } from '@/components/layout/VisualPreferencesProvider'

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
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="font-sans">
        <SupabaseProvider>
          <VisualPreferencesProvider>
            <CommandReceiverProvider>
              <Sidebar />
              <main className="min-h-screen">{children}</main>
              <MobileBottomNav />
            </CommandReceiverProvider>
          </VisualPreferencesProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
