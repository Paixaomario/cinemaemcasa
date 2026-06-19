'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Search, Film, Tv, Heart, Clock, User } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { href: '/search', icon: Search, label: 'Busca' },
    { href: '/home', icon: Home, label: 'Início' },
    { href: '/filmes', icon: Film, label: 'Filmes' },
    { href: '/series', icon: Tv, label: 'Séries' },
    { href: '/favoritos', icon: Heart, label: 'Minha Lista' },
    { href: '/assistir', icon: Clock, label: 'Histórico' },
    { href: '/perfil', icon: User, label: 'Perfil' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen hidden lg:flex flex-col w-[100px] z-[9999] group overflow-visible bg-black/90 backdrop-blur-md border-r border-white/10">
      {/* Container do Logotipo (Altura 121px) */}
      <div className="h-[121px] mt-4 flex items-center justify-center w-[100px] shrink-0 overflow-hidden pointer-events-none">
        <div className="relative w-[100px] flex items-center justify-center flex-none scale-125">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={120} 
            height={60} 
            className="object-contain transition-all duration-500 nav-logo" 
          />
        </div>
      </div>

      {/* Navegação: Colada ao logo para eliminar rolagem em TVs */}
      <nav className="mt-2 flex flex-col gap-3 px-0 overflow-y-auto no-scrollbar relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.href === '/' || item.href === '/home' ? 'sidebar-home-link' : undefined}
              tabIndex={0}
              className={`
                flex items-center transition-all duration-200 outline-none h-[64px] w-full shrink-0 relative z-20 pointer-events-auto
                ${isActive 
                  ? 'bg-brand-cyan text-black' 
                  : 'text-white hover:bg-white/20 hover:text-white focus:bg-brand-cyan focus:text-black'
                }
              `}
            >
              <div className="w-[100px] flex-none flex items-center justify-center">
                <Icon className="w-[36px] h-[36px]" strokeWidth={isActive ? 3 : 2} />
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Estilos de Foco para Smart TV */}
      <style jsx global>{`
        .using-keyboard aside a:focus {
          transform: scale(1.1) translateX(8px);
        }
      `}</style>
    </aside>
  )
}