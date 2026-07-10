'use client'
import { Check } from 'lucide-react'

export function VisualPreferencesSection({ preferences, onPreferencesChange }: { preferences: any, onPreferencesChange: (p: any) => void }) {
  if (!preferences) return null

  const colors = [
    { name: 'Ciano', value: '#00ADEF' },
    { name: 'Ouro', value: '#FFD700' },
    { name: 'Netflix', value: '#E50914' },
    { name: 'HBO', value: '#8E44AD' },
    { name: 'Disney', value: '#2ECC71' }
  ]

  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 mb-8 text-brand-cyan">
        <span className="w-2 h-10 rounded-full bg-brand-cyan"></span>
        Preferências Visuais
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
        {/* Accent Color */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4">Cor de Destaque</label>
          <div className="flex flex-wrap gap-4">
            {colors.map(c => (
              <button
                key={c.value}
                onClick={() => onPreferencesChange({ ...preferences, accent_color: c.value })}
                style={{ backgroundColor: c.value }}
                className="w-12 h-12 rounded-full border-4 border-black/40 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              >
                {preferences.accent_color === c.value && <Check className="text-black w-6 h-6 stroke-[4px]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Blur Toggle */}
        <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
          <div>
            <p className="font-black uppercase tracking-tight text-sm">Efeitos de Transparência</p>
            <p className="text-xs text-neutral-500">Ativa o desfoque (blur) cinematográfico</p>
          </div>
          <button
            onClick={() => onPreferencesChange({ ...preferences, background_blur: !preferences.background_blur })}
            className={`w-14 h-8 rounded-full transition-colors relative ${preferences.background_blur ? 'bg-brand-cyan' : 'bg-neutral-800'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${preferences.background_blur ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Card Style */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4">Estilo da Grade</label>
          <div className="flex gap-4">
            {['standard', 'minimal'].map(style => (
              <button
                key={style}
                onClick={() => onPreferencesChange({ ...preferences, card_style: style })}
                className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] border-2 transition-all ${
                  preferences.card_style === style ? 'border-brand-cyan bg-brand-cyan/10' : 'border-white/10 hover:border-white/30'
                }`}
              >
                {style === 'standard' ? '🖼️ Detalhado' : '🎥 Minimalista'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}