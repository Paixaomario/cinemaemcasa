import { TitleCard } from './TitleCard';

interface Item {
  id: string | number;
  href: string;
  poster: string | null;
  titulo: string;
  ano?: number | null;
  rating?: number | null;
  trailer?: string | null;
}

interface Props {
  items: Item[];
  tall?: boolean;
}

// Capas em tamanho HBO Max, mas 10% maiores que a versão anterior, e a
// grade PREENCHE a largura disponível (auto-fill + 1fr) em vez de
// deixar sobra de espaço em telas grandes — mais colunas aparecem
// conforme a tela cresce.
const LARGURA_MIN = 227;

export function PosterGrid({ items, tall = true }: Props) {
  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop / Smart TV / computador */}
      <div
        className="hidden md:grid gap-x-[4px] gap-y-3"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${LARGURA_MIN}px, 1fr))` }}
      >
        {items.map((item) => (
          <TitleCard
            key={item.id}
            href={item.href}
            poster={item.poster}
            titulo={item.titulo}
            ano={item.ano}
            rating={item.rating}
            trailer={item.trailer}
            tall={tall}
          />
        ))}
      </div>

      {/* Mobile: 3 capas por linha, rolagem horizontal */}
      <div className="flex md:hidden gap-1 overflow-x-auto -mx-3 px-3 snap-x snap-mandatory">
        {items.map((item) => (
          <div key={item.id} className="shrink-0 w-[31%] snap-start">
            <TitleCard
              href={item.href}
              poster={item.poster}
              titulo={item.titulo}
              ano={item.ano}
              rating={item.rating}
            trailer={item.trailer}
              tall={tall}
            />
          </div>
        ))}
      </div>
    </>
  );
}
