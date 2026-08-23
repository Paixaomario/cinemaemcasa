import { supabaseServer } from '@/lib/supabase/server';
import { TitleCard } from '@/components/TitleCard';
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
export default async function FilmeDetalhesPage({ params }: { params: { id: string } }) {
  const filme = await getFilme(params.id);
  if (!filme) notFound();

  const relacionados = await getRelacionados(filme.relacionados);

  return (
    <div>
      <div
        className="relative bg-accent-soft bg-cover bg-center min-h-[46vh] flex items-end px-6 pb-8"
        style={{
          backgroundImage: filme.backdrop || filme.banner ? `url(${filme.backdrop || filme.banner})` : undefined
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-[26px] font-medium mb-2">{filme.titulo}</h1>
          <p className="text-[13px] text-accent-hover mb-1">
            {[filme.year, filme.duration, filme.category].filter(Boolean).join(' · ')}
          </p>
          {filme.rating !== null && (
            <p className="text-[12px] text-gold mb-4">
              {Math.round((filme.rating || 0) * 10)}% de compatibilidade
            </p>
          )}
          <div className="flex gap-2">
            <Link
              href={`/filmes/${filme.id}/assistir`}
              className="focusable bg-accent text-white text-[13px] font-medium rounded-card px-6 py-2.5"
            >
              <i className="ti ti-player-play mr-1.5" aria-hidden="true" />
              Assistir
            </Link>
            <button className="focusable bg-white/10 border border-border text-white text-[13px] font-medium rounded-card px-5 py-2.5">
              <i className="ti ti-plus mr-1.5" aria-hidden="true" />
              Minha lista
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <p className="text-[13px] text-white/90 leading-relaxed mb-4">{filme.description}</p>
            {filme.elenco && filme.elenco.length > 0 && (
              <p className="text-[12px] text-textmuted mb-1">
                Elenco: {filme.elenco.map((e) => e.nome).join(', ')}
              </p>
            )}
            {filme.genre && <p className="text-[12px] text-textmuted">Gêneros: {filme.genre}</p>}
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="px-6 pt-6 pb-10">
          <h2 className="text-[18px] font-semibold mb-3">Títulos semelhantes</h2>
          <div className="flex gap-1.5 overflow-x-auto">
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
