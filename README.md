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

## 14. Video.js, Assistir Juntos visível e refinamentos finais (esta entrega)

- **Player agora usa Video.js:** `components/Player.tsx` foi reescrito
  sobre a biblioteca [Video.js](https://videojs.com/), com skin
  customizada nas cores da marca (dourado no lugar do azul padrão) —
  ver `.cinema-player-skin` em `app/globals.css`. Rode `npm install`
  para baixar a dependência (`video.js` + `@types/video.js` já estão no
  `package.json`). Suporta MP4 nativamente; se algum dia os arquivos
  virarem HLS/DASH (`.m3u8`/`.mpd`), o player já detecta pela extensão.
- **"Assistir Juntos" agora tem botão:** o recurso já existia em código
  (`/assistir-junto/[roomId]`, chat, emojis) mas não tinha nenhum
  gatilho na interface — por isso "não aparecia em lugar nenhum".
  Adicionei `components/AssistirJuntoButton.tsx` nas páginas de
  detalhes de filme e série.
- **Banner hero (Home/Filmes/Séries/Minha Lista/Busca):** agora 16:9,
  sem botões de ação, com bandeira do país (via TMDB), classificação
  (quando a tabela de origem tem essa coluna — séries têm, filmes não)
  e duração, descrição limitada a 2 linhas. Resolvido por
  `lib/heroEnrichment.ts`.
- **Capas:** data/avaliação com fonte maior (+5px) e peso 500 (antes
  quase ilegível); trailer toca automaticamente ao focar/passar o mouse
  em qualquer capa do sistema (não só no hero); +10% de tamanho.
- **Foco não pula mais de linha sozinho:** na ponta de uma linha de
  capas, ele dá a volta para o outro extremo da mesma linha — só
  cima/baixo trocam de linha.

### Limitação conhecida
A "classificação indicativa" no banner hero só aparece para séries
(coluna `classificacao` existe na tabela `series`); a tabela `cinema`
não tem uma coluna equivalente, então não exibo nada ali para filmes —
preferi deixar em branco a inventar um valor. Se você tiver essa
informação em outro lugar (categoria, TMDB certification), me diga
onde que eu conecto.

## 16. Correções desta entrega (regressões de layout, hero rotativo, player, capas)

- **Menu lateral:** efeito vidro restaurado (`backdrop-blur-md` + fundo
  translúcido), sem nenhuma borda, e agora **some completamente** na
  página de exibição (`/assistir`). Usei um blur mais leve que antes
  (`md` em vez de `xl`) para não repetir o problema de lentidão no
  webOS que resolvemos há algumas entregas — é um equilíbrio entre
  efeito visual e performance real na TV; se ainda notar lentidão
  especificamente por causa do blur, me avise que eu removo de vez.
- **Capas não "expandiam" ao passar o mouse:** o efeito usava
  `:focus-visible`, que por padrão dos navegadores **não ativa com
  mouse/toque**, só com teclado/D-pad — por isso funcionava (talvez) no
  controle remoto mas nunca ao passar o mouse. Trocado para um controle
  explícito via estado do React, funciona em qualquer dispositivo.
- **Banner hero agora é ROTATIVO** (`components/HeroBanner.tsx` recebe
  uma lista `heroes[]`, não mais um único item): mostra capa → trailer
  do mesmo título → passa pro próximo título da lista, com indicadores
  (bolinhas) no canto, igual Netflix/YouTube. Aplicado nas 5 páginas.
  Continua 16:9 e ocupando 100% da largura (confirmei que não há
  padding lateral no código — se ainda aparecer com espaçamento, pode
  ser cache/deploy antigo; vale conferir se o site já está no commit
  mais recente).
- **Seção "Continuar assistindo"** criada do zero como a **primeira**
  seção da Home (antes do restante), lendo `view_progress` do usuário
  logado e resolvendo cada item como filme (`cinema`) ou episódio
  (`episodios` → `temporadas` → série).
- **Player:** botão trocado de "Sair" para **Voltar** (seta, canto
  superior esquerdo) — mesma função, ícone mais claro. Adicionados
  botões de **retroceder/avançar 10s** flutuando sobre o vídeo, além da
  barra nativa do Video.js (play/pause, volume, velocidade, tela
  cheia). Skin da marca já estava aplicada via `.cinema-player-skin`
  em `app/globals.css`.
- **Filmes/Séries com capas em branco/tamanho inconsistente:**
  encontrei uma causa de código real — `CategoryCarousel.tsx` tinha uma
  implementação de grade PRÓPRIA, diferente do `PosterGrid` usado na
  Home/Minha Lista, causando tamanhos diferentes entre páginas. Unifiquei
  os dois (Category Carousel agora só chama PosterGrid por dentro).
  Além disso, adicionei um fallback: se uma série não tiver NENHUMA
  imagem própria (`poster`/`capa`/`banner` vazios) mas tiver `tmdb_id`,
  busco o pôster direto do TMDB.

  **Isso é best-effort, não a correção definitiva:** eu não tenho
  acesso direto ao seu Supabase pra confirmar se as colunas de imagem
  da tabela `series` realmente estão vazias, ou se têm um valor mas em
  formato de caminho relativo (não uma URL completa). Se depois
  desse fallback ainda sobrar alguma capa em branco, me manda o valor
  exato de `poster`/`capa`/`banner` de uma linha da tabela `series`
  que eu ajusto com precisão cirúrgica em vez de tentar de novo às
  cegas.

## 18. Correções desta entrega (regressão do carrossel, layout do menu, textos, player)

- **Carrossel de categorias voltou a ser UMA linha só, com loop
  infinito de verdade:** na entrega anterior eu unifiquei
  `CategoryCarousel` com o `PosterGrid` pensando em consistência de
  tamanho, mas isso quebrou a rolagem horizontal (virou grade com
  várias linhas). Desfiz isso — `CategoryCarousel` agora é dedicado,
  com uma linha, `overflow-x-auto`, e loop infinito real (a lista é
  duplicada uma vez; ao chegar perto do fim, o scroll salta de volta
  pro meio de forma imperceptível). Os itens duplicados ficam marcados
  para o D-pad não parar neles.
- **Indicadores (bolinhas) removidos** do banner hero.
- **Menu lateral agora "flutua" sobre o conteúdo** (`position: fixed`)
  em vez de empurrar a página — por isso o banner hero consegue
  começar atrás dele (mesmo efeito visual do HBO Max/Netflix, com o
  menu translúcido por cima).
- **Capas +10% novamente** (206px → 227px) e **ano/avaliação bem
  maiores** (de 15px para 38px). Não consegui aplicar literalmente
  "3x" (45px) porque nesse tamanho o ano e a avaliação se sobrepõem
  numa capa de ~227px de largura — 38px é o maior tamanho que ainda
  cabe os dois lado a lado sem cortar. Se quiser ainda maior, dá pra
  aumentar mais a capa em si pra abrir espaço.
- **Legendas do player maiores:** `::cue` em `app/globals.css`, com um
  tamanho ainda maior a partir de telas de 1024px+ (computador, smart
  TV, projetor).
- **Textos em azul ilegível:** encontrei e troquei — eram as linhas de
  ano/duração/categoria nas páginas de detalhes e o ícone de enviar no
  chat, que usavam a cor de destaque azul como cor de TEXTO (baixo
  contraste). Agora usam branco translúcido; o azul continua reservado
  pra botões/ícones de ação.
- **Assistir Juntos agora gera link compartilhável:** depois de criar a
  sala, aparece o link (já curto, 7 caracteres de ID) com o nome do
  conteúdo na mensagem, botão direto pro WhatsApp (`wa.me`) e botão de
  copiar.

### Sobre os itens que pareciam "não corrigidos": rotação do hero e trailer nas capas
Revisei `HeroBanner.tsx` e `TitleCard.tsx` a fundo — o código dessas
duas coisas está correto (rotação por lista de títulos, troca pra
trailer no foco). Se ainda não aparecem no seu ambiente depois deste
deploy, são dois motivos possíveis:
1. O deploy anterior não chegou a ir ao ar (já aconteceu antes nesta
   conversa) — vale conferir o hash do commit mais recente na Vercel.
2. Os registros do seu banco realmente não têm valor na coluna
   `trailer` — nesse caso não há capa/hero que consiga mostrar um
   trailer que não existe. Pode confirmar abrindo um registro na tabela
   `cinema` ou `series` e olhando se `trailer` tem uma URL preenchida?

## 20. Correções desta entrega (viewport mobile, hero atrás do menu, rotação, scroll)

- **Causa raiz de vários problemas de mobile encontrada:** faltava a
  tag/config de **viewport** (`export const viewport` em
  `app/layout.tsx`). Sem ela, o navegador do celular assume uma largura
  de página "desktop" (~980px) e encolhe tudo — isso sozinho explica o
  menu lateral aparecendo em vez da barra inferior, e o sistema
  "parecendo site" em vez de app. Corrigido, junto com ajustes de
  `overscroll-behavior`/`touch-action` pra reduzir a sensação de
  navegador (bounce de scroll, zoom por toque duplo).
- **Título/descrição do hero atrás do menu lateral:** corrigido — o
  texto agora começa depois da largura do menu, mesmo com a imagem de
  fundo continuando por baixo dele.
- **Capas pequenas em smart TV/telas gigantes:** agora crescem em
  etapas conforme a tela aumenta (227px → 270px a partir de 1600px →
  360px a partir de 2560px), em vez de um tamanho único fixo.
- **Ano/avaliação:** reduzidos em 2px (36px agora).
- **Tela de carregamento reaparecendo entre navegações:** ela só
  deveria aparecer uma vez; corrigido para aparecer só na primeira
  carga da sessão (`sessionStorage`).
- **Banner rotativo sem limite artificial:** aumentei a quantidade de
  títulos que alimentam a rotação de 5 para até 40 por página (Minha
  Lista usa todos os favoritos). Também persisti o índice mostrado por
  página (`localStorage`) — ao recarregar, continua do próximo título
  em vez de voltar sempre ao primeiro.

  **Limitação honesta:** "nunca repetir antes de chegar na última capa
  do sistema" eu implementei dentro do lote de até 40 títulos buscados
  por página, não literalmente entre TODOS os milhares de títulos do
  catálogo — buscar e enriquecer (com TMDB) milhares de registros a
  cada carregamento da Home ficaria lento demais. Se quiser cobertura
  de 100% do catálogo na rotação, o caminho certo é pré-calcular isso
  num job separado (ex: tabela `home_sections` já preenchida
  periodicamente), não em tempo real a cada visita — me avisa se quiser
  que eu monte isso.
- **Capas "expandindo lateralmente" tipo Prime Video:** aumentei bem o
  efeito de zoom ao focar/passar o mouse nas capas dentro dos
  carrosséis de categoria (mais forte que nas capas da Home/Minha
  Lista). Uma reprodução 100% fiel do Prime Video (onde a capa foca
  cresce por cima de várias vizinhas simultaneamente, com uma
  micro-prévia animada dentro dela) é uma reformulação bem mais
  profunda do componente — o que entreguei aqui já expande e mostra o
  trailer, mas se quiser o efeito exatamente idêntico linha por linha,
  me diga que eu dedico uma rodada só pra isso.
- **Menu lateral fecha ao clicar num item:** mesmo com o mouse parado
  em cima, agora colapsa imediatamente ao navegar.
- **Rolagem horizontal das categorias:** roda do mouse/trackpad agora
  é convertida pra rolagem horizontal (antes só funcionava por
  toque/D-pad). Também troquei `scrollIntoView` de `nearest` para
  `center` — capas cortadas na borda da tela agora são trazidas
  totalmente pra vista ao navegar até elas por controle remoto/setas.

## 22. Performance para catálogo grande (200 mil títulos) — esta entrega

- **Bug crítico encontrado e corrigido:** o cliente Supabase usado nas
  páginas de servidor nunca lia o cookie de sessão do navegador —
  `.auth.getUser()` no servidor **nunca** reconhecia quem estava
  logado, mesmo com sessão válida. Isso deixava "Continuar assistindo"
  (Home) e "Minha Lista" sempre vazios, silenciosamente. Corrigido com
  `@supabase/ssr` (`lib/supabase/server.ts`), que agora lê os cookies
  via `next/headers` no padrão oficial da biblioteca.
- **Dois clientes separados, de propósito:**
  - `supabaseServer` (com cookies) — só para páginas realmente
    pessoais (Home, Minha Lista). Não pode ter cache de página, porque
    o conteúdo depende de quem está logado.
  - `supabasePublic` (sem cookies) — para catálogo/detalhes/busca, que
    é igual pra todo mundo. Só esse pode usar cache de página.
  Misturar os dois teria feito toda página virar dinâmica (sem cache)
  só por causa da leitura de cookies — separei exatamente pra evitar
  isso.
- **Fim das buscas "traga tudo e filtre depois":** a página de Filmes
  buscava **o catálogo inteiro** de filmes e organizava as categorias
  em JavaScript — inviável em 200 mil linhas. Agora cada categoria
  busca direto no banco, já filtrada e limitada (30 itens por
  categoria), usando índice. Séries já era um pouco melhor mas também
  não tinha limite por gênero — adicionado.
- **Cache de página (ISR) de 5 minutos** em Filmes, Séries, detalhes de
  filme/série e Busca (`export const revalidate = 300`). Isso significa
  que o banco só é consultado de verdade a cada 5 minutos por página,
  não a cada visita — o resto do tempo o Vercel serve a versão em
  cache. A busca em tempo real (`LiveSearch`) continua sempre ao vivo,
  porque roda no navegador, não afeta esse cache.
- **Script de índices** em `supabase/indices-performance.sql` — **você
  precisa rodar isso no SQL Editor do Supabase** pra essas otimizações
  funcionarem de verdade (índices de busca por categoria, ordenação por
  nota, episódios por temporada, progresso do usuário). Só adiciona
  índices, não altera nenhuma coluna/tabela existente.

### Limitações que ficaram de fora por ora
- `getGeneros()` (Séries) ainda lê a coluna `genero` de toda a tabela
  pra descobrir a lista de gêneros existentes — isso é mais leve que
  buscar linhas inteiras, e como a página inteira já fica em cache por
  5 minutos, o custo real é baixo, mas em escala muito grande o ideal
  seria uma tabela de referência de gêneros à parte, ou uma função RPC
  com `SELECT DISTINCT` no Postgres.
- Não implementei cache em camada extra (Redis/Upstash) — o ISR do
  Next.js já cobre a maior parte do ganho de performance sem precisar
  de mais uma peça de infraestrutura. Se o catálogo crescer muito além
  de 200 mil títulos ou o tráfego for alto, aí sim vale considerar.

## 24. Rolagem infinita real por categoria (esta entrega)

- **Sem limite de itens por categoria, sem botão "carregar mais":** a
  página carrega só o primeiro lote de cada categoria (rápido); o
  `CategoryCarousel` (agora client-side) busca mais pela
  `/api/categoria` conforme o usuário rola — mouse, toque ou D-pad —
  até esgotar TUDO que existe no banco para aquela categoria. Só
  depois de mostrar tudo é que a rolagem reinicia do primeiro item.
- **Trava de segurança:** categorias muito pequenas (que cabem inteiras
  numa tela) não entram num loop de recarregamento automático infinito
  — depois de uma volta completa sem crescer, o carregamento automático
  por scroll para (a navegação por D-pad continua funcionando sob
  demanda, já que aí é o usuário pedindo explicitamente).
- **Consulta compartilhada:** `lib/catalogoPorCategoria.ts` centraliza
  a busca por categoria/gênero, usada tanto na primeira carga da
  página quanto na API de rolagem — mesma ordenação, mesmo
  comportamento, sem duplicar lógica.

## 26. Ajustes AAA dentro da arquitetura 100% gratuita (esta entrega)

Tudo abaixo funciona com GitHub + Vercel + Supabase + Archive.org, sem
nenhum investimento financeiro novo.

### Segurança — `supabase/politicas-seguranca-rls.sql` (PRIORIDADE MÁXIMA)
Pelo schema original, nenhuma tabela tinha política de RLS visível —
ou seja, era possível que qualquer usuário logado (ou até anônimo,
dependendo da configuração) lesse ou alterasse dado de OUTRA pessoa
direto pela API do Supabase, sem passar pelo site. **Rode esse script
no SQL Editor do Supabase o quanto antes.** Ele:
- Libera leitura pública só nas tabelas de catálogo (`cinema`,
  `series`, `episodios`, etc.) — o que já era público de fato.
- Tranca as tabelas pessoais (`view_progress`, `favorites`,
  `parental_control`, etc.) pra cada usuário só ver o próprio dado.
- No "Assistir Juntos", mantém leitura/chat aberta pra quem tem o link
  da sala (convidados não têm login, por desenho) — só criar sala
  continua exigindo o host estar logado.
Depois de rodar, teste o app inteiro de novo — se algo parar de
mostrar dado que devia, me avise que ajusto a consulta.

### Monitoramento de erros — Sentry (gratuito)
Adicionei `@sentry/nextjs` (`sentry.client/server/edge.config.ts` +
`app/global-error.tsx`). Crie uma conta grátis em sentry.io, um
projeto Next.js, e preencha `NEXT_PUBLIC_SENTRY_DSN` (+ opcionalmente
`SENTRY_ORG`/`SENTRY_PROJECT`) nas variáveis de ambiente do Vercel.
Sem isso preenchido, o app funciona normal — só não manda erro pra
lugar nenhum.

### CI no GitHub Actions — `.github/workflows/ci.yml`
Roda checagem de tipos, testes e build a cada push/PR, **antes** de
chegar no Vercel — teria pego o bug do import do Video.js e outros
erros de build que só descobrimos depois de various tentativas nesta
conversa. **Importante:** pra o passo de build funcionar no CI, você
precisa cadastrar `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` e `TMDB_API_READ_TOKEN` como *secrets*
do repositório no GitHub (Settings → Secrets and variables → Actions)
— sem isso, o build do CI falha por falta de variável, mesmo que o
código esteja certo.

### Testes automatizados — Vitest
`lib/__tests__/categorias.test.ts` cobre a lógica de categorias (a que
mais deu problema nesta conversa: múltiplas categorias por título,
acentuação, categoria inventada, duplicata). Rode com `npm test`.

### PWA mais "nível app"
- `manifest.json` revisado: `display: standalone` (antes era
  `fullscreen`, que em alguns navegadores se comporta pior),
  orientação livre (antes travava só em paisagem, o que atrapalhava
  navegar pelo catálogo no celular), atalhos rápidos (Filmes/Séries/
  Minha Lista) e ícone "maskable" pra Android.
- Meta tags específicas do iOS em `app/layout.tsx` — o Safari ignora
  boa parte do `manifest.json`; sem essas tags, "Adicionar à Tela de
  Início" no iPhone abre com a barra do Safari por cima, quebrando a
  sensação de app.

### Painel de administração — seções da Home
`/admin/secoes` — liga/desliga seções da Home sem precisar abrir o
Supabase Studio. Criar seção nova ou mudar categoria/ordenação ainda
exige o Studio (deixei isso documentado na própria tela).

### O que fica de fora, mesmo de graça (limitação real, não falta de esforço)
- **Streaming adaptativo de verdade:** confirmei que o Archive.org gera
  só UM derivado de vídeo por arquivo (H.264, ~768kb/s, 640×480) — sem
  múltiplas qualidades, sem HLS/DASH. Isso é um teto da própria
  plataforma de hospedagem, não algo que dá pra contornar só com
  código.
- **DRM:** exige serviço pago (Widevine/FairPlay/PlayReady).
- **CDN de vídeo dedicado:** o Archive.org já cumpre parcialmente esse
  papel (serve os arquivos), mas sem controle de qualidade adaptativa.
- **Apps publicados em loja:** taxas obrigatórias da Apple/Google, sem
  jeito gratuito de contornar.

## 28. Correções de navegação + Modo Infantil implementado de verdade (esta entrega)

- **Banner hero não é mais clicável nem focável:** virou uma `<div>`
  simples (era um `<Link>` com classe `focusable`). Isso, sozinho, já
  resolve o pedido de navegação: como a barra lateral e os carrosséis
  usam a classe `.focusable` pra decidir pra onde o foco vai, o hero
  agora é automaticamente pulado — seta direita a partir do menu já
  cai direto na primeira capa da primeira seção/categoria, sem
  precisar de nenhuma regra especial a mais.
- **Splash mais rápida (700ms, era 1800ms):** o HTML da página
  (incluindo o hero) já vem pronto do servidor por baixo da splash —
  ela nunca bloqueou o carregamento de verdade, só ficava tempo demais
  na frente. Agora o banner hero é a primeira coisa que aparece de
  fato, quase instantaneamente.
- **Modo Infantil implementado de verdade:** existia a coluna
  `is_child`/`content_rating_limit`, mas nada no código realmente
  filtrava conteúdo — era só um rótulo. Agora, ao escolher um perfil
  infantil em `/perfil`, um cookie é gravado e:
  - Home filtra no SERVIDOR (ela já é dinâmica por causa do login, não
    tem cache pra perder).
  - Filmes/Séries/Busca filtram no CLIENTE, depois que os dados
    (cacheados, iguais pra todo mundo) chegam no navegador — ler o
    cookie no servidor ali quebraria o cache que sustenta os 200 mil
    títulos. Documentei isso com honestidade no código: é uma barreira
    de experiência, não uma trava de segurança inquebrável (dá pra
    contornar pelo DevTools) — bloqueio de verdade exigiria
    autenticação por perfil no servidor, fora do escopo gratuito atual.
  - Categoria "Adulto" some inteira das listagens e do banner hero;
    títulos adultos em qualquer outra categoria também somem.
  - Acesso direto por link a um título adulto (sem passar pela
    listagem) redireciona pra Home — `components/GuardaModoInfantil.tsx`.
  - Testado em `lib/__tests__/kidsMode.test.ts`.

## 29. Notas do Agente QA Final

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
