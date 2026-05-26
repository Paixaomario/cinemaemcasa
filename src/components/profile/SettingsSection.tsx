'use client'
import { useState } from 'react'

interface SettingsSectionProps {
  settings?: {
    language?: string
    subtitles?: string
    quality?: string
    dataSaver?: boolean
  }
  onSettingsChange?: (settings: any) => void
}

export function SettingsSection({ settings = {}, onSettingsChange }: SettingsSectionProps) {
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
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--red-primary)]">
        <span className="w-2 h-10 rounded-full bg-[var(--red-primary)]"></span>
        Configurações
      </h2>

      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
        {/* Idioma */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Idioma</h3>
            <p className="text-sm text-gray-400">Idioma preferido para a interface</p>
          </div>
          <select
            value={localSettings.language || 'pt-BR'}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-cyan focus:outline-none"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>

        {/* Legendas */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Legendas</h3>
            <p className="text-sm text-gray-400">Legendas preferidas</p>
          </div>
          <select
            value={localSettings.subtitles || 'off'}
            onChange={(e) => handleSettingChange('subtitles', e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-cyan focus:outline-none"
          >
            <option value="off">Desativadas</option>
            <option value="pt-BR">Português</option>
            <option value="en-US">English</option>
          </select>
        </div>

        {/* Qualidade */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Qualidade de Vídeo</h3>
            <p className="text-sm text-gray-400">Resolução preferida</p>
          </div>
          <select
            value={localSettings.quality || 'auto'}
            onChange={(e) => handleSettingChange('quality', e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-cyan focus:outline-none"
          >
            <option value="auto">Automático</option>
            <option value="4k">4K Ultra HD</option>
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD</option>
            <option value="480p">480p SD</option>
          </select>
        </div>

        {/* Economia de Dados */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Economia de Dados</h3>
            <p className="text-sm text-gray-400">Reduzir qualidade em redes móveis</p>
          </div>
          <button
            onClick={() => handleSettingChange('dataSaver', !localSettings.dataSaver)}
            className={`w-14 h-8 rounded-full transition-colors ${localSettings.dataSaver ? 'bg-[var(--gold-primary)]' : 'bg-white/10'}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-transform ${localSettings.dataSaver ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </section>
  )
}
