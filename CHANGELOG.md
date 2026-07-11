# Changelog

## 2026-07-11

### Added
- Banners rotativos na `home`, `filmes` e `series` sem botões de navegação (rotação a cada 7s).
- Sistema de seleção única para conteúdos na `home` para evitar repetições entre seções.
- Ordenação fixa e personalizada das categorias de filmes (estilo Netflix).
- `RotatingBanner` component em `src/components/RotatingBanner.tsx`.

### Changed
- `src/hooks/useSpatialNavigation.ts` ajustado para navegação por grupos (sidebar vs conteúdo) e movimento estrito por linha/coluna.
- `src/components/ContentCard.tsx` e `src/components/AppShell.tsx` marcados com `data-spatial-group` para navegação isolada.
- `src/app/filmes/page.tsx` e `src/app/series/page.tsx` atualizadas para exibir categorias como blocos com rolagem horizontal.
- Home ajustada para exibir somente 5 capas por linha e evitar duplicatas entre seções.

### Fixed
- Correções na abertura de episódios e rotas de reprodução.
- Correção de normalização de IDs para deduplicação segura.

### Notes
- Build verificado: `npm run build` (Next.js 15.5.18)
- Testes: adicionado teste unitário para `selectUniqueItems` em `src/lib/queries.test.ts`.
