'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Search, Film, Tv, Heart, Clock, User, Settings } from 'lucide-react'

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
    <aside className="fixed left-0 top-0 h-screen z-[6000] hidden lg:flex flex-col bg-black/40 hover:bg-black/95 focus-within:bg-black/95 w-[75px] hover:w-72 focus-within:w-72 transition-all duration-500 group border-r border-white/10 backdrop-blur-3xl shadow-[20px_0_60px_rgba(0,0,0,0.95)] overflow-hidden">
      {/* Container do Logotipo (Altura 121px) */}
      <div className="h-[121px] mt-4 mb-4 flex items-center px-4 overflow-hidden shrink-0">
        <div className="relative w-full flex items-center justify-center group-hover:justify-start group-focus-within:justify-start transition-all duration-500">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={300} 
            height={121} 
            className="object-contain transition-all duration-500 scale-[0.32] group-hover:scale-100 group-focus-within:scale-100 origin-center group-hover:origin-left nav-logo" 
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
                flex items-center rounded-xl transition-all duration-300 outline-none h-9 w-full shrink-0
                ${isActive 
                  ? 'bg-brand-cyan/20 text-brand-cyan' 
                  : 'text-neutral-400 hover:bg-white/10 hover:text-white focus:bg-brand-cyan focus:text-black focus:scale-110'
                }
              `}
            >
              <div className="w-[75px] flex-shrink-0 flex items-center justify-center">
                <Icon size={26} strokeWidth={isActive ? 2.5 : 1.5} className="transition-transform group-hover:scale-110" />
              </div>
              <span className="font-montserrat font-bold uppercase tracking-[0.1em] text-xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500 whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Rodapé: Configurações */}
      <div className="p-2 mb-6 shrink-0">
        <Link
          href="/perfil?tab=settings"
          tabIndex={0}
          className="flex items-center rounded-xl text-neutral-500 hover:text-white focus:bg-white/10 outline-none transition-all h-[36px] w-full"
        >
          <div className="w-[75px] flex-shrink-0 flex items-center justify-center">
            <Settings size={26} />
          </div>
          <span className="font-montserrat font-bold uppercase tracking-[0.1em] text-[10px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity whitespace-nowrap">
            Configurações
          </span>
        </Link>
      </div>

      {/* Estilos de Foco para Smart TV */}
      <style jsx global>{`
        .using-keyboard aside a:focus {
          transform: scale(1.05) translateX(5px);
        }
      `}</style>
    </aside>
  )
}