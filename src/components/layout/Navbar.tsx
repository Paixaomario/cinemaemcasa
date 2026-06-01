'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[4vw] py-0 bg-black/40 hover:bg-black/80 backdrop-blur-md border-b border-white/5 shadow-2xl transition-all duration-500 whitespace-nowrap">
      {/* Lado Esquerdo: Logo */}
      <div className="flex-shrink-0 relative z-10">
        <Link href="/" tabIndex={0} className="focus:outline-none transition-transform hover:scale-105 active:scale-95 block">
          <Image 
            src="/logo.png" 
            alt="CINECASA" 
            width={450} 
            height={121} 
            priority
            className="nav-logo"
          />
        </Link>
      </div>

      {/* Centro: Menus centralizados perfeitamente */}
      <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
        <div className="flex items-center gap-[2.5vw] pointer-events-auto">
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
              className={`text-lg font-bold uppercase tracking-widest transition-all duration-300 outline-none
                ${pathname === link.href 
                  ? 'text-brand-cyan drop-shadow-[0_0_15px_rgba(0,173,239,0.5)] scale-110' 
                  : 'text-white/70 hover:text-white focus:text-brand-cyan focus:scale-110'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lado Direito: Ações com z-index para ficar acima do container central */}
      <div className="flex items-center gap-4 relative z-10">
        <Link href="/search" tabIndex={0} className="p-3 hover:bg-white/10 rounded-full focus:bg-brand-cyan focus:text-black outline-none transition-all">
          <span className="text-[24px] block">🔍</span>
        </Link>
        <Link href="/perfil" tabIndex={0} className="p-3 hover:bg-white/10 rounded-full focus:bg-brand-cyan focus:text-black outline-none transition-all">
          <span className="text-[24px] block">👤</span>
        </Link>
      </div>
    </nav>
  )
}
