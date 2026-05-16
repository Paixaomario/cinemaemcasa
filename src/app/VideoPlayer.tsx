'use client'
import React, { useEffect, useRef } from 'react'

interface ClapprPlayer {
  destroy(): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  isPlaying(): boolean;
}
interface ClapprLevel {
  level: {
    height: number;
    name: string;
  };
}

interface ClapprConfig {
  source: string;
  parentId: string;
  plugins?: unknown[];
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  levelSelectorConfig?: {
    title?: string;
    labelCallback?: (playbackLevel: ClapprLevel) => string;
  };
  playbackSpeedConfig?: {
    defaultValue?: string;
    options?: { value: string; label: string }[];
  };
  markers?: {
    markers?: unknown[];
  };
  chromecast?: {
    appId?: string;
    contentType?: string;
  };
  scrubThumbnails?: {
    backdropHeight?: number;
    spotlightHeight?: number;
    thumbs?: unknown[];
  };
  [key: string]: unknown;
}

declare const Clappr: {
  Player: new (config: ClapprConfig) => ClapprPlayer;
};
declare const HlsjsPlayback: unknown;
declare const DashShakaPlayback: unknown;
declare const LevelSelector: unknown;
declare const PlaybackSpeed: unknown;
declare const ClapprMarkersPlugin: unknown;
declare const ClapprSubtitlePlugin: unknown;
declare const ChromecastPlugin: unknown;
declare const ClapprThumbnailsPlugin: unknown;

interface Props {
  src: string
  title: string
  onClose: () => void
}

export function VideoPlayer({ src, title, onClose }: Props) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<ClapprPlayer | null>(null)

  useEffect(() => {
    if (
      videoRef.current && 
      typeof Clappr !== 'undefined' && 
      typeof HlsjsPlayback !== 'undefined' &&
      typeof DashShakaPlayback !== 'undefined' &&
      typeof LevelSelector !== 'undefined' &&
      typeof PlaybackSpeed !== 'undefined' &&
      typeof ClapprMarkersPlugin !== 'undefined' &&
      typeof ClapprSubtitlePlugin !== 'undefined' &&
      typeof ChromecastPlugin !== 'undefined' &&
      typeof ClapprThumbnailsPlugin !== 'undefined'
    ) {
      const player = new Clappr.Player({
        source: src,
        parentId: `#clappr-generic`,
        plugins: [HlsjsPlayback, DashShakaPlayback, LevelSelector, PlaybackSpeed, ClapprMarkersPlugin, ClapprSubtitlePlugin, ChromecastPlugin, ClapprThumbnailsPlugin],
        levelSelectorConfig: {
          title: 'Qualidade',
          labelCallback: function(playbackLevel: ClapprLevel) {
            return playbackLevel.level.height ? playbackLevel.level.height + 'p' : playbackLevel.level.name;
          }
        },
        playbackSpeedConfig: {
          defaultValue: '1.0',
          options: [
            {value: '0.5', label: '0.5x'},
            {value: '1.0', label: 'Normal'},
            {value: '1.25', label: '1.25x'},
            {value: '1.5', label: '1.5x'},
            {value: '2.0', label: '2.0x'},
          ]
        },
        scrubThumbnails: {
          backdropHeight: 64,
          spotlightHeight: 84,
          thumbs: []
        },
        markers: {
          markers: []
        },
        chromecast: {
          appId: '9DFB77C0',
          contentType: 'video/mp4',
        },
        subtitleConfig: {
          title: 'Legendas',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          fontWeight: 'bold',
        },
        width: '100%',
        height: '100%',
        autoPlay: true,
      });
      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [src]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center hero-enter">
      {/* Header do Player conforme padrão @netflix */}
      <div className="absolute top-0 left-0 right-0 p-8 z-[10001] flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose}
          className="flex items-center gap-4 text-white text-2xl font-bold hover:text-[var(--gold-primary)] transition-colors"
        >
          <span className="text-4xl">←</span>
          <span className="uppercase tracking-widest">{title}</span>
        </button>
      </div>
      
      <div className="w-full h-full">
        <div ref={videoRef} id="clappr-generic" className="w-full h-full" />
      </div>
    </div>
  )
}