'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="relative flex min-h-screen items-center justify-center bg-black" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const { user } = useAuth()
  const router   = useRouter()
  const searchParams = useSearchParams()
  const sb       = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { 
    if (user) router.push('/')
    const urlError = searchParams.get('error')
    if (urlError === 'auth-callback-failed') {
      setError('O link de login expirou ou é inválido. Tente novamente.')
    }
  }, [user, router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await sb.auth.signInWithPassword({ email, password })
        if (err) throw err
        router.push('/home')
      } else if (mode === 'register') {
        const { error: err } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
        if (err) throw err
        setSuccess('Conta criada! Verifique seu e-mail.')
      } else {
        const { error: err } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback` })
        if (err) throw err
        setSuccess('E-mail de recuperação enviado!')
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(''); setLoading(true)
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com Google.')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image 
          src="/bg-family.jpg" 
          alt="Família assistindo" 
          fill 
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-red-600/20 blur-2xl" />
            <Image 
              src="/logo.png" 
              alt="PAIXAOFLIX" 
              width={200} 
              height={70} 
              className="relative h-16 w-auto object-contain"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/60 p-6 sm:p-8 backdrop-blur-xl sm:border-white/15 sm:bg-black/70">
          <h2 className="mb-2 text-center text-2xl font-bold text-white sm:text-3xl">
            {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Crie sua conta' : 'Recuperar senha'}
          </h2>
          <p className="mb-6 text-center text-sm text-gray-400">
            {mode === 'login' ? 'Entre para continuar assistindo' : mode === 'register' ? 'Comece sua jornada cinematográfica' : 'Enviaremos instruções para seu e-mail'}
          </p>

          {error   && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">E-mail</label>
              <div className="relative">
                <input
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500 focus:bg-white/10"
                />
                <svg className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            
            {mode !== 'forgot' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500 focus:bg-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
            <button
              type="submit" 
              disabled={loading}
              className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Aguarde...
                </span>
              ) : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar'}
            </button>

            {mode === 'login' && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-black/60 px-2 text-gray-500">ou continue com</span>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            )}
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center">
            {mode === 'login' && (
              <>
                <button 
                  onClick={() => setMode('register')} 
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Não tem conta? <span className="font-semibold text-red-500">Cadastre-se</span>
                </button>
                <button 
                  onClick={() => setMode('forgot')} 
                  className="text-xs text-gray-500 transition-colors hover:text-gray-300"
                >
                  Esqueceu a senha?
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button 
                onClick={() => setMode('login')} 
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Já tem conta? <span className="font-semibold text-red-500">Entrar</span>
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Plataforma privada — somente usuários autorizados
        </p>
      </div>
    </div>
  )
}
