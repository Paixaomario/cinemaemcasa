import type { Cinema } from './types';

export const COOKIE_PERFIL_INFANTIL = 'perfil_infantil';

// Termos usados tanto aqui quanto em lib/recommendations.ts para
// identificar conteúdo adulto pelo campo category/genre/genero — sem
// depender de nenhuma coluna nova no banco.
export const TERMOS_ADULTOS = ['adulto', '+18', 'adult'];

export function contemTermoAdulto(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const alvo = texto.toLowerCase();
  return TERMOS_ADULTOS.some((termo) => alvo.includes(termo));
}

/** Remove itens marcados como adulto (por category/genre) de uma lista. */
export function filtrarConteudoAdulto(items: Cinema[]): Cinema[] {
  return items.filter(
    (item) => !contemTermoAdulto(item.category) && !contemTermoAdulto(item.genre)
  );
}

/**
 * Lê no CLIENTE (via document.cookie) se o perfil ativo é infantil.
 *
 * Propositalmente client-side, não server-side: as páginas de
 * catálogo (Filmes/Séries) usam cache (ISR) pra suportar 200 mil
 * títulos — ler cookie no servidor ali forçaria a página inteira a
 * virar dinâmica pra TODO MUNDO, não só pra quem está em modo
 * infantil, cancelando esse cache. Por isso o filtro roda nos
 * componentes de cliente (CategoryCarousel, HomeSectionRow,
 * LiveSearch), depois que os dados (cacheados, iguais pra todos)
 * chegam no navegador.
 *
 * TRANSPARÊNCIA: isso é uma barreira de EXPERIÊNCIA, não de segurança
 * forte — tecnicamente dá pra contornar abrindo o DevTools. Pra
 * bloqueio de verdade exigiria autenticação por perfil no servidor,
 * fora do escopo gratuito atual. Serve bem pro uso doméstico comum.
 */
export function estaEmModoInfantilCliente(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${COOKIE_PERFIL_INFANTIL}=true`);
}
