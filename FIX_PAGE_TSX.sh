#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔧 CORRIGIR page.tsx — Adicionar WebOS + ContentCard      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# Backup do arquivo original
echo "1️⃣  Fazendo backup de src/app/page.tsx..."
cp src/app/page.tsx src/app/page.tsx.backup
echo "   ✅ Backup em: src/app/page.tsx.backup"
echo ""

# Criar novo page.tsx com suporte WebOS
echo "2️⃣  Criando novo page.tsx com WebOS support..."

cat > src/app/page.tsx << 'EOF'
'use client'

import { useEffect, useState } from 'react'
import { useWebOSFocus } from '@/hooks/useWebOSFocus'
import { ContentCard } from '@/components/ContentCard'
import { getMovies, getSeries } from '@/lib/queries'

export default function Home() {
  // Ativa navegação com setas do controle remoto (WebOS)
  useWebOSFocus()

  const [movies, setMovies] = useState<any[]>([])
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [moviesData, seriesData] = await Promise.all([
          getMovies(),
          getSeries()
        ])
        setMovies(moviesData)
        setSeries(seriesData)
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-yellow-400" />
          <p className="text-white">Carregando conteúdo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 text-white sm:p-6 md:p-8">
      {/* Seção de Filmes */}
      {movies.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">🎬 Filmes</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {movies.map((movie) => (
              <ContentCard
                key={movie.id}
                id={movie.id}
                titulo={movie.titulo}
                type="movie"
                poster={movie.poster}
                backdrop={movie.backdrop}
                banner={movie.banner}
                rating={movie.rating}
                year={movie.year}
              />
            ))}
          </div>
        </section>
      )}

      {/* Seção de Séries */}
      {series.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">📺 Séries</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {series.map((serie) => (
              <ContentCard
                key={serie.id_n}
                id={serie.id_n}
                titulo={serie.titulo}
                type="series"
                capa={serie.capa}
                banner={serie.banner}
                poster={serie.poster}
                rating={serie.rating}
                year={serie.ano}
              />
            ))}
          </div>
        </section>
      )}

      {/* Se não houver conteúdo */}
      {movies.length === 0 && series.length === 0 && (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-gray-400">Nenhum conteúdo disponível</p>
            <p className="mt-2 text-sm text-gray-500">Verifique sua conexão com Supabase</p>
          </div>
        </div>
      )}
    </div>
  )
}
EOF

echo "   ✅ page.tsx atualizado com sucesso!"
echo ""

# Verificar se arquivo foi criado corretamente
echo "3️⃣  Verificando arquivo..."
if grep -q "useWebOSFocus" src/app/page.tsx; then
  echo "   ✅ useWebOSFocus importado e ativado"
else
  echo "   ❌ Erro: useWebOSFocus não encontrado"
  exit 1
fi

if grep -q "ContentCard" src/app/page.tsx; then
  echo "   ✅ ContentCard importado e usado"
else
  echo "   ❌ Erro: ContentCard não encontrado"
  exit 1
fi

if grep -q "getMovies\|getSeries" src/app/page.tsx; then
  echo "   ✅ Queries importadas"
else
  echo "   ❌ Erro: Queries não encontradas"
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PRONTO PARA DEPLOY!                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximo passo:"
echo "  npm run dev  (testar localmente)"
echo ""
echo "Ou faça deploy direto:"
echo "  git add ."
echo "  git commit -m \"feat: update page.tsx with webos support\""
echo "  git push origin main"
echo ""

