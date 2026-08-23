import { supabaseServer } from '@/lib/supabase/server';
import type { Serie, Temporada, Episodio } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getSerie(id: string): Promise<Serie | null> {
  const { data } = await supabaseServer.from('series').select('*').eq('id_n', id).maybeSingle();
  return data;
}

async function getTemporadas(serieId: number): Promise<Temporada[]> {
  const { data } = await supabaseServer
    .from('temporadas')
    .select('*')
    .eq('serie_id', serieId)
    .order('numero_temporada', { ascending: true });
  return data || [];
}

async function getEpisodios(temporadaId: number): Promise<Episodio[]> {
  const { data } = await supabaseServer
    .from('episodios')
    .select('*')
    .eq('temporada_id', temporadaId)
    .order('numero_episodio', { ascending: true });
  return data || [];
}

export default async function SerieDetalhesPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { temporada?: string };
}) {
  const serie = await getSerie(params.id);
  if (!serie) notFound();

  const temporadas = await getTemporadas(serie.id_n);
  const temporadaAtual =
    temporadas.find((t) => String(t.numero_temporada) === searchParams.temporada) ||
    temporadas[0];
  const episodios = temporadaAtual ? await getEpisodios(temporadaAtual.id_n) : [];

  return (
    <div>
      <div className="relative bg-accent-soft px-6 pt-12 pb-7">
        <h1 className="text-[22px] font-medium mb-1">{serie.titulo}</h1>
        <p className="text-[13px] text-accent-hover mb-1">
          {[serie.ano, `${temporadas.length} temporadas`, serie.classificacao]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {serie.rating !== null && (
          <p className="text-[12px] text-gold mb-4">
            {Math.round((serie.rating || 0) * 10)}% de compatibilidade
          </p>
        )}
        <p className="text-[13px] text-white/90 max-w-[520px]">{serie.descricao}</p>
      </div>

      <div className="px-6 pt-5 flex items-center justify-between">
        <h2 className="text-[15px] font-medium">Episódios</h2>
        <div className="flex gap-1.5">
          {temporadas.map((t) => (
            <Link
              key={t.id_n}
              href={`/series/${serie.id_n}?temporada=${t.numero_temporada}`}
              className={`focusable text-[12px] rounded px-3 py-1.5 ${
                t.id_n === temporadaAtual?.id_n ? 'bg-accent text-white' : 'bg-card text-textmuted'
              }`}
            >
              Temporada {t.numero_temporada}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-6 pt-4 pb-10 flex flex-col gap-2.5">
        {episodios.map((ep, idx) => {
          const next = episodios[idx + 1];
          return (
            <Link
              key={ep.id_n}
              href={`/series/${serie.id_n}/assistir/${ep.id_n}${
                next ? `?proximo=${next.id_n}` : ''
              }`}
              className="focusable flex gap-3 items-center bg-panel rounded-card p-2.5"
            >
              <div className="w-[100px] h-14 rounded bg-card shrink-0 overflow-hidden">
                {ep.imagem_342 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ep.imagem_342} alt={ep.titulo || ''} className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-[13px] font-medium">
                  {ep.numero_episodio}. {ep.titulo}
                </p>
                <p className="text-[11px] text-textmuted">
                  {[ep.duracao, ep.descricao].filter(Boolean).join(' · ')}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
