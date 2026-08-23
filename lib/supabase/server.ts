import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Cliente somente leitura para uso em Server Components / rotas server-side.
// Nunca expõe service_role — apenas a chave pública, respeitando RLS.
export const supabaseServer = createClient(url, key, {
  auth: { persistSession: false }
});
