'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface ProfileAvatarProps {
  avatarUrl?: string | null
  username?: string | null
  onAvatarChange?: (file: File) => void
  onSystemAvatarClick?: () => void
  editable?: boolean
}

export function ProfileAvatar({ avatarUrl, username, onAvatarChange, onSystemAvatarClick, editable = false }: ProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(avatarUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    setIsUploading(true)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = async () => {
      setPreview(reader.result as string)
      // Chamar callback com o arquivo após criar preview
      if (onAvatarChange) {
        await onAvatarChange(file)
      }
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleCameraClick = () => {
    if (!editable) return
    fileInputRef.current?.click()
  }

  const getInitials = (name?: string | null) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="relative group">
      <div 
        className={`w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-[var(--red-primary)] to-[var(--gold-primary)] p-1 shadow-2xl transition-all duration-300 ${editable ? 'cursor-pointer hover:scale-105' : ''}`}
        onClick={handleCameraClick}
      >
        <div className="w-full h-full rounded-[22px] bg-[#0B0B0F] flex items-center justify-center overflow-hidden relative">
          {preview ? (
            <Image
              src={preview}
              alt={username || 'Avatar'}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-5xl sm:text-6xl font-bold text-white/80">
              {getInitials(username)}
            </span>
          )}
          
          {editable && !preview && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
          )}
        </div>
      </div>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            capture="environment"
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl">
              <div className="text-white font-bold">Carregando...</div>
            </div>
          )}
          {/* Botão para selecionar avatar do sistema */}
          {onSystemAvatarClick && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSystemAvatarClick()
              }}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
              title="Escolher avatar do sistema"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  )
}
