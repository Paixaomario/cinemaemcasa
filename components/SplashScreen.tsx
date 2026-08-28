'use client';

import { useEffect, useState } from 'react';

// Agente de página de carregamento: logo em 700px no desktop / 500px no
// mobile, com barra de progresso rápida. O CONTEÚDO real da página
// (incluindo o banner hero) já vem pronto no HTML enviado pelo
// servidor por baixo dela — a splash é só um flash de marca breve,
// não um bloqueio de carregamento. Assim que ela some, o banner hero
// já é a primeira coisa que aparece, igual nos grandes streamings.
// Aparece SÓ UMA VEZ por sessão do navegador.
export function SplashScreen() {
  const [progresso, setProgresso] = useState(0);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('splash_exibida')) return;
    sessionStorage.setItem('splash_exibida', '1');
    setVisivel(true);

    const inicio = Date.now();
    const duracao = 700;

    const tick = () => {
      const decorrido = Date.now() - inicio;
      const pct = Math.min(100, Math.round((decorrido / duracao) * 100));
      setProgresso(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => setVisivel(false), 120);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  if (!visivel) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-6 transition-opacity duration-300"
      style={{ opacity: progresso >= 100 ? 0 : 1 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Cinema em Casa"
        className="w-[500px] max-w-[85vw] md:w-[700px] md:max-w-[70vw]"
      />
      <div className="w-[240px] md:w-[320px] h-1 bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-gold transition-[width] duration-150 ease-linear"
          style={{ width: `${progresso}%` }}
        />
      </div>
      <p className="text-[11px] text-textmuted">{progresso}%</p>
    </div>
  );
}
