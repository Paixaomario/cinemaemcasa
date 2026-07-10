'use client'

interface Device {
  id: string
  name: string
  type: 'tv' | 'mobile' | 'tablet' | 'desktop' | 'console'
  lastActive: string
  isCurrent: boolean
}

interface DevicesSectionProps {
  devices?: Device[]
  onLogoutDevice?: (deviceId: string) => void
}

export function DevicesSection({ devices = [], onLogoutDevice }: DevicesSectionProps) {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'tv': return '📺'
      case 'mobile': return '📱'
      case 'tablet': return '📲'
      case 'desktop': return '💻'
      case 'console': return '🎮'
      default: return '📱'
    }
  }

  const formatLastActive = (date: string) => {
    const now = new Date()
    const last = new Date(date)
    const diff = now.getTime() - last.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `${minutes} min atrás`
    if (hours < 24) return `${hours}h atrás`
    return `${days} dias atrás`
  }

  if (devices.length === 0) {
    return (
      <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--gold-primary)]">
          <span className="w-2 h-10 rounded-full bg-[var(--gold-primary)]"></span>
          Dispositivos Conectados
        </h2>
        <div className="p-10 rounded-3xl bg-white/5 border border-white/5 text-gray-500 font-medium italic">
          Nenhum dispositivo conectado.
        </div>
      </section>
    )
  }

  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--gold-primary)]">
        <span className="w-2 h-10 rounded-full bg-[var(--gold-primary)]"></span>
        Dispositivos Conectados
      </h2>

      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{getDeviceIcon(device.type)}</span>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  {device.name}
                  {device.isCurrent && (
                    <span className="text-xs bg-[var(--gold-primary)] text-black px-2 py-0.5 rounded-full font-bold">
                      Atual
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-400">Última atividade: {formatLastActive(device.lastActive)}</p>
              </div>
            </div>

            {!device.isCurrent && onLogoutDevice && (
              <button
                onClick={() => onLogoutDevice(device.id)}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-bold text-sm"
              >
                Sair
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
