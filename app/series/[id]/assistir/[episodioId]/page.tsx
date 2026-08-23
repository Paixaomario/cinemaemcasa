import { supabaseServer } from '@/lib/supabase/server';
import { Player } from '@/components/Player';
import type { Episodio } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getEpisodio(id: string): Promise<Episodio | null> {
  const { data } = await supabaseServer.from('episodios').select('*').eq('id_n', id).maybeSingle();
  return data;
}

export default async function AssistirEpisodioPage({
  params,
  searchParams
}: {
  params: { id: string; episodioId: string };
  searchParams: { proximo?: string };
}) {
  const episodio = await getEpisodio(params.episodioId);
  if (!episodio) notFound();

  return (
    <div>
      <Player
        src={episodio.arquivo}
        poster={episodio.banner || episodio.imagem_500}
        subtitles={episodio.subtitles}
        audioTracks={episodio.audio_tracks}
        contentId={String(episodio.id_n)}
        nextEpisodeHref={
          searchParams.proximo
            ? `/series/${params.id}/assistir/${searchParams.proximo}`
            : null
        }
      />
      <div className="px-6 pt-4 pb-10">
        <h1 className="text-[16px] font-medium">
          {episodio.numero_episodio}. {episodio.titulo}
        </h1>
        <p className="text-[12px] text-textmuted mt-1">{episodio.descricao}</p>
      </div>
    </div>
  );
}
