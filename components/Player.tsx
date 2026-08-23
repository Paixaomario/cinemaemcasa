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
}

// Agente de player: legendas/áudio configuráveis + próximo episódio
// automático com contagem regressiva cancelável + progresso salvo
// em view_progress para retomar em qualquer dispositivo.
export function Player({
  src,
  poster,
  subtitles,
  audioTracks,
  nextEpisodeHref,
  contentId,
  userId
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioTrack, setAudioTrack] = useState(audioTracks?.[0]?.lang || '');
  const [subtitleTrack, setSubtitleTrack] = useState('off');

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
    <div className="relative bg-black">
      <video
        ref={videoRef}
        src={src || undefined}
        poster={poster || undefined}
        controls
        className="w-full aspect-video bg-black"
        onTimeUpdate={saveProgress}
      >
        {subtitleTrack !== 'off' &&
          subtitles?.map(
            (s) =>
              s.lang === subtitleTrack &&
              s.url && <track key={s.lang} kind="subtitles" src={s.url} srcLang={s.lang} label={s.lang} default />
          )}
      </video>

      {(audioTracks?.length || subtitles?.length) ? (
        <div className="flex gap-3 px-3 py-2 bg-panel text-[12px]">
          {audioTracks && audioTracks.length > 0 && (
            <label className="flex items-center gap-1 text-textmuted">
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
            <label className="flex items-center gap-1 text-textmuted">
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
      ) : null}

      {countdown !== null && nextEpisodeHref && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-3">
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
