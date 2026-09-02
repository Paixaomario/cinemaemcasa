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

## 30. Lote grande de correções (esta entrega)

- **Rotação do hero — bug de verdade encontrado:** o índice usava
  módulo (`i % total`) como estado do React; quando o próximo valor
  calculado era IGUAL ao atual (acontece sempre que só há 1 título na
  lista, e podia acontecer em outros casos), o React não reexecuta o
  efeito (`setState` pro mesmo valor é ignorado) — a rotação
  simplesmente parava depois do 1º ciclo, e só "voltava" ao recarregar
  a página (que sorteava outro ponto de partida). Corrigido com um
  contador que só cresce, nunca reatribui o mesmo valor.
- **Sistema abria com uma capa já focada, escondendo o hero:** o foco
  automático inicial chamava `.focus()` sem `preventScroll`, e o
  navegador rolava a página pra trazer aquele card pra vista — pulando
  o hero. Corrigido.
- **Foco muda de linha → agora centraliza verticalmente** (`block:
  'center'`, era `'nearest'`).
- **Botões de avançar/voltar 10s no player agora somem com
  inatividade** (3s), como o resto dos controles — antes ficavam
  sempre visíveis, "grudados" na tela.
- **Erro de mídia agora mostra mensagem amigável** em vez de tela preta
  ou erro cru do navegador.
- **Travamentos durante a reprodução — causa real encontrada:** o
  progresso era salvo no Supabase a CADA disparo do evento
  `timeupdate` do vídeo (várias vezes por segundo, sem limite nenhum)
  — uma enxurrada de requisições concorrendo com o próprio streaming
  do vídeo. Agora salva no máximo 1x a cada 10 segundos.
- **Assistir Juntos — três correções:**
  - Guests ficavam "carregando pra sempre" porque só o host via a
    sessão iniciar (não havia sincronização em tempo real) — agora usa
    Supabase Realtime pra avisar todo mundo.
  - Vídeo sem `autoplay` e sem tratamento de erro — corrigido.
  - Faltava botão de sair — adicionado.
  - **Link do WhatsApp abrindo o Google:** o botão "Copiar link"
    copiava a MENSAGEM inteira (texto + link grudados). Colar isso na
    barra de endereço de um navegador (em vez de clicar num link já
    reconhecido) faz o navegador tratar tudo como busca no Google, não
    como link. Agora "Copiar link" copia só a URL.
- **Emojis pequenos/escuros:** aumentados (+5px) e com fonte de emoji
  colorida forçada explicitamente (`.emoji-fonte` em `globals.css`) —
  a fonte principal do app (Inter) não tem glifos de emoji, e em
  alguns navegadores/SOs o fallback escolhido não é o de emoji colorido
  por padrão.
- **Capas sem imagem (filmes):** o reforço via TMDB que já existia só
  pra séries agora vale também para filmes — se `poster`/`banner`
  estiverem vazios mas houver `tmdb_id`, busca o pôster no TMDB.
- **Capas +5px, ano/avaliação -3px.**
- **Carrossel de categorias (Filmes/Séries) agora respeita 3 por linha
  no mobile** — usava um tamanho fixo (227px+) direto, ignorando
  completamente o layout mobile; agora usa `31vw` abaixo de 768px.
- **Botão "Minha Lista" funcionava só visualmente — agora salva de
  verdade** (`components/BotaoMinhaLista.tsx`), com estado
  salvo/não-salvo, nas páginas de filme e série (série nem tinha esse
  botão antes).
- **Página de Busca:** banner removido; capas dos resultados não
  cortam mais (trocado de altura fixa pra proporção de pôster real).

### Sobre "filmes em sequência aparecendo com a mesma capa de coleção"
Isso **não é um bug de código** — é dado: a coluna `poster`/`banner`
de cada um desses filmes no Supabase provavelmente está apontando pro
mesmo arquivo de imagem (uma capa de "coleção" salva por engano em vez
da capa individual de cada continuação). O reforço via TMDB que acabei
de adicionar só entra em ação quando essas colunas estão **vazias** —
se elas já têm um valor (mesmo que errado), o sistema usa esse valor
tal como está, porque não tem como saber que ele está "errado" sem
comparar com a ficha real do filme. Pra corrigir de vez: ou você ajusta
a coluna `poster` de cada filme afetado direto no Supabase pra apontar
pra imagem certa, ou apaga o valor errado (deixa vazio) — nesse caso o
reforço via TMDB assume sozinho, buscando a capa individual correta
pelo `tmdb_id` de cada filme (desde que cada um tenha o tmdb_id
correto do filme específico, não da franquia/coleção).

## 32. Correção crítica de performance na TV + lote de correções (esta entrega)

### Delay de ~5s pra mudar de linha na LG webOS — causa raiz encontrada
A navegação por seta pra CIMA/BAIXO calculava a posição na tela
(`getBoundingClientRect`) de **todos** os elementos focáveis dentro de
`<main>` pra decidir o mais próximo — e como a rolagem infinita das
categorias vai acumulando capas sem limite (por pedido seu, "sem
paginação, sem limite"), essa lista podia chegar a milhares de
elementos depois de um tempo de uso. Num processador fraco de smart
TV, recalcular a posição de milhares de elementos a cada aperto de
seta é exatamente o tipo de trabalho que trava por segundos.
`hooks/useSpatialNavigation.ts` foi reescrito: cada linha de capas já é
uma `<section>` própria — agora cima/baixo primeiro localiza a seção
anterior/seguinte (rápido, são dezenas de seções) e só DEPOIS busca os
elementos dentro dela (uma linha só, não a página inteira). O trabalho
por tecla caiu de "milhares de elementos" pra "uma dezena", não importa
quanto a rolagem infinita tenha crescido.

**Limitação residual:** se você rolar MUITO tempo numa única categoria
lotada, aquela seção especificamente ainda pode acumular bastante DOM
(a rolagem infinita nunca remove itens antigos). Isso não afeta mais a
navegação nas OUTRAS categorias (que é o que causava o travamento
geral), mas se quiser, numa próxima rodada dá pra implementar uma poda
dos itens mais antigos de uma categoria conforme ela cresce demais.

### Outras correções desta entrega
- **Páginas de detalhes sem imagem/elenco:** agora buscam no TMDB como
  último recurso quando o Supabase não tem `backdrop`/`banner`/
  `poster`, `description` ou `elenco` — usando o `tmdb_id` salvo.
- **Botão Voltar atrás do botão Assistir:** z-index aumentado bem acima
  de qualquer outro elemento da página (`z-50`).
- **Descrição das páginas de detalhes:** fonte maior (+3px), até 6
  linhas, ocupando a largura toda (antes ficava restrita a uma coluna
  central).
- **Nenhuma capa aparece focada ao abrir o sistema:** removido o
  autofoco silencioso — agora o foco só nasce na PRIMEIRA seta que o
  usuário aperta (ação real do usuário, não algo "acontecendo sozinho"
  no carregamento).
- **Prévia ao focar uma capa, bem mais completa** (mais perto do Prime
  Video): descrição (2 linhas), duração (filme) ou nº de temporadas
  (série), classificação, e atalhos rápidos de Assistir/Minha Lista —
  além do trailer que já tocava.
- **Trailer do hero quando o campo `trailer` está vazio:** busca um
  trailer do YouTube no TMDB como último recurso (mostra em vez de
  ficar com a tela preta).
- **Nome dos participantes no chat:** peso 600, +3px.
- **Emojis reforçados de novo:** ainda maiores, com `!important` na
  fonte de emoji colorida (mais garantia contra o navegador escolher um
  fallback monocromático).
- **Botão de "Transmitir para TV" no player** (Chromecast/AirPlay) via
  API nativa do navegador (`RemotePlayback`) — sem custo, sem SDK
  pago do Google Cast.
- **Tentativa de iniciar em tela cheia automaticamente** — navegadores
  só permitem isso como resultado direto de um gesto do usuário; é
  best-effort, alguns navegadores ainda assim bloqueiam por segurança.

## 34. Correções desta entrega (segurança, layout horizontal, elenco, menu Infantil)

- **Segurança: Next.js atualizado de 14.2.15 para 14.2.35** — o log de
  build acusou uma vulnerabilidade real (confirmada: há CVEs corrigidos
  entre essas versões). Sem isso, o app ficava exposto a falhas já
  conhecidas publicamente.
- **Todas as seções agora são linha horizontal com rolagem, nunca
  grade que quebra:** Home ("Continuar assistindo", seções, "Escolhido
  para você") e Minha Lista usavam uma grade (`PosterGrid`) que podia
  quebrar em mais de uma linha dependendo da largura da tela — por
  isso aparecia "vertical" no F12. Criei `components/HorizontalRow.tsx`
  (mesmo comportamento de rolagem das categorias de Filmes/Séries) e
  troquei em todo lugar.
- **Trailer nas capas ao focar, mesmo sem o campo `trailer` no banco:**
  conectei o mesmo reforço via TMDB do hero também nas capas comuns —
  busca sob demanda (só quando o usuário realmente para na capa por
  900ms), nunca antecipado, pra não estourar limite de chamadas.
- **Elenco agora com fotos redondas** (`components/ElencoRow.tsx`),
  abaixo da descrição — antes era só uma lista de texto corrido.
- **Página de série reestruturada:** descrição/elenco/gênero saíram de
  dentro do banner hero (onde ficavam espremidos numa coluna estreita)
  e foram pro mesmo padrão de largura total da página de filme.
- **Menu "Infantil" criado** (`/infantil`, no menu lateral e na barra
  mobile) — mostra só filmes/séries já classificados como "Infantil",
  sem remover essa categoria de nenhum outro lugar do sistema. É um
  atalho de acesso rápido, não um filtro.

### Preciso de 2 informações suas pros itens que restaram
1. **"Coleção" nas capas de sequência:** você confirmou que o banco
   está correto (posters individuais, tmdb_id sem repetição). Isso me
   diz que a causa NÃO é o fallback do TMDB (ele só age quando o campo
   já está vazio). Preciso do nome de UM filme específico que está
   mostrando a capa errada pra eu conseguir investigar o caminho real
   do bug em vez de adivinhar às cegas.
2. **Vídeo que fica só carregando e dá erro:** preciso de um exemplo
   específico (nome do filme/episódio) que está fazendo isso, pra eu
   conseguir olhar a URL exata salva no banco pra aquele item — sem
   isso não dá pra saber se é formato incompatível, link quebrado do
   Archive.org, ou outra causa.

## 36. Causa provável do "3 minutos pra carregar" + trailer que nunca tocava (esta entrega)

### Descoberta principal: trailer do YouTube salvo como link, não como arquivo
Você confirmou que TODOS os conteúdos já têm trailer salvo corretamente
na coluna do banco — isso, combinado com "nenhum trailer toca em lugar
nenhum", aponta pra uma causa bem específica: se a coluna `trailer`
guarda um **link do YouTube** (`youtube.com/watch?v=...`) em vez de um
arquivo de vídeo direto (`.mp4`), a tag `<video>` do navegador nunca
consegue tocar isso — ela só reproduz arquivo de vídeo puro, não uma
página web. Criei `lib/videoHelpers.ts` que detecta esse caso e usa o
embed certo (iframe) automaticamente, tanto no banner hero quanto nas
capas — funciona pra link do YouTube em qualquer idioma, sem precisar
filtrar nada.

### Causa real do carregamento de minutos
`buscarFilmesPorCategoria`/`buscarSeriesPorGenero` buscavam o pôster no
TMDB, **um por um, esperando terminar antes de responder**, pra cada
item sem imagem. Com várias categorias e vários itens sem capa, isso
podia empilhar dezenas de chamadas externas sequenciais numa única
carga de página — exatamente o tipo de coisa que vira "3 minutos".
Removido: agora essas funções só leem o banco (sempre rápidas); o
reforço de capa via TMDB roda no NAVEGADOR, sob demanda, só para os
itens que realmente aparecerem sem imagem (`/api/poster`), sem travar
o carregamento de mais nada.

### Ícones "quadrados"
Trocado o ícone de estrela (avaliação) e os ícones do painel de
prévia (play, mais) de fonte de ícones pra **SVG embutido no próprio
código** — não depende de nenhum arquivo externo carregar, então não
tem como aparecer como quadrado.

### Performance na TV — mais uma causa encontrada
Tocar um trailer (vídeo ou, pior, um iframe inteiro do YouTube) consome
bastante processamento. Numa smart TV mais fraca, isso competia por
CPU com a própria navegação por D-pad. Agora o trailer (vídeo ou
iframe) só toca fora de smart TV — na TV, a capa ainda aumenta e mostra
as informações, só sem o vídeo tocando dentro dela.

### Home: sem repetir capa entre seções + "random" de verdade
`app/page.tsx` agora resolve as seções em sequência (não mais em
paralelo), reservando os IDs já usados — a mesma capa nunca aparece em
duas seções ao mesmo tempo. Seções configuradas com `ordenacao =
'random'` agora sorteiam de verdade a cada carregamento da Home (antes
caíam num `order(created_at)`, que não é aleatório).

### O que ainda depende de você
**"Coleção" nas capas de sequência (Harry Potter, Velozes e Furiosos,
Sexta-Feira 13, Piratas do Caribe):** não tenho acesso direto ao seu
Supabase — só ao que o próprio código consegue ler em produção. Rode
`supabase/investigar-colecao.sql` no SQL Editor e me mande o resultado
(os valores de `poster`/`banner`/`backdrop`/`tmdb_id` de cada filme da
saga). Com esse dado exato eu confirmo se são realmente diferentes
entre si ou se algum está repetido, e corrijo com precisão.

## 38. Confirmado e corrigido: bug real da "capa de coleção" + redesign das páginas de detalhes + bug de sessão (esta entrega)

### "Coleção" — confirmado com os dados que você mandou
Toda a saga "Velozes e Furiosos" tem o **mesmo valor de `poster`**
salvo no banco, enquanto `banner`, `backdrop` e `tmdb_id` são
diferentes e corretos em cada filme — confirma que é um dado importado
errado (provavelmente uma capa de coleção/franquia usada por engano no
lugar da capa individual). Implementei uma correção que NÃO exige
mexer no banco: `lib/catalogoPorCategoria.ts` agora detecta quando o
mesmo `poster` aparece em títulos com `tmdb_id` diferentes dentro do
mesmo lote e trata isso como inválido — nesse caso, o `TitleCard` busca
sozinho, no navegador, o pôster individual correto no TMDB (usando o
tmdb_id certo de cada filme, via `/api/poster`).

### Bug real de sessão encontrado: cliente do navegador nunca gravava cookie
Isso explica o "Minha Lista não salva" e é mais sério do que parecia:
`lib/supabase/client.ts` usava o `createClient()` genérico do
supabase-js, que guarda a sessão só em `localStorage` — **nunca em
cookie**. Isso quer dizer que, mesmo depois de eu ter corrigido o
cliente do SERVIDOR pra ler cookies (entrega de duas rodadas atrás), o
servidor nunca via ninguém logado, porque o navegador nunca escreveu
esse cookie. Troquei pra `createBrowserClient()` do `@supabase/ssr`
(mesma família do cliente do servidor) — agora sessão fica em cookie E
em localStorage, cliente e servidor enxergam o mesmo login. Isso pode
ter efeito colateral positivo em outras coisas que dependiam de saber
quem estava logado no servidor (como "Continuar assistindo").

Além disso, `BotaoMinhaLista` nunca checava se a gravação realmente
tinha funcionado — sempre mostrava "salvo" mesmo quando o Supabase
recusava a operação. Corrigido: agora mostra erro na tela se a
gravação falhar de verdade, em vez de fingir sucesso.

### Páginas de detalhes redesenhadas por completo
Novo layout: imagem de fundo grande, capa em tamanho normal à
**esquerda**, título grande e todas as informações + botões à
**direita** — responsivo (empilha em telas estreitas). Ordem das
informações, como pedido: título → ano → gênero/categoria →
classificação etária + avaliação + bandeira do país + duração → idioma
de áudio/legenda (quando disponível) → sinopse (6 linhas) → elenco →
botões.

Tudo isso é buscado no TMDB automaticamente (via `getMetadadosDoTMDB`,
expandido nesta entrega) quando o Supabase não tiver: classificação
etária (prioriza avaliação brasileira), duração, gêneros, bandeira do
país. **Única exceção honesta: o TMDB não tem nenhum campo de
"prêmios/premiações"** — essa informação não existe na API deles, não
tem como buscar de lá. Se você tiver isso disponível em outro lugar, me
diga que conecto.

### Outros ajustes
- **Títulos sem ano solto no final:** "Velozes e Furiosos Hobbs e Shaw
  2019" vira "Velozes e Furiosos Hobbs e Shaw" — mantém números de
  sequência (1, 2, 3...) e mantém títulos que SÃO só um ano (ex: um
  filme chamado literalmente "1917").
- **Qualidade de imagem reforçada:** qualquer imagem do TMDB (mesmo já
  salva no banco em resolução menor, tipo `w500`) agora é pedida em
  `original` na exibição — bem acima de 1080p de largura.

## 40. Correções desta entrega (z-index, Minha Lista, script definitivo de capas)

- **Capa expandida agora sobrepõe TUDO, inclusive o menu lateral:** o
  menu usa `z-40`; a capa expandida usava `z-30` — por isso ficava
  atrás dele nas primeiras colunas. Subido pra `z-100`. Também liberei
  o vazamento vertical da capa expandida (`overflow-y-visible` na
  linha de rolagem) — antes o `overflow-x-auto` sozinho também
  cortava o topo/base da capa quando ela crescia.
- **Minha Lista:** banner removido; cada capa agora tem botão de
  excluir (ícone de lixeira, canto superior direito) que remove da
  lista na hora, sem precisar abrir os detalhes.
- **"Continuar assistindo" ausente:** o código já está na ordem certa
  (Hero → Continuar assistindo → resto). Se ainda não aparece, o mais
  provável é a sessão ter sido criada ANTES da correção do cookie de
  login (entrega anterior) — tente sair, entrar de novo, assistir algo
  por uns 15s (é o tempo mínimo pro progresso ser salvo) e voltar pra
  Home.
- **Travamento na reprodução:** confirmado que é o teto técnico do
  Archive.org (uma única qualidade fixa por vídeo, sem opção de
  qualidade menor pra internet mais lenta) — não é algo que o código
  consiga contornar sozinho.

### Script definitivo para as capas de "coleção"
A detecção em tempo real (entrega anterior) só pega duplicatas quando
os filmes aparecem juntos na mesma consulta — por isso ainda falhava
em alguns casos. Agora tem dois arquivos pra resolver isso **de vez,
no banco**:

- `scripts/diagnostico-capas.sql` — só leitura, mostra exatamente quais
  filmes têm capa quebrada ou compartilhada com outro filme diferente.
- `scripts/corrigir-capas-colecao.mjs` — script Node que você roda no
  seu computador (instruções completas no topo do arquivo): busca a
  capa individual correta de cada filme afetado no TMDB (usando o
  tmdb_id certo) e atualiza a coluna `poster` no Supabase. Roda em
  modo "dry-run" por padrão (só mostra o que faria); precisa do
  argumento `--aplicar` pra gravar de verdade.

**Importante:** esse script precisa da chave **service_role** do
Supabase (não a "anon" que o site usa) — ela tem permissão de escrita
total, então só use localmente, nunca no código do site, nunca faça
commit dela.

## 41. Notas do Agente QA Final

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
