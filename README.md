# Cinema em Casa

Sistema de streaming caseiro (estilo HBO Max/Netflix), 100% em Português BR,
construído com Next.js + Supabase, pronto para deploy automático no Vercel.

## 1. Configuração local

```bash
npm install
cp .env.local.example .env.local
# preencha .env.local com suas chaves reais do Supabase e do TMDB
npm run dev
```

## 2. Variáveis de ambiente (Vercel)

No painel do projeto em vercel.com/paixaocasainteligente-8419s-projects/cinemaemcasa,
em **Settings → Environment Variables**, cadastre:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `TMDB_API_READ_TOKEN`
- `TMDB_API_KEY`

## 3. Subindo para o GitHub

```bash
git init
git add .
git commit -m "Cinema em Casa - versão inicial"
git branch -M main
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

Com o repositório já conectado ao seu projeto Vercel, cada push na branch
`main` dispara automaticamente um novo deploy.

## 4. Estrutura de agentes (mapeamento código ↔ função)

| Agente | Onde está no código |
|---|---|
| Home | `app/page.tsx`, `components/HomeSectionRow.tsx` |
| Menu lateral (Web/TV) | `components/Sidebar.tsx` |
| Mobile / responsividade | `components/BottomNav.tsx`, breakpoints Tailwind |
| Filmes + detalhes | `app/filmes/**` |
| Séries + detalhes | `app/series/**` |
| Usuário (acesso) | `app/login/page.tsx` |
| Perfil | `app/perfil/page.tsx` |
| Pesquisa | `app/busca/page.tsx`, `components/SearchResultsGrid.tsx` |
| Indicações por IA | `lib/recommendations.ts` (restrito ao catálogo próprio) |
| Assistir Juntos | `app/assistir-junto/[roomId]/page.tsx`, `components/PartyRoomClient.tsx` |
| Chat | `components/PartyChat.tsx` |
| Emoji | `components/EmojiPicker.tsx` |
| Player / próximo episódio / legendas / áudio | `components/Player.tsx` |
| Administração | `app/admin/page.tsx` |
| Telas gigantes (100"+) | breakpoint `tv:` em `tailwind.config.ts` |

## 5. Empacotamento nativo para LG webOS

O projeto roda como app web (Vercel) e também pode virar um pacote `.ipk`
instalável nativamente na TV:

1. `npm run build:webos` monta a pasta `dist-webos/`
2. Edite `dist-webos/index.html` trocando a URL de exemplo pela URL real
   do seu deploy no Vercel
3. Adicione os ícones em `webos/` (`icon.png` 80x80, `icon-large.png`
   130x130, `splash.png` 1920x1080) — não incluídos aqui, precisam ser
   gerados a partir da sua logo
4. Instale o [webOS TV CLI](https://webostv.developer.lge.com/develop/tools/cli-installation)
   e rode `ares-package dist-webos/ -o ./` para gerar o `.ipk`
5. Com a TV em modo desenvolvedor: `ares-install nome-do-pacote.ipk`

**Importante:** seu projeto já tinha essa infraestrutura de empacotamento
antes (`manifest.webos.json`, `config.xml` do Tizen, scripts de build,
arquivos `.brs` de Roku, hooks de navegação espacial e proteção de
burn-in) e ela foi **apagada** num commit que substituiu a estrutura
antiga pela nova (`app/` do Next.js). Os arquivos em `webos/`,
`hooks/useSpatialNavigation.ts`, `hooks/useBurnInProtection.ts` e
`lib/platform/platformDetect.ts` desta entrega são **recriações do
zero**, não uma restauração do código original — cobrem a mesma
necessidade, mas a lógica interna é diferente. Se você tiver um backup
git de antes desse commit (`git log` + `git show <hash>:caminho`), pode
valer a pena comparar. O suporte a **Tizen (Samsung)** e **Roku** não foi
recriado nesta entrega — avise se quiser que eu monte essa camada
também.

## 6. Atualização de marca e navegação (agentes de layout/menu/splash)

- **Logo:** `public/logo.png` (marca completa) e `public/logo-icon.png`
  (símbolo recortado, sem texto) substituem o texto "CINEMA EM CASA" em
  todo o sistema (`components/Logo.tsx`). Favicon (`app/icon.png`),
  ícone Apple (`app/apple-icon.png`) e ícones PWA (`public/icons/`) já
  foram gerados a partir do logo enviado.
- **Splash screen:** `components/SplashScreen.tsx`, 700px no desktop /
  500px no mobile (responsivo), com barra de progresso de 0–100%
  simulada (~1,8s) antes de revelar a Home.
- **Menu lateral com efeito vidro:** `components/Sidebar.tsx` agora usa
  `backdrop-blur` + fundo translúcido, encolhido (só ícone) por padrão e
  expandindo com nomes via `:hover` (mouse) e `:focus-within` (teclado/
  D-pad/controle remoto) — sem depender de JavaScript para abrir/fechar.
- **Detalhes vs. exibição separados:** `/filmes/[id]` agora é só a
  página de informações (padrão HBO Max); o player ficou isolado em
  `/filmes/[id]/assistir`. Para séries, `/series/[id]` já lista
  episódios e cada um abre em `/series/[id]/assistir/[episodioId]`.
- **Capas maiores:** `TitleCard` passou a usar `aspect-ratio` fluido em
  vez de largura fixa em pixels, com `gap` reduzido nas grades — as
  capas agora preenchem a largura disponível de cada seção/carrossel.

## 8. Foco, categorias fixas e banner com trailer (esta entrega)

- **Navegação por D-pad corrigida:** `hooks/useSpatialNavigation.ts` agora
  trata o menu lateral e o conteúdo como regiões separadas, com duas
  regras explícitas: do menu, seta direita vai para a primeira linha/
  coluna do conteúdo; da primeira coluna do conteúdo, seta esquerda volta
  para o ícone Início do menu (expandindo-o). Também adicionei um foco
  inicial automático (`PlatformProvider.tsx`) para o D-pad ter de onde
  partir assim que a página carrega.
- **Menu lateral:** ícones agora são brancos (antes usavam uma cor cinza
  de baixo contraste) e o ícone do logo encolhido aumentou de 28px para
  44px. Item **Minha lista** adicionado, apontando para `/minha-lista`
  (nova página, lê a tabela `favorites`).
- **Categorias da página Filmes:** lista fixa e ordem exatas em
  `lib/categorias.ts` (`CATEGORIAS_FILMES`). Cada filme pode aparecer em
  mais de uma categoria — o campo `category` é lido como uma lista
  separada por vírgula/ponto e vírgula/barra (ex: `"Ação, Aventura"`).
  Se seu banco guarda categoria de um jeito diferente disso, me avise
  para eu ajustar o separador em `categoriasDoTitulo()`.
- **Banner hero com trailer:** `components/HeroBanner.tsx` mostra a capa
  por 10s e troca para o `trailer` do mesmo título (mudo, em loop até
  acabar, depois volta pra capa). Se um título não tiver `trailer`
  preenchido no banco, ele simplesmente continua mostrando a capa.
- **Títulos de seção:** padronizados em `18px/semibold` em toda a Home,
  Filmes, Séries e Minha Lista.

## 10. Correções desta entrega (foco, tipografia, player e mais)

- **Ícones sumidos (causa raiz):** o link do CDN do Tabler Icons estava
  com o caminho errado (404 silencioso) — por isso nenhum ícone
  aparecia em lugar nenhum do sistema, não só no menu. Corrigido em
  `app/layout.tsx`.
- **Fontes oficiais:** `Inter` (texto corrido) + `Poppins` (títulos de
  seção/categoria), configuradas via `next/font` em `app/layout.tsx` e
  expostas como `font-sans`/`font-heading` no Tailwind.
- **Títulos de seção/categoria:** 40px em telas grandes, responsivos
  (20px→32px→40px) em telas menores, usando `font-heading`.
- **Capas:** sombra leve (`shadow-card`) para não ficarem sem contorno
  no fundo preto; espaçamento de 2px de cada lado (`gap-x-[4px]`).
- **Páginas de detalhes (filme/série):** imagem trocada de
  `background-image` para `<img object-top>` (não corta mais o topo),
  textos bem maiores para leitura a distância, e botão **Voltar**
  (`components/BackButton.tsx`).
- **Episódios:** cada linha agora mostra capa (16:9), nome, descrição
  limitada a 2 linhas (`line-clamp-2`) e duração em destaque.
- **Página de exibição (player):** virou tela cheia (`fixed inset-0`,
  sem scroll vertical), com botão **Sair** que volta para `/filmes` ou
  `/series` conforme o conteúdo. O seletor de áudio/legenda passou a
  flutuar sobre o vídeo em vez de empurrar o layout.
- **Banner hero da Home:** agora respeita a seção com `layout =
  'featured'` em `home_sections` (categoria/ordenação) para escolher o
  destaque, em vez de sempre pegar o melhor avaliado do catálogo
  inteiro — se você já tinha configurado essa seção antes, ela deve
  aparecer corretamente agora.

## 12. Correções desta entrega (imagem do hero, tamanho das capas, performance na TV, menu mobile)

- **Capas do hero:** `getHero()` na Home agora só usa a coluna
  `backdrop`/`banner` do próprio título ou, na ausência dela, busca o
  backdrop direto no TMDB pelo `tmdb_id` (`lib/tmdb.ts →
  getBackdropDoTMDB`). Nunca usa qualquer outra fonte.
- **Tamanho das capas:** criado `components/PosterGrid.tsx` — no
  desktop/TV, cada capa tem largura MÁXIMA travada (170px, ajustável
  via `LARGURA_MAX`) em vez de esticar para preencher a tela toda
  (comportamento mais próximo do HBO Max real). Usado em Home, Filmes,
  Séries, Minha Lista e "Títulos semelhantes".
- **Performance/foco na LG webOS:** `hooks/useSpatialNavigation.ts`
  agora tem throttle (ignora eventos repetidos em menos de 140ms,
  comuns em controles remotos) e troca `scrollIntoView` suave por
  instantâneo — isso deve eliminar o delay de vários segundos. Também
  aumentei a penalidade de desalinhamento no cálculo de distância, pra
  reduzir "pulos" de foco na direção errada. Além disso,
  `PlatformProvider.tsx` agora refaz o foco inicial a CADA troca de
  página (antes só rodava uma vez, no carregamento inicial — por isso
  o D-pad "sumia" depois de navegar).
- **Menu mobile:** `components/BottomNav.tsx` virou uma barra flutuante
  com cantos arredondados, efeito vidro e sombra (estilo Telegram), com
  ícone + legenda — incluí também o atalho para Minha Lista.
- **Mobile — 2 capas por linha:** Home, Filmes e Séries agora mostram
  2 capas por linha com rolagem horizontal em telas pequenas
  (`PosterGrid`/`CategoryCarousel` já cuidam disso automaticamente).

## 13. Notas do Agente QA Final

- **Nenhuma tabela/coluna do Supabase é alterada** — o sistema apenas lê os
  dados existentes, exatamente como solicitado.
- **Indicações por IA:** validadas para nunca consultar TMDB nem qualquer
  fonte externa — somente `cinema`/`recommendations`, com filtro de termos
  adultos (`lib/recommendations.ts`). Se sua coluna de classificação adulta
  tiver um nome diferente do esperado (`category`/`genre`), ajuste a lista
  `ADULT_TERMS` ou o campo verificado.
- **Idioma:** toda a interface está em Português BR; nenhuma string em
  outro idioma foi usada nos componentes.
- **Limite de 5 convidados em "Assistir Juntos":** a tabela `party_rooms`
  atual não tem uma coluna de lista de participantes, então esse limite é
  hoje controlado pelo anfitrião (compartilhando o link manualmente). Se
  quiser um limite tecnicamente garantido (bloquear o 6º convidado
  automaticamente), será necessário criar uma nova tabela de participantes
  — combinamos que tabelas existentes não seriam alteradas, então essa
  seria uma tabela nova, adicional.
- **Telas 100"+:** o breakpoint `tv` em `tailwind.config.ts` está com valor
  aproximado (2560px) — recomendo validar no seu modelo real de LG webOS e
  ajustar esse número se a interface não escalar como esperado.
- **Pendências para produção:** conectar botão "Minha lista" à tabela
  `favorites`, e paginação/infinite scroll em `app/filmes` e `app/series`
  se o catálogo crescer muito (hoje carregam tudo de uma vez por categoria).
