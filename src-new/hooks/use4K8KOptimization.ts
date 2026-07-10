'use client'
import { useEffect, useState, useCallback } from 'react'

/**
 * Hook para otimizar performance para 4K/8K em LG WebOS
 * Detecta resolução e ajusta configurações automaticamente
 */
export function use4K8KOptimization() {
  const [resolution, setResolution] = useState<'HD' | 'FHD' | '4K' | '8K'>('FHD')
  const [refreshRate, setRefreshRate] = useState(60)
  const [isHDR, setIsHDR] = useState(false)
  const [isOLED, setIsOLED] = useState(false)

  // Detecta se está rodando em LG WebOS
  const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

  useEffect(() => {
    if (!isWebOS) return

    const detectDisplay = () => {
      const width = window.screen.width
      const height = window.screen.height
      const pixelCount = width * height

      // Detecta resolução
      if (pixelCount >= 7680 * 4320) {
        setResolution('8K')
      } else if (pixelCount >= 3840 * 2160) {
        setResolution('4K')
      } else if (pixelCount >= 1920 * 1080) {
        setResolution('FHD')
      } else {
        setResolution('HD')
      }

      // Detecta taxa de refresh (aproximado)
      const webOS = (window as any).webOS
      const refreshRateValue = webOS?.platform?.tv?.refreshRate || 60
      setRefreshRate(refreshRateValue)

      // Detecta HDR (via CSS media query)
      const isHDRSupported = window.matchMedia('(dynamic-range: high)').matches
      setIsHDR(isHDRSupported)

      // Detecta OLED (via user agent)
      const userAgent = navigator.userAgent
      setIsOLED(userAgent.includes('OLED'))
    }

    detectDisplay()

    // Atualiza se a janela for redimensionada
    const handleResize = () => {
      detectDisplay()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isWebOS])

  // Função para obter configurações otimizadas baseadas na resolução
  const getOptimizedSettings = useCallback(() => {
    const settings = {
      // Imagens
      imageQuality: resolution === '8K' ? 'ultra' : resolution === '4K' ? 'high' : 'medium',
      imageFormat: isHDR ? 'webp-hdr' : 'webp',
      imageSize: resolution === '8K' ? 'original' : resolution === '4K' ? 'w780' : 'w500',
      
      // Vídeo
      videoQuality: resolution === '8K' ? '8K' : resolution === '4K' ? '4K' : '1080p',
      videoBitrate: resolution === '8K' ? 25000 : resolution === '4K' ? 15000 : 5000,
      enableHDR: isHDR,
      enableDolbyVision: isHDR && isOLED,
      
      // Renderização
      enableHardwareAcceleration: true,
      enableGPUAcceleration: true,
      renderScale: resolution === '8K' ? 1.5 : resolution === '4K' ? 1.2 : 1.0,
      
      // Performance
      enableVirtualScroll: resolution === '8K' || resolution === '4K',
      renderBatchSize: resolution === '8K' ? 5 : resolution === '4K' ? 10 : 20,
      lazyLoadThreshold: resolution === '8K' ? 200 : resolution === '4K' ? 100 : 50,
      
      // Animações
      enableAnimations: refreshRate >= 120,
      animationDuration: refreshRate >= 120 ? 16 : refreshRate >= 60 ? 16 : 33,
      enableTransitions: true,
      
      // Cache
      cacheSize: resolution === '8K' ? 5 : resolution === '4K' ? 10 : 20,
      cacheDuration: 10 * 60 * 1000, // 10 minutos
      
      // Network
      requestTimeout: 30000,
      retryAttempts: 3,
      enableAdaptiveBitrate: true,
    }

    return settings
  }, [resolution, refreshRate, isHDR, isOLED])

  // Função para habilitar otimizações de GPU
  const enableGPUAcceleration = useCallback(() => {
    if (!isWebOS) return

    // Habilita aceleração de hardware via CSS
    document.body.style.willChange = 'transform'
    document.body.style.transform = 'translateZ(0)'
    
    // Habilita composição de GPU para elementos animados
    const animatedElements = document.querySelectorAll('[data-animate]')
    animatedElements.forEach(el => {
      const element = el as HTMLElement
      element.style.willChange = 'transform, opacity'
      element.style.transform = 'translateZ(0)'
    })
  }, [isWebOS])

  // Função para otimizar imagens para 4K/8K
  const optimizeImages = useCallback(() => {
    if (!isWebOS) return

    const settings = getOptimizedSettings()
    const images = document.querySelectorAll('img')

    images.forEach(img => {
      const src = (img as HTMLImageElement).src
      
      // Substitui URLs de imagem por versões otimizadas
      if (src.includes('tmdb.org')) {
        const optimizedSrc = src.replace(/\/w\d+\//, `/${settings.imageSize}/`)
        ;(img as HTMLImageElement).src = optimizedSrc
      }
    })
  }, [isWebOS, getOptimizedSettings])

  // Função para otimizar vídeo para 4K/8K
  const optimizeVideo = useCallback(() => {
    if (!isWebOS) return

    const settings = getOptimizedSettings()
    const videos = document.querySelectorAll('video')

    videos.forEach(video => {
      // Configura qualidade do vídeo
      if (settings.enableHDR) {
        video.setAttribute('playsinline', 'true')
      }
      
      // Habilita hardware decoding
      ;(video as HTMLVideoElement).setAttribute('webkit-playsinline', 'true')
    })
  }, [isWebOS])

  // Aplica otimizações ao montar
  useEffect(() => {
    if (!isWebOS) return

    enableGPUAcceleration()
    optimizeImages()
    optimizeVideo()
  }, [isWebOS, enableGPUAcceleration, optimizeImages, optimizeVideo])

  return {
    resolution,
    refreshRate,
    isHDR,
    isOLED,
    getOptimizedSettings,
    enableGPUAcceleration,
    optimizeImages,
    optimizeVideo,
  }
}
