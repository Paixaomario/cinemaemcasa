import { hydrateCinemaItem } from '@/lib/content';
import * as tmdb from '@/lib/tmdb';

jest.mock('@/lib/tmdb');

describe('content - Data Hydration', () => {
  const sb = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve hidratar conteúdo via UUID (tabela content) com fallback TMDB', async () => {
    const mockContent = { id: 'uuid-1', tmdb_id: 123, type: 'movie', title: 'Oppenheimer' };
    const mockTmdb = { title: 'Oppenheimer', poster_path: '/path.jpg', backdrop_path: '/back.jpg' };

    sb.maybeSingle.mockResolvedValue({ data: mockContent, error: null });
    (tmdb.getMovieDetails as jest.Mock).mockResolvedValue(mockTmdb);

    const result = await hydrateCinemaItem(sb, 'uuid-1');

    expect(result?.titulo).toBe('Oppenheimer');
    expect(result?.backdrop).toContain('original'); // Valida otimização de qualidade
    expect(result?.type).toBe('movie');
  });

  test('deve lidar com falhas no TMDB retornando os dados locais do Supabase', async () => {
    const mockLocal = { id: 'uuid-2', title: 'Local Movie', poster: '/local.png' };
    
    sb.maybeSingle.mockResolvedValue({ data: mockLocal, error: null });
    (tmdb.getMovieDetails as jest.Mock).mockRejectedValue(new Error('TMDB Offline'));

    const result = await hydrateCinemaItem(sb, 'uuid-2');

    expect(result?.titulo).toBe('Local Movie');
    expect(result?.poster).toBe('/local.png');
  });

  test('deve suportar formato legado tipo-id', async () => {
    const mockTmdb = { name: 'The Boys', poster_path: '/boys.jpg' };
    
    // Simula que não encontrou na tabela content
    sb.maybeSingle.mockResolvedValue({ data: null, error: null });
    (tmdb.getShowDetails as jest.Mock).mockResolvedValue(mockTmdb);

    const result = await hydrateCinemaItem(sb, 'serie-123');

    expect(tmdb.getShowDetails).toHaveBeenCalledWith('123');
    expect(result?.type).toBe('serie');
    expect(result?.titulo).toBe('The Boys');
  });
});