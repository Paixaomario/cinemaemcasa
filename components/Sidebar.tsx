'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/filmes', label: 'Filmes', icon: 'movie' },
  { href: '/series', label: 'Séries', icon: 'device-tv' },
  { href: '/busca', label: 'Buscar', icon: 'search' }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:justify-between md:w-[220px] md:shrink-0 bg-panel border-r border-border py-5">
      <div>
        <p className="px-5 mb-7 text-sm font-medium text-gold tracking-wide">
          CINEMA EM CASA
        </p>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focusable flex items-center gap-3 px-5 py-3 text-sm ${
                  active
                    ? 'bg-accent text-white border-l-2 border-gold -ml-[2px] pl-[22px]'
                    : 'text-textmuted hover:text-white'
                }`}
              >
                <i className={`ti ti-${item.icon} text-lg`} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href="/admin"
          className="focusable flex items-center gap-3 px-5 py-3 text-sm text-textmuted hover:text-white"
        >
          <i className="ti ti-settings text-lg" aria-hidden="true" />
          Configurações
        </Link>
        <Link
          href="/perfil"
          className="focusable flex items-center gap-3 px-5 py-3 text-sm text-textmuted hover:text-white"
        >
          <span className="w-[22px] h-[22px] rounded-full bg-accent flex items-center justify-center text-[10px]">
            <i className="ti ti-user" aria-hidden="true" />
          </span>
          Perfil
        </Link>
      </div>
    </aside>
  );
}
