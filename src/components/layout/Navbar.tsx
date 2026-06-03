'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, User } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[4vw] py-0 bg-black/40 hover:bg-black/80 backdrop-blur-md border-b border-white/5 shadow-2xl transition-all duration-500 whitespace-nowrap h-[121px]">
      {/* Lado Esquerdo: Logo */}
      <div className="flex-shrink-0 relative z-20">
        <Link href="/" tabIndex={0} className="focus:outline-none transition-transform hover:scale-105 block">
          <Image 
            src="/logo.png" 
            alt="CINECASA" 
            width={320} 
            height={121}
            priority
            className="nav-logo"
          />
        </Link>
      </div>

      {/* Centro: Menus centralizados matematicamente */}
      <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
        <div className="flex items-center gap-[2.5vw] pointer-events-auto relative z-10">
          {[
            { href: '/', label: 'Início' },
            { href: '/filmes', label: 'Filmes' },
            { href: '/series', label: 'Séries' },
            { href: '/favoritos', label: 'Favoritos' },
          ].map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              tabIndex={0}
              className={`text-lg font-bold uppercase tracking-widest transition-all duration-300 outline-none px-4 py-2 rounded-xl
                ${pathname === link.href 
                  ? 'text-brand-cyan drop-shadow-[0_0_15px_rgba(0,173,239,0.5)] scale-110' 
                  : 'text-white hover:text-white focus:text-brand-cyan focus:scale-110'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lado Direito: Ações (Busca e Perfil) */}
      <div className="flex items-center gap-4 relative z-20">
        <Link 
          href="/search" 
          tabIndex={0} 
          className={`p-3 hover:bg-white/10 rounded-full outline-none transition-all ${pathname === '/search' ? 'text-brand-cyan' : 'text-white'}`} 
          aria-label="Pesquisar"
        >
          <Search size={24} />
        </Link>
        <Link 
          href="/perfil" 
          tabIndex={0} 
          className={`p-3 hover:bg-white/10 rounded-full outline-none transition-all ${pathname === '/perfil' ? 'text-brand-cyan' : 'text-white'}`} 
          aria-label="Perfil"
        >
          <User size={24} />
        </Link>
      </div>
    </nav>
  )
}
