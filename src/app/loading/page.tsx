'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoadingPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [loadingStep, setLoadingStep] = useState('Iniciando...')

  useEffect(() => {
    let mounted = true

    async function loadData() {
      const steps = [
        { name: 'Carregando configurações...', duration: 800 },
        { name: 'Preparando interface...', duration: 600 },
        { name: 'Carregando dados do usuário...', duration: 700 },
        { name: 'Otimizando experiência...', duration: 500 },
        { name: 'Finalizando...', duration: 400 },
      ]

      let currentProgress = 0
      const progressIncrement = 100 / steps.length

      for (const step of steps) {
        if (!mounted) return

        setLoadingStep(step.name)

        // Simular progresso gradual dentro de cada step
        const stepProgress = progressIncrement / 10
        for (let i = 0; i < 10; i++) {
          if (!mounted) return
          await new Promise(resolve => setTimeout(resolve, step.duration / 10))
          currentProgress += stepProgress
          setProgress(Math.min(currentProgress, 100))
        }
      }

      if (mounted) {
        setProgress(100)
        setLoadingStep('Pronto!')

        // Marcar que o usuário já visitou
        localStorage.setItem('has_visited_before', 'true')

        // Pequeno delay para mostrar 100%
        await new Promise(resolve => setTimeout(resolve, 500))

        // Redirecionar para home
        router.replace('/')
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="mb-12 relative">
        <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px]">
          <Image
            src="/logo.png"
            alt="Cinema em Casa"
            fill
            className="object-contain animate-pulse"
            priority
          />
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-[#00ADEF] font-bold text-lg sm:text-xl uppercase tracking-wider">
            {loadingStep}
          </span>
          <span className="text-white font-bold text-lg sm:text-xl">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00ADEF] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </div>
      </div>

      {/* Texto de carregamento */}
      <p className="mt-8 text-gray-400 text-sm sm:text-base text-center">
        Preparando sua experiência de cinema...
      </p>
    </div>
  )
}
