import { HorizontalRow } from './HorizontalRow';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
}

// Agente Home: linha horizontal com rolagem (nunca quebra em várias
// linhas) — igual aos streamings oficiais e igual ao padrão já usado
// em Filmes/Séries. Antes usava uma grade que podia quebrar em mais de
// uma linha dependendo da largura da tela; corrigido.
export function HomeSectionRow({ titulo, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="py-4">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-3">
        {titulo}
      </h2>
      <HorizontalRow
        items={items.map((item) => ({
          id: item.id,
          href: `/filmes/${item.id}`,
          poster: item.poster || item.banner,
          titulo: item.titulo,
          ano: item.year,
          rating: item.rating,
          trailer: item.trailer,
          duracao: item.duration,
          descricao: item.description,
          tmdbId: item.tmdb_id,
          tipo: 'movie'
        }))}
      />
    </section>
  );
}
