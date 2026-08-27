import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * `supabasePublic` — cliente SEM cookies, para dados que não dependem
 * de quem está logado (catálogo de filmes/séries, detalhes, busca).
 * Usar este nas páginas que têm `export const revalidate = ...`
 * (cache/ISR) — chamar cookies() dentro delas forçaria renderização
 * dinâmica em toda requisição, cancelando o cache.
 */
export const supabasePublic = createClient(url, key, {
  auth: { persistSession: false }
});

/**
 * `supabaseServer` — cliente COM cookies de sessão (via next/headers),
 * para páginas que precisam saber quem está logado no servidor
 * (Continuar assistindo, Minha Lista). Usar aqui é o que corrige um bug
 * real: antes, `.auth.getUser()` no servidor nunca reconhecia a sessão
 * do navegador porque o cliente antigo não tinha nenhuma ligação com
 * os cookies da requisição.
 *
 * Páginas que usam este cliente NÃO devem ter `export const
 * revalidate` — elas são inerentemente por-usuário, então precisam
 * renderizar a cada requisição mesmo.
 */
function getSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // Server Components não podem definir cookies — sem-op intencional.
      },
      remove() {
        // Idem — ver comentário acima.
      }
    }
  });
}

export const supabaseServer = new Proxy({} as ReturnType<typeof getSupabaseServer>, {
  get(_target, prop) {
    const client = getSupabaseServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valor = (client as any)[prop];
    return typeof valor === 'function' ? valor.bind(client) : valor;
  }
});
