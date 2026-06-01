import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'
import { Navbar } from '@/components/layout/Navbar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CommandReceiverProvider } from '@/components/layout/CommandReceiverProvider'
import { Inter, Montserrat } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-montserrat',
  weight: ['400', '700', '900'] 
})

export const metadata: Metadata = {
  title: 'Meu Projeto Clean',
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
          <CommandReceiverProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <MobileBottomNav />
          </CommandReceiverProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
