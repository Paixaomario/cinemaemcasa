# 🎬 Cinema em Casa

Aplicação web de streaming em Next.js para filmes e séries, com catálogo carregado a partir do Supabase, páginas de detalhes, player de conteúdo e interface responsiva para mobile, desktop e TV.

## Status atual

- Home com visual inspirado em Netflix e seções horizontais
- Páginas separadas para filmes e séries
- Página de detalhes com destaque visual para TV e visão à distância
- Fluxo de reprodução unificado em /assistir/[id]
- Sidebar responsiva e navegação mobile
- Tela de carregamento com logo e barra de progresso
- Redirecionamento de login para a home
- Build confirmado com Next.js 15

## Atualizações recentes (2026-07-11)

- Banners rotativos adicionados na `home`, `filmes` e `series` com rotação automática a cada 7 segundos e sem botões de navegação.
- Navegação espacial aprimorada para TV/controle remoto, evitando saltos entre a sidebar e as grades de conteúdo.
- A `home` agora evita repetição de itens entre seções e mostra até 5 capas por linha.
- Páginas de `filmes` e `series` exibem categorias como blocos horizontais (sem menus laterais na página).

Consulte o `CHANGELOG.md` para detalhes completos sobre as alterações recentes.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- WebOS assets em [public](public)

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

A aplicação ficará disponível em http://localhost:3000.

## Variáveis de ambiente

Adicione no arquivo .env.local:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Build

```bash
npm run build
```

## Estrutura principal

- [src/app](src/app) — páginas e rotas da aplicação
- [src/components](src/components) — shell, cards e grade de conteúdo
- [src/hooks](src/hooks) — navegação espacial e comportamento de TV
- [src/lib](src/lib) — consultas ao Supabase, TMDB e helpers de plataforma
- [public](public) — assets e manifestos para WebOS

## Recursos principais

- Catálogo dinâmico com conteúdo do Supabase
- Fallback para TMDB quando necessário
- Navegação otimizada para controle remoto
- Layout adaptado para telas grandes e telas pequenas

## Documentação

- [CHANGELOG.md](CHANGELOG.md) — histórico das mudanças recentes

## Contribuição

1. Crie uma branch para a sua alteração
2. Faça o desenvolvimento e teste local
3. Abra um pull request com resumo claro
