'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Search, Film, Tv, Heart, Clock, User } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { href: '/search', icon: Search, label: 'Pesquisar' },
    { href: '/', icon: Home, label: 'Início' },
    { href: '/filmes', icon: Film, label: 'Filmes' },
    { href: '/series', icon: Tv, label: 'Séries' },
    { href: '/favoritos', icon: Heart, label: 'Favoritos' },
    { href: '/assistir', icon: Clock, label: 'Ver Depois' },
    { href: '/perfil', icon: User, label: 'Minha Conta' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen z-[6000] hidden lg:flex flex-col bg-gradient-to-r from-black via-black/95 to-transparent w-20 hover:w-64 transition-all duration-300 group border-r border-white/5 backdrop-blur-xl">
      {/* Logo no Topo */}
      <div className="p-6 mb-10 overflow-hidden">
        <div className="w-10 group-hover:w-32 transition-all duration-300">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={120} 
            height={40} 
            className="object-contain nav-logo" 
          />
        </div>
      </div>

      {/* Navegação Central */}
      <nav className="flex-1 flex flex-col gap-2 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={0}
              className={`
                flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 outline-none
                ${isActive 
                  ? 'bg-brand-cyan/20 text-brand-cyan' 
                  : 'text-neutral-400 hover:bg-white/10 hover:text-white focus:bg-brand-cyan focus:text-black'
                }
              `}
            >
              <Icon size={28} strokeWidth={isActive ? 3 : 2} className="flex-shrink-0" />
              <span className="font-montserrat font-bold uppercase tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Indicador de Foco para TV */}
      <style jsx global>{`
        .using-keyboard aside *:focus {
          transform: scale(1.1) translateX(10px);
          box-shadow: 0 0 30px rgba(0, 173, 239, 0.4) !important;
        }
      `}</style>
    </aside>
  )
}