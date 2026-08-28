import { supabaseServer } from '@/lib/supabase/server';
import { getHomeRecommendations } from '@/lib/recommendations';
import { enrichHeroes } from '@/lib/heroEnrichment';
import { filtrarConteudoAdulto, contemTermoAdulto, COOKIE_PERFIL_INFANTIL } from '@/lib/kidsMode';
import { cookies } from 'next/headers';
import { HomeSectionRow } from '@/components/HomeSectionRow';
import { HeroBanner } from '@/components/HeroBanner';
import { PosterGrid } from '@/components/PosterGrid';
import type { Cinema, HomeSection } from '@/lib/types';

interface ItemContinuar {
  id: string;
  href: string;
  poster: string | null;
  titulo: string;
  ano: number | null;
  rating: number | null;
}

async function getContinuarAssistindo(): Promise<ItemContinuar[]> {
  // Agente de Home: seção "Continuar assistindo" — SEMPRE a primeira,
  // lida da tabela view_progress do usuário logado. Cada content_id
  // pode ser um filme (tabela cinema) ou um episódio (tabela
  // episodios); tenta resolver nas duas, na ordem.
  const { data: userData } = await supabaseServer.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: progresso } = await supabaseServer
    .from('view_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('is_finished', false)
    .order('updated_at', { ascending: false })
    .limit(8);

  if (!progresso || progresso.length === 0) return [];

  const itens: ItemContinuar[] = [];
  for (const p of progresso) {
    const idNum = Number(p.content_id);
    if (Number.isNaN(idNum)) continue;

    const { data: filme } = await supabaseServer.from('cinema').select('*').eq('id', idNum).maybeSingle();
    if (filme) {
      itens.push({
        id: `c-${filme.id}`,
        href: `/filmes/${filme.id}/assistir`,
        poster: filme.poster || filme.banner,
        titulo: filme.titulo,
        ano: filme.year,
        rating: filme.rating
      });
      continue;
    }

    const { data: episodio } = await supabaseServer
      .from('episodios')
      .select('*, temporadas(serie_id)')
      .eq('id_n', idNum)
      .maybeSingle();
    if (episodio) {
      const serieId = (episodio as unknown as { temporadas?: { serie_id: number } }).temporadas?.serie_id;
      itens.push({
        id: `e-${episodio.id_n}`,
        href: serieId ? `/series/${serieId}/assistir/${episodio.id_n}` : '#',
        poster: episodio.imagem_342 || episodio.banner,
        titulo: episodio.titulo || '',
        ano: null,
        rating: null
      });
    }
  }
  return itens;
}

async function getSections(): Promise<HomeSection[]> {
  const { data } = await supabaseServer
    .from('home_sections')
    .select('*')
    .eq('ativo', true)
    .order('posicao', { ascending: true });
  return data || [];
}

async function getSectionItems(section: HomeSection): Promise<Cinema[]> {
  let query = supabaseServer.from('cinema').select('*').limit(section.limite || 5);

  if (section.categorias && section.categorias.length > 0) {
    query = query.in('category', section.categorias);
  }

  if (section.ordenacao === 'rating_desc') query = query.order('rating', { ascending: false });
  else if (section.ordenacao === 'year_desc') query = query.order('year', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data } = await query;
  return data || [];
}

async function getHeroes(featuredSection: HomeSection | undefined, infantil: boolean): Promise<Cinema[]> {
  // Agente de Home: o banner hero ROTATIVO respeita a configuração da
  // seção com layout = 'featured' em home_sections (categorias/
  // ordenação) e mostra vários títulos em sequência, não só um. Em
  // modo infantil, nunca sorteia um título de categoria adulta.
  if (featuredSection && !(infantil && featuredSection.categorias.some((c) => contemTermoAdulto(c)))) {
    let query = supabaseServer.from('cinema').select('*').limit(40);
    if (featuredSection.categorias && featuredSection.categorias.length > 0) {
      query = query.in('category', featuredSection.categorias);
    }
    if (featuredSection.ordenacao === 'rating_desc') query = query.order('rating', { ascending: false });
    else if (featuredSection.ordenacao === 'year_desc') query = query.order('year', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query;
    if (data && data.length > 0) return infantil ? filtrarConteudoAdulto(data) : data;
  }

  const { data } = await supabaseServer
    .from('cinema')
    .select('*')
    .order('rating', { ascending: false })
    .limit(40);
  return infantil ? filtrarConteudoAdulto(data || []) : data || [];
}

export default async function HomePage() {
  const infantil = cookies().get(COOKIE_PERFIL_INFANTIL)?.value === 'true';

  const todasSecoes = await getSections();
  const secaoFeatured = todasSecoes.find((s) => s.layout === 'featured');
  const secoesLinha = todasSecoes
    .filter((s) => s.layout !== 'featured')
    // Modo infantil (Agente de Perfil): a seção inteira some se a
    // categoria configurada for de conteúdo adulto.
    .filter((s) => !infantil || !s.categorias.some((c) => contemTermoAdulto(c)));

  const [heroesBase, sectionData, continuarAssistindo] = await Promise.all([
    getHeroes(secaoFeatured, infantil),
    Promise.all(
      secoesLinha.map(async (s) => ({
        section: s,
        items: infantil ? filtrarConteudoAdulto(await getSectionItems(s)) : await getSectionItems(s)
      }))
    ),
    getContinuarAssistindo()
  ]);

  // Agente de indicações por IA: sempre a 4ª seção, restrita ao catálogo próprio.
  // Já filtra termos adultos por padrão (ver lib/recommendations.ts),
  // independente do modo infantil.
  const recomendados = await getHomeRecommendations(null, 5);

  const heroes = await enrichHeroes(heroesBase);

  const rows = [...sectionData];
  const heroSectionIndex = 3;
  const beforeAI = rows.slice(0, heroSectionIndex);
  const afterAI = rows.slice(heroSectionIndex);

  return (
    <div>
      {heroes.length > 0 && <HeroBanner heroes={heroes} />}

      {continuarAssistindo.length > 0 && (
        <section className="px-3 py-3">
          <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-1">
            Continuar assistindo
          </h2>
          <PosterGrid items={continuarAssistindo} tall={false} />
        </section>
      )}

      {beforeAI.map(({ section, items }) => (
        <HomeSectionRow key={section.id} titulo={section.titulo} items={items} />
      ))}

      {recomendados.length > 0 && (
        <section className="px-3 py-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <i className="ti ti-sparkles text-gold text-base" aria-hidden="true" />
            <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white">Escolhido para você</h2>
          </div>
          <PosterGrid
            items={recomendados.slice(0, 5).map((item) => ({
              id: item.id,
              href: `/filmes/${item.id}`,
              poster: item.poster || item.banner,
              titulo: item.titulo,
              ano: item.year,
              rating: item.rating,
              trailer: item.trailer
            }))}
          />
          <p className="text-[10px] text-textmuted mt-2">
            Indicações geradas apenas com títulos do seu catálogo.
          </p>
        </section>
      )}

      {afterAI.map(({ section, items }) => (
        <HomeSectionRow key={section.id} titulo={section.titulo} items={items} />
      ))}
    </div>
  );
}
