import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { PlatformProvider } from '@/components/PlatformProvider';
import { SplashScreen } from '@/components/SplashScreen';

// Agente de layout: fontes oficiais do sistema. Inter para textos
// corridos (legível em qualquer tamanho de tela) e Poppins (mais
// encorpada) para títulos de seção/categoria e destaques — mesmo
// princípio usado por apps de streaming AAA.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap'
});

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
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-black text-white font-sans">
        <SplashScreen />
        <PlatformProvider>
          <Sidebar />
          <main className="md:pl-[92px] pb-24 md:pb-0">{children}</main>
          <BottomNav />
        </PlatformProvider>
      </body>
    </html>
  );
}

