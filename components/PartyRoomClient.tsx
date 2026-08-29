'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { PartyChat } from './PartyChat';
import type { PartyRoom } from '@/lib/types';

interface Props {
  room: PartyRoom;
  videoSrc: string | null;
  poster: string | null;
  titulo: string;
  exitHref: string;
}

// Agente "Assistir Juntos": até 5 convidados por sala. Somente o host
// (party_rooms.host_id) pode dar o play inicial — os demais veem o
// player travado até esse momento.
//
// CORREÇÃO: antes, o "iniciado" só mudava localmente pra quem CLICOU
// em iniciar — os convidados nunca sabiam que a sessão começou sem
// recarregar a página manualmente (pareciam travados "carregando").
// Agora todo mundo escuta a mudança em tempo real (Supabase Realtime).
// Também corrigido: o vídeo não tinha autoplay nem tratamento de erro.
export function PartyRoomClient({ room, videoSrc, poster, titulo, exitHref }: Props) {
  const [nome, setNome] = useState('');
  const [nomeConfirmado, setNomeConfirmado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [iniciado, setIniciado] = useState(!!room.started_at);
  const [erroVideo, setErroVideo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    const canal = supabaseBrowser
      .channel(`party_rooms:${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'party_rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          if ((payload.new as PartyRoom).started_at) setIniciado(true);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(canal);
    };
  }, [room.id]);

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
    <div className="relative flex flex-col md:flex-row h-screen">
      <button
        onClick={() => router.push(exitHref)}
        aria-label="Sair"
        className="focusable absolute top-4 left-4 z-30 w-11 h-11 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white"
      >
        <i className="ti ti-arrow-left text-xl" aria-hidden="true" />
      </button>

      <div className="flex-1 relative bg-black flex items-center justify-center">
        {iniciado ? (
          erroVideo ? (
            <div className="text-center px-6">
              <i className="ti ti-alert-triangle text-3xl text-gold mb-2" aria-hidden="true" />
              <p className="text-sm text-white">Não foi possível carregar este vídeo.</p>
            </div>
          ) : (
            <video
              src={videoSrc || undefined}
              poster={poster || undefined}
              controls
              autoPlay
              onError={() => setErroVideo(true)}
              className="w-full h-full"
            />
          )
        ) : (
          <>
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={titulo} className="absolute inset-0 w-full h-full object-cover opacity-40" />
            )}
            <div className="relative text-center px-6">
              <p className="text-[12px] text-gold mb-3">
                {souHost ? 'Você pode iniciar quando quiser' : 'Aguardando o anfitrião iniciar...'}
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
