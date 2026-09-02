import { supabaseServer } from '@/lib/supabase/server';
import { MinhaListaSecao } from '@/components/MinhaListaSecao';
import type { Cinema, Serie } from '@/lib/types';

// Agente de Minha Lista: SEM banner hero (removido a pedido) — só as
// capas salvas, cada uma com botão de excluir.
export default async function MinhaListaPage() {
  const { data: userData } = await supabaseServer.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return (
      <div className="px-6 pt-10">
        <h1 className="text-xl font-medium mb-3">Minha lista</h1>
        <p className="text-sm text-textmuted">Entre na sua conta para ver sua lista.</p>
      </div>
    );
  }

  const { data: favoritos } = await supabaseServer
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const filmesIds = (favoritos || [])
    .filter((f) => f.content_type === 'movie' || !f.content_type)
    .map((f) => f.legacy_id)
    .filter((id): id is number => typeof id === 'number');

  const seriesIds = (favoritos || [])
    .filter((f) => f.content_type === 'series')
    .map((f) => f.legacy_id)
    .filter((id): id is number => typeof id === 'number');

  const [filmes, series] = await Promise.all([
    filmesIds.length
      ? supabaseServer.from('cinema').select('*').in('id', filmesIds).then((r) => r.data || [])
      : Promise.resolve([] as Cinema[]),
    seriesIds.length
      ? supabaseServer.from('series').select('*').in('id_n', seriesIds).then((r) => r.data || [])
      : Promise.resolve([] as Serie[])
  ]);

  const itensFilme = filmes.map((f) => ({
    id: f.id,
    href: `/filmes/${f.id}`,
    titulo: f.titulo,
    poster: f.poster || f.banner,
    ano: f.year,
    rating: f.rating,
    trailer: f.trailer,
    contentType: 'movie' as const
  }));

  const itensSerie = series.map((s) => ({
    id: s.id_n,
    href: `/series/${s.id_n}`,
    titulo: s.titulo || '',
    poster: s.poster || s.capa,
    ano: s.ano,
    rating: s.rating,
    trailer: s.trailer,
    contentType: 'series' as const
  }));

  const vazio = itensFilme.length === 0 && itensSerie.length === 0;

  return (
    <div className="px-3 pt-10 pb-10">
      <h1 className="text-xl font-medium mb-4 px-2">Minha lista</h1>

      {vazio && (
        <p className="text-sm text-textmuted px-2">
          Sua lista está vazia. Adicione filmes e séries pelo botão &ldquo;Minha lista&rdquo; nas páginas de detalhes.
        </p>
      )}

      <MinhaListaSecao titulo="Filmes" itensIniciais={itensFilme} />
      <MinhaListaSecao titulo="Séries" itensIniciais={itensSerie} />
    </div>
  );
}
