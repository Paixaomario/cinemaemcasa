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

## 5. Notas do Agente QA Final

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
