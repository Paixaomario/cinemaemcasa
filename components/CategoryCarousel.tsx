import { TitleCard } from './TitleCard';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
  basePath: 'filmes' | 'series';
}

// Agente de Filmes/Séries: linha de rolagem horizontal SEM setas de
// navegação — a rolagem acontece por toque, trackpad/scroll do mouse,
// ou pelo foco do D-pad/controle remoto (o hook de navegação espacial
// já rola o item focado para dentro da tela). Mostra TODOS os itens da
// categoria, com tiles em tamanho travado (estilo HBO Max, 10% maiores
// no desktop; 3 por linha no mobile).
export function CategoryCarousel({ titulo, items, basePath }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="px-3 py-4">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-1">
        {titulo}
      </h2>

      <div className="flex gap-1 overflow-x-auto -mx-3 px-3">
        {items.map((item) => (
          <div key={item.id} className="shrink-0 w-[31%] md:w-[206px]">
            <TitleCard
              href={`/${basePath}/${item.id}`}
              poster={item.poster || item.banner}
              titulo={item.titulo}
              ano={item.year}
              rating={item.rating}
              trailer={item.trailer}
              tall
            />
          </div>
        ))}
      </div>
    </section>
  );
}
