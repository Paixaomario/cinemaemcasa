import { NextRequest, NextResponse } from 'next/server';
import { getTrailerYoutubeDoTMDB } from '@/lib/tmdb';

export const revalidate = 3600;

// Chamada pelo TitleCard só quando o usuário realmente para numa capa
// (depois dos 900ms de foco) e o título não tem `trailer` próprio no
// banco — evita bater no TMDB pra cada capa que só passa voando pela
// tela.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = Number(searchParams.get('tmdbId'));
  const tipo = searchParams.get('tipo');

  if (!tmdbId || (tipo !== 'movie' && tipo !== 'series')) {
    return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 });
  }

  const key = await getTrailerYoutubeDoTMDB(tmdbId, tipo);
  return NextResponse.json({ key });
}
