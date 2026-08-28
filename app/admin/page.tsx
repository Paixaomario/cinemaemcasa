'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

// Agente de administração: tela restrita (só quem tem profiles.is_admin
// = true) para gerenciar quem tem acesso, sem precisar mexer direto no
// Supabase Studio.
export default function AdminPage() {
  const [perfis, setPerfis] = useState<Profile[]>([]);
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      const { data: perfil } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (!perfil?.is_admin) {
        setAutorizado(false);
        return;
      }
      setAutorizado(true);
      const { data } = await supabaseBrowser.from('profiles').select('*');
      setPerfis(data || []);
    })();
  }, [router]);

  const atualizar = async (id: string, campo: 'is_admin' | 'is_child', valor: boolean) => {
    await supabaseBrowser.from('profiles').update({ [campo]: valor }).eq('id', id);
    setPerfis((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
  };

  if (autorizado === null) return null;

  if (!autorizado) {
    return (
      <div className="px-6 pt-10">
        <p className="text-sm text-textmuted">Esta área é restrita a administradores.</p>
      </div>
    );
  }

  return (
    <div className="px-6 pt-10 pb-10">
      <h1 className="text-xl font-medium mb-2">Usuários autorizados</h1>
      <Link href="/admin/secoes" className="text-[12px] text-white underline mb-6 inline-block">
        Gerenciar seções da Home →
      </Link>
      <div className="flex flex-col gap-2 mt-4">
        {perfis.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-panel rounded-card px-4 py-3"
          >
            <div>
              <p className="text-sm">{p.username || p.full_name}</p>
              <p className="text-[11px] text-textmuted">
                Classificação máxima: {p.content_rating_limit}
              </p>
            </div>
            <div className="flex gap-4 text-[12px]">
              <label className="flex items-center gap-1.5 text-textmuted">
                <input
                  type="checkbox"
                  checked={p.is_admin}
                  onChange={(e) => atualizar(p.id, 'is_admin', e.target.checked)}
                />
                Admin
              </label>
              <label className="flex items-center gap-1.5 text-textmuted">
                <input
                  type="checkbox"
                  checked={p.is_child}
                  onChange={(e) => atualizar(p.id, 'is_child', e.target.checked)}
                />
                Modo infantil
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
