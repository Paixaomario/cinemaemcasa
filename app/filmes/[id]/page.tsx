export const revalidate = 300;

import { supabasePublic } from '@/lib/supabase/server';
import { getMetadadosDoTMDB } from '@/lib/tmdb';
import { limparTituloExibicao, qualidadeMaximaTMDB } from '@/lib/exibicao';
import { HorizontalRow } from '@/components/HorizontalRow';
import { BackButton } from '@/components/BackButton';
import { GuardaModoInfantil } from '@/components/GuardaModoInfantil';
import { AssistirJuntoButton } from '@/components/AssistirJuntoButton';
import { BotaoMinhaLista } from '@/components/BotaoMinhaLista';
import { ElencoRow } from '@/components/ElencoRow';
import type { Cinema } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getFilme(id: string): Promise<Cinema | null> {
  const { data } = await supabasePublic.from('cinema').select('*').eq('id', id).maybeSingle();
  return data;
}

async function getRelacionados(ids: number[] | null): Promise<Cinema[]> {
  if (!ids || ids.length === 0) return [];
  const { data } = await supabasePublic.from('cinema').select('*').in('id', ids);
  return data || [];
}

// Página de DETALHES — fundo com a imagem grande do filme, capa à
// esquerda (tamanho normal), todas as informações e botões à direita.
// Tudo que faltar no Supabase (imagem, sinopse, elenco, classificação,
// duração, gêneros, bandeira, idioma) é buscado no TMDB automaticamente
// pelo tmdb_id salvo — nunca substitui o que já existe no banco.
export default async function FilmeDetalhesPage({ params }: { params: { id: string } }) {
  const filme = await getFilme(params.id);
  if (!filme) notFound();

  const reforco = filme.tmdb_id ? await getMetadadosDoTMDB(filme.tmdb_id, 'movie') : null;

  const titulo = limparTituloExibicao(filme.titulo);
  const fundo = qualidadeMaximaTMDB(filme.backdrop || filme.banner) || reforco?.backdrop;
  const capa = qualidadeMaximaTMDB(filme.poster) || reforco?.poster;
  const descricao = filme.description || reforco?.descricao;
  const elenco = filme.elenco?.length ? filme.elenco : reforco?.elenco || [];
  const generos = filme.genre ? filme.genre.split(/[,/]/).map((g) => g.trim()) : reforco?.generos || [];
  const duracao = filme.duration || reforco?.duracao;
  const classificacao = reforco?.classificacao;
  const bandeira = reforco?.bandeira;
  const idiomasAudio = (filme.audio_tracks?.map((a) => a.lang) || reforco?.idiomasAudio || []).filter(Boolean);
  const idiomasLegenda = (filme.subtitles?.map((s) => s.lang) || []).filter(Boolean);

  const relacionados = await getRelacionados(filme.relacionados);

  return (
    <div className="relative min-h-screen">
      {fundo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fundo} alt={titulo} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <BackButton />
      <GuardaModoInfantil category={filme.category} genre={filme.genre} />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 px-6 md:px-10 pt-20 pb-10 min-h-screen">
        {/* Capa — lado esquerdo, tamanho normal */}
        {capa && (
          <div className="shrink-0 w-[140px] sm:w-[180px] md:w-[220px] mx-auto md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capa} alt={titulo} className="w-full aspect-[2/3] object-cover rounded-lg shadow-2xl" />
          </div>
        )}

        {/* Informações — lado direito */}
        <div className="flex-1 flex flex-col justify-center gap-3 max-w-3xl">
          <h1 className="font-heading font-bold text-[32px] md:text-[52px] lg:text-[60px] leading-[1.05]">
            {titulo}
          </h1>

          <p className="text-[16px] md:text-[20px] text-white/80">{filme.year}</p>

          {generos.length > 0 && (
            <p className="text-[14px] md:text-[16px] text-white/70">{generos.join(' · ')}</p>
          )}

          <div className="flex items-center gap-2.5 flex-wrap text-[13px] md:text-[15px]">
            {classificacao && (
              <span className="border border-white/40 rounded px-2 py-0.5 text-white/90">
                {classificacao}
              </span>
            )}
            {filme.rating !== null && (
              <span className="text-gold font-medium">
                {Math.round((filme.rating || 0) * 10)}% de compatibilidade
              </span>
            )}
            {bandeira && <span>{bandeira}</span>}
            {duracao && <span className="text-white/70">{duracao}</span>}
          </div>

          {(idiomasAudio.length > 0 || idiomasLegenda.length > 0) && (
            <p className="text-[12px] md:text-[13px] text-white/60">
              {idiomasAudio.length > 0 && <>Áudio: {idiomasAudio.join(', ')}</>}
              {idiomasAudio.length > 0 && idiomasLegenda.length > 0 && ' · '}
              {idiomasLegenda.length > 0 && <>Legendas: {idiomasLegenda.join(', ')}</>}
            </p>
          )}

          {descricao && (
            <p className="text-[16px] md:text-[19px] text-white/90 leading-relaxed max-w-none line-clamp-6">
              {descricao}
            </p>
          )}

          {elenco.length > 0 && <ElencoRow elenco={elenco} />}

          <div className="flex gap-3 flex-wrap mt-2">
            <Link
              href={`/filmes/${filme.id}/assistir`}
              className="focusable bg-accent text-white text-[15px] md:text-[17px] font-medium rounded-card px-7 py-3"
            >
              <i className="ti ti-player-play mr-2" aria-hidden="true" />
              Assistir
            </Link>
            <BotaoMinhaLista contentId={filme.id} contentType="movie" />
            <AssistirJuntoButton contentId={String(filme.id)} contentType="movie" titulo={titulo} />
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="relative z-10 bg-black pt-6 pb-10">
          <h2 className="px-6 md:px-10 text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold mb-3">
            Títulos semelhantes
          </h2>
          <HorizontalRow
            items={relacionados.map((r) => ({
              id: r.id,
              href: `/filmes/${r.id}`,
              poster: r.poster || r.banner,
              titulo: r.titulo,
              ano: r.year,
              rating: r.rating,
              trailer: r.trailer,
              tmdbId: r.tmdb_id,
              tipo: 'movie' as const
            }))}
          />
        </div>
      )}
    </div>
  );
}
