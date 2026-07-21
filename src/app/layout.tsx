import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/AppShell'
import { getVisualPreferences } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'PaixãoFlix - Cinema em Casa',
  description: 'Sua plataforma de streaming premium',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const preferences = await getVisualPreferences()

  // Define os valores padrão caso não haja preferências salvas
  const theme = {
    accentColor: preferences?.accent_color || '#00ADEF', // Cor do logo como padrão
    theme: preferences?.theme || 'dark',
  }

  const bodyStyle = {
    '--theme-accent-color': theme.accentColor,
    '--theme-focus-ring-color': theme.accentColor,
  } as React.CSSProperties

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Configurações do PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        {/* Favicon */}
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning style={bodyStyle} data-theme={theme.theme}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
