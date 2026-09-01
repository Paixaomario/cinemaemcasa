export const revalidate = 300;

import { supabasePublic } from '@/lib/supabase/server';
import { BackButton } from '@/components/BackButton';
import { getMetadadosDoTMDB } from '@/lib/tmdb';
import { limparTituloExibicao, qualidadeMaximaTMDB } from '@/lib/exibicao';
import { GuardaModoInfantil } from '@/components/GuardaModoInfantil';
import { AssistirJuntoButton } from '@/components/AssistirJuntoButton';
import { BotaoMinhaLista } from '@/components/BotaoMinhaLista';
import { ElencoRow } from '@/components/ElencoRow';
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

// Página de DETALHES da série — mesmo padrão da de filme: fundo com a
// imagem grande, capa à esquerda, informações e botões à direita. Tudo
// que faltar no Supabase é buscado no TMDB pelo tmdb_id salvo.
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

  const reforco = serie.tmdb_id ? await getMetadadosDoTMDB(serie.tmdb_id, 'series') : null;

  const titulo = limparTituloExibicao(serie.titulo || '');
  const fundo = qualidadeMaximaTMDB(serie.banner) || reforco?.backdrop;
  const capa = qualidadeMaximaTMDB(serie.poster || serie.capa) || reforco?.poster;
  const descricao = serie.descricao || reforco?.descricao;
  const elenco = serie.elenco?.length ? serie.elenco : reforco?.elenco || [];
  const generos = serie.genero ? serie.genero.split(/[,/]/).map((g) => g.trim()) : reforco?.generos || [];
  const duracao = serie.tmdb_runtime || reforco?.duracao;
  const classificacao = serie.classificacao || reforco?.classificacao;
  const bandeira = reforco?.bandeira;

  return (
    <div className="relative min-h-screen">
      {fundo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fundo} alt={titulo} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <BackButton />
      <GuardaModoInfantil category={serie.genero} genre={serie.genero} />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 px-6 md:px-10 pt-20 pb-10 min-h-screen">
        {capa && (
          <div className="shrink-0 w-[140px] sm:w-[180px] md:w-[220px] mx-auto md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capa} alt={titulo} className="w-full aspect-[2/3] object-cover rounded-lg shadow-2xl" />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center gap-3 max-w-3xl">
          <h1 className="font-heading font-bold text-[32px] md:text-[52px] lg:text-[60px] leading-[1.05]">
            {titulo}
          </h1>

          <p className="text-[16px] md:text-[20px] text-white/80">{serie.ano}</p>

          {generos.length > 0 && (
            <p className="text-[14px] md:text-[16px] text-white/70">{generos.join(' · ')}</p>
          )}

          <div className="flex items-center gap-2.5 flex-wrap text-[13px] md:text-[15px]">
            {classificacao && (
              <span className="border border-white/40 rounded px-2 py-0.5 text-white/90">
                {classificacao}
              </span>
            )}
            {serie.rating !== null && (
              <span className="text-gold font-medium">
                {Math.round((serie.rating || 0) * 10)}% de compatibilidade
              </span>
            )}
            {bandeira && <span>{bandeira}</span>}
            <span className="text-white/70">{temporadas.length} temporadas</span>
            {duracao && <span className="text-white/70">{duracao}</span>}
          </div>

          {descricao && (
            <p className="text-[16px] md:text-[19px] text-white/90 leading-relaxed max-w-none line-clamp-6">
              {descricao}
            </p>
          )}

          {elenco.length > 0 && <ElencoRow elenco={elenco} />}

          <div className="flex gap-3 flex-wrap mt-2">
            <BotaoMinhaLista contentId={serie.id_n} contentType="series" />
            {episodios[0] && (
              <AssistirJuntoButton contentId={String(episodios[0].id_n)} contentType="series" titulo={titulo} />
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-black pt-6 px-6 md:px-10 flex items-center justify-between flex-wrap gap-3">
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

      <div className="relative z-10 bg-black px-6 md:px-10 pt-5 pb-10 flex flex-col gap-3">
        {episodios.map((ep, idx) => {
          const next = episodios[idx + 1];
          const capaEp = qualidadeMaximaTMDB(ep.imagem_342 || ep.imagem_500 || ep.capa || ep.banner);
          return (
            <Link
              key={ep.id_n}
              href={`/series/${serie.id_n}/assistir/${ep.id_n}${next ? `?proximo=${next.id_n}` : ''}`}
              className="focusable flex gap-4 items-center bg-panel rounded-card p-3 shadow-card"
            >
              <div className="w-[140px] md:w-[180px] aspect-video rounded bg-card shrink-0 overflow-hidden">
                {capaEp && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capaEp} alt={ep.titulo || ''} className="w-full h-full object-cover" />
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
