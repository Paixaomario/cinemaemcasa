import { supabaseServer } from '@/lib/supabase/server';
import { HeroBanner } from '@/components/HeroBanner';
import { enrichHero } from '@/lib/heroEnrichment';
import { LiveSearch } from '@/components/LiveSearch';
import type { Cinema } from '@/lib/types';

async function getHeroBusca(): Promise<Cinema | null> {
  const { data } = await supabaseServer
    .from('cinema')
    .select('*')
    .order('rating', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// Agente da página de Busca: banner hero de destaque no topo + campo de
// pesquisa em tempo real (ver components/LiveSearch.tsx) logo abaixo.
export default async function BuscaPage() {
  const heroBase = await getHeroBusca();
  const hero = heroBase ? await enrichHero(heroBase) : null;

  return (
    <div>
      {hero && <HeroBanner hero={hero} />}
      <LiveSearch />
    </div>
  );
}
