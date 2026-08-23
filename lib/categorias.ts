// Ordem e lista EXATA de categorias da página de Filmes — definida pelo
// usuário. Nenhuma categoria nova deve ser criada e nenhuma deve se
// repetir; categorias do banco que não estejam nesta lista simplesmente
// não aparecem como seção própria.
export const CATEGORIAS_FILMES = [
  'Lançamento 2026',
  'Lançamento 2025',
  'Animação',
  'Comédia',
  'Ação',
  'Aventura',
  'Dorama',
  'Negritude',
  'Finanças',
  'Infantil',
  'Clássicos',
  'Crime',
  'Anime',
  'Romance',
  'Religioso',
  'Nacional',
  'Documentários',
  'Drama',
  'Família',
  'Musical',
  'Faroeste',
  'Ficção',
  'Policial',
  'Suspense',
  'Terror',
  'Adulto'
] as const;

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Um título pode pertencer a mais de uma categoria — o campo `category`
 * no Supabase é lido como uma lista separada por vírgula, ponto e
 * vírgula ou barra (ex: "Ação, Aventura" ou "Ação/Aventura"). Cada
 * pedaço é comparado (sem acento/maiúsculas) contra a lista oficial
 * acima; o que não corresponder a nenhuma categoria oficial é ignorado
 * — nunca vira uma categoria nova na tela.
 */
export function categoriasDoTitulo(campoCategory: string | null): string[] {
  if (!campoCategory) return [];
  const partes = campoCategory
    .split(/[,;/|]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const encontradas: string[] = [];
  for (const parte of partes) {
    const alvo = CATEGORIAS_FILMES.find((c) => normalizar(c) === normalizar(parte));
    if (alvo && !encontradas.includes(alvo)) encontradas.push(alvo);
  }
  return encontradas;
}
