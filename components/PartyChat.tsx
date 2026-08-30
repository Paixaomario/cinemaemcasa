'use client';

import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { EmojiPicker } from './EmojiPicker';
import type { PartyMessage } from '@/lib/types';

const MAX_CHARS = 140; // aproximadamente 2 linhas no painel de chat

interface Props {
  roomId: string;
  nome: string;
}

// Agente de chat (assistir juntos): painel lateral fixo em desktop/TV/
// tablet (nunca sobre o vídeo); em mobile vira painel deslizante que
// cobre apenas a parte de baixo da tela e pode ser recolhido.
export function PartyChat({ roomId, nome }: Props) {
  const [mensagens, setMensagens] = useState<PartyMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [aberto, setAberto] = useState(true);
  const [emojiAberto, setEmojiAberto] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const { data } = await supabaseBrowser
        .from('party_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (ativo && data) setMensagens(data);
    })();

    const channel = supabaseBrowser
      .channel(`party_messages:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'party_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMensagens((prev) => [...prev, payload.new as PartyMessage]);
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabaseBrowser.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviar = async (conteudo: string) => {
    const mensagem = conteudo.trim().slice(0, MAX_CHARS);
    if (!mensagem) return;
    await supabaseBrowser.from('party_messages').insert({
      room_id: roomId,
      sender_name: nome,
      message: mensagem
    });
    setTexto('');
  };

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="focusable fixed bottom-20 right-4 md:bottom-4 bg-accent text-white rounded-full w-11 h-11 flex items-center justify-center z-20"
        aria-label="Abrir chat"
      >
        <i className="ti ti-message-circle text-lg" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className="
        fixed md:static bottom-0 left-0 right-0 md:bottom-auto
        h-[45vh] md:h-full
        w-full md:w-[260px]
        bg-panel md:bg-panel
        border-t md:border-t-0 md:border-l border-border
        flex flex-col z-20
      "
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <p className="text-[11px] text-textmuted">Chat da sessão</p>
        <button onClick={() => setAberto(false)} aria-label="Fechar chat" className="text-textmuted">
          <i className="ti ti-chevron-down md:ti-x" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
        {mensagens.map((m) => (
          <div key={m.id}>
            <span className="text-[13px] font-semibold text-gold">{m.sender_name}</span>
            <p className="emoji-fonte text-[15px] text-white/90 leading-snug line-clamp-2">{m.message}</p>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <div className="relative flex items-center gap-1.5 p-2 border-t border-border">
        <input
          value={texto}
          maxLength={MAX_CHARS}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar(texto)}
          placeholder="Mensagem..."
          className="flex-1 bg-card rounded-full px-3 py-1.5 text-[12px] text-white placeholder:text-textmuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
        <button
          onClick={() => setEmojiAberto((v) => !v)}
          aria-label="Emojis"
          className="focusable text-gold text-lg"
        >
          <i className="ti ti-mood-smile" aria-hidden="true" />
        </button>
        <button onClick={() => enviar(texto)} aria-label="Enviar" className="focusable text-white text-lg">
          <i className="ti ti-send" aria-hidden="true" />
        </button>

        {emojiAberto && (
          <EmojiPicker onSelect={(e) => enviar(e)} onClose={() => setEmojiAberto(false)} />
        )}
      </div>
    </div>
  );
}
