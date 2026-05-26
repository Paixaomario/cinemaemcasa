'use client'
import { useState } from 'react'

interface AccessibilitySectionProps {
  settings?: {
    subtitle_size?: string
    subtitle_color?: string
    subtitle_background?: string
    audio_description?: boolean
    high_contrast?: boolean
    reduced_motion?: boolean
  }
  onSettingsChange?: (settings: any) => void
}

export function AccessibilitySection({ settings = {}, onSettingsChange }: AccessibilitySectionProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }

  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--gold-primary)]">
        <span className="w-2 h-10 rounded-full bg-[var(--gold-primary)]"></span>
        Acessibilidade
      </h2>

      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
        {/* Tamanho da Legenda */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Tamanho da Legenda</h3>
            <p className="text-sm text-gray-400">Tamanho do texto das legendas</p>
          </div>
          <select
            value={localSettings.subtitle_size || 'medium'}
            onChange={(e) => handleSettingChange('subtitle_size', e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-cyan focus:outline-none"
          >
            <option value="small">Pequeno</option>
            <option value="medium">Médio</option>
            <option value="large">Grande</option>
            <option value="extra-large">Extra Grande</option>
          </select>
        </div>

        {/* Cor da Legenda */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Cor da Legenda</h3>
            <p className="text-sm text-gray-400">Cor do texto das legendas</p>
          </div>
          <select
            value={localSettings.subtitle_color || 'white'}
            onChange={(e) => handleSettingChange('subtitle_color', e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-cyan focus:outline-none"
          >
            <option value="white">Branco</option>
            <option value="yellow">Amarelo</option>
            <option value="cyan">Ciano</option>
            <option value="green">Verde</option>
          </select>
        </div>

        {/* Fundo da Legenda */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Fundo da Legenda</h3>
            <p className="text-sm text-gray-400">Cor de fundo das legendas</p>
          </div>
          <select
            value={localSettings.subtitle_background || 'black'}
            onChange={(e) => handleSettingChange('subtitle_background', e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-cyan focus:outline-none"
          >
            <option value="black">Preto</option>
            <option value="transparent">Transparente</option>
            <option value="dark-gray">Cinza Escuro</option>
          </select>
        </div>

        {/* Audiodescrição */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Audiodescrição</h3>
            <p className="text-sm text-gray-400">Descrição de áudio para deficientes visuais</p>
          </div>
          <button
            onClick={() => handleSettingChange('audio_description', !localSettings.audio_description)}
            className={`w-14 h-8 rounded-full transition-colors ${localSettings.audio_description ? 'bg-[var(--gold-primary)]' : 'bg-white/10'}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-transform ${localSettings.audio_description ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Alto Contraste */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Alto Contraste</h3>
            <p className="text-sm text-gray-400">Aumentar contraste da interface</p>
          </div>
          <button
            onClick={() => handleSettingChange('high_contrast', !localSettings.high_contrast)}
            className={`w-14 h-8 rounded-full transition-colors ${localSettings.high_contrast ? 'bg-[var(--gold-primary)]' : 'bg-white/10'}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-transform ${localSettings.high_contrast ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Movimento Reduzido */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Movimento Reduzido</h3>
            <p className="text-sm text-gray-400">Reduzir animações da interface</p>
          </div>
          <button
            onClick={() => handleSettingChange('reduced_motion', !localSettings.reduced_motion)}
            className={`w-14 h-8 rounded-full transition-colors ${localSettings.reduced_motion ? 'bg-[var(--gold-primary)]' : 'bg-white/10'}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-transform ${localSettings.reduced_motion ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </section>
  )
}
