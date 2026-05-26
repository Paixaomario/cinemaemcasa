'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-10 py-1 bg-black/60 sm:bg-black/60 backdrop-blur-lg border-b border-white/10 shadow-2xl transition-all duration-500 whitespace-nowrap">
      {/* Lado Esquerdo: Logo */}
      <div className="flex-shrink-0">
        <Link href="/home" className="focus:outline-none focus:ring-4 focus:ring-brand-cyan/40 rounded-[20px] transition-transform hover:scale-110 block">
          <Image
            src="/logo.png"
            alt="CINECASA"
            width={120}
            height={40}
            priority
            style={{ height: 'auto' }}
            className="object-contain w-24 sm:w-auto"
          />
        </Link>
      </div>

      {/* Centro: Menus Ampliados e Centralizados */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="hidden md:flex items-center gap-16">
          {[
            { href: '/home', label: 'Início' },
            { href: '/filmes', label: 'Filmes' },
            { href: '/series', label: 'Séries' },
            { href: '/favoritos', label: 'Favoritos' },
          ].map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`text-3xl font-black uppercase tracking-tighter transition-all outline-none 
                ${pathname === link.href 
                  ? 'text-brand-cyan drop-shadow-[0_0_10px_rgba(0,173,239,0.6)] scale-110' 
                  : 'text-white hover:text-brand-cyan focus:text-brand-cyan hover:scale-125 focus:scale-125'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lado Direito: Ações */}
      <div className="flex-shrink-0 flex items-center gap-6">
        {/* Ícone de Busca - Essencial para TV, oculto em mobile */}
        <Link
          href="/search"
          className="hidden sm:block p-2 hover:bg-white/10 rounded-[20px] focus:bg-white/20 focus:ring-4 focus:ring-brand-cyan/40 outline-none transition-all text-white hover:text-brand-cyan focus:text-brand-cyan"
        >
          <span className="text-4xl block">🔍</span>
        </Link>

        {/* Ícone de Perfil */}
        <Link
          href="/perfil"
          className="hidden sm:block p-2 hover:bg-white/10 rounded-[20px] focus:bg-white/20 focus:ring-4 focus:ring-brand-cyan/40 outline-none transition-all text-white hover:text-brand-cyan focus:text-brand-cyan"
        >
          <span className="text-4xl block">👤</span>
        </Link>
      </div>
    </nav>
  )
}
