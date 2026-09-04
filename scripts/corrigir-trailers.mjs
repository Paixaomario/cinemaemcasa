/**
 * Corrige, no banco de dados, filmes e séries SEM trailer ou com link
 * quebrado (ex: link de busca do YouTube em vez do vídeo, ou a home do
 * YouTube sem nada) — busca um trailer de verdade no TMDB usando o
 * tmdb_id de cada um (em qualquer idioma disponível — não filtra por
 * português) e preenche a coluna `trailer` com o link direto do vídeo
 * do YouTube (formato "https://www.youtube.com/watch?v=ID").
 *
 * COMO RODAR (no seu computador, mesma lógica do script de capas):
 *
 *   SUPABASE_SERVICE_ROLE_KEY="sua_chave" \
 *   NEXT_PUBLIC_SUPABASE_URL="https://ebbuobnltsrvqxayrulk.supabase.co" \
 *   TMDB_API_READ_TOKEN="seu_token" \
 *   node scripts/corrigir-trailers.mjs
 *
 * Roda em modo "dry-run" por padrão (só mostra, não grava nada). Pra
 * aplicar de verdade, acrescente --aplicar no final do comando.
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

function trailerQuebrado(valor) {
  if (!valor) return true;
  const v = valor.trim().toLowerCase();
  if (v === '') return true;
  if (v.startsWith('https://www.youtube.com/results')) return true;
  if (['https://www.youtube.com/', 'https://www.youtube.com', 'https://youtube.com/', 'https://youtube.com'].includes(v))
    return true;
  return false;
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

// Busca em QUALQUER idioma disponível — tenta primeiro sem idioma
// forçado (o TMDB devolve o(s) trailer(s) cadastrados, geralmente o
// original), sem restringir a português.
async function buscarTrailerNoTMDB(tmdbId, tipo) {
  const endpoint = tipo === 'series' ? `tv/${tmdbId}` : `movie/${tmdbId}`;
  const res = await fetch(`https://api.themoviedb.org/3/${endpoint}/videos`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const resultados = data.results || [];

  // Prioriza um "Trailer" de verdade; na falta, aceita um "Teaser".
  const trailer =
    resultados.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    resultados.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

async function processarTabela(tabela, colunaId, tipo) {
  const todos = await supabaseRequest(`${tabela}?select=${colunaId},titulo,trailer,tmdb_id`);
  const afetados = todos.filter((item) => trailerQuebrado(item.trailer));

  console.log(`\n=== ${tabela} (${afetados.length} sem trailer válido) ===`);

  let corrigidos = 0;
  let semTmdbId = 0;
  let semTrailerNoTmdb = 0;

  for (const item of afetados) {
    const id = item[colunaId];
    if (!item.tmdb_id) {
      semTmdbId++;
      continue;
    }

    const trailerCerto = await buscarTrailerNoTMDB(item.tmdb_id, tipo);
    if (!trailerCerto) {
      console.log(`  [sem trailer no TMDB] ${item.titulo} (tmdb_id ${item.tmdb_id})`);
      semTrailerNoTmdb++;
      continue;
    }

    console.log(`  ${item.titulo}: -> ${trailerCerto}`);

    if (APLICAR) {
      await supabaseRequest(`${tabela}?${colunaId}=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ trailer: trailerCerto })
      });
      corrigidos++;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Sem tmdb_id: ${semTmdbId} · Sem trailer disponível no TMDB: ${semTrailerNoTmdb}`);
  if (APLICAR) console.log(`Corrigidos de verdade: ${corrigidos}`);
}

async function main() {
  console.log(APLICAR ? 'MODO: aplicando as correções de verdade.' : 'MODO: dry-run (nada será alterado).');
  await processarTabela('cinema', 'id', 'movie');
  await processarTabela('series', 'id_n', 'series');
  if (!APLICAR) console.log('\nNada foi alterado (dry-run). Rode de novo com --aplicar pra gravar.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
