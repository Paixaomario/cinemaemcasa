import { supabaseServer } from '@/lib/supabase/server';
import { getHomeRecommendations } from '@/lib/recommendations';
import { getBackdropDoTMDB } from '@/lib/tmdb';
import { HomeSectionRow } from '@/components/HomeSectionRow';
import { HeroBanner } from '@/components/HeroBanner';
import { PosterGrid } from '@/components/PosterGrid';
import type { Cinema, HomeSection } from '@/lib/types';

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

async function getHero(featuredSection: HomeSection | undefined): Promise<Cinema | null> {
  // Agente de Home: o banner hero deve respeitar a configuração da seção
  // com layout = 'featured' em home_sections (categorias/ordenação),
  // em vez de ignorar essa configuração como antes.
  if (featuredSection) {
    let query = supabaseServer.from('cinema').select('*').limit(1);
    if (featuredSection.categorias && featuredSection.categorias.length > 0) {
      query = query.in('category', featuredSection.categorias);
    }
    if (featuredSection.ordenacao === 'rating_desc') query = query.order('rating', { ascending: false });
    else if (featuredSection.ordenacao === 'year_desc') query = query.order('year', { ascending: false });
    else if (featuredSection.ordenacao === 'random') query = query.order('created_at', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query.maybeSingle();
    if (data) return data;
  }

  // Sem seção 'featured' configurada: usa o melhor avaliado do catálogo.
  const { data } = await supabaseServer
    .from('cinema')
    .select('*')
    .order('rating', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export default async function HomePage() {
  const todasSecoes = await getSections();
  const secaoFeatured = todasSecoes.find((s) => s.layout === 'featured');
  const secoesLinha = todasSecoes.filter((s) => s.layout !== 'featured');

  const [hero, sectionData] = await Promise.all([
    getHero(secaoFeatured),
    Promise.all(secoesLinha.map(async (s) => ({ section: s, items: await getSectionItems(s) })))
  ]);

  // Agente de indicações por IA: sempre a 4ª seção, restrita ao catálogo próprio.
  const recomendados = await getHomeRecommendations(null, 5);

  // Agente de Home: a imagem do banner hero SEMPRE vem da coluna exata
  // da tabela (backdrop/banner) ou, na ausência dela, do TMDB pelo
  // tmdb_id salvo no próprio registro — nunca de outra fonte.
  let heroResolvido = hero;
  if (hero && !hero.backdrop && !hero.banner && hero.tmdb_id) {
    const tmdbId = hero.tmdb_id;
    const backdropTMDB = await getBackdropDoTMDB(tmdbId, hero.type === 'series' ? 'series' : 'movie');
    if (backdropTMDB) heroResolvido = { ...hero, backdrop: backdropTMDB };
  }

  const rows = [...sectionData];
  const heroSectionIndex = 3;
  const beforeAI = rows.slice(0, heroSectionIndex);
  const afterAI = rows.slice(heroSectionIndex);

  return (
    <div>
      {heroResolvido && <HeroBanner hero={heroResolvido} />}

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
              rating: item.rating
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
