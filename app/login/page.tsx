'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

// Agente de Usuário: tela simples de acesso. Não há cadastro público —
// usuários autorizados são criados por você (admin) via Supabase Auth
// ou pelo painel de administração.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password: senha
    });
    setCarregando(false);
    if (error) {
      setErro('Usuário ou senha incorretos.');
      return;
    }
    router.push('/perfil');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={entrar} className="w-full max-w-[280px] flex flex-col items-center">
        <Logo width={160} className="mb-6" />
        <p className="text-[11px] text-textmuted tracking-widest mb-4">ACESSO RESTRITO</p>

        <input
          type="email"
          required
          placeholder="e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-card border border-border rounded-card px-3 py-2.5 text-sm text-white mb-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
        <input
          type="password"
          required
          placeholder="senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full bg-card border border-border rounded-card px-3 py-2.5 text-sm text-white mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />

        {erro && <p className="text-[12px] text-red-400 mb-3">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="focusable w-full bg-accent text-white text-sm font-medium rounded-card py-2.5 disabled:opacity-60"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
