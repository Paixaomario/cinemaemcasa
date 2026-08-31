interface Ator {
  nome: string;
  personagem?: string;
  foto?: string;
}

interface Props {
  elenco: Ator[];
}

// Elenco principal com foto redonda + nome, em linha horizontal com
// rolagem — no lugar da lista de texto corrido de antes. Ator sem foto
// (nem do banco, nem do TMDB) mostra um círculo com a inicial do nome.
export function ElencoRow({ elenco }: Props) {
  if (elenco.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-[14px] md:text-[16px] text-white/70 mb-3">Elenco principal</p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {elenco.slice(0, 10).map((ator, idx) => (
          <div key={idx} className="flex flex-col items-center text-center shrink-0 w-[80px]">
            {ator.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ator.foto}
                alt={ator.nome}
                className="w-16 h-16 rounded-full object-cover mb-1.5"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-1.5 text-white/60 text-lg font-medium">
                {ator.nome.charAt(0)}
              </div>
            )}
            <p className="text-[11px] text-white/90 leading-tight line-clamp-2">{ator.nome}</p>
            {ator.personagem && (
              <p className="text-[10px] text-textmuted leading-tight line-clamp-1">{ator.personagem}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
