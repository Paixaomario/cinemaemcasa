'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';

const ITEMS = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/filmes', label: 'Filmes', icon: 'movie' },
  { href: '/series', label: 'Séries', icon: 'device-tv' },
  { href: '/busca', label: 'Buscar', icon: 'search' }
];

// Agente de menu lateral: efeito vidro (glass), encolhido mostrando só
// ícones quando não está em uso. Expande com nomes ao passar o mouse OU
// ao receber foco por controle remoto/setas (via :focus-within, sem
// depender de JS) — mesmo comportamento em Web e Smart TV.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        group hidden md:flex md:flex-col md:justify-between md:shrink-0
        w-[76px] hover:w-[220px] focus-within:w-[220px]
        transition-[width] duration-300 ease-out
        bg-black/40 backdrop-blur-xl border-r border-white/10
        py-5 overflow-hidden
      "
    >
      <div>
        <div className="px-[26px] mb-7 h-9 flex items-center relative">
          <Logo iconOnly width={28} className="absolute left-[26px] group-hover:opacity-0 group-focus-within:opacity-0 transition-opacity duration-200 shrink-0" />
          <Logo
            width={140}
            className="
              opacity-0 -translate-x-1
              group-hover:opacity-100 group-hover:translate-x-0
              group-focus-within:opacity-100 group-focus-within:translate-x-0
              transition-all duration-300
            "
          />
        </div>

        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focusable flex items-center gap-3 px-[26px] py-3 text-sm whitespace-nowrap ${
                  active ? 'bg-accent/70 text-white border-l-2 border-gold' : 'text-textmuted hover:text-white'
                }`}
              >
                <i className={`ti ti-${item.icon} text-lg shrink-0`} aria-hidden="true" />
                <span
                  className="
                    max-w-0 opacity-0 overflow-hidden
                    group-hover:max-w-[140px] group-hover:opacity-100
                    group-focus-within:max-w-[140px] group-focus-within:opacity-100
                    transition-all duration-300
                  "
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href="/admin"
          className="focusable flex items-center gap-3 px-[26px] py-3 text-sm text-textmuted hover:text-white whitespace-nowrap"
        >
          <i className="ti ti-settings text-lg shrink-0" aria-hidden="true" />
          <span
            className="
              max-w-0 opacity-0 overflow-hidden
              group-hover:max-w-[140px] group-hover:opacity-100
              group-focus-within:max-w-[140px] group-focus-within:opacity-100
              transition-all duration-300
            "
          >
            Configurações
          </span>
        </Link>
        <Link
          href="/perfil"
          className="focusable flex items-center gap-3 px-[26px] py-3 text-sm text-textmuted hover:text-white whitespace-nowrap"
        >
          <span className="w-[22px] h-[22px] rounded-full bg-accent flex items-center justify-center text-[10px] shrink-0">
            <i className="ti ti-user" aria-hidden="true" />
          </span>
          <span
            className="
              max-w-0 opacity-0 overflow-hidden
              group-hover:max-w-[140px] group-hover:opacity-100
              group-focus-within:max-w-[140px] group-focus-within:opacity-100
              transition-all duration-300
            "
          >
            Perfil
          </span>
        </Link>
      </div>
    </aside>
  );
}
