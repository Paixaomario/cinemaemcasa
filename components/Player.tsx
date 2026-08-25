'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import 'video.js/dist/video-js.css';

// Tipagem do player mantida solta (sem importar um caminho interno do
// pacote video.js) — caminhos internos como 'video.js/dist/types/...'
// podem mudar entre versões e quebrar o build no Vercel. O player em
// si continua 100% funcional; só a checagem de tipo fica mais simples.
type VideoJsPlayer = {
  dispose: () => void;
  on: (evento: string, cb: (...args: unknown[]) => void) => void;
  currentTime: () => number | undefined;
};

interface Track {
  lang: string;
  url?: string;
}

interface Props {
  src: string | null;
  poster?: string | null;
  subtitles?: Track[] | null;
  audioTracks?: Track[] | null;
  nextEpisodeHref?: string | null;
  contentId: string;
  userId?: string | null;
  exitHref: string;
}

// Agente de página de exibição: player construído sobre o Video.js
// (biblioteca madura, pensada para catálogos grandes — suporta MP4,
// HLS/DASH via plugins, controle de qualidade e é a mesma base usada
// por várias plataformas de streaming), com skin customizada nas cores
// da marca em vez do azul padrão do Video.js. Tela cheia, SEM rolagem
// vertical, botão Sair que volta para Filmes/Séries, legendas/áudio
// próprios flutuando sobre o vídeo, e próximo episódio automático.
export function PlayerVideoJS({
  src,
  poster,
  subtitles,
  audioTracks,
  nextEpisodeHref,
  contentId,
  userId,
  exitHref
}: Props) {
  const videoElRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioTrack, setAudioTrack] = useState(audioTracks?.[0]?.lang || '');
  const [subtitleTrack, setSubtitleTrack] = useState('off');
  const [menuAberto, setMenuAberto] = useState(false);

  // Inicializa o Video.js uma vez por src.
  useEffect(() => {
    if (!videoElRef.current || !src) return;

    let ativo = true;

    (async () => {
      const videojs = (await import('video.js')).default;

      if (!ativo || !videoElRef.current) return;

      const player = videojs(videoElRef.current, {
        autoplay: true,
        controls: true,
        fluid: false,
        fill: true,
        preload: 'auto',
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        sources: [{ src, type: guessType(src) }],
        poster: poster || undefined
      });

      playerRef.current = player;

      player.on('ended', () => {
        if (nextEpisodeHref) setCountdown(10);
      });

      player.on('timeupdate', () => {
        if (!userId) return;
        const t = player.currentTime();
        if (typeof t === 'number') saveProgress(t);
      });
    })();

    return () => {
      ativo = false;
      playerRef.current?.dispose();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (nextEpisodeHref) router.push(nextEpisodeHref);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, nextEpisodeHref, router]);

  const saveProgress = async (currentTime: number) => {
    if (!userId) return;
    const { supabaseBrowser } = await import('@/lib/supabase/client');
    await supabaseBrowser.from('view_progress').upsert(
      {
        user_id: userId,
        content_id: contentId,
        last_position: Math.floor(currentTime),
        is_finished: false
      },
      { onConflict: 'user_id,content_id' }
    );
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cinema-player-skin">
      <div data-vjs-player className="w-full h-full">
        <video ref={videoElRef} className="video-js w-full h-full" playsInline />
      </div>

      {/* Botão Sair — volta para a listagem (Filmes ou Séries) */}
      <button
        onClick={() => router.push(exitHref)}
        aria-label="Sair"
        className="focusable absolute top-5 left-5 z-30 w-11 h-11 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white"
      >
        <i className="ti ti-x text-xl" aria-hidden="true" />
      </button>

      {/* Legendas/áudio: flutua sobre o vídeo, nunca empurra layout */}
      {(audioTracks?.length || subtitles?.length) ? (
        <div className="absolute top-5 right-5 z-30">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Áudio e legendas"
            className="focusable w-11 h-11 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white"
          >
            <i className="ti ti-adjustments-horizontal text-xl" aria-hidden="true" />
          </button>

          {menuAberto && (
            <div className="absolute top-12 right-0 bg-panel border border-border rounded-card p-3 w-[190px] flex flex-col gap-2 text-[12px]">
              {audioTracks && audioTracks.length > 0 && (
                <label className="flex items-center justify-between gap-2 text-textmuted">
                  Áudio
                  <select
                    value={audioTrack}
                    onChange={(e) => setAudioTrack(e.target.value)}
                    className="bg-card text-white rounded px-1.5 py-0.5"
                  >
                    {audioTracks.map((a) => (
                      <option key={a.lang} value={a.lang}>
                        {a.lang}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {subtitles && subtitles.length > 0 && (
                <label className="flex items-center justify-between gap-2 text-textmuted">
                  Legenda
                  <select
                    value={subtitleTrack}
                    onChange={(e) => setSubtitleTrack(e.target.value)}
                    className="bg-card text-white rounded px-1.5 py-0.5"
                  >
                    <option value="off">Desligada</option>
                    {subtitles.map((s) => (
                      <option key={s.lang} value={s.lang}>
                        {s.lang}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </div>
      ) : null}

      {countdown !== null && nextEpisodeHref && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-3 z-40">
          <p className="text-sm text-textmuted">Próximo episódio em {countdown}s</p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(nextEpisodeHref)}
              className="focusable bg-accent text-white text-[13px] font-medium rounded-card px-5 py-2"
            >
              Assistir agora
            </button>
            <button
              onClick={() => setCountdown(null)}
              className="focusable bg-white/10 border border-border text-white text-[13px] rounded-card px-5 py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function guessType(src: string): string {
  if (src.endsWith('.m3u8')) return 'application/x-mpegURL';
  if (src.endsWith('.mpd')) return 'application/dash+xml';
  return 'video/mp4';
}

export { PlayerVideoJS as Player };
