/**
 * Remove um ano solto (4 dígitos, 1900-2099) do FINAL do título de
 * exibição — ex: "Velozes e Furiosos Hobbs e Shaw 2019" vira "Velozes
 * e Furiosos Hobbs e Shaw". Mantém números de sequência (1, 2, 3...)
 * intactos, já que esses fazem parte do nome de verdade.
 *
 * Exceção importante: se o título INTEIRO for só o ano (ex: um filme
 * chamado literalmente "1917" ou "2012"), mantém como está — nesse
 * caso o ano NÃO é uma sobra de importação, é o nome do filme.
 */
export function limparTituloExibicao(titulo: string): string {
  const somenteAno = /^\d{4}$/;
  if (somenteAno.test(titulo.trim())) return titulo;

  const comAnoNoFinal = /\s+(19|20)\d{2}$/;
  return titulo.replace(comAnoNoFinal, '').trim();
}

const TAMANHOS_TMDB = ['w92', 'w154', 'w185', 'w342', 'w500', 'w780'];

/**
 * Reforça a qualidade de uma imagem do TMDB pedindo o tamanho maior
 * direto na URL (o TMDB aceita qualquer tamanho válido pra qualquer
 * imagem, então isso funciona mesmo pra URLs já salvas no banco em
 * resolução menor, tipo w500 — vira "original", tipicamente acima de
 * 1080p de largura). Não afeta imagens de outros domínios.
 */
export function qualidadeMaximaTMDB(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes('image.tmdb.org')) return url;

  for (const tamanho of TAMANHOS_TMDB) {
    if (url.includes(`/t/p/${tamanho}/`)) {
      return url.replace(`/t/p/${tamanho}/`, '/t/p/original/');
    }
  }
  return url;
}
