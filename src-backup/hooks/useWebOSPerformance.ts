'use client'
import { useEffect, useState, useCallback } from 'react'

/**
 * Hook para otimizar performance em LG WebOS TVs antigas
 * Detecta limitações de hardware e ajusta configurações automaticamente
 */
export function useWebOSPerformance() {
  const [isLowMemoryDevice, setIsLowMemoryDevice] = useState(false)
  const [isOldWebOS, setIsOldWebOS] = useState(false)
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high')

  // Detecta se está rodando em LG WebOS
  const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

  useEffect(() => {
    if (!isWebOS) return

    // Detecta versão do WebOS
    const webOSVersion = (window as any).webOS?.platform?.tv?.version || '0.0'
    const versionParts = webOSVersion.split('.').map(Number)
    const majorVersion = versionParts[0] || 0

    // Considera WebOS 3.0 e anteriores como "antigo"
    setIsOldWebOS(majorVersion < 4)

    // Detecta memória disponível (aproximado)
    const detectMemory = () => {
      try {
        // Tenta detectar memória via navigator.deviceMemory
        const deviceMemory = (navigator as any).deviceMemory
        if (deviceMemory && deviceMemory < 2) {
          setIsLowMemoryDevice(true)
          setPerformanceMode('low')
        } else if (deviceMemory && deviceMemory < 4) {
          setPerformanceMode('medium')
        } else {
          setPerformanceMode('high')
        }
      } catch (e) {
        // Fallback: assume performance medium se não conseguir detectar
        setPerformanceMode('medium')
      }
    }

    detectMemory()

    // Detecta CPU cores (aproximado)
    const detectCPU = () => {
      try {
        const cpuCores = navigator.hardwareConcurrency || 2
        if (cpuCores < 4) {
          setPerformanceMode(prev => prev === 'high' ? 'medium' : prev)
        }
      } catch (e) {
        // Ignora erro
      }
    }

    detectCPU()

    // Detecta se é TV antiga baseado em user agent
    const userAgent = navigator.userAgent
    if (userAgent.includes('WebOS') && userAgent.includes('2018') || userAgent.includes('2017')) {
      setIsOldWebOS(true)
      setPerformanceMode('low')
    }

  }, [isWebOS])

  // Função para obter configurações otimizadas baseadas no modo de performance
  const getOptimizedSettings = useCallback(() => {
    const settings = {
      // Imagens
      imageQuality: performanceMode === 'low' ? 'low' : performanceMode === 'medium' ? 'medium' : 'high',
      lazyLoadThreshold: performanceMode === 'low' ? 100 : performanceMode === 'medium' ? 50 : 0,
      preloadImages: performanceMode !== 'low',
      
      // Animações
      enableAnimations: performanceMode !== 'low',
      animationDuration: performanceMode === 'low' ? 0 : performanceMode === 'medium' ? 200 : 300,
      enableTransitions: performanceMode !== 'low',
      
      // Cache
      cacheSize: performanceMode === 'low' ? 10 : performanceMode === 'medium' ? 50 : 100,
      cacheDuration: performanceMode === 'low' ? 5 * 60 * 1000 : 30 * 60 * 1000, // 5min vs 30min
      
      // Renderização
      virtualScroll: performanceMode === 'low',
      renderBatchSize: performanceMode === 'low' ? 10 : performanceMode === 'medium' ? 20 : 50,
      
      // Network
      requestTimeout: performanceMode === 'low' ? 10000 : 30000,
      retryAttempts: performanceMode === 'low' ? 2 : 3,
      
      // Features
      enableRealtime: performanceMode !== 'low',
      enableVoiceSearch: performanceMode !== 'low',
      enableSpatialNavigation: true,
    }

    return settings
  }, [performanceMode])

  // Função para limpar memória periodicamente
  const cleanupMemory = useCallback(() => {
    if (!isWebOS || performanceMode === 'high') return

    // Limpa caches não essenciais
    if (typeof window !== 'undefined') {
      // Limpa imagens não visíveis
      const images = document.querySelectorAll('img[data-src]')
      images.forEach(img => {
        const rect = img.getBoundingClientRect()
        if (rect.top > window.innerHeight || rect.bottom < 0) {
          img.removeAttribute('src')
        }
      })

      // Força garbage collection se disponível
      if ((window as any).gc) {
        (window as any).gc()
      }
    }
  }, [isWebOS, performanceMode])

  // Limpa memória periodicamente em dispositivos de baixa performance
  useEffect(() => {
    if (!isWebOS || performanceMode === 'high') return

    const interval = setInterval(() => {
      cleanupMemory()
    }, 60000) // A cada 60 segundos

    return () => clearInterval(interval)
  }, [isWebOS, performanceMode, cleanupMemory])

  // Função para desabilitar features pesadas
  const disableHeavyFeatures = useCallback(() => {
    // Desabilita animações pesadas
    document.body.classList.add('reduce-motion')
    
    // Desabilita backdrop-filter (muito pesado em TVs antigas)
    document.body.style.backdropFilter = 'none'
    
    // Desabilita box-shadow pesado
    document.body.classList.add('reduce-shadows')
  }, [])

  // Função para habilitar features otimizadas
  const enableOptimizedFeatures = useCallback(() => {
    const settings = getOptimizedSettings()
    
    // Aplica configurações de animação
    if (!settings.enableAnimations) {
      document.body.classList.add('no-animations')
    }
    
    // Aplica configurações de transição
    if (!settings.enableTransitions) {
      document.body.classList.add('no-transitions')
    }
    
    // Aplica configurações de imagem
    if (settings.imageQuality === 'low') {
      document.body.classList.add('low-quality-images')
    }
  }, [getOptimizedSettings])

  // Aplica otimizações ao montar
  useEffect(() => {
    if (!isWebOS) return

    if (performanceMode === 'low') {
      disableHeavyFeatures()
    }
    
    enableOptimizedFeatures()
  }, [isWebOS, performanceMode, disableHeavyFeatures, enableOptimizedFeatures])

  return {
    isLowMemoryDevice,
    isOldWebOS,
    performanceMode,
    getOptimizedSettings,
    cleanupMemory,
  }
}
