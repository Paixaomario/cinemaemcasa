'use client'
import { useState, useCallback, useEffect } from 'react'

export function useVoiceSearch(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recog = new SpeechRecognition()
      recog.lang = 'pt-BR'
      recog.continuous = false
      recog.interimResults = false

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        onResult(transcript)
        setIsListening(false)
      }

      recog.onerror = () => setIsListening(false)
      recog.onend = () => setIsListening(false)

      setRecognition(recog)
    }
  }, [onResult])

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognition?.stop()
    } else {
      try {
        recognition?.start()
        setIsListening(true)
      } catch (e) {
        console.error('Voice search error:', e)
      }
    }
  }, [isListening, recognition])

  return {
    isListening,
    toggleListening,
    isSupported: !!recognition
  }
}