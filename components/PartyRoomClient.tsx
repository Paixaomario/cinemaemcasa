'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { PartyChat } from './PartyChat';
import type { PartyRoom } from '@/lib/types';

interface Props {
  room: PartyRoom;
  videoSrc: string | null;
  poster: string | null;
  titulo: string;
}

// Agente "Assistir Juntos": até 5 convidados por sala. Somente o host
// (party_rooms.host_id) pode dar o play inicial — os demais veem o
// player travado até esse momento, depois assistem sincronizados.
export function PartyRoomClient({ room, videoSrc, poster, titulo }: Props) {
  const [nome, setNome] = useState('');
  const [nomeConfirmado, setNomeConfirmado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [iniciado, setIniciado] = useState(!!room.started_at);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const souHost = userId === room.host_id;

  const iniciarSessao = async () => {
    await supabaseBrowser
      .from('party_rooms')
      .update({ started_at: new Date().toISOString() })
      .eq('id', room.id);
    setIniciado(true);
  };

  if (!nomeConfirmado) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nome.trim()) setNomeConfirmado(true);
          }}
          className="w-full max-w-[260px] text-center"
        >
          <p className="text-[13px] text-textmuted mb-3">
            Como você quer aparecer no chat desta sessão?
          </p>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            maxLength={30}
            required
            className="w-full bg-card border border-border rounded-card px-3 py-2.5 text-sm text-white text-center mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
          <button
            type="submit"
            className="focusable w-full bg-accent text-white text-sm font-medium rounded-card py-2.5"
          >
            Entrar na sessão
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {iniciado ? (
          <video src={videoSrc || undefined} poster={poster || undefined} controls className="w-full h-full" />
        ) : (
          <>
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={titulo} className="absolute inset-0 w-full h-full object-cover opacity-40" />
            )}
            <div className="relative text-center px-6">
              <p className="text-[12px] text-gold mb-3">
                {souHost ? 'Você pode iniciar quando quiser' : 'Aguardando o anfitrião iniciar'}
              </p>
              {souHost && (
                <button
                  onClick={iniciarSessao}
                  className="focusable bg-accent text-white text-sm font-medium rounded-card px-6 py-2.5"
                >
                  <i className="ti ti-player-play mr-1.5" aria-hidden="true" />
                  Iniciar para todos
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <PartyChat roomId={room.id} nome={nome} />
    </div>
  );
}
