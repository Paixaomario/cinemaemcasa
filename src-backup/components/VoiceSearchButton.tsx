'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AdvancedVoiceSearch, VoiceResult, getVoiceConfidenceLevel } from '@/lib/advancedVoiceSearch'

interface VoiceSearchButtonProps {
  onVoiceInput: (text: string, confidence: number) => void
  onError?: (error: string) => void
  language?: 'pt-BR' | 'en-US' | 'es-ES'
  isWebOS?: boolean
  continuous?: boolean
}

interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  error: string | null
  transcript: string
  confidence: number
  alternatives: Array<{ text: string; confidence: number }>
}

/**
 * Botão de Busca por Voz Aprimorado
 * 
 * Features:
 * - Transcrição em tempo real
 * - Indicador visual de confiança
 * - Alternativas de reconhecimento
 * - Modo contínuo ou simples
 * - Compatível com WebOS Magic Remote
 * - Tratamento de erros com fallback
 */
export function VoiceSearchButton({
  onVoiceInput,
  onError,
  language = 'pt-BR',
  isWebOS = false,
  continuous = false
}: VoiceSearchButtonProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    error: null,
    transcript: '',
    confidence: 0,
    alternatives: []
  })
  const [showAlternatives, setShowAlternatives] = useState(false)
  const voiceSearchRef = useRef<AdvancedVoiceSearch | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Inicializar Voice Search
  useEffect(() => {
    const voiceSearch = new AdvancedVoiceSearch({
      language,
      continuous,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.3 // Mais baixo para mostrar alternativas
    })

    voiceSearchRef.current = voiceSearch
    setIsSupported(voiceSearch.isVoiceSupported())
  }, [language, continuous])

  const handleVoiceStart = () => {
    if (!voiceSearchRef.current) return

    setVoiceState({
      isListening: true,
      isProcessing: false,
      error: null,
      transcript: '',
      confidence: 0,
      alternatives: []
    })
    setShowAlternatives(false)

    voiceSearchRef.current.start(
      (result: VoiceResult) => handleVoiceResult(result),
      (error: string) => handleVoiceError(error)
    )
  }

  const handleVoiceStop = () => {
    if (!voiceSearchRef.current) return

    setVoiceState(prev => ({
      ...prev,
      isListening: false,
      isProcessing: true
    }))

    voiceSearchRef.current.stop()

    // Processar resultado após parar
    setTimeout(() => {
      const state = voiceSearchRef.current?.getState()
      if (state?.finalTranscript.trim()) {
        onVoiceInput(
          state.finalTranscript.trim(),
          0.7 // Confiança padrão para entrada final
        )
      }
      setVoiceState(prev => ({ ...prev, isProcessing: false }))
    }, 500)
  }

  const handleVoiceResult = (result: VoiceResult) => {
    const confidenceLevel = getVoiceConfidenceLevel(result.confidence)

    // Converter alternativas do formato VoiceResult para VoiceState
    const alternatives = (result.alternatives || []).map(alt => ({
      text: alt.transcript,
      confidence: alt.confidence
    }))

    setVoiceState({
      isListening: true,
      isProcessing: false,
      error: null,
      transcript: result.transcript,
      confidence: result.confidence,
      alternatives
    })

    // Usar resultado se confiança foi boa
    if (result.isFinal && result.confidence >= 0.7) {
      onVoiceInput(result.transcript, result.confidence)
      voiceSearchRef.current?.stop()
    }
  }

  const handleVoiceError = (error: string) => {
    setVoiceState(prev => ({
      ...prev,
      isListening: false,
      isProcessing: false,
      error
    }))

    if (onError) {
      onError(error)
    }
  }

  const selectAlternative = (text: string) => {
    onVoiceInput(text, 0.6)
    setShowAlternatives(false)
    voiceSearchRef.current?.stop()
  }

  if (!isSupported) {
    return null
  }

  const isActive = voiceState.isListening || voiceState.isProcessing
  const confidencePercent = Math.round(voiceState.confidence * 100)

  return (
    <div className="relative group">
      {/* Botão principal */}
      <button
        ref={buttonRef}
        onClick={isActive ? handleVoiceStop : handleVoiceStart}
        className={`relative flex items-center justify-center gap-2 px-3 h-12 rounded-lg transition-all duration-300 ${
          isActive
            ? 'bg-red-500/20 border-2 border-red-500 text-red-400 shadow-[0_0_15px_rgba(255,0,0,0.3)] animate-pulse'
            : 'bg-brand-cyan/10 border-2 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20 hover:border-brand-cyan'
        }`}
        title={isActive ? 'Clique para parar' : 'Clique para falar'}
        disabled={voiceState.isProcessing}
      >
        {/* Ícone do microfone */}
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            isActive ? 'animate-bounce' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {isActive ? (
            // Ícone de microfone ativo
            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3z M17.3 11c0 2.48-1.85 4.55-4.3 4.97v2.53h-2v-2.53c-2.45-.42-4.3-2.49-4.3-4.97H5c0 3.53 2.61 6.43 6 6.92v3.08h2v-3.08c3.39-.49 6-3.39 6-6.92h-1.7z" />
          ) : (
            // Ícone de microfone inativo
            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3z M17.3 11c0 2.48-1.85 4.55-4.3 4.97v2.53h-2v-2.53c-2.45-.42-4.3-2.49-4.3-4.97H5c0 3.53 2.61 6.43 6 6.92v3.08h2v-3.08c3.39-.49 6-3.39 6-6.92h-1.7z" />
          )}
        </svg>

        {/* Label do estado */}
        {isActive && (
          <span className="text-sm font-bold tracking-wider">
            {voiceState.isProcessing ? 'Processando...' : 'Ouvindo...'}
          </span>
        )}
      </button>

      {/* Transcrição em tempo real */}
      {isActive && voiceState.transcript && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1f] border-2 border-brand-cyan/30 rounded-lg p-3 whitespace-nowrap overflow-hidden text-ellipsis z-50">
          <p className="text-sm font-semibold text-brand-cyan truncate">
            {voiceState.transcript}
          </p>
          {voiceState.confidence > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    voiceState.confidence >= 0.7
                      ? 'bg-green-500'
                      : voiceState.confidence >= 0.5
                        ? 'bg-yellow-500'
                        : 'bg-orange-500'
                  }`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
              <span className="text-xs text-white/60">
                {getVoiceConfidenceLevel(voiceState.confidence).charAt(0).toUpperCase() +
                  getVoiceConfidenceLevel(voiceState.confidence).slice(1)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Dropdown de alternativas */}
      {voiceState.alternatives.length > 0 && (
        <button
          onClick={() => setShowAlternatives(!showAlternatives)}
          className="ml-2 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors"
          title="Mostrar alternativas"
        >
          {voiceState.alternatives.length} alt
        </button>
      )}

      {showAlternatives && voiceState.alternatives.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1f] border-2 border-brand-cyan/30 rounded-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
          {voiceState.alternatives.map((alt, idx) => (
            <button
              key={idx}
              onClick={() => selectAlternative(alt.text)}
              className="w-full text-left px-4 py-3 hover:bg-brand-cyan/20 border-b border-white/5 last:border-b-0 transition-colors"
            >
              <p className="text-sm text-white truncate">{alt.text}</p>
              <p className="text-xs text-white/40">
                {Math.round(alt.confidence * 100)}% confiança
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Mensagem de erro */}
      {voiceState.error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3 text-sm text-red-300 z-50">
          {voiceState.error}
        </div>
      )}
    </div>
  )
}

export default VoiceSearchButton
