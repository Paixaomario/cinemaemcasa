/**
 * Se a coluna `trailer` do banco guarda um link do YouTube (em vez de
 * um arquivo de vídeo direto), a tag <video> do navegador NUNCA
 * consegue tocar isso — ela só reproduz arquivo de vídeo puro, não uma
 * página web. Essa função detecta esse caso e extrai o ID do vídeo
 * pra ser usado num embed de iframe, que é o jeito certo de tocar
 * YouTube. Funciona pra qualquer formato comum de link do YouTube.
 */
export function extrairIdYoutube(url: string | null | undefined): string | null {
  if (!url) return null;
  const padroes = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/
  ];
  for (const padrao of padroes) {
    const match = url.match(padrao);
    if (match) return match[1];
  }
  return null;
}

export function ehLinkDeVideoDireto(url: string): boolean {
  return /\.(mp4|webm|mov|m3u8|mpd)(\?.*)?$/i.test(url);
}
