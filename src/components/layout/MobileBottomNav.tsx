'use client'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from './SupabaseProvider'

function NavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const { user } = useAuth()

  // Não exibir na página de exibição (detalhes/player)
  if (pathname?.startsWith('/detalhes')) return null

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠', active: pathname === '/' },
    { href: '/filmes', label: 'Filmes', icon: '🎬', active: pathname === '/filmes' },
    { href: '/series', label: 'Séries', icon: '📺', active: pathname === '/series' },
    { href: '/perfil?tab=fav', label: 'Favoritos', icon: '❤️', active: pathname === '/perfil' && currentTab === 'fav' },
    { href: '/perfil?tab=later', label: 'Assistir Depois', icon: '⏰', active: pathname === '/perfil' && currentTab === 'later' },
    { href: '/localizar', label: 'Localizar', icon: '🔍', active: pathname === '/localizar' },
    { href: user ? '/perfil' : '/login', label: 'Perfil', icon: '👤', active: pathname === '/perfil' && !currentTab },
  ]

  return (
    <>
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${item.active ? 'active' : ''}`}
              aria-label={item.label}
              title={item.label}
            >
              <span className="icon">{item.icon}</span>
            </Link>
          )
        })}
      </nav>

      <style jsx>{`
        /* =========================================================
           PAIXAOFLIX - BARRA DE RODAPÉ MOBILE (MODELO 2 - GLASS)
           ========================================================= */
        
        .mobile-bottom-nav {
          position: fixed;
          bottom: 18px;
          left: 50% !important;
          right: auto !important;
          transform: translateX(-50%) !important;
          z-index: 5000;

          width: min(95vw, 860px);
          height: 80px;

          display: flex;
          justify-content: space-around;
          align-items: center;

          padding: 12px 18px;
          border-radius: 40px;

          /* efeito glass / fosco */
          background: rgba(20, 10, 10, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);

          /* borda metálica leve */
          border: 2px solid rgba(255, 140, 80, 0.22);

          /* sombra suave de flutuação */
          box-shadow:
            0px 18px 40px rgba(0, 0, 0, 0.75),
            0px 0px 16px rgba(255, 40, 40, 0.12);

          overflow: hidden;
          transition: transform 0.3s ease;
        }

        /* Ocultar em Desktop */
        @media (min-width: 769px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }

        /* brilho inferior bem discreto (efeito 3D) */
        .mobile-bottom-nav::after {
          content: "";
          position: absolute;
          bottom: -18px;
          left: 12%;
          width: 76%;
          height: 40px;
          background: radial-gradient(
            ellipse,
            rgba(255, 0, 0, 0.18) 0%,
            rgba(255, 0, 0, 0.08) 45%,
            rgba(255, 0, 0, 0.00) 70%
          );
          filter: blur(10px);
          opacity: 0.55;
          pointer-events: none;
        }

        /* linha superior metálica leve */
        .mobile-bottom-nav::before {
          content: "";
          position: absolute;
          top: 0;
          left: 8%;
          width: 84%;
          height: 2px;
          background: linear-gradient(
            90deg,
            rgba(255, 140, 80, 0.00) 0%,
            rgba(255, 180, 120, 0.22) 50%,
            rgba(255, 140, 80, 0.00) 100%
          );
          opacity: 0.55;
          pointer-events: none;
        }

        .nav-item {
          position: relative;
          z-index: 5;
          width: auto;
          height: 100%;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          cursor: pointer;
          border-radius: 18px;
          transition: 0.2s ease;
        }

        .nav-item .icon {
          font-size: 48px !important;
          width: 48px !important;
          height: 48px !important;
          min-width: 48px !important;
          min-height: 48px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 190, 90, 0.75);
          transition: 0.2s ease;
        }

        .nav-item.active {
          background: rgba(255, 0, 0, 0.06);
          border: 2px solid rgba(255, 60, 60, 0.15);
          box-shadow:
            inset 0px 0px 14px rgba(255, 0, 0, 0.15),
            0px 0px 18px rgba(255, 0, 0, 0.10);
        }

        .nav-item.active .icon,
        .nav-item.active .icon {
          color: rgba(255, 90, 60, 0.85);
        }

        .nav-item:hover {
          transform: translateY(-2px);
        }

        .nav-item:hover .icon,
        .nav-item:hover .icon {
          color: rgba(255, 220, 150, 0.95);
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            /* Centralização forçada para evitar desalinhamento à direita */
            left: 50% !important; /* Força a centralização */
            right: auto !important; /* Garante que 'right' não interfira */
            transform: translateX(-50%) !important; /* Ajusta a centralização */
            margin: 0 !important; /* Remove margens que possam empurrar */
            
            height: 120px !important; /* Altura ajustada para ícones maiores */
            border-radius: 30px;
            padding: 4px;
            bottom: 15px;
          }
          .nav-item {
            width: auto;
            flex: 1;
            height: 100px !important;
          }
          .nav-item .icon { font-size: 48px !important; width: 48px !important; height: 48px !important; min-width: 48px !important; }
        }
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