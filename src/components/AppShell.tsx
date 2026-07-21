'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Film, Home, Search, Tv, UserRound } from 'lucide-react'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/filmes', label: 'Filmes', icon: Film },
  { href: '/series', label: 'Séries', icon: Tv },
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/perfil', label: 'Perfil', icon: UserRound },
]

function LoadingOverlay() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)
  const [logoSize, setLogoSize] = useState<number | string>('40vw')

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth
      // For very large screens show the 750px logo
      if (w >= 1400) setLogoSize(750)
      else setLogoSize(Math.min(560, Math.floor(w * 0.5)))
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // Simulate loading progress tied to window load and a minimum time
    let mounted = true
    const targetDuration = 1400 // ms
    const start = Date.now()

    const tick = () => {
      const elapsed = Date.now() - start
      const p = Math.min(100, Math.floor((elapsed / targetDuration) * 100))
      if (mounted) setProgress(p)
      if (p < 100) requestAnimationFrame(tick)
      else setTimeout(() => { if (mounted) setVisible(false) }, 300)
    }

    requestAnimationFrame(tick)

    return () => { mounted = false; window.removeEventListener('resize', updateSize) }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 px-6">
        <div style={{ width: typeof logoSize === 'number' ? logoSize : undefined }} className="relative">
          <Image src="/logo.png" alt="logo" width={750} height={750} style={{ width: typeof logoSize === 'number' ? `${logoSize}px` : undefined, height: 'auto' }} priority />
        </div>

        <div className="w-full rounded-full bg-white/5 p-1">
          <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: 'var(--media-brand)' }} />
        </div>
        <div className="text-sm text-slate-400">Carregando... {progress}%</div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useSpatialNavigation()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Service Worker registrado com sucesso:', registration))
        .catch((error) => console.error('Erro ao registrar Service Worker:', error));
    }
  }, []);


  return (
    <div className="min-h-screen bg-black text-white">
      <LoadingOverlay />

            <aside className="fixed left-0 top-0 z-30 hidden h-full w-24 flex-col border-r border-white/10 bg-white/5 px-3 py-6 backdrop-blur-xl lg:flex">
        <div className="mb-6 flex h-24 w-full items-center justify-center rounded-2xl bg-transparent text-xl font-semibold">
          <Image src="/logo.png" alt="logo" width={120} height={120} className="object-contain h-20 w-auto" />
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                data-spatial-nav="true"
                data-spatial-group="sidebar"
                className={`group flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-center transition ${
                  isActive
                        ? 'text-slate-900'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                    style={isActive ? { backgroundColor: 'var(--media-brand)' } : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-2 text-[11px] font-medium tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="pb-24 lg:pl-0 lg:pb-0">
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
                data-spatial-nav="true"
                data-spatial-group="sidebar"
                className={`flex min-w-[56px] flex-col items-center rounded-full px-3 py-2 text-[11px] font-medium transition ${
                  isActive ? 'text-slate-900' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: 'var(--media-brand)' } : undefined}
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
