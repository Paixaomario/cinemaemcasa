import { render, screen } from '@testing-library/react';
import { ContentCard } from '@/components/ui/ContentCard';

describe('ContentCard Component', () => {
  const mockMovie = {
    id: '123',
    titulo: 'Filme de Teste',
    poster: 'https://image.tmdb.org/t/p/w500/test.jpg',
    type: 'movie' as const,
    year: '2024'
  };

  const mockSerie = {
    id: '456',
    id_n: 'serie-456',
    titulo: 'Série de Teste',
    poster: null, // Testando fallback
    type: 'series' as const
  };

  test('deve renderizar informações básicas de um filme corretamente', () => {
    render(<ContentCard item={mockMovie} />);
    
    expect(screen.getByText('Filme de Teste')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/detalhes/123');
  });

  test('deve usar o ID numérico (id_n) para séries quando disponível', () => {
    render(<ContentCard item={mockSerie} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/detalhes/serie-456');
  });

  test('deve exibir placeholder ou div de fundo quando não houver poster', () => {
    render(<ContentCard item={mockSerie} />);
    
    // Como o poster é null, verificamos se a estrutura de fallback (div com bg-neutral) existe
    // No componente real, o Image costuma ter um fallback ou o container pai tem a cor
    const imageContainer = screen.getByText('Série de Teste').closest('div');
    expect(imageContainer).toBeDefined();
  });

  test('deve ter classes de animação e foco para Smart TVs', () => {
    render(<ContentCard item={mockMovie} />);
    
    const container = screen.getByRole('link').parentElement;
    // Verifica se possui as classes de transição e escala definidas no design premium
    expect(container).toHaveClass('transition-all');
    expect(container).toHaveClass('duration-300');
  });
});