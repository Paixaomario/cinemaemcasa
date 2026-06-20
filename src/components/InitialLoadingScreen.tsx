'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export function InitialLoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isCancelled = false

    // Simula carregamento do sistema em segundo plano
    const loadSystem = async () => {
      const steps = [
        { progress: 10, delay: 200 },  // Inicialização
        { progress: 30, delay: 400 },  // Carregando configurações
        { progress: 50, delay: 600 },  // Conectando ao Supabase
        { progress: 70, delay: 800 },  // Carregando dados do usuário
        { progress: 85, delay: 1000 }, // Pré-carregando imagens
        { progress: 95, delay: 1200 }, // Finalizando
        { progress: 100, delay: 1400 }  // Pronto
      ]

      for (const step of steps) {
        if (isCancelled) return
        await new Promise(resolve => setTimeout(resolve, step.delay))
        if (!isCancelled) {
          setProgress(step.progress)
        }
      }

      if (!isCancelled) {
        // Pequeno delay para transição suave
        await new Promise(resolve => setTimeout(resolve, 300))
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSystem()

    return () => {
      isCancelled = true
    }
  }, [mounted])

  // Evita erro de hidratação
  if (!mounted) return null

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black z-[10000] flex flex-col items-center justify-center">
      {/* Logo responsivo */}
      <div className="relative mb-8">
        <div className="w-[300px] h-[150px] sm:w-[400px] sm:h-[200px] md:w-[500px] md:h-[250px] lg:w-[600px] lg:h-[300px] xl:w-[700px] xl:h-[350px] 2xl:w-[800px] 2xl:h-[400px]">
          <Image
            src="/logo.png"
            alt="Cinema em Casa"
            fill
            className="object-contain"
            priority
            sizes="(max-width: 640px) 300px, (max-width: 768px) 400px, (max-width: 1024px) 500px, (max-width: 1280px) 600px, (max-width: 1536px) 700px, 800px"
          />
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] xl:w-[700px] 2xl:w-[800px]">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-cyan to-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/70 text-sm font-medium">
          <span>Carregando sistema...</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Mensagem de status */}
      <div className="mt-4 text-white/50 text-sm">
        {progress < 30 && 'Inicializando...'}
        {progress >= 30 && progress < 50 && 'Carregando configurações...'}
        {progress >= 50 && progress < 70 && 'Conectando ao servidor...'}
        {progress >= 70 && progress < 85 && 'Carregando dados...'}
        {progress >= 85 && progress < 100 && 'Finalizando...'}
        {progress === 100 && 'Pronto!'}
      </div>
    </div>
  )
}
