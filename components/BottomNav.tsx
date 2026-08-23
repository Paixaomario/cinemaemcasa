'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/filmes', label: 'Filmes', icon: 'movie' },
  { href: '/series', label: 'Séries', icon: 'device-tv' },
  { href: '/busca', label: 'Buscar', icon: 'search' },
  { href: '/perfil', label: 'Perfil', icon: 'user' }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-border flex justify-around items-center py-2 z-30">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2"
          >
            <i
              className={`ti ti-${item.icon} text-lg`}
              style={{ color: active ? '#1D4E7A' : '#7A7A82' }}
              aria-hidden="true"
            />
            <span
              className="text-[9px]"
              style={{ color: active ? '#1D4E7A' : '#7A7A82' }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
