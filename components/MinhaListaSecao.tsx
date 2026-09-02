'use client';

import { useState, useRef } from 'react';
import { TitleCard } from './TitleCard';
import { supabaseBrowser } from '@/lib/supabase/client';

interface Item {
  id: number;
  href: string;
  poster: string | null;
  titulo: string;
  ano: number | null;
  rating: number | null;
  trailer: string | null;
  contentType: 'movie' | 'series';
}

interface Props {
  titulo: string;
  itensIniciais: Item[];
}

// Agente de Minha Lista: cada capa tem um botão de excluir (canto
// superior direito) — clique nele remove da lista sem precisar entrar
// na página de detalhes pra fazer isso pelo botão de lá.
export function MinhaListaSecao({ titulo, itensIniciais }: Props) {
  const [itens, setItens] = useState(itensIniciais);
  const scrollRef = useRef<HTMLDivElement>(null);

  const remover = async (e: React.MouseEvent, item: Item) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: userData } = await supabaseBrowser.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabaseBrowser
      .from('favorites')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('legacy_id', item.id)
      .eq('content_type', item.contentType);

    if (!error) setItens((prev) => prev.filter((i) => i.id !== item.id));
  };

  const aoRodarMouse = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  if (itens.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-2">
        {titulo}
      </h2>
      <div
        ref={scrollRef}
        onWheel={aoRodarMouse}
        className="flex gap-1 overflow-x-auto overflow-y-visible px-3 py-8 -my-8"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {itens.map((item) => (
          <div
            key={item.id}
            data-carousel-card="true"
            className="relative shrink-0 poster-card-width"
            style={{ scrollSnapAlign: 'start' }}
          >
            <TitleCard
              href={item.href}
              poster={item.poster}
              titulo={item.titulo}
              ano={item.ano}
              rating={item.rating}
              trailer={item.trailer}
              tall
            />
            <button
              onClick={(e) => remover(e, item)}
              aria-label={`Remover ${item.titulo} da minha lista`}
              className="focusable absolute top-2 right-2 z-[110] w-7 h-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white"
            >
              <i className="ti ti-trash text-[14px]" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
