'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5vw] py-0 bg-black/60 backdrop-blur-lg border-b border-white/10 shadow-2xl transition-all duration-500 whitespace-nowrap">
      {/* Lado Esquerdo: Logo */}
      <div className="flex-shrink-0">
        <Link href="/" className="focus:outline-none focus:ring-4 focus:ring-brand-cyan/40 rounded-[20px] transition-transform hover:scale-110 block">
          <Image 
            src="/logo.png" 
            alt="CINECASA" 
            width={304} 
            height={81} 
            priority
            className="nav-logo"
          />
        </Link>
      </div>

      {/* Centro: Menus centralizados perfeitamente */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-[3vw]">
        {[
          { href: '/', label: 'Início' },
          { href: '/filmes', label: 'Filmes' },
          { href: '/series', label: 'Séries' },
          { href: '/favoritos', label: 'Favoritos' },
        ].map((link) => (
          <Link 
            key={link.href}
            href={link.href} 
            className={`text-xl font-bold uppercase tracking-tight transition-all outline-none 
              ${pathname === link.href 
                ? 'text-brand-cyan drop-shadow-[0_0_10px_rgba(0,173,239,0.6)] scale-110' 
                : 'text-white hover:text-brand-cyan focus:text-brand-cyan hover:scale-125 focus:scale-125'
              }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Lado Direito: Ações (Busca e Perfil) */}
      <div className="flex items-center gap-3">
        <Link href="/search" className="p-2 hover:bg-white/10 rounded-full focus:ring-4 focus:ring-brand-cyan/40 outline-none transition-all text-white hover:text-brand-cyan">
          <span className="text-[27px] block">🔍</span>
        </Link>
        <Link href="/perfil" className="p-2 hover:bg-white/10 rounded-full focus:ring-4 focus:ring-brand-cyan/40 outline-none transition-all text-white hover:text-brand-cyan">
          <span className="text-[27px] block">👤</span>
        </Link>
      </div>
    </nav>
  )
}
