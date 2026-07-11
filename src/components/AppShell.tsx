'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, Home, Search, Tv, UserRound } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/filmes', label: 'Filmes', icon: Film },
  { href: '/series', label: 'Séries', icon: Tv },
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/perfil', label: 'Perfil', icon: UserRound },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-24 flex-col border-r border-white/10 bg-black/95 px-3 py-6 lg:flex">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-xl font-semibold text-cyan-400">
          P
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-center transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-2 text-[11px] font-medium tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="pb-24 lg:pl-24 lg:pb-0">
        {children}
      </div>

      <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[56px] flex-col items-center rounded-full px-3 py-2 text-[11px] font-medium transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
