'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Search, Film, Tv, Heart, Clock, User } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { href: '/search', icon: Search, label: 'Busca' },
    { href: '/', icon: Home, label: 'Início' },
    { href: '/filmes', icon: Film, label: 'Filmes' },
    { href: '/series', icon: Tv, label: 'Séries' },
    { href: '/favoritos', icon: Heart, label: 'Minha Lista' },
    { href: '/assistir', icon: Clock, label: 'Histórico' },
    { href: '/perfil', icon: User, label: 'Perfil' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen z-[6000] hidden lg:flex flex-col bg-black/40 hover:bg-black/95 focus-within:bg-black/95 w-[75px] hover:w-[195px] focus-within:w-[195px] transition-all duration-500 group border-r border-white/10 backdrop-blur-3xl shadow-[15px_0_50px_rgba(0,0,0,0.95)] overflow-hidden">
      {/* Container do Logotipo (Altura 121px) */}
      <div className="h-[121px] mt-4 mb-4 flex items-center px-0 overflow-hidden shrink-0">
        <div className="relative w-[75px] flex items-center justify-start pl-[10px] transition-all duration-500">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={240} 
            height={121} 
            className="object-contain transition-all duration-500 scale-[0.3125] origin-left nav-logo" 
          />
        </div>
      </div>

      {/* Itens de Navegação Centralizados Verticalmente */}
      <nav className="flex-1 flex flex-col justify-center gap-4 px-2 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={0}
              className={`
                flex items-center rounded-lg transition-all duration-200 outline-none h-[36px] lg:h-[51px] 2xl:h-[56px] w-full shrink-0
                ${isActive 
                  ? 'bg-brand-cyan/15 text-brand-cyan' 
                  : 'text-white hover:bg-white/10 hover:text-white focus:bg-brand-cyan focus:text-black focus:scale-110'
                }
              `}
            >
              <div className="w-[75px] flex-none flex items-center justify-center">
                <Icon className="w-[26px] h-[26px] transition-transform group-hover:scale-110" strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className="font-montserrat font-bold uppercase tracking-[0.1em] text-xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500 whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Estilos de Foco para Smart TV */}
      <style jsx global>{`
        .using-keyboard aside a:focus {
          transform: scale(1.05) translateX(5px);
        }
      `}</style>
    </aside>
  )
}