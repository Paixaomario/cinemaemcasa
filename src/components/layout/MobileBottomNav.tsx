'use client'
import React, { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from './SupabaseProvider'

function NavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const { user } = useAuth()

  // Visível em todas as páginas, o player usará Z-index superior para cobrir
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/filmes', label: 'Filmes', icon: '🎬' },
    { href: '/series', label: 'Séries', icon: '📺' },
    { href: '/search', label: 'Localizar', icon: '🔍' },
    { href: user ? '/perfil' : '/login', label: 'Perfil', icon: '👤' },
  ]

  return (
    <>
      <nav className="mobile-bottom-nav">
        <div className="nav-wrapper">
          {/* Lado Esquerdo */}
          <div className="nav-group">
            {navItems.slice(0, 3).map((item) => (
              <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span>
              </Link>
            ))}
          </div>

          {/* Logo Central */}
          <div className="logo-center">
            <Image src="/logo.png" alt="CineCasa" width={48} height={48} objectFit="contain" priority />
          </div>

          {/* Lado Direito */}
          <div className="nav-group">
            {navItems.slice(3).map((item) => (
              <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <style jsx>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 25px;
          left: 5% !important;
          right: 5% !important;
          width: 90% !important;
          max-width: 450px !important;
          margin: 0 auto !important;
          z-index: 9999;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(0, 173, 239, 0.35);
          border-radius: 28px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 173, 239, 0.15);
          padding: 8px 5px;
        }

        .nav-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .nav-group {
          display: flex;
          flex: 1;
          justify-content: space-evenly;
          align-items: center;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-item.active {
          color: #00ADEF;
          transform: translateY(-3px);
        }

        .icon { font-size: 26px; }

        .logo-center {
          width: 68px;
          height: 68px;
          background: #000;
          border: 2px solid #00ADEF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: -45px 10px 0 10px;
          box-shadow: 0 8px 20px rgba(0, 173, 239, 0.4);
          overflow: hidden;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        @media (min-width: 1024px) { .mobile-bottom-nav { display: none !important; } }
      `}</style>
    </>
  )
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <NavContent />
    </Suspense>
  )
}