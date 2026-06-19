'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook para suporte a LG Voice Search
 * Integra com a API de voz do LG WebOS Magic Remote
 */
export function useLGVoiceSearch() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Detecta se está rodando em LG WebOS
  const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

  useEffect(() => {
    if (!isWebOS) {
      setIsSupported(false)
      return
    }

    // Verifica se a API de voz do LG WebOS está disponível
    const webOS = (window as any).webOS
    const voiceAPI = webOS?.voice || webOS?.service?.request('luna://com.webos.service.voice')

    if (voiceAPI) {
      setIsSupported(true)
    } else {
      // Fallback para Web Speech API se LG Voice API não estiver disponível
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setIsSupported(true)
        setupWebSpeechRecognition()
      } else {
        setIsSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [isWebOS])

  // Configura Web Speech API como fallback
  const setupWebSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'pt-BR'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  // Inicia reconhecimento de voz usando LG Voice API
  const startListening = useCallback(async () => {
    if (!isSupported || isListening) return

    try {
      const webOS = (window as any).webOS
      
      // Tenta usar LG Voice API nativa
      if (webOS?.voice) {
        setIsListening(true)
        
        const result = await new Promise((resolve, reject) => {
          webOS.voice.start({
            onSuccess: (response: any) => {
              setIsListening(false)
              setTranscript(response.transcript || '')
              resolve(response)
            },
            onFailure: (error: any) => {
              setIsListening(false)
              reject(error)
            }
          })
        })
        
        return result
      } else if (recognitionRef.current) {
        // Fallback para Web Speech API
        recognitionRef.current.start()
      }
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento de voz:', error)
      setIsListening(false)
    }
  }, [isSupported, isListening])

  // Para reconhecimento de voz
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  // Limpa o transcript
  const clearTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  // Alterna entre iniciar/parar
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    toggleListening,
  }
}
