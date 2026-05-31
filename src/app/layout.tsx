import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@/lib/responsive-core.css'
import { SupabaseProvider } from '@/components/layout/SupabaseProvider'
import { MobileNavBar } from '@/components/layout/MobileNavBar'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { Inter, Montserrat } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-montserrat',
  weight: ['400', '700', '900'] 
})

export const metadata: Metadata = {
  title: 'Cinema em Casa',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cinema em Casa',
  },
}

export const viewport: Viewport = {
  themeColor: '#00ADEF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="font-sans">
        <Script 
          src="https://static.webostv.developer.lge.com/sdk/lib/webOSTVjs-1.2.4/webOSTV.js" 
          strategy="afterInteractive"
        />
        <ServiceWorkerRegister />
        <SupabaseProvider>
          {children}
          <MobileNavBar />
        </SupabaseProvider>
      </body>
    </html>
  )
}
