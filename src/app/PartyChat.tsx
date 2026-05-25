'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

interface Message {
  id: string
  sender_name: string
  message: string
  created_at: string
}
interface UserPresence {
  name: string
  avatarUrl?: string
}

interface PartyChatProps { 
  roomId: string, 
  userName: string, 
  userAvatar?: string, 
  isHost?: boolean, 
  onReaction?: (emoji: string) => void 
}

export function PartyChat({ roomId, userName, userAvatar, isHost, onReaction }: PartyChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<UserPresence[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const sb = useMemo(() => createClient(), [])

  const REACTIONS = ['❤️', '😂', '😮', '🔥', '👏', '😢']

  useEffect(() => {
    if (!roomId) return;

    // Carregar mensagens iniciais
    sb.from('party_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => data && setMessages(data))

    // Escutar novas mensagens em tempo real
    const channel = sb.channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'party_messages', filter: `room_id=eq.${roomId}` }, 
      (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    // Gerenciar Presença (Quem está na sala)
    const presenceChannel = sb.channel(`presence-${roomId}`)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        const presentUsers: UserPresence[] = Object.values(newState).flat().filter((p: unknown) => !!(p as UserPresence).name).map((p: unknown) => ({
          name: (p as UserPresence).name,
          avatarUrl: (p as UserPresence).avatarUrl
        }))
        setUsers(presentUsers)

        // Validação de limite de 21 pessoas
        if (presentUsers.length > 21 && !presentUsers.find(u => u.name === userName)) {
           alert("Sala lotada! O limite é de 21 pessoas.");
           window.location.href = '/';
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ 
            online_at: new Date().toISOString(), 
            name: userName, 
            avatarUrl: userAvatar 
          })
        }
      })

    return () => { 
      sb.removeChannel(channel)
      sb.removeChannel(presenceChannel)
    }
  }, [roomId, sb, userName, userAvatar])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const msg = input
    setInput('')
    await sb.from('party_messages').insert({
      room_id: roomId,
      sender_name: userName,
      message: msg
    })
  }

  return (
    <div className="flex flex-col h-full w-full sm:w-80 bg-black/90 sm:bg-black/60 border-l border-white/10 backdrop-blur-lg z-[10005] relative">
      <div className="p-3 sm:p-4 border-b border-white/5 bg-gradient-to-r from-[#1A1A1F] to-black">
        <h3 className="text-brand-cyan font-black uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm flex items-center gap-2">
          <span className="live-ping w-2 h-2 bg-red-600 rounded-full"></span>
          <span className="hidden sm:inline">Chat da Sala</span>
          <span className="sm:hidden">Chat</span>
        </h3>
        <div className="mt-2 flex -space-x-2 overflow-hidden">
          {users.slice(0, 5).map((u, i) => (
            <div key={i} title={u.name} className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-[#0B0B0F] bg-brand-cyan text-[8px] sm:text-[10px] text-black flex items-center justify-center font-bold uppercase" style={{ position: 'relative' }}>
              {u.name[0]}
            </div>
          ))}
          {users.length > 5 && (
            <span className="pl-3 sm:pl-4 text-[8px] sm:text-[10px] text-gray-400">+{users.length - 5}</span>
          )}
        </div>
      </div>

      {/* Pilar 1: Reações Rápidas */}
      <div className="flex justify-between px-3 sm:px-4 py-1.5 sm:py-2 border-b border-white/5 bg-white/5">
        {REACTIONS.map(emoji => (
          <button 
            key={emoji} 
            tabIndex={0}
            onClick={() => {
              console.log("Reaction clicked:", emoji); // Debug para garantir o clique
              onReaction?.(emoji);
            }}
            className="hover:scale-125 transition-transform text-base sm:text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col animate-in fade-in slide-in-from-right-2">
            <span className="text-[9px] sm:text-[10px] font-black text-brand-cyan uppercase mb-1">{m.sender_name}</span>
            <div className="bg-white/5 rounded-xl sm:rounded-2xl rounded-tl-none p-2 sm:p-3 text-xs sm:text-sm text-[#ECECEC] border border-white/5">
              {m.message}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-3 sm:p-4 bg-black/40 border-t border-white/5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          tabIndex={0}
          placeholder="Diga algo..."
          className="w-full bg-[#1A1A1F] border border-white/10 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all font-montserrat"
        />
      </form>
    </div>
  )
}