import { NextRequest, NextResponse } from 'next/server';
import { buscarFilmesPorCategoria, buscarSeriesPorGenero } from '@/lib/catalogoPorCategoria';

export const revalidate = 300;

// Chamada pelo CategoryCarousel conforme o usuário rola pra perto do
// fim da linha — não existe limite de quantas vezes isso pode ser
// chamado nem quantidade máxima de itens por categoria; a rolagem só
// "dá a volta" pro começo quando o banco realmente não tem mais nada
// pra aquela categoria (fim: true).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo');
  const categoria = searchParams.get('categoria');
  const offset = Number(searchParams.get('offset') || 0);

  if (!categoria || (tipo !== 'filme' && tipo !== 'serie')) {
    return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 });
  }

  const resultado =
    tipo === 'filme'
      ? await buscarFilmesPorCategoria(categoria, offset)
      : await buscarSeriesPorGenero(categoria, offset);

  return NextResponse.json(resultado);
}
