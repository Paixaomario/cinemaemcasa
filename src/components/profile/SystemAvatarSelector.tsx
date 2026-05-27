'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getSystemAvatars, selectSystemAvatar, type SystemAvatar } from '@/lib/systemAvatars'

interface SystemAvatarSelectorProps {
  userId: string
  currentAvatarUrl?: string | null
  onClose: () => void
  onAvatarSelected: (url: string) => void
}

export function SystemAvatarSelector({ userId, currentAvatarUrl, onClose, onAvatarSelected }: SystemAvatarSelectorProps) {
  const [avatars, setAvatars] = useState<SystemAvatar[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selecting, setSelecting] = useState<number | null>(null)

  useEffect(() => {
    loadAvatars()
  }, [])

  async function loadAvatars() {
    setLoading(true)
    try {
      const data = await getSystemAvatars()
      setAvatars(data)
    } catch (error) {
      console.error('Erro ao carregar avatares:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectAvatar(avatar: SystemAvatar) {
    setSelecting(avatar.id)
    try {
      await selectSystemAvatar(userId, avatar.id)
      onAvatarSelected(avatar.url)
      onClose()
    } catch (error) {
      console.error('Erro ao selecionar avatar:', error)
      alert('Erro ao selecionar avatar. Tente novamente.')
    } finally {
      setSelecting(null)
    }
  }

  const categories = ['all', ...Array.from(new Set(avatars.map(a => a.category)))]
  const filteredAvatars = selectedCategory === 'all' 
    ? avatars 
    : avatars.filter(a => a.category === selectedCategory)

  const categoryNames: Record<string, string> = {
    all: 'Todos',
    default: 'Padrão',
    cinema: 'Cinema',
    characters: 'Personagens',
    animals: 'Animais',
    abstract: 'Abstrato',
    professional: 'Profissional'
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Escolha seu Avatar</h2>
            <p className="text-gray-400 text-sm mt-1">Selecione um avatar do sistema</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-800 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {categoryNames[category] || category}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {filteredAvatars.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar)}
                  disabled={selecting === avatar.id}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    currentAvatarUrl === avatar.url
                      ? 'border-red-600 ring-2 ring-red-600 ring-offset-2 ring-offset-gray-900'
                      : 'border-gray-700 hover:border-gray-500'
                  } ${selecting === avatar.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Image
                    src={avatar.url}
                    alt={avatar.name}
                    fill
                    className="object-cover"
                  />
                  {selecting === avatar.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
