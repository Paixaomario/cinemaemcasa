import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/app/search/Sidebar';
import { usePathname } from 'next/navigation';

// Mock do Next.js Navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Sidebar Component - Navigation & Accessibility', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  test('deve renderizar todos os itens essenciais do menu', () => {
    render(<Sidebar />);
    
    expect(screen.getByText(/Início/i)).toBeInTheDocument();
    expect(screen.getByText(/Pesquisar/i)).toBeInTheDocument();
    expect(screen.getByText(/Filmes/i)).toBeInTheDocument();
    expect(screen.getByText(/Séries/i)).toBeInTheDocument();
  });

  test('deve aplicar classe de destaque ao item da rota ativa', () => {
    (usePathname as jest.Mock).mockReturnValue('/search');
    render(<Sidebar />);
    
    const searchLink = screen.getByRole('link', { name: /pesquisar/i });
    // Verifica se a classe de cor da marca (brand-cyan) está presente no estado ativo
    expect(searchLink).toHaveClass('text-brand-cyan');
  });

  test('todos os links devem ser acessíveis via teclado (tabIndex=0)', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    
    links.forEach(link => {
      expect(link).toHaveAttribute('tabIndex', '0');
    });
  });

  test('deve exibir o logo com as propriedades de acessibilidade corretas', () => {
    render(<Sidebar />);
    const logo = screen.getByAltText(/Logo/i);
    expect(logo).toBeInTheDocument();
    // No Next.js Image, o src é processado, mas verificamos se existe
    expect(logo).toHaveAttribute('src');
  });
});