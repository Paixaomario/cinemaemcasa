'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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

// Agente de página de exibição: tela cheia SEM rolagem vertical
// (fixed inset-0), com botão de Sair que volta para a página de Filmes
// ou Séries (conforme o conteúdo). Legendas/áudio configuráveis
// flutuam sobre o vídeo em vez de empurrar layout (o que causaria
// scroll). Próximo episódio automático com contagem regressiva
// cancelável + progresso salvo em view_progress.
export function Player({
  src,
  poster,
  subtitles,
  audioTracks,
  nextEpisodeHref,
  contentId,
  userId,
  exitHref
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioTrack, setAudioTrack] = useState(audioTracks?.[0]?.lang || '');
  const [subtitleTrack, setSubtitleTrack] = useState('off');
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      if (nextEpisodeHref) setCountdown(10);
    };
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, [nextEpisodeHref]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (nextEpisodeHref) router.push(nextEpisodeHref);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, nextEpisodeHref, router]);

  const saveProgress = async () => {
    if (!userId || !videoRef.current) return;
    const { supabaseBrowser } = await import('@/lib/supabase/client');
    await supabaseBrowser.from('view_progress').upsert(
      {
        user_id: userId,
        content_id: contentId,
        last_position: Math.floor(videoRef.current.currentTime),
        is_finished: false
      },
      { onConflict: 'user_id,content_id' }
    );
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={src || undefined}
        poster={poster || undefined}
        controls
        autoPlay
        className="w-full h-full object-contain bg-black"
        onTimeUpdate={saveProgress}
      >
        {subtitleTrack !== 'off' &&
          subtitles?.map(
            (s) =>
              s.lang === subtitleTrack &&
              s.url && <track key={s.lang} kind="subtitles" src={s.url} srcLang={s.lang} label={s.lang} default />
          )}
      </video>

      {/* Botão Sair — sempre visível, volta para a listagem (Filmes ou Séries) */}
      <button
        onClick={() => router.push(exitHref)}
        aria-label="Sair"
        className="focusable absolute top-5 left-5 z-30 w-11 h-11 rounded-full bg-black/75 flex items-center justify-center text-white"
      >
        <i className="ti ti-x text-xl" aria-hidden="true" />
      </button>

      {/* Legendas/áudio: flutua sobre o vídeo, nunca empurra o layout (sem scroll) */}
      {(audioTracks?.length || subtitles?.length) ? (
        <div className="absolute top-5 right-5 z-30">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Áudio e legendas"
            className="focusable w-11 h-11 rounded-full bg-black/75 flex items-center justify-center text-white"
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
