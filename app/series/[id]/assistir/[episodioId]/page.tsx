import { supabasePublic } from '@/lib/supabase/server';
import { Player } from '@/components/Player';
import type { Episodio } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getEpisodio(id: string): Promise<Episodio | null> {
  const { data } = await supabasePublic.from('episodios').select('*').eq('id_n', id).maybeSingle();
  return data;
}

// Página de EXIBIÇÃO do episódio — tela cheia, sem rolagem vertical.
// Botão Sair volta para a listagem de Séries.
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
    <Player
      src={episodio.arquivo}
      poster={episodio.banner || episodio.imagem_500}
      subtitles={episodio.subtitles}
      audioTracks={episodio.audio_tracks}
      contentId={String(episodio.id_n)}
      nextEpisodeHref={
        searchParams.proximo ? `/series/${params.id}/assistir/${searchParams.proximo}` : null
      }
      exitHref="/series"
    />
  );
}
