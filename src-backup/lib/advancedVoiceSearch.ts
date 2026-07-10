/**
 * Advanced Voice Search Module
 * Improved speech recognition with continuous listening and alternatives
 * 
 * Features:
 * - Continuous listening mode for multiple words/phrases
 * - Alternative recognition results (confidence scoring)
 * - Confidence threshold filtering
 * - Language support (Portuguese, English, Spanish)
 * - Fallback text input if voice fails
 * - WebOS Magic Remote integration ready
 */

export interface VoiceResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives: Array<{
    transcript: string
    confidence: number
  }>
}

export interface VoiceSearchState {
  isListening: boolean
  isProcessing: boolean
  error: string | null
  interimTranscript: string
  finalTranscript: string
  allResults: VoiceResult[]
}

interface VoiceSearchConfig {
  language: 'pt-BR' | 'en-US' | 'es-ES'
  continuous: boolean // Continua escutando para múltiplas frases
  interimResults: boolean // Mostra resultados parciais enquanto fala
  maxAlternatives: number // Número de alternativas a retornar
  confidenceThreshold: number // Mínimo de confiança (0-1)
  maxDuration: number // Duração máxima em ms (0 = sem limite)
  autoStopSilenceDuration: number // Se silêncio > X ms, para
}

const DEFAULT_CONFIG: VoiceSearchConfig = {
  language: 'pt-BR',
  continuous: false, // Modo normal: interrompe após frase completa
  interimResults: true, // Mostra resultados parciais
  maxAlternatives: 3,
  confidenceThreshold: 0.5, // 50% de confiança mínima
  maxDuration: 60000, // 1 minuto máximo
  autoStopSilenceDuration: 3000 // Para após 3s de silêncio
}

type VoiceSearchCallback = (result: VoiceResult) => void
type VoiceErrorCallback = (error: string) => void

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

/**
 * Gerenciador de busca de voz com suporte a contínuo e alternativas
 */
export class AdvancedVoiceSearch {
  private recognition: any = null
  private isSupported: boolean = false
  private state: VoiceSearchState = {
    isListening: false,
    isProcessing: false,
    error: null,
    interimTranscript: '',
    finalTranscript: '',
    allResults: []
  }
  private config: VoiceSearchConfig
  private onResult: VoiceSearchCallback | null = null
  private onError: VoiceErrorCallback | null = null
  private silenceTimeout: NodeJS.Timeout | null = null
  private maxDurationTimeout: NodeJS.Timeout | null = null

  constructor(config: Partial<VoiceSearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeRecognition()
  }

  /**
   * Inicializa a API de reconhecimento de voz
   */
  private initializeRecognition() {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      this.isSupported = false
      return
    }

    this.isSupported = true
    this.recognition = new SpeechRecognition()

    // Configurar propriedades
    this.recognition.language = this.config.language
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // Event handlers
    this.recognition.onstart = () => this.handleStart()
    this.recognition.onresult = (event: any) => this.handleResult(event)
    this.recognition.onerror = (event: any) => this.handleError(event)
    this.recognition.onend = () => this.handleEnd()
  }

  /**
   * Inicia a escuta por voz
   */
  public start(
    onResult: VoiceSearchCallback,
    onError: VoiceErrorCallback
  ): boolean {
    if (!this.isSupported) {
      onError('Seu navegador não suporta reconhecimento de voz')
      return false
    }

    this.onResult = onResult
    this.onError = onError
    this.state = {
      isListening: true,
      isProcessing: false,
      error: null,
      interimTranscript: '',
      finalTranscript: '',
      allResults: []
    }

    try {
      this.recognition.start()

      // Timer para duração máxima
      if (this.config.maxDuration > 0) {
        this.maxDurationTimeout = setTimeout(() => {
          this.stop()
        }, this.config.maxDuration)
      }

      return true
    } catch (error) {
      this.state.error = 'Erro ao iniciar reconhecimento de voz'
      if (this.onError) {
        this.onError(this.state.error)
      }
      return false
    }
  }

  /**
   * Para a escuta por voz
   */
  public stop() {
    if (!this.isSupported || !this.state.isListening) return

    this.state.isListening = false
    this.clearTimeouts()

    try {
      if (this.recognition) {
        this.recognition.stop()
      }
    } catch (error) {
      console.error('Error stopping recognition:', error)
    }
  }

  /**
   * Aborta a escuta por voz (sem processar resultado)
   */
  public abort() {
    this.clearTimeouts()
    this.state = {
      isListening: false,
      isProcessing: false,
      error: null,
      interimTranscript: '',
      finalTranscript: '',
      allResults: []
    }

    try {
      if (this.recognition) {
        this.recognition.abort()
      }
    } catch (error) {
      console.error('Error aborting recognition:', error)
    }
  }

  /**
   * Muda o idioma de reconhecimento
   */
  public setLanguage(language: 'pt-BR' | 'en-US' | 'es-ES') {
    this.config.language = language
    if (this.recognition) {
      this.recognition.language = language
    }
  }

  /**
   * Retorna estado atual
   */
  public getState(): VoiceSearchState {
    return { ...this.state }
  }

  /**
   * Verifica se o navegador suporta voz
   */
  public isVoiceSupported(): boolean {
    return this.isSupported
  }

  /**
   * Handler para início da escuta
   */
  private handleStart() {
    this.state.isListening = true
    this.state.error = null
  }

  /**
   * Handler para resultados do reconhecimento
   */
  private handleResult(event: any) {
    let interimTranscript = ''
    let finalTranscript = ''

    // Processar todos os resultados
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      const confidence = event.results[i][0].confidence

      if (event.results[i].isFinal) {
        // Resultado final
        if (confidence >= this.config.confidenceThreshold) {
          finalTranscript += transcript + ' '
        }
      } else {
        // Resultado parcial
        interimTranscript += transcript
      }

      // Coletar alternativas
      if (event.results[i].isFinal) {
        const result: VoiceResult = {
          transcript: transcript.trim(),
          confidence: confidence,
          isFinal: true,
          alternatives: event.results[i]
            .slice(1, this.config.maxAlternatives + 1)
            .map((alt: any) => ({
              transcript: alt.transcript.trim(),
              confidence: alt.confidence
            }))
            .filter((alt: any) => alt.confidence >= this.config.confidenceThreshold)
        }

        // Apenas adicionar se atender threshold
        if (confidence >= this.config.confidenceThreshold) {
          this.state.allResults.push(result)

          if (this.onResult) {
            this.onResult(result)
          }

          // Resetar timer de silêncio
          this.resetSilenceTimer()
        }
      }
    }

    // Atualizar transcrição
    this.state.interimTranscript = interimTranscript
    if (finalTranscript.trim()) {
      this.state.finalTranscript += finalTranscript
    }
  }

  /**
   * Handler para erros
   */
  private handleError(event: any) {
    const errorMessages: { [key: string]: string } = {
      'no-speech': 'Nenhuma fala detectada. Por favor, tente novamente.',
      'audio-capture': 'Nenhum microfone encontrado. Verifique as permissões.',
      'network': 'Erro de conexão. Tente novamente.',
      'not-allowed': 'Permissão para usar o microfone foi negada.',
      'service-not-allowed': 'Serviço de reconhecimento de voz não disponível.',
      'bad-grammar': 'Erro de gramática no reconhecimento.',
      'unknown': 'Erro desconhecido no reconhecimento de voz.'
    }

    const errorMessage = errorMessages[event.error] || errorMessages.unknown
    this.state.error = errorMessage
    this.state.isListening = false

    if (this.onError) {
      this.onError(errorMessage)
    }
  }

  /**
   * Handler para fim da escuta
   */
  private handleEnd() {
    this.state.isListening = false
    this.clearTimeouts()

    // Se não teve resultado final, tenta usar interim
    if (
      this.state.allResults.length === 0 &&
      this.state.interimTranscript.trim() &&
      this.onResult
    ) {
      this.onResult({
        transcript: this.state.interimTranscript.trim(),
        confidence: 0.5, // Confiança reduzida para interim
        isFinal: false,
        alternatives: []
      })
    }
  }

  /**
   * Resetar timer de silêncio
   */
  private resetSilenceTimer() {
    if (!this.config.continuous) return

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout)
    }

    this.silenceTimeout = setTimeout(() => {
      this.stop()
    }, this.config.autoStopSilenceDuration)
  }

  /**
   * Limpa todos os timeouts
   */
  private clearTimeouts() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout)
      this.silenceTimeout = null
    }
    if (this.maxDurationTimeout) {
      clearTimeout(this.maxDurationTimeout)
      this.maxDurationTimeout = null
    }
  }
}

/**
 * Hook helper para usar AdvancedVoiceSearch em componentes React
 * Uso: const voiceSearch = useVoiceSearch()
 */
export function createVoiceSearchInstance(config?: Partial<VoiceSearchConfig>) {
  return new AdvancedVoiceSearch(config)
}

/**
 * Detecta qualidade de entrada de voz com base em confiança
 */
export function getVoiceConfidenceLevel(confidence: number): string {
  if (confidence >= 0.8) return 'excelente'
  if (confidence >= 0.6) return 'boa'
  if (confidence >= 0.4) return 'razoável'
  return 'baixa'
}

/**
 * Formata resultado de voz para exibição
 */
export function formatVoiceResult(result: VoiceResult): string {
  const confidencePercent = Math.round(result.confidence * 100)
  const status = result.isFinal ? '✓' : '◇'
  return `${status} "${result.transcript}" (${confidencePercent}%)`
}
