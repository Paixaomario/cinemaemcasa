/**
 * Corrige, DE VEZ, no banco de dados: capas quebradas (link truncado
 * do TMDB) e capas "de coleção" (mesmo poster usado em filmes
 * diferentes) — busca a capa individual correta no TMDB usando o
 * tmdb_id de cada filme (que você confirmou estar certo) e atualiza a
 * coluna `poster`.
 *
 * COMO RODAR (no seu computador, não no Vercel):
 *
 *   1. Pegue a SERVICE ROLE KEY do seu projeto Supabase:
 *      Supabase Dashboard → Project Settings → API → service_role key
 *      (é diferente da chave "anon" que o site usa — essa aqui tem
 *      permissão de escrita total, então NUNCA cole ela no código,
 *      nunca faça commit dela, e nunca a use no site publicado).
 *
 *   2. Rode assim, substituindo pelos valores reais:
 *
 *      SUPABASE_SERVICE_ROLE_KEY="sua_chave_aqui" \
 *      NEXT_PUBLIC_SUPABASE_URL="https://ebbuobnltsrvqxayrulk.supabase.co" \
 *      TMDB_API_READ_TOKEN="seu_token_aqui" \
 *      node scripts/corrigir-capas-colecao.mjs
 *
 *   3. O script primeiro faz um "dry run" (só mostra o que faria, sem
 *      alterar nada). Pra aplicar de verdade, rode de novo acrescentando
 *      --aplicar no final do comando.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TMDB_TOKEN = process.env.TMDB_API_READ_TOKEN;
const APLICAR = process.argv.includes('--aplicar');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TMDB_TOKEN) {
  console.error(
    'Faltam variáveis de ambiente. Preciso de NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e TMDB_API_READ_TOKEN.'
  );
  process.exit(1);
}

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function buscarPosterNoTMDB(tmdbId) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.poster_path ? `https://image.tmdb.org/t/p/original${data.poster_path}` : null;
}

async function main() {
  console.log(APLICAR ? 'MODO: aplicando as correções de verdade.' : 'MODO: dry-run (só mostrando, nada será alterado).');
  console.log('Buscando filmes no Supabase...\n');

  const todos = await supabaseRequest('cinema?select=id,titulo,poster,tmdb_id&type=eq.movie');

  // Agrupa por valor de poster pra achar os compartilhados entre filmes diferentes.
  const porPoster = new Map();
  for (const filme of todos) {
    if (!filme.poster) continue;
    if (!porPoster.has(filme.poster)) porPoster.set(filme.poster, []);
    porPoster.get(filme.poster).push(filme);
  }

  const quebrados = todos.filter((f) => f.poster && /\/t\/p\/w\d+\/?$/.test(f.poster));
  const compartilhados = [...porPoster.values()].filter(
    (grupo) => new Set(grupo.map((f) => f.tmdb_id)).size > 1
  );

  const afetados = new Map();
  for (const f of quebrados) afetados.set(f.id, f);
  for (const grupo of compartilhados) for (const f of grupo) afetados.set(f.id, f);

  console.log(`Encontrados ${afetados.size} filmes afetados (capa quebrada ou compartilhada).\n`);

  let corrigidos = 0;
  let semTmdbId = 0;
  let semPosterNoTmdb = 0;

  for (const filme of afetados.values()) {
    if (!filme.tmdb_id) {
      console.log(`  [sem tmdb_id] ${filme.titulo} — não dá pra buscar a capa certa sem isso.`);
      semTmdbId++;
      continue;
    }

    const posterCerto = await buscarPosterNoTMDB(filme.tmdb_id);
    if (!posterCerto) {
      console.log(`  [sem capa no TMDB] ${filme.titulo} (tmdb_id ${filme.tmdb_id})`);
      semPosterNoTmdb++;
      continue;
    }

    console.log(`  ${filme.titulo}: ${filme.poster} -> ${posterCerto}`);

    if (APLICAR) {
      await supabaseRequest(`cinema?id=eq.${filme.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ poster: posterCerto })
      });
      corrigidos++;
    }

    // Pequena pausa pra não estourar o limite de requisições do TMDB.
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n--- Resumo ---');
  console.log(`Total afetados: ${afetados.size}`);
  console.log(`Sem tmdb_id (não dava pra corrigir): ${semTmdbId}`);
  console.log(`Sem pôster disponível no TMDB: ${semPosterNoTmdb}`);
  if (APLICAR) console.log(`Corrigidos de verdade no banco: ${corrigidos}`);
  else console.log('\nNada foi alterado (dry-run). Rode de novo com --aplicar pra gravar as correções.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
