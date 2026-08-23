import { supabaseServer } from '@/lib/supabase/server';
import { Player } from '@/components/Player';
import { TitleCard } from '@/components/TitleCard';
import type { Cinema } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getFilme(id: string): Promise<Cinema | null> {
  const { data } = await supabaseServer.from('cinema').select('*').eq('id', id).maybeSingle();
  return data;
}

async function getRelacionados(ids: number[] | null): Promise<Cinema[]> {
  if (!ids || ids.length === 0) return [];
  const { data } = await supabaseServer.from('cinema').select('*').in('id', ids);
  return data || [];
}

export default async function FilmeDetalhesPage({ params }: { params: { id: string } }) {
  const filme = await getFilme(params.id);
  if (!filme) notFound();

  const relacionados = await getRelacionados(filme.relacionados);

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

      <div className="px-6 pt-5">
        <h1 className="text-[22px] font-medium mb-1">{filme.titulo}</h1>
        <p className="text-[13px] text-accent-hover mb-1">
          {[filme.year, filme.duration, filme.category].filter(Boolean).join(' · ')}
        </p>
        {filme.rating !== null && (
          <p className="text-[12px] text-gold mb-4">{Math.round((filme.rating || 0) * 10)}% de compatibilidade</p>
        )}

        <div className="flex gap-6">
          <div className="flex-1">
            <p className="text-[13px] text-white/90 leading-relaxed mb-4">{filme.description}</p>
            {filme.elenco && filme.elenco.length > 0 && (
              <p className="text-[12px] text-textmuted mb-1">
                Elenco: {filme.elenco.map((e) => e.nome).join(', ')}
              </p>
            )}
            {filme.genre && (
              <p className="text-[12px] text-textmuted">Gêneros: {filme.genre}</p>
            )}
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="px-6 pt-6 pb-10">
          <h2 className="text-[15px] font-medium mb-3">Títulos semelhantes</h2>
          <div className="flex gap-2.5 overflow-x-auto">
            {relacionados.map((r) => (
              <TitleCard
                key={r.id}
                href={`/filmes/${r.id}`}
                poster={r.poster || r.banner}
                titulo={r.titulo}
                ano={r.year}
                tall
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
