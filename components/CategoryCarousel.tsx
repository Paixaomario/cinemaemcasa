'use client';

import { useEffect, useRef, useState } from 'react';
import { TitleCard } from './TitleCard';
import { estaEmModoInfantilCliente, filtrarConteudoAdulto, contemTermoAdulto } from '@/lib/kidsMode';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  itensIniciais: Cinema[];
  fimInicial: boolean;
  categoria: string;
  tipo: 'filme' | 'serie';
  basePath: 'filmes' | 'series';
}

// Agente de Filmes/Séries: rolagem horizontal SEM LIMITE. A página
// carrega só o primeiro lote (rápido, direto do servidor); conforme o
// usuário rola (mouse, toque OU D-pad) perto do fim da linha, mais
// itens são buscados na hora via /api/categoria e anexados à lista —
// sem paginação por clique, sem "carregar mais", sem número máximo por
// categoria. Só quando o banco realmente não tem mais nada pra aquela
// categoria a rolagem reinicia do primeiro item de novo (nunca antes
// de mostrar tudo que existe).
export function CategoryCarousel({ titulo, itensIniciais, fimInicial, categoria, tipo, basePath }: Props) {
  // Modo infantil (Agente de Perfil): se o perfil ativo é infantil, a
  // categoria "Adulto" nem chega a renderizar, e qualquer item
  // marcado como adulto some das demais categorias — checado uma vez
  // (o cookie só muda ao trocar de perfil, o que já recarrega a
  // página). Ver lib/kidsMode.ts para a explicação de por que isso
  // roda no cliente, não no servidor.
  const [infantil] = useState(estaEmModoInfantilCliente);
  const categoriaBloqueada = infantil && contemTermoAdulto(categoria);

  const [items, setItems] = useState(
    categoriaBloqueada ? [] : infantil ? filtrarConteudoAdulto(itensIniciais) : itensIniciais
  );
  const [offset, setOffset] = useState(itensIniciais.length);
  const [fimAlcancado, setFimAlcancado] = useState(fimInicial);
  const [carregando, setCarregando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelaRef = useRef<HTMLDivElement>(null);
  const indiceParaFocar = useRef<number | null>(null);
  // Trava de segurança: categorias com poucos itens (menores que uma
  // página) não podem gerar carregamento automático infinito só porque
  // a sentinela nunca sai da tela. Depois da 1ª volta completa sem
  // crescer, o carregamento automático por scroll para — mas continua
  // funcionando sob demanda ao navegar por D-pad/teclado.
  const voltasSemCrescer = useRef(0);
  const [autoCarregarAtivo, setAutoCarregarAtivo] = useState(!fimInicial || itensIniciais.length === 0);

  const carregarMais = async () => {
    if (carregando) return;
    setCarregando(true);

    const proximoOffset = fimAlcancado ? 0 : offset;
    const res = await fetch(
      `/api/categoria?tipo=${tipo}&categoria=${encodeURIComponent(categoria)}&offset=${proximoOffset}`
    );
    const data = await res.json();

    if (proximoOffset === 0 && fimAlcancado) {
      voltasSemCrescer.current += 1;
      if (voltasSemCrescer.current >= 1) setAutoCarregarAtivo(false);
    }

    setItems((prev) => [...prev, ...(infantil ? filtrarConteudoAdulto(data.items) : data.items)]);
    setOffset(proximoOffset + data.items.length);
    setFimAlcancado(data.fim);
    setCarregando(false);
  };

  // Mouse/toque: observa uma "sentinela" invisível no fim da linha —
  // quando ela entra na tela, busca mais itens automaticamente. Só
  // ativo enquanto a categoria ainda não deu uma volta completa sem
  // crescer (ver trava de segurança acima).
  useEffect(() => {
    const sentinela = sentinelaRef.current;
    if (!sentinela || !autoCarregarAtivo) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) carregarMais();
      },
      { root: scrollRef.current, rootMargin: '0px 400px 0px 0px' }
    );
    observer.observe(sentinela);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, fimAlcancado, autoCarregarAtivo]);

  // D-pad/teclado: quando o foco chega na sentinela (navegando pra
  // direita), guarda a posição atual, carrega mais, e assim que os
  // novos itens chegarem manda o foco pro primeiro deles — a
  // navegação nunca "trava" no fim da linha.
  useEffect(() => {
    if (indiceParaFocar.current === null) return;
    const alvo = scrollRef.current?.querySelector<HTMLElement>(
      `[data-item-index="${indiceParaFocar.current}"] .focusable`
    );
    alvo?.focus();
    alvo?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    indiceParaFocar.current = null;
  }, [items]);

  const aoFocarSentinela = () => {
    indiceParaFocar.current = items.length;
    carregarMais();
  };

  const aoRodarMouse = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  if (categoriaBloqueada || items.length === 0) return null;

  return (
    <section className="py-4">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-3">
        {titulo}
      </h2>
      <div
        ref={scrollRef}
        onWheel={aoRodarMouse}
        className="flex gap-1 overflow-x-auto overflow-y-visible px-3 py-8 -my-8"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {items.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            data-item-index={idx}
            data-carousel-card="true"
            className="shrink-0 poster-card-width"
            style={{ scrollSnapAlign: 'start' }}
          >
            <TitleCard
              href={`/${basePath}/${item.id}`}
              poster={item.poster || item.banner}
              titulo={item.titulo}
              ano={item.year}
              rating={item.rating}
              trailer={item.trailer}
              duracao={item.duration}
              descricao={item.description}
              tmdbId={item.tmdb_id}
              tipo={tipo === 'filme' ? 'movie' : 'series'}
              tall
            />
          </div>
        ))}

        {/* Sentinela: invisível, mas focável — é o "próximo item" tanto
            pra rolagem por scroll quanto pra navegação por D-pad. */}
        <div
          ref={sentinelaRef}
          tabIndex={0}
          onFocus={aoFocarSentinela}
          className="focusable shrink-0 w-2 h-2 opacity-0"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
