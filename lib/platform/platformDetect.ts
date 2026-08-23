'use client';

export type Plataforma = 'webos' | 'tizen' | 'android-tv' | 'mobile' | 'desktop';

/**
 * Detecção de plataforma recriada do zero (substitui o antigo
 * `src/lib/platform/platformDetect.ts`). Usada para ligar/desligar
 * recursos específicos — ex: proteção de burn-in só roda em TVs,
 * navegação espacial só é necessária sem mouse/touch.
 */
export function detectarPlataforma(): Plataforma {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('web0s') || ua.includes('webos')) return 'webos';
  if (ua.includes('tizen')) return 'tizen';
  if (ua.includes('android') && (ua.includes('tv') || ua.includes('aft'))) return 'android-tv';
  if (/mobi|android|iphone|ipad/.test(ua)) return 'mobile';
  return 'desktop';
}

export function ehSmartTV(plataforma: Plataforma): boolean {
  return plataforma === 'webos' || plataforma === 'tizen' || plataforma === 'android-tv';
}
