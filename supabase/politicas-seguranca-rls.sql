-- =====================================================================
-- POLÍTICAS DE SEGURANÇA (RLS) — Cinema em Casa
-- =====================================================================
-- Rode isso no SQL Editor do Supabase. Não altera nenhuma coluna nem
-- apaga nenhum dado — só liga o RLS (Row Level Security) e define
-- quem pode ler/escrever cada linha.
--
-- POR QUE ISSO IMPORTA: pelo schema original que você me passou, não
-- havia nenhuma política de RLS visível nessas tabelas. Isso quer
-- dizer que, dependendo de como a chave pública está configurada, é
-- possível que qualquer pessoa logada (ou até anônima) consiga ler ou
-- alterar dados de OUTRAS pessoas usando a API do Supabase direto
-- (sem nem precisar do seu site) — perfil, progresso de reprodução,
-- lista de favoritos, controle parental, etc. Isso é sério mesmo num
-- sistema doméstico com poucas contas.
--
-- Depois de rodar este script, teste o app inteiro de novo — se
-- alguma tela parar de mostrar dado que devia mostrar, é sinal de que
-- alguma consulta no código precisa ser ajustada pra rodar como o
-- usuário certo (me avise que eu corrijo).
-- =====================================================================


-- ---------------------------------------------------------------------
-- TABELAS DE CATÁLOGO — leitura pública (o app mostra pra qualquer
-- visitante), sem necessidade de escrita pelo cliente (quem cadastra
-- filme/série é você, direto no Supabase Studio ou por um processo
-- separado — não pelo site).
-- ---------------------------------------------------------------------
alter table public.cinema enable row level security;
create policy "cinema_leitura_publica" on public.cinema
  for select using (true);

alter table public.series enable row level security;
create policy "series_leitura_publica" on public.series
  for select using (true);

alter table public.temporadas enable row level security;
create policy "temporadas_leitura_publica" on public.temporadas
  for select using (true);

alter table public.episodios enable row level security;
create policy "episodios_leitura_publica" on public.episodios
  for select using (true);

alter table public.home_sections enable row level security;
create policy "home_sections_leitura_publica" on public.home_sections
  for select using (true);

alter table public.search_catalog enable row level security;
create policy "search_catalog_leitura_publica" on public.search_catalog
  for select using (true);

alter table public.search_advanced enable row level security;
create policy "search_advanced_leitura_publica" on public.search_advanced
  for select using (true);


-- ---------------------------------------------------------------------
-- TABELAS PESSOAIS — cada usuário só pode ler/escrever as PRÓPRIAS
-- linhas (auth.uid() = user_id). Ninguém, nem outro usuário logado,
-- consegue ver ou mexer no dado de quem não é ele mesmo.
-- ---------------------------------------------------------------------
alter table public.view_progress enable row level security;
create policy "view_progress_dono" on public.view_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.watch_history enable row level security;
create policy "watch_history_dono" on public.watch_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.favorites enable row level security;
create policy "favorites_dono" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.recommendations enable row level security;
create policy "recommendations_dono" on public.recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.parental_control enable row level security;
create policy "parental_control_dono" on public.parental_control
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.visual_preferences enable row level security;
create policy "visual_preferences_dono" on public.visual_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions_dono" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.user_search_history enable row level security;
create policy "user_search_history_dono" on public.user_search_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- PROFILES — cada um lê/edita o próprio perfil. Leitura de TODOS os
-- perfis fica liberada só pra popular a tela "Quem está assistindo?"
-- (seleção de perfil) — sem isso, ninguém veria os outros perfis da
-- família pra escolher. Escrita continua restrita ao próprio dono.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "profiles_leitura_autenticado" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_edicao_proprio" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insercao_propria" on public.profiles
  for insert with check (auth.uid() = id);


-- ---------------------------------------------------------------------
-- ASSISTIR JUNTOS — projetado de propósito pra convidados SEM CONTA
-- (eles só digitam o nome, não fazem login — ver PartyRoomClient.tsx).
-- Por isso a leitura/chat fica aberta pra quem tiver o link da sala
-- (o próprio ID aleatório de 7 caracteres já funciona como "segredo"
-- de acesso, do mesmo jeito que um link de reunião comum). Só CRIAR
-- uma sala continua restrito a usuário logado (o host).
-- ---------------------------------------------------------------------
alter table public.party_rooms enable row level security;
create policy "party_rooms_leitura_publica" on public.party_rooms
  for select using (true);
create policy "party_rooms_criacao_proprio_host" on public.party_rooms
  for insert with check (auth.uid() = host_id);
create policy "party_rooms_edicao_proprio_host" on public.party_rooms
  for update using (auth.uid() = host_id);

alter table public.party_messages enable row level security;
create policy "party_messages_leitura_publica" on public.party_messages
  for select using (true);
create policy "party_messages_insercao_publica" on public.party_messages
  for insert with check (true);


-- ---------------------------------------------------------------------
-- Conferir rapidamente quais tabelas ficaram sem RLS habilitado
-- (deveria retornar zero linhas depois de rodar tudo acima).
-- ---------------------------------------------------------------------
select relname as tabela_sem_rls
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public'
  and relkind = 'r'
  and not relrowsecurity;
