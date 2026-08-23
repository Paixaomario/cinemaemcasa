import { supabaseServer } from '@/lib/supabase/server';
import { getHomeRecommendations } from '@/lib/recommendations';
import { HomeSectionRow } from '@/components/HomeSectionRow';
import type { Cinema, HomeSection } from '@/lib/types';
import Link from 'next/link';

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

async function getHero(): Promise<Cinema | null> {
  const { data } = await supabaseServer
    .from('cinema')
    .select('*')
    .order('rating', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export default async function HomePage() {
  const [hero, sections] = await Promise.all([getHero(), getSections()]);

  const sectionData = await Promise.all(
    sections.map(async (s) => ({ section: s, items: await getSectionItems(s) }))
  );

  // Agente de indicações por IA: sempre a 4ª seção, restrita ao catálogo próprio.
  const recomendados = await getHomeRecommendations(null, 5);

  const rows = [...sectionData];
  const heroSectionIndex = 3;
  const beforeAI = rows.slice(0, heroSectionIndex);
  const afterAI = rows.slice(heroSectionIndex);

  return (
    <div>
      {hero && (
        <div className="relative bg-accent-soft px-5 pt-12 pb-8 min-h-[220px]">
          <p className="text-[11px] text-gold tracking-widest mb-2">
            {hero.type === 'series' ? 'SÉRIE EM DESTAQUE' : 'FILME EM DESTAQUE'}
          </p>
          <h1 className="text-2xl font-medium mb-2 max-w-[360px]">{hero.titulo}</h1>
          <p className="text-[13px] text-accent-hover mb-1">
            {[hero.year, hero.genre, hero.duration].filter(Boolean).join(' · ')}
          </p>
          <p className="text-[13px] text-textmuted mb-4 max-w-[420px] line-clamp-3">
            {hero.description}
          </p>
          <div className="flex gap-2">
            <Link
              href={hero.type === 'series' ? `/series/${hero.id}` : `/filmes/${hero.id}/assistir`}
              className="focusable bg-accent text-white text-[13px] font-medium rounded-card px-5 py-2.5"
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
      )}

      {beforeAI.map(({ section, items }) => (
        <HomeSectionRow key={section.id} titulo={section.titulo} items={items} />
      ))}

      {recomendados.length > 0 && (
        <section className="px-3 py-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <i className="ti ti-sparkles text-gold text-base" aria-hidden="true" />
            <h2 className="text-[15px] font-medium text-white">Escolhido para você</h2>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {recomendados.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/filmes/${item.id}`}
                className="focusable block overflow-hidden bg-card rounded-[4px] w-full aspect-[2/3]"
              >
                {item.poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.poster} alt={item.titulo} className="w-full h-full object-cover" />
                )}
              </Link>
            ))}
          </div>
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
