'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

interface Props {
  contentId: number;
  contentType: 'movie' | 'series';
}

// Agente de Minha Lista: o botão existia só visualmente, sem nenhuma
// ação — agora salva/remove de verdade na tabela `favorites`
// (usando `legacy_id` + `content_type`, os campos que a leitura de
// /minha-lista já espera).
export function BotaoMinhaLista({ contentId, contentType }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getUser();
      const uid = data.user?.id || null;
      setUserId(uid);
      if (!uid) return;

      const { data: existente } = await supabaseBrowser
        .from('favorites')
        .select('id')
        .eq('user_id', uid)
        .eq('legacy_id', contentId)
        .eq('content_type', contentType)
        .maybeSingle();
      setSalvo(!!existente);
    })();
  }, [contentId, contentType]);

  const alternar = async () => {
    if (!userId) {
      router.push('/login');
      return;
    }
    setCarregando(true);
    setErro(false);

    // CORREÇÃO IMPORTANTE: antes, o resultado da gravação nunca era
    // checado — o botão sempre mostrava "salvo" mesmo quando o
    // Supabase recusava a operação (por RLS, por exemplo), fazendo
    // parecer que funcionou quando na verdade não gravou nada.
    if (salvo) {
      const { error } = await supabaseBrowser
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('legacy_id', contentId)
        .eq('content_type', contentType);
      if (error) setErro(true);
      else setSalvo(false);
    } else {
      const { error } = await supabaseBrowser.from('favorites').insert({
        user_id: userId,
        legacy_id: contentId,
        content_type: contentType
      });
      if (error) setErro(true);
      else setSalvo(true);
    }
    setCarregando(false);
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={alternar}
        disabled={carregando}
        className="focusable bg-white/10 border border-border text-white text-[15px] md:text-[17px] font-medium rounded-card px-6 py-3 disabled:opacity-60"
      >
        <i className={`ti ${salvo ? 'ti-check' : 'ti-plus'} mr-2`} aria-hidden="true" />
        {salvo ? 'Na minha lista' : 'Minha lista'}
      </button>
      {erro && <p className="text-[11px] text-red-400">Não foi possível salvar. Tente novamente.</p>}
    </div>
  );
}
