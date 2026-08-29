'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

interface Props {
  contentId: string;
  contentType: 'movie' | 'series';
  titulo: string;
}

// Sala com id curto (7 caracteres) — o link final fica algo como
// dominio.com/assistir-junto/ab12xy9, já naturalmente curto o
// suficiente para digitar ou colar no WhatsApp, sem depender de um
// encurtador de link externo.
function gerarIdSala(): string {
  return Math.random().toString(36).slice(2, 9);
}

// Agente "Assistir Juntos": cria a sala com o usuário logado como host
// e mostra um link para convidar até 5 pessoas — com o nome do
// conteúdo já embutido na mensagem, pronto pra mandar no WhatsApp ou
// digitar em outro aparelho.
export function AssistirJuntoButton({ contentId, contentType, titulo }: Props) {
  const [criando, setCriando] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
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
    if (!error) setLink(`${window.location.origin}/assistir-junto/${id}`);
  };

  const mensagem = `Assista comigo "${titulo}" no Cinema em Casa:\n${link}`;

  const copiarLink = async () => {
    // Copia SÓ o link (não a mensagem inteira) — colar o texto+link
    // grudados na barra de endereço de um navegador faz ele tratar
    // tudo como uma busca no Google, em vez de abrir o link.
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (link) {
    return (
      <div className="flex flex-col gap-2 bg-panel border border-border rounded-card p-4 max-w-sm">
        <p className="text-[13px] text-textmuted">Convide até 5 pessoas — envie este link:</p>
        <p className="text-[13px] text-white break-all bg-card rounded px-3 py-2">{link}</p>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focusable flex-1 text-center bg-[#25D366] text-black text-[13px] font-medium rounded-card px-4 py-2.5"
          >
            <i className="ti ti-brand-whatsapp mr-1.5" aria-hidden="true" />
            WhatsApp
          </a>
          <button
            onClick={copiarLink}
            className="focusable flex-1 bg-white/10 border border-border text-white text-[13px] font-medium rounded-card px-4 py-2.5"
          >
            <i className="ti ti-copy mr-1.5" aria-hidden="true" />
            {copiado ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
        <button
          onClick={() => router.push(`/assistir-junto/${link.split('/').pop()}`)}
          className="focusable bg-accent text-white text-[13px] font-medium rounded-card px-4 py-2.5"
        >
          Entrar na sala agora
        </button>
      </div>
    );
  }

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
