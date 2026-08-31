'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/filmes', label: 'Filmes', icon: 'movie' },
  { href: '/series', label: 'Séries', icon: 'device-tv' },
  { href: '/infantil', label: 'Infantil', icon: 'mood-kid' },
  { href: '/minha-lista', label: 'Lista', icon: 'heart' },
  { href: '/busca', label: 'Buscar', icon: 'search' },
  { href: '/perfil', label: 'Perfil', icon: 'user' }
];

// Agente de menu (mobile): barra flutuante com cantos arredondados,
// efeito vidro e sombra — igual ao padrão da barra inferior do
// Telegram — em vez de uma barra reta colada na borda da tela.
export function BottomNav() {
  const pathname = usePathname();

  // Some invisível na página de exibição (player) — precisa ser tela
  // cheia, sem elementos de navegação por cima do vídeo.
  if (pathname.includes('/assistir')) return null;

  return (
    <nav
      className="
        md:hidden fixed left-3 right-3 bottom-3 z-30
        bg-black/90 border border-white/10
        rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.5)]
        flex justify-around items-center py-2 px-1
      "
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-1 py-0.5">
            <i
              className={`ti ti-${item.icon} text-lg`}
              style={{ color: active ? '#E8C97A' : '#FFFFFF' }}
              aria-hidden="true"
            />
            <span className="text-[9px]" style={{ color: active ? '#E8C97A' : 'rgba(255,255,255,0.75)' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
