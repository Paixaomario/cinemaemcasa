'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { SearchResultsGrid } from './SearchResultsGrid';
import { estaEmModoInfantilCliente, contemTermoAdulto } from '@/lib/kidsMode';
import type { SearchCatalogItem } from '@/lib/types';

// Agente de Busca: pesquisa em tempo real — a cada tecla digitada (com
// pequeno debounce de 300ms para não disparar uma consulta por letra),
// os resultados aparecem abaixo sem precisar enviar formulário nem
// recarregar a página.
export function LiveSearch() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<SearchCatalogItem[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const termoAtual = termo.trim();
    if (!termoAtual) {
      setResultados([]);
      return;
    }

    setBuscando(true);
    const t = setTimeout(async () => {
      const { data } = await supabaseBrowser
        .from('search_catalog')
        .select('*')
        .ilike('titulo', `%${termoAtual}%`)
        .limit(30);
      // Modo infantil (Agente de Perfil): nunca mostra resultado
      // marcado como conteúdo adulto (ver lib/kidsMode.ts).
      const filtrados = estaEmModoInfantilCliente()
        ? (data || []).filter((r) => !contemTermoAdulto(r.genero) && !contemTermoAdulto(r.tipo))
        : data || [];
      setResultados(filtrados);
      setBuscando(false);
    }, 300);

    return () => clearTimeout(t);
  }, [termo]);

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="mb-6 max-w-md relative">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar filmes, séries..."
          autoFocus
          className="w-full bg-card border border-border rounded-card px-4 py-2.5 text-sm text-white placeholder:text-textmuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
        {buscando && (
          <i className="ti ti-loader-2 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-textmuted" aria-hidden="true" />
        )}
      </div>

      {termo.trim() && !buscando && resultados.length === 0 && (
        <p className="text-sm text-textmuted">Nenhum título encontrado para &ldquo;{termo}&rdquo;.</p>
      )}

      <SearchResultsGrid results={resultados} />
    </div>
  );
}
