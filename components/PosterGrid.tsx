import { TitleCard } from './TitleCard';

interface Item {
  id: string | number;
  href: string;
  poster: string | null;
  titulo: string;
  ano?: number | null;
}

interface Props {
  items: Item[];
  tall?: boolean;
}

// HBO Max usa tiles relativamente pequenos e compactos — bem menores
// do que uma grade "elástica" que estica 5 colunas pra ocupar a tela
// inteira em telas grandes. Por isso, no desktop/TV, cada coluna tem
// uma largura MÁXIMA travada (170px), então a grade cresce em NÚMERO
// de colunas em telas maiores em vez de esticar cada capa. Ajuste
// LARGURA_MAX se quiser um tile maior/menor.
const LARGURA_MAX = 170;

export function PosterGrid({ items, tall = true }: Props) {
  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop / Smart TV / computador: tamanho travado, estilo HBO Max */}
      <div
        className="hidden md:grid gap-x-[4px] gap-y-3"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, ${LARGURA_MAX}px))` }}
      >
        {items.map((item) => (
          <TitleCard key={item.id} href={item.href} poster={item.poster} titulo={item.titulo} ano={item.ano} tall={tall} />
        ))}
      </div>

      {/* Mobile: 2 capas por linha, com rolagem horizontal */}
      <div className="flex md:hidden gap-1 overflow-x-auto -mx-3 px-3 snap-x snap-mandatory">
        {items.map((item) => (
          <div key={item.id} className="shrink-0 w-[47%] snap-start">
            <TitleCard href={item.href} poster={item.poster} titulo={item.titulo} ano={item.ano} tall={tall} />
          </div>
        ))}
      </div>
    </>
  );
}
