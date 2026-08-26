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

// Capas em tamanho HBO Max — a grade PREENCHE a largura disponível
// (auto-fit + 1fr), crescendo ainda mais em telas grandes/TV via CSS
// (.poster-grid-desktop, ver app/globals.css) em vez de um tamanho
// único fixo, para ficar confortável de ver também em 100"+.

export function PosterGrid({ items, tall = true }: Props) {
  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop / Smart TV / computador */}
      <div className="hidden md:grid poster-grid-desktop">
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
