import { supabaseServer } from '@/lib/supabase/server';
import { PosterGrid } from '@/components/PosterGrid';
import { BackButton } from '@/components/BackButton';
import type { Cinema } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getFilme(id: string): Promise<Cinema | null> {
  const { data } = await supabaseServer.from('cinema').select('*').eq('id', id).maybeSingle();
  return data;
}

async function getRelacionados(ids: number[] | null): Promise<Cinema[]> {
  if (!ids || ids.length === 0) return [];
  const { data } = await supabaseServer.from('cinema').select('*').in('id', ids);
  return data || [];
}

// Página de DETALHES (informações) — separada da página de EXIBIÇÃO
// (/filmes/[id]/assistir), exatamente como no padrão HBO Max: aqui só
// se decide se vai assistir; o player só existe na rota de exibição.
// Imagem em <img object-top> (não background-image) para não cortar o
// topo, e tipografia ampliada para leitura à distância na TV.
export default async function FilmeDetalhesPage({ params }: { params: { id: string } }) {
  const filme = await getFilme(params.id);
  if (!filme) notFound();

  const relacionados = await getRelacionados(filme.relacionados);
  const imagem = filme.backdrop || filme.banner;

  return (
    <div>
      <div className="relative min-h-[62vh] flex items-end px-6 md:px-10 pb-10 overflow-hidden bg-accent-soft">
        {imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagem} alt={filme.titulo} className="absolute inset-0 w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <BackButton />

        <div className="relative z-10 max-w-3xl">
          <h1 className="font-heading font-bold text-[32px] md:text-[48px] lg:text-[56px] leading-tight mb-3">
            {filme.titulo}
          </h1>
          <p className="text-[16px] md:text-[20px] text-accent-hover mb-2">
            {[filme.year, filme.duration, filme.category].filter(Boolean).join(' · ')}
          </p>
          {filme.rating !== null && (
            <p className="text-[15px] md:text-[18px] text-gold mb-5">
              {Math.round((filme.rating || 0) * 10)}% de compatibilidade
            </p>
          )}
          <div className="flex gap-3">
            <Link
              href={`/filmes/${filme.id}/assistir`}
              className="focusable bg-accent text-white text-[15px] md:text-[17px] font-medium rounded-card px-7 py-3"
            >
              <i className="ti ti-player-play mr-2" aria-hidden="true" />
              Assistir
            </Link>
            <button className="focusable bg-white/10 border border-border text-white text-[15px] md:text-[17px] font-medium rounded-card px-6 py-3">
              <i className="ti ti-plus mr-2" aria-hidden="true" />
              Minha lista
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 pt-8">
        <div className="flex gap-6">
          <div className="flex-1 max-w-3xl">
            <p className="text-[16px] md:text-[19px] text-white/90 leading-relaxed mb-5">{filme.description}</p>
            {filme.elenco && filme.elenco.length > 0 && (
              <p className="text-[14px] md:text-[16px] text-textmuted mb-1.5">
                Elenco: {filme.elenco.map((e) => e.nome).join(', ')}
              </p>
            )}
            {filme.genre && (
              <p className="text-[14px] md:text-[16px] text-textmuted">Gêneros: {filme.genre}</p>
            )}
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="px-6 md:px-10 pt-8 pb-10">
          <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold mb-3">
            Títulos semelhantes
          </h2>
          <PosterGrid
            items={relacionados.map((r) => ({
              id: r.id,
              href: `/filmes/${r.id}`,
              poster: r.poster || r.banner,
              titulo: r.titulo,
              ano: r.year,
              rating: r.rating
            }))}
          />
        </div>
      )}
    </div>
  );
}
