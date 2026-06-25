'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { startCatalogSync, stopCatalogSync } from '@/lib/catalogSync'
import type { User, Session } from '@supabase/supabase-js'

interface Ctx {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthCtx = createContext<Ctx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthCtx)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Inicia sincronização automática do catálogo globalmente
  // Temporariamente desabilitado para corrigir erro React #310
  /*
  useEffect(() => {
    startCatalogSync()
    return () => stopCatalogSync()
  }, [])
  */

  // Lógica de Navegação Espacial para Smart TVs e Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) return

      // Prioriza elementos com tabindex="0" para navegação espacial, depois elementos interativos padrão
      const selectors = '[tabindex="0"]:not([disabled]), a:not([disabled]), button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
      
      // Otimização Avançada: Cache de elementos e verificação de visibilidade inteligente
      const rawElements = Array.from(document.querySelectorAll(selectors)) as HTMLElement[];
      const focusableItems: { el: HTMLElement; rect: DOMRect; isInSidebar: boolean }[] = [];
      
      // Identifica a sidebar fora do loop para economizar CPU
      const sidebar = document.querySelector('aside');

      for (let i = 0; i < rawElements.length; i++) {
        const el = rawElements[i];
        // offsetWidth/Height é muito mais rápido que getComputedStyle
        if (!el.hasAttribute('disabled') && (el.offsetWidth > 0 || el.offsetHeight > 0)) {
          focusableItems.push({
            el,
            rect: el.getBoundingClientRect(),
            isInSidebar: sidebar ? sidebar.contains(el) : false
          });
        }
      }
      
      const active = document.activeElement as HTMLElement
      const activeItem = focusableItems.find(item => item.el === active);

      // Se nada estiver focado, foca no primeiro elemento disponível
      if (!activeItem || active === document.body) {
        if (focusableItems.length > 0) focusableItems[0].el.focus()
        return
      }

      if (key === 'Enter') return // Enter nativo funciona em links/botões

      const activeRect = activeItem.rect
      const isInSidebar = activeItem.isInSidebar

      let nearest: HTMLElement | null = null

      if (key === 'ArrowRight') {
        if (isInSidebar) {
          // OBRIGATÓRIO: Se estiver no menu, vai para o primeiro elemento focável da página principal.
          const mainContent = focusableItems.filter(item => !item.isInSidebar);
          nearest = mainContent.length > 0 ? mainContent[0].el : null;
          if (nearest) { 
            e.preventDefault(); 
            nearest.focus();
            return;
          }
        }

        // Busca elementos na mesma linha (ou próxima linha visualmente)
        const sameRowElements = focusableItems.filter(item => 
          !item.isInSidebar && 
          Math.abs(item.rect.top - activeRect.top) < 60
        );

        // Busca o próximo elemento à direita na mesma linha
        const toRightInRow = sameRowElements.filter(item => item.rect.left >= activeRect.right - 5);
        if (toRightInRow.length > 0) {
          const nextItem = toRightInRow.reduce((prev, curr) => 
            curr.rect.left < prev.rect.left ? curr : prev
          );
          nearest = nextItem.el;
        } else {
          // Se não há mais à direita na linha, tenta "wrap around" para o início da mesma linha
          const firstInRow = sameRowElements.reduce((prev, curr) => 
            curr.rect.left < prev.rect.left ? curr : prev
          );
          if (firstInRow && firstInRow.el !== active) nearest = firstInRow.el;
        }
      } else if (key === 'ArrowLeft') {
        const sameRowElements = focusableItems.filter(item => 
          !item.isInSidebar && 
          Math.abs(item.rect.top - activeRect.top) < 60
        );

        // Busca o próximo elemento à esquerda na mesma linha
        const toLeftInRow = sameRowElements.filter(item => item.rect.right <= activeRect.left + 5);
        if (toLeftInRow.length > 0) {
          const nextItem = toLeftInRow.reduce((prev, curr) => 
            curr.rect.right > prev.rect.right ? curr : prev
          );
          nearest = nextItem.el;
        } else {
          // Se não há mais à esquerda na linha, tenta "wrap around" para o final da mesma linha
          const lastInRow = sameRowElements.reduce((prev, curr) => 
            curr.rect.right > prev.rect.right ? curr : prev
          );
          if (lastInRow && lastInRow.el !== active) nearest = lastInRow.el;
        }

        // OBRIGATÓRIO: Se não houver nada à esquerda no conteúdo, foca obrigatoriamente no ícone Home da Sidebar
        if (!nearest && !isInSidebar) {
          nearest = document.getElementById('sidebar-home-link') as HTMLElement || null;
        }
      } else if (key === 'ArrowDown') {
        const below = focusableItems.filter(item => item.rect.top >= activeRect.bottom - 5 && item.el !== active && item.isInSidebar === isInSidebar)
        if (below.length > 0) {
          const minTop = Math.min(...below.map(item => item.rect.top))
          const nextRow = below.filter(item => Math.abs(item.rect.top - minTop) < 60)
          
          if (isInSidebar) {
            nearest = nextRow[0].el
          } else if (nextRow.length > 0) {
            const nextItem = nextRow.reduce((prev, curr) => {
              const prevDiff = Math.abs(prev.rect.left - activeRect.left);
              const currDiff = Math.abs(curr.rect.left - activeRect.left);
              return currDiff < prevDiff ? curr : prev;
            });
            nearest = nextItem.el;
          } // Tenta manter a coluna
        } else if (!isInSidebar && active.id === 'search-input') {
          // Se estiver no input de busca e acionar para baixo, foca no primeiro item do grid principal
          const firstMainItem = document.querySelector('main [tabindex="0"]') as HTMLElement;
          if (firstMainItem) nearest = firstMainItem;
        }
      } else if (key === 'ArrowUp') {
        const above = focusableItems.filter(item => item.rect.bottom <= activeRect.top + 5 && item.el !== active && item.isInSidebar === isInSidebar)
        if (above.length > 0) {
          const maxBottom = Math.max(...above.map(item => item.rect.bottom))
          const prevRow = above.filter(item => Math.abs(item.rect.bottom - maxBottom) < 60)
          
          if (isInSidebar) {
            nearest = prevRow[0].el
          } else if (prevRow.length > 0) {
            const nextItem = prevRow.reduce((prev, curr) => {
              const prevDiff = Math.abs(prev.rect.left - activeRect.left);
              const currDiff = Math.abs(curr.rect.left - activeRect.left);
              return currDiff < prevDiff ? curr : prev;
            });
            nearest = nextItem.el;
          }
        }

        // Se não houver nada acima no conteúdo (primeira linha), volta obrigatoriamente para a caixa de pesquisa
        if (!nearest && !isInSidebar && active.closest('main')) {
          const searchInput = document.getElementById('search-input') as HTMLElement;
          if (searchInput) nearest = searchInput;
        }
      }

      if (nearest) {
        e.preventDefault() // Só impede o scroll padrão se houver um alvo válido
        const targetElement = nearest as HTMLElement
        targetElement.focus()
        // Algumas TVs antigas não suportam smooth behavior, adicionamos fallback
        try { targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch(e) { targetElement.scrollIntoView(false); }
      }
    }

    // Intercepta erros de "Loading chunk failed" (Página Inexistente após ociosidade)
    const handleChunkError = (e: ErrorEvent) => {
      if (e.message.toLowerCase().includes('loading chunk') || e.message.toLowerCase().includes('unexpected token <')) {
        console.warn('Detectado erro de versão/chunk. Recarregando sistema...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('error', handleChunkError);
    };
  }, [])

  const signOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
  }

  return (
    <AuthCtx.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}
