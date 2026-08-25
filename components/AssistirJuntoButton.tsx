'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

interface Props {
  contentId: string;
  contentType: 'movie' | 'series';
}

function gerarIdSala(): string {
  return Math.random().toString(36).slice(2, 9);
}

// Agente "Assistir Juntos": botão que estava faltando em qualquer tela
// do sistema — sem ele, a funcionalidade existia no código mas nunca
// era alcançável. Cria a sala (party_rooms) com o usuário logado como
// host e leva direto para /assistir-junto/[roomId].
export function AssistirJuntoButton({ contentId, contentType }: Props) {
  const [criando, setCriando] = useState(false);
  const router = useRouter();

  const criarSala = async () => {
    setCriando(true);
    const { data: userData } = await supabaseBrowser.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const id = gerarIdSala();
    const { error } = await supabaseBrowser.from('party_rooms').insert({
      id,
      content_id: contentId,
      content_type: contentType,
      host_id: userData.user.id,
      is_active: true
    });

    setCriando(false);
    if (!error) router.push(`/assistir-junto/${id}`);
  };

  return (
    <button
      onClick={criarSala}
      disabled={criando}
      className="focusable bg-white/10 border border-border text-white text-[15px] md:text-[17px] font-medium rounded-card px-6 py-3 disabled:opacity-60"
    >
      <i className="ti ti-users-group mr-2" aria-hidden="true" />
      {criando ? 'Criando sala...' : 'Assistir Juntos'}
    </button>
  );
}
