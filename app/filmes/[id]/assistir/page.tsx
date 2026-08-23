import { supabaseServer } from '@/lib/supabase/server';
import { Player } from '@/components/Player';
import type { Cinema } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getFilme(id: string): Promise<Cinema | null> {
  const { data } = await supabaseServer.from('cinema').select('*').eq('id', id).maybeSingle();
  return data;
}

// Página de EXIBIÇÃO — só o player em tela cheia, separada da página
// de detalhes (informações ficam em /filmes/[id]).
export default async function AssistirFilmePage({ params }: { params: { id: string } }) {
  const filme = await getFilme(params.id);
  if (!filme) notFound();

  return (
    <div>
      <Player
        src={filme.url}
        poster={filme.backdrop || filme.banner}
        subtitles={filme.subtitles}
        audioTracks={filme.audio_tracks}
        contentId={String(filme.id)}
        nextEpisodeHref={null}
      />
      <div className="px-6 pt-4 pb-10">
        <h1 className="text-[16px] font-medium">{filme.titulo}</h1>
      </div>
    </div>
  );
}
