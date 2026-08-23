import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { PlatformProvider } from '@/components/PlatformProvider';
import { SplashScreen } from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'Cinema em Casa',
  description: 'Filmes e séries do seu acervo pessoal, em qualquer tela.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.47.0/iconfont/tabler-icons.min.css"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-black text-white">
        <SplashScreen />
        <PlatformProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
          </div>
          <BottomNav />
        </PlatformProvider>
      </body>
    </html>
  );
}
