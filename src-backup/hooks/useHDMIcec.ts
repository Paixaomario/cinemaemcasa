'use client'
import { useEffect, useState, useCallback } from 'react'

/**
 * Hook para suporte a HDMI-CEC em LG WebOS
 * Permite controle da TV via outros dispositivos HDMI-CEC
 */
export function useHDMIcec() {
  const [isSupported, setIsSupported] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [deviceName, setDeviceName] = useState('')

  // Detecta se está rodando em LG WebOS
  const isWebOS = typeof window !== 'undefined' && !!(window as any).webOS

  useEffect(() => {
    if (!isWebOS) return

    const webOS = (window as any).webOS
    const cecAPI = webOS?.service?.request('luna://com.webos.service.cec')

    if (cecAPI) {
      setIsSupported(true)
      
      // Verifica se HDMI-CEC está conectado
      cecAPI.getStatus({
        onSuccess: (response: any) => {
          setIsConnected(response.connected || false)
          setDeviceName(response.deviceName || 'Cinema em Casa')
        },
        onFailure: (error: any) => {
          console.error('Erro ao verificar status HDMI-CEC:', error)
          setIsSupported(false)
        }
      })
    } else {
      setIsSupported(false)
    }
  }, [isWebOS])

  // Função para enviar comando HDMI-CEC
  const sendCommand = useCallback(async (command: string, params?: any) => {
    if (!isSupported || !isWebOS) return false

    try {
      const webOS = (window as any).webOS
      const cecAPI = webOS?.service?.request('luna://com.webos.service.cec')

      if (!cecAPI) return false

      const result = await new Promise((resolve, reject) => {
        cecAPI[command]({
          ...params,
          onSuccess: (response: any) => resolve(response),
          onFailure: (error: any) => reject(error)
        })
      })

      return result
    } catch (error) {
      console.error('Erro ao enviar comando HDMI-CEC:', error)
      return false
    }
  }, [isSupported, isWebOS])

  // Liga a TV via HDMI-CEC
  const turnOnTV = useCallback(async () => {
    return sendCommand('turnOn')
  }, [sendCommand])

  // Desliga a TV via HDMI-CEC
  const turnOffTV = useCallback(async () => {
    return sendCommand('turnOff')
  }, [sendCommand])

  // Muda o input HDMI
  const switchInput = useCallback(async (inputId: string) => {
    return sendCommand('switchInput', { inputId })
  }, [sendCommand])

  // Ajusta o volume
  const setVolume = useCallback(async (volume: number) => {
    return sendCommand('setVolume', { volume })
  }, [sendCommand])

  // Muda o canal
  const setChannel = useCallback(async (channel: number) => {
    return sendCommand('setChannel', { channel })
  }, [sendCommand])

  // Envia comando customizado
  const sendCustomCommand = useCallback(async (opcode: number, params?: any) => {
    return sendCommand('sendCustomCommand', { opcode, ...params })
  }, [sendCommand])

  // Registra callback para eventos HDMI-CEC
  const registerCallback = useCallback((event: string, callback: (data: any) => void) => {
    if (!isSupported || !isWebOS) return

    const webOS = (window as any).webOS
    const cecAPI = webOS?.service?.request('luna://com.webos.service.cec')

    if (!cecAPI) return

    cecAPI.registerCallback({
      event,
      callback
    })
  }, [isSupported, isWebOS])

  // Remove callback de eventos HDMI-CEC
  const unregisterCallback = useCallback((event: string) => {
    if (!isSupported || !isWebOS) return

    const webOS = (window as any).webOS
    const cecAPI = webOS?.service?.request('luna://com.webos.service.cec')

    if (!cecAPI) return

    cecAPI.unregisterCallback({ event })
  }, [isSupported, isWebOS])

  return {
    isSupported,
    isConnected,
    deviceName,
    turnOnTV,
    turnOffTV,
    switchInput,
    setVolume,
    setChannel,
    sendCustomCommand,
    registerCallback,
    unregisterCallback,
  }
}
