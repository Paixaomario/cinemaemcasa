import { supabaseServer } from '@/lib/supabase/server';
import { PartyRoomClient } from '@/components/PartyRoomClient';
import { notFound } from 'next/navigation';

export default async function AssistirJuntoPage({ params }: { params: { roomId: string } }) {
  const { data: room } = await supabaseServer
    .from('party_rooms')
    .select('*')
    .eq('id', params.roomId)
    .maybeSingle();

  if (!room) notFound();

  let videoSrc: string | null = null;
  let poster: string | null = null;
  let titulo = '';

  if (room.content_type === 'movie') {
    const { data } = await supabaseServer
      .from('cinema')
      .select('*')
      .eq('id', room.content_id)
      .maybeSingle();
    videoSrc = data?.url || null;
    poster = data?.backdrop || data?.banner || null;
    titulo = data?.titulo || '';
  } else {
    const { data } = await supabaseServer
      .from('episodios')
      .select('*')
      .eq('id_n', room.content_id)
      .maybeSingle();
    videoSrc = data?.arquivo || null;
    poster = data?.banner || null;
    titulo = data?.titulo || '';
  }

  return (
    <PartyRoomClient
      room={room}
      videoSrc={videoSrc}
      poster={poster}
      titulo={titulo}
      exitHref={room.content_type === 'movie' ? '/filmes' : '/series'}
    />
  );
}
