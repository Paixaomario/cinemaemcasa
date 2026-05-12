'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const sb       = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  useEffect(() => { if (user) router.push('/') }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await sb.auth.signInWithPassword({ email, password })
        if (err) throw err
        router.push('/')
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: '#000' }}>
      {/* Background image */}
      <div className="absolute inset-0">
        <Image src="/bg-family.jpg" alt="Família assistindo" fill className="object-cover object-center" priority />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.72)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' }} />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="PAIXAOFLIX" width={180} height={60} className="h-14 w-auto" />
        </div>

        <div className="rounded-2xl p-7" style={{ background: 'rgba(10,10,10,0.92)', border: '1px solid #2a2a2a', backdropFilter: 'blur(20px)' }}>
          <h2 className="mb-6 text-center text-xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Recuperar senha'}
          </h2>

          {error   && <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(192,57,43,0.15)', color: '#e74c3c', fontFamily: "'Open Sans', sans-serif", border: '1px solid rgba(192,57,43,0.3)' }}>{error}</div>}
          {success && <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(39,174,96,0.15)', color: '#2ecc71', fontFamily: "'Open Sans', sans-serif", border: '1px solid rgba(39,174,96,0.3)' }}>{success}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>E-mail</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg px-3 py-3 text-sm text-white outline-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid #333', fontFamily: "'Open Sans', sans-serif" }}
                onFocus={e => { e.target.style.borderColor = 'var(--px-red)' }}
                onBlur={e => { e.target.style.borderColor = '#333' }}
              />
            </div>
            {mode !== 'forgot' && (
              <div>
                <label className="mb-1.5 block text-xs" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>Senha</label>
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-3 text-sm text-white outline-none transition-all"
                  style={{ background: '#1a1a1a', border: '1px solid #333', fontFamily: "'Open Sans', sans-serif" }}
                  onFocus={e => { e.target.style.borderColor = 'var(--px-red)' }}
                  onBlur={e => { e.target.style.borderColor = '#333' }}
                />
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="btn btn-red w-full justify-center py-3 text-sm"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar'}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-center">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('register')} className="text-sm transition-colors hover:text-white"
                  style={{ color: '#aaa', fontFamily: "'Inter', sans-serif" }}>
                  Não tem conta? <span style={{ color: 'var(--px-red)' }}>Cadastre-se</span>
                </button>
                <button onClick={() => setMode('forgot')} className="text-xs transition-colors"
                  style={{ color: '#666', fontFamily: "'Open Sans', sans-serif" }}>
                  Esqueceu a senha?
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => setMode('login')} className="text-sm transition-colors"
                style={{ color: '#aaa', fontFamily: "'Inter', sans-serif" }}>
                Já tem conta? <span style={{ color: 'var(--px-red)' }}>Entrar</span>
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#444', fontFamily: "'Open Sans', sans-serif" }}>
          Plataforma privada — somente usuários autorizados
        </p>
      </div>
    </div>
  )
}
