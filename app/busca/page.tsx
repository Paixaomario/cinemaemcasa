import { LiveSearch } from '@/components/LiveSearch';

// Agente da página de Busca: SEM banner hero (removido a pedido) — só
// o campo de pesquisa em tempo real, direto ao ponto.
export default function BuscaPage() {
  return (
    <div className="pt-8">
      <LiveSearch />
    </div>
  );
}
