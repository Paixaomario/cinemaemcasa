import Link from 'next/link'
import Image from 'next/image'

// Tipagem para o item do banner
interface HeroItem {
  id: string | number
  id_n?: string | number
  titulo: string
  sinopse?: string
  banner?: string
  logo?: string // Campo para o logo do título (importante para o estilo Netflix)
  type: 'movie' | 'series'
}

interface HeroBannerProps {
  item: HeroItem | null
}

function getItemId(item: HeroItem) {
  return item.type === 'series' ? item.id_n ?? item.id : item.id
}

export function HeroBanner({ item }: HeroBannerProps) {
  if (!item) {
    // Fallback elegante se nenhum item for fornecido
    return (
      <section className="relative flex h-[56.25vw] min-h-[300px] max-h-[80vh] w-full items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Não foi possível carregar o destaque.</p>
      </section>
    )
  }

  const href = `/detalhes/${getItemId(item)}`

  return (
    <section className="relative h-[56.25vw] min-h-[400px] max-h-[85vh] w-full">
      {/* Imagem de Fundo */}
      <div className="absolute inset-0">
        {item.banner && (
          <Image
            src={item.banner}
            alt={`Banner de ${item.titulo}`}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Gradiente para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />

      {/* Conteúdo do Banner */}
      <div className="relative z-10 mx-auto flex h-full max-w-full flex-col justify-end px-4 pb-[10%] md:px-16 md:pb-[8%] lg:pl-[calc(80px+4rem)] lg:pr-16">
        <div className="w-full max-w-lg">
          {/* Logo do Título (preferencial) ou Texto */}
          {item.logo ? (
            <Image
              src={item.logo}
              alt={`Logo de ${item.titulo}`}
              width={400}
              height={150}
              className="h-auto w-2/3 object-contain drop-shadow-lg"
            />
          ) : (
            <h1 className="text-4xl font-extrabold text-white drop-shadow-lg md:text-6xl">
              {item.titulo}
            </h1>
          )}

          {/* Sinopse */}
          <p className="mt-4 line-clamp-2 text-sm text-white/90 drop-shadow-md md:text-lg">
            {item.sinopse || 'Conteúdo em destaque no catálogo.'}
          </p>
        </div>
      </div>
    </section>
  )
}