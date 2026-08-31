import { NextRequest, NextResponse } from 'next/server';
import { getPosterDoTMDB } from '@/lib/tmdb';

export const revalidate = 3600;

// Chamada pelo TitleCard só quando uma capa realmente aparece sem
// imagem no navegador — nunca durante o carregamento da página no
// servidor (isso é o que causava o carregamento de minutos).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId'));
  const tipo = searchParams.get('tipo');

  if (!tmdbId || (tipo !== 'movie' && tipo !== 'series')) {
    return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 });
  }

  const poster = await getPosterDoTMDB(tmdbId, tipo);
  return NextResponse.json({ poster });
}
