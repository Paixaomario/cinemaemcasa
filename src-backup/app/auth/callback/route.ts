/**
 * Handler de Callback de Autenticação
 * Este arquivo processa o código de troca (exchange code) após o login/registro.
 * A implementação utiliza a estratégia de cookies segura para SSR.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const response = NextResponse.redirect(`${origin}/home`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => Array.from(request.cookies.getAll()),
          setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Erro na troca de sessão:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
    }

    return response
  }

  return NextResponse.redirect(`${origin}/home`)
}
