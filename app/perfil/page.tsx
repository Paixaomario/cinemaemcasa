'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

// Agente de Perfil: seleção de perfil dentro da conta autorizada.
// Perfis marcados como is_child aplicam o filtro content_rating_limit
// (modo infantil) em todas as listagens.
export default function PerfilPage() {
  const [perfis, setPerfis] = useState<Profile[]>([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      const { data } = await supabaseBrowser.from('profiles').select('*');
      setPerfis(data || []);
      setCarregando(false);
    })();
  }, [router]);

  const escolherPerfil = (perfil: Profile) => {
    sessionStorage.setItem('perfil_ativo', JSON.stringify(perfil));
    router.push('/');
  };

  if (carregando) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-[16px] font-medium text-center mb-8">Quem está assistindo?</h1>
        <div className="flex flex-wrap justify-center gap-5">
          {perfis.map((p) => (
            <button
              key={p.id}
              onClick={() => escolherPerfil(p)}
              className="focusable flex flex-col items-center gap-2"
            >
              <span className="w-16 h-16 rounded-card bg-accent flex items-center justify-center text-lg font-medium text-white">
                {(p.username || p.full_name || '?').slice(0, 2).toUpperCase()}
              </span>
              <span className="text-xs text-white/90">{p.username || p.full_name}</span>
              {p.is_child && <span className="text-[10px] text-gold">Infantil</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
