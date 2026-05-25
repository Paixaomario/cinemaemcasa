'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Film, Tv, Heart, Search, User } from 'lucide-react'

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Filmes', href: '/filmes', icon: Film },
  { name: 'Séries', href: '/series', icon: Tv },
  { name: 'Favoritos', href: '/favoritos', icon: Heart },
  { name: 'Localizar', href: '/buscar', icon: Search },
  { name: 'Perfil', href: '/perfil', icon: User },
]

export function MobileNavBar() {
  const pathname = usePathname()

  // Não mostrar na página de player (quando há parâmetros de player)
  if (pathname?.includes('/room/')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] sm:hidden">
      <div className="mx-4 mb-4">
        <div className="relative backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Efeito de brilho 3D */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
          
          <div className="relative flex items-center justify-around py-3 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  {/* Indicador ativo */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
                  )}
                  
                  {/* Container do ícone */}
                  <div
                    className={`
                      relative p-2 rounded-xl transition-all duration-300
                      ${isActive 
                        ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                        : 'text-neutral-400 group-hover:text-neutral-200 group-hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Efeito de brilho no ícone ativo */}
                    {isActive && (
                      <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-xl" />
                    )}
                    <Icon className="relative w-5 h-5" strokeWidth={2.5} />
                  </div>
                  
                  {/* Texto */}
                  <span
                    className={`
                      text-[10px] font-medium tracking-wide transition-all duration-300
                      ${isActive ? 'text-cyan-400 font-semibold' : 'text-neutral-500 group-hover:text-neutral-300'}
                    `}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
