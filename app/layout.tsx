import type { Metadata, Viewport } from 'next';
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

// CAUSA RAIZ de vários problemas de mobile reportados (menu lateral
// aparecendo em vez da barra inferior, sistema "parecendo site"): não
// havia uma tag de viewport explícita. Sem ela, o navegador do celular
// assume uma largura de página desktop (~980px) e encolhe tudo — o que
// faz até os breakpoints `md:` do Tailwind se comportarem errado. Este
// export é a forma correta de declarar isso no Next.js (App Router).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000'
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

