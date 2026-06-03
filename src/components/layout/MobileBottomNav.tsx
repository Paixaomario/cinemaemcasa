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
          <div className="nav-group">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon">{item.icon}</span>
                <span className="legend">{item.label}</span>
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
          background: linear-gradient(135deg, rgba(20, 20, 25, 0.9) 0%, rgba(10, 10, 15, 0.95) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(0, 173, 239, 0.4);
          border-radius: 28px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.9),
            0 0 20px rgba(0, 173, 239, 0.15),
            inset 0 1px 1px rgba(255, 255, 255, 0.1);
          padding: 12px 10px;
          transform: perspective(1000px) rotateX(2deg);
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

        .icon { font-size: 18px; margin-bottom: 4px; }
        .legend { 
          font-size: 9px; 
          font-weight: 800; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          opacity: 0.8;
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