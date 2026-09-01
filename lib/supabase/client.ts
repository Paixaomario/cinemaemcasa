'use client';

import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * CORREÇÃO IMPORTANTE: antes, este cliente usava createClient() puro
 * do supabase-js, que guarda a sessão só no localStorage do navegador
 * — nunca em cookie. Isso significa que, mesmo depois de corrigir o
 * cliente do SERVIDOR pra ler cookies (lib/supabase/server.ts), ele
 * NUNCA via a sessão de quem tinha logado, porque o navegador nunca
 * escreveu esse cookie em primeiro lugar. Usar createBrowserClient()
 * do @supabase/ssr (em vez do createClient() genérico) faz a sessão
 * ser guardada em cookie E em localStorage — cliente e servidor agora
 * enxergam o mesmo login.
 */
export const supabaseBrowser = createBrowserClient(url, key);

