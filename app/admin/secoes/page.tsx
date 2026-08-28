'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { HomeSection } from '@/lib/types';

// Agente de administração: gerenciar as seções da Home (ativar/
// desativar, ver categoria/ordenação/posição) sem precisar abrir o
// Supabase Studio e mexer em SQL direto.
export default function AdminSecoesPage() {
  const [secoes, setSecoes] = useState<HomeSection[]>([]);
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
      const { data } = await supabaseBrowser
        .from('home_sections')
        .select('*')
        .order('posicao', { ascending: true });
      setSecoes(data || []);
    })();
  }, [router]);

  const alternarAtivo = async (id: string, ativo: boolean) => {
    await supabaseBrowser.from('home_sections').update({ ativo }).eq('id', id);
    setSecoes((prev) => prev.map((s) => (s.id === id ? { ...s, ativo } : s)));
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
      <Link href="/admin" className="text-[12px] text-textmuted mb-4 inline-block">
        <i className="ti ti-arrow-left mr-1" aria-hidden="true" />
        Voltar
      </Link>
      <h1 className="text-xl font-medium mb-2">Seções da Home</h1>
      <p className="text-[13px] text-textmuted mb-6">
        Liga/desliga seções sem mexer no Supabase. Pra criar uma seção nova, mudar categoria,
        ordenação ou posição, ainda é preciso usar o Supabase Studio — isso aqui cobre só o
        ajuste do dia a dia.
      </p>
      <div className="flex flex-col gap-2">
        {secoes.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between bg-panel rounded-card px-4 py-3"
          >
            <div>
              <p className="text-sm">{s.titulo}</p>
              <p className="text-[11px] text-textmuted">
                {s.layout} · posição {s.posicao} ·{' '}
                {s.categorias.length > 0 ? s.categorias.join(', ') : 'todas as categorias'}
              </p>
            </div>
            <label className="flex items-center gap-1.5 text-[12px] text-textmuted">
              <input
                type="checkbox"
                checked={s.ativo}
                onChange={(e) => alternarAtivo(s.id, e.target.checked)}
              />
              Ativa
            </label>
          </div>
        ))}
        {secoes.length === 0 && (
          <p className="text-[13px] text-textmuted">Nenhuma seção cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
