'use client'
import { useEffect, useState, useCallback } from 'react'

/**
 * Hook para suporte offline parcial em LG WebOS
 * Permite funcionamento básico sem conexão à internet
 */
export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)
  const [cachedContent, setCachedContent] = useState<any[]>([])

  // Detecta se está rodando em LG WebOS
  const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setOfflineMode(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOfflineMode(true)
      loadCachedContent()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verifica status inicial
    setIsOnline(navigator.onLine)
    if (!navigator.onLine) {
      setOfflineMode(true)
      loadCachedContent()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carrega conteúdo cacheado
  const loadCachedContent = useCallback(() => {
    try {
      const cached = localStorage.getItem('offline_content')
      if (cached) {
        setCachedContent(JSON.parse(cached))
      }
    } catch (e) {
      console.error('Erro ao carregar conteúdo cacheado:', e)
    }
  }, [])

  // Salva conteúdo para uso offline
  const cacheContent = useCallback((content: any[]) => {
    try {
      localStorage.setItem('offline_content', JSON.stringify(content))
      setCachedContent(content)
    } catch (e) {
      console.error('Erro ao salvar conteúdo cacheado:', e)
    }
  }, [])

  // Limpa cache offline
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem('offline_content')
      setCachedContent([])
    } catch (e) {
      console.error('Erro ao limpar cache offline:', e)
    }
  }, [])

  // Verifica se há conteúdo cacheado suficiente
  const hasCachedContent = useCallback(() => {
    return cachedContent.length > 0
  }, [cachedContent.length])

  // Função para pré-carregar conteúdo para uso offline
  const preloadContent = useCallback(async (contentIds: string[]) => {
    if (!isWebOS) return

    try {
      // Em uma implementação real, isso buscaria o conteúdo do Supabase
      // e salvaria no localStorage para uso offline
      const contentToCache = contentIds.slice(0, 50) // Limite de 50 itens
      cacheContent(contentToCache)
    } catch (e) {
      console.error('Erro ao pré-carregar conteúdo:', e)
    }
  }, [isWebOS, cacheContent])

  return {
    isOnline,
    offlineMode,
    cachedContent,
    loadCachedContent,
    cacheContent,
    clearCache,
    hasCachedContent,
    preloadContent,
  }
}
