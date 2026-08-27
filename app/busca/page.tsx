export const revalidate = 300;

import { supabasePublic } from '@/lib/supabase/server';
import { HeroBanner } from '@/components/HeroBanner';
import { enrichHeroes } from '@/lib/heroEnrichment';
import { LiveSearch } from '@/components/LiveSearch';
import type { Cinema } from '@/lib/types';

async function getHeroesBusca(): Promise<Cinema[]> {
  const { data } = await supabasePublic
    .from('cinema')
    .select('*')
    .order('rating', { ascending: false })
    .limit(40);
  return data || [];
}

// Agente da página de Busca: banner hero rotativo no topo + campo de
// pesquisa em tempo real (ver components/LiveSearch.tsx) logo abaixo.
export default async function BuscaPage() {
  const heroesBase = await getHeroesBusca();
  const heroes = await enrichHeroes(heroesBase);

  return (
    <div>
      {heroes.length > 0 && <HeroBanner heroes={heroes} />}
      <LiveSearch />
    </div>
  );
}
