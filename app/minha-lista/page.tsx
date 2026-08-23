import { supabaseServer } from '@/lib/supabase/server';
import { TitleCard } from '@/components/TitleCard';
import type { Cinema, Serie } from '@/lib/types';

// Agente de Minha Lista: lê a tabela `favorites` do usuário autenticado
// e resolve cada item na tabela de origem (cinema ou series), sem
// alterar nenhuma estrutura existente.
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

  const itensSerie = series.map((s) => ({
    id: s.id_n,
    titulo: s.titulo || '',
    poster: s.poster || s.capa,
    ano: s.ano
  }));

  const itensFilme = filmes.map((f) => ({
    id: f.id,
    titulo: f.titulo,
    poster: f.poster || f.banner,
    ano: f.year
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

      {itensFilme.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[18px] font-semibold text-white mb-2 px-2">Filmes</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {itensFilme.map((f) => (
              <TitleCard key={`f-${f.id}`} href={`/filmes/${f.id}`} poster={f.poster} titulo={f.titulo} ano={f.ano} tall />
            ))}
          </div>
        </div>
      )}

      {itensSerie.length > 0 && (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-2 px-2">Séries</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {itensSerie.map((s) => (
              <TitleCard key={`s-${s.id}`} href={`/series/${s.id}`} poster={s.poster} titulo={s.titulo} ano={s.ano} tall />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
