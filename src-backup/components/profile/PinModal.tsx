'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pin: string) => void
  title?: string
  description?: string
}

export function PinModal({ isOpen, onClose, onConfirm, title = "Controle Parental", description = "Insira seu PIN de 4 dígitos" }: PinModalProps) {
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (pin.length === 4) {
      onConfirm(pin)
      setPin('')
    }
  }, [pin, onConfirm])

  if (!isOpen) return null

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num)
    }
  }

  const handleClear = () => {
    setPin('')
  }

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm relative shadow-2xl animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">{title}</h3>
          <p className="text-neutral-400 text-sm font-medium">{description}</p>
        </div>

        {/* Display do PIN */}
        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all ${
                pin.length > i ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/10' : 'border-white/10 text-white/20 bg-white/5'
              }`}
            >
              {pin.length > i ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(String(num))}
              tabIndex={0}
              className="h-16 rounded-2xl bg-white/5 border border-white/10 text-2xl font-black hover:bg-brand-cyan hover:text-black hover:border-brand-cyan focus:bg-brand-cyan focus:text-black focus:border-brand-cyan outline-none transition-all active:scale-90"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            tabIndex={0}
            className="h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white outline-none transition-all"
          >
            CLR
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            tabIndex={0}
            className="h-16 rounded-2xl bg-white/5 border border-white/10 text-2xl font-black hover:bg-brand-cyan hover:text-black focus:bg-brand-cyan focus:text-black outline-none transition-all"
          >
            0
          </button>
        </div>
      </div>
    </div>
  )
}