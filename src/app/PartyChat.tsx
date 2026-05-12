'use client'
import { useState, useEffect, useRef } from 'react'
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
  userAvatar?: string, // Adicionado avatar do anfitrião
  onReaction?: (emoji: string) => void 
}

export function PartyChat({ roomId, userName, userAvatar, isHost, onReaction }: PartyChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<UserPresence[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const sb = createClient()

  const REACTIONS = ['❤️', '😂', '😮', '🔥', '👏', '😢']

  useEffect(() => {
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
        const presentUsers: UserPresence[] = Object.values(newState).flat().filter((p: any) => !!p.name).map((p: any) => ({
          name: p.name,
          avatarUrl: p.avatarUrl
        }))
        setUsers(presentUsers)
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
  }, [roomId, sb, userName])

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
    <div className="flex flex-col h-full w-full sm:w-[clamp(300px,25vw,500px)] bg-black/95 sm:bg-black/60 border-l border-white/10 backdrop-blur-xl z-[10005] fixed right-0 top-0 sm:relative shadow-2xl">
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#1A1A1F] to-black">
        <h3 className="text-[#F5C76B] font-bold uppercase tracking-widest text-sm flex items-center gap-2">
          <span className="live-ping w-2 h-2 bg-red-600 rounded-full"></span>
          Chat da Sala
        </h3>
        <div className="mt-2 flex -space-x-2 overflow-hidden">
          {users.slice(0, 5).map((u, i) => (
            <div key={i} title={u.name} className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0B0B0F] bg-[#F5C76B] text-[10px] text-black flex items-center justify-center font-bold uppercase">
              {u.name[0]}
            </div>
          ))}
          {users.length > 5 && (
            <span className="pl-4 text-[10px] text-gray-400">+{users.length - 5} assistindo</span>
          )}
        </div>
      </div>

      {/* Pilar 1: Reações Rápidas */}
      <div className="flex justify-between px-4 py-2 border-b border-white/5 bg-white/5">
        {REACTIONS.map(emoji => (
          <button 
            key={emoji} 
            onClick={() => {
              console.log("Reaction clicked:", emoji); // Debug para garantir o clique
              onReaction?.(emoji);
            }}
            className="hover:scale-125 transition-transform text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col animate-in fade-in slide-in-from-right-2">
            <span className="text-[10px] font-bold text-[#F5C76B] uppercase mb-1">{m.sender_name}</span>
            <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 text-sm text-[#ECECEC] border border-white/5">
              {m.message}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-black/40 border-t border-white/5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Diga algo..."
          className="w-full bg-[#1A1A1F] border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-[#F5C76B] focus:ring-1 focus:ring-[#F5C76B] outline-none transition-all"
        />
      </form>
    </div>
  )
}