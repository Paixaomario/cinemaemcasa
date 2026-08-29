export const revalidate = 300;

import { supabasePublic } from '@/lib/supabase/server';
import { BackButton } from '@/components/BackButton';
import { GuardaModoInfantil } from '@/components/GuardaModoInfantil';
import { AssistirJuntoButton } from '@/components/AssistirJuntoButton';
import { BotaoMinhaLista } from '@/components/BotaoMinhaLista';
import type { Serie, Temporada, Episodio } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getSerie(id: string): Promise<Serie | null> {
  const { data } = await supabasePublic.from('series').select('*').eq('id_n', id).maybeSingle();
  return data;
}

async function getTemporadas(serieId: number): Promise<Temporada[]> {
  const { data } = await supabasePublic
    .from('temporadas')
    .select('*')
    .eq('serie_id', serieId)
    .order('numero_temporada', { ascending: true });
  return data || [];
}

async function getEpisodios(temporadaId: number): Promise<Episodio[]> {
  const { data } = await supabasePublic
    .from('episodios')
    .select('*')
    .eq('temporada_id', temporadaId)
    .order('numero_episodio', { ascending: true });
  return data || [];
}

// Página de DETALHES da série — imagem com object-top (sem cortar o
// topo), tipografia ampliada para leitura a distância, botão voltar, e
// lista de episódios com capa + nome + descrição (2 linhas) + duração.
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
  const imagem = serie.banner || serie.capa;

  return (
    <div>
      <div className="relative min-h-[56vh] flex items-end px-6 md:px-10 pb-8 overflow-hidden bg-accent-soft">
        {imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagem} alt={serie.titulo || ''} className="absolute inset-0 w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <BackButton />
        <GuardaModoInfantil category={serie.genero} genre={serie.genero} />

        <div className="relative z-10 max-w-3xl">
          <h1 className="font-heading font-bold text-[32px] md:text-[48px] lg:text-[56px] leading-tight mb-3">
            {serie.titulo}
          </h1>
          <p className="text-[16px] md:text-[20px] text-white/80 mb-2">
            {[serie.ano, `${temporadas.length} temporadas`, serie.classificacao].filter(Boolean).join(' · ')}
          </p>
          {serie.rating !== null && (
            <p className="text-[15px] md:text-[18px] text-gold mb-4">
              {Math.round((serie.rating || 0) * 10)}% de compatibilidade
            </p>
          )}
          <p className="text-[16px] md:text-[19px] text-white/90 leading-relaxed max-w-2xl">{serie.descricao}</p>
          <div className="flex gap-3 mt-4 flex-wrap">
            <BotaoMinhaLista contentId={serie.id_n} contentType="series" />
            {episodios[0] && (
              <AssistirJuntoButton contentId={String(episodios[0].id_n)} contentType="series" titulo={serie.titulo || ''} />
            )}
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 pt-8 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold">Episódios</h2>
        <div className="flex gap-2 flex-wrap">
          {temporadas.map((t) => (
            <Link
              key={t.id_n}
              href={`/series/${serie.id_n}?temporada=${t.numero_temporada}`}
              className={`focusable text-[14px] rounded px-4 py-2 ${
                t.id_n === temporadaAtual?.id_n ? 'bg-accent text-white' : 'bg-card text-textmuted'
              }`}
            >
              Temporada {t.numero_temporada}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-10 pt-5 pb-10 flex flex-col gap-3">
        {episodios.map((ep, idx) => {
          const next = episodios[idx + 1];
          const capa = ep.imagem_342 || ep.imagem_500 || ep.capa || ep.banner;
          return (
            <Link
              key={ep.id_n}
              href={`/series/${serie.id_n}/assistir/${ep.id_n}${next ? `?proximo=${next.id_n}` : ''}`}
              className="focusable flex gap-4 items-center bg-panel rounded-card p-3 shadow-card"
            >
              <div className="w-[140px] md:w-[180px] aspect-video rounded bg-card shrink-0 overflow-hidden">
                {capa && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capa} alt={ep.titulo || ''} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] md:text-[17px] font-medium mb-1">
                  {ep.numero_episodio}. {ep.titulo}
                </p>
                <p className="text-[13px] md:text-[14px] text-textmuted leading-snug line-clamp-2 mb-1">
                  {ep.descricao}
                </p>
                {ep.duracao && <p className="text-[12px] text-gold">{ep.duracao}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
