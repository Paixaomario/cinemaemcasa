import { TitleCard } from './TitleCard';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
}

// Regra fixa do Agente Home: sempre 5 capas por seção, sem carrossel.
// Se o Supabase retornar menos de 5 itens para a categoria, a grade
// simplesmente mostra os que existem — nunca inventa itens.
export function HomeSectionRow({ titulo, items }: Props) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 5);

  return (
    <section className="px-3 py-3">
      <h2 className="text-[15px] font-medium text-white mb-2 px-1">{titulo}</h2>
      <div className="grid grid-cols-5 gap-1.5">
        {shown.map((item) => (
          <TitleCard
            key={item.id}
            href={`/filmes/${item.id}`}
            poster={item.poster || item.banner}
            titulo={item.titulo}
            ano={item.year}
            duracao={item.duration}
            tall
          />
        ))}
      </div>
    </section>
  );
}
