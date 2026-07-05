#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🔧 SOLUÇÃO NUCLEAR — ARQUIVO CORRETO                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# PASSO 1: Deletar arquivo corrompido
echo "1️⃣  Removendo arquivo corrompido..."
rm -f src/app/layout.tsx src/app/layout.tsx.backup
echo "   ✅ Arquivo removido"

# PASSO 2: Criar arquivo CORRETO
echo "2️⃣  Criando arquivo layout.tsx correto..."
cat > src/app/layout.tsx << 'LAYOUT'
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
LAYOUT

echo "   ✅ layout.tsx recriado"

# PASSO 3: Remover Cypress
echo "3️⃣  Removendo Cypress..."
rm -f cypress.config.ts cypress.config.js 2>/dev/null || true
rm -rf cypress 2>/dev/null || true
echo "   ✅ Cypress removido"

# PASSO 4: npm
echo "4️⃣  Limpando e reinstalando..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --quiet 2>&1 | tail -2
echo "   ✅ npm pronto"

# PASSO 5: Build
echo ""
echo "5️⃣  Testando build..."
if npm run build 2>&1 | tail -20; then
  echo ""
  echo "✅ BUILD SUCESSO!"
  echo ""
  echo "Próximo passo:"
  echo "  git add ."
  echo "  git commit -m \"fix: remove google fonts and restore layout\""
  echo "  git push origin main"
else
  echo ""
  echo "❌ Build falhou"
  exit 1
fi
