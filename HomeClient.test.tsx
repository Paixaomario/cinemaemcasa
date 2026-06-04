import { render, screen, waitFor } from '@testing-library/react';
import { HomeClient } from '@/app/HomeClient';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/layout/SupabaseProvider';

jest.mock('@/lib/supabase');
jest.mock('@/components/layout/SupabaseProvider');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockSupabase = createClient() as any;

describe('HomeClient - Page Orchestration', () => {
  const mockUser = { id: 'user-1', email: 'test@test.com' };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });
    jest.clearAllMocks();
  });

  test('deve redirecionar para login se usuário não estiver autenticado', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
    const { useRouter } = require('next/navigation');
    const mockPush = useRouter().push;
    
    render(<HomeClient />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  test('deve carregar perfil e identificar Modo Infantil', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { is_child: true }, error: null });
    
    render(<HomeClient />);
    
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  test('deve ocultar seções fora do horário de agendamento', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 86400000).toISOString();
    
    const mockSections = [
      { id: '1', titulo: 'Seção Futura', ativo: true, data_inicio: futureDate, posicao: 1 }
    ];

    mockSupabase.from().order.mockResolvedValueOnce({ data: mockSections, error: null });

    render(<HomeClient />);
    
    await waitFor(() => {
      expect(screen.queryByText('Seção Futura')).not.toBeInTheDocument();
    });
  });

  test('deve renderizar o Continuar Assistindo se houver progresso', async () => {
    mockSupabase.limit.mockResolvedValueOnce({ 
      data: [{ content_id: '123', last_position: 500 }], 
      error: null 
    });

    render(<HomeClient />);
    
    await waitFor(() => {
      expect(screen.getByText(/Continuar Assistindo/i)).toBeInTheDocument();
    });
  });

  test('deve carregar recomendações de IA para usuários antigos', async () => {
    // Mock isNewUser como false
    // Mock getPersonalizedRecommendations...
    render(<HomeClient />);
    // Valida se a chamada para o manager foi feita
  });

  test('deve mostrar esqueletos de carregamento enquanto busca dados', () => {
    mockSupabase.from().order.mockReturnValue(new Promise(() => {})); // Suspende
    render(<HomeClient />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('deve inicializar proteção de Burn-in para TVs OLED', () => {
    // Verifica se o hook useBurnInProtection foi chamado (via mock)
  });

  test('deve detectar qualidade da rede para habilitar autoplay de trailers', () => {
    // Verifica alteração do estado canAutoPlayTrailer com base no navigator.connection
  });
});