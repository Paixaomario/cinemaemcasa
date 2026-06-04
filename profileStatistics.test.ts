import { updateProfileStatistics, getProfileStatistics } from '@/lib/profileStatistics';
import { createClient } from '@/lib/supabase';

const mockSupabase = createClient() as any;

describe('profileStatistics - Analytics Logic', () => {
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar estatísticas vazias se não houver histórico', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'view_progress') return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      if (table === 'profile_statistics') return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) };
      return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
    });

    const stats = await getProfileStatistics(userId);
    expect(stats).toEqual({});
  });

  test('deve calcular corretamente tempo, contagem de filmes e episódios', async () => {
    const mockHistory = [
      { content_id: 'movie-1', last_position: 3600, updated_at: '2026-06-01T10:00:00Z' }, // 1h filme
      { content_id: 'series-uuid-ep-1', last_position: 1200, updated_at: '2026-06-02T10:00:00Z' }, // 20min ep
      { content_id: 'series-uuid-ep-2', last_position: 1200, updated_at: '2026-06-03T10:00:00Z' }, // 20min ep
    ];

    const mockGenres = [
      { id: 'movie-1', genres: ['Ação', 'Sci-Fi'] },
      { id: 'series-uuid-ep-1', genres: ['Ação'] },
      { id: 'series-uuid-ep-2', genres: ['Ação'] },
    ];

    // Mock complexo para simular o fluxo de queries do Supabase
    mockSupabase.from.mockImplementation((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockImplementation(() => {
        if (table === 'view_progress') return Promise.resolve({ data: mockHistory });
        if (table === 'profile_statistics') return Promise.resolve({ data: null });
        if (table === 'content') return Promise.resolve({ data: mockGenres });
        return Promise.resolve({ data: null });
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
    }));

    await updateProfileStatistics(userId);

    // Verifica se o insert foi chamado com os cálculos corretos
    expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: userId,
      total_watch_time: 6000, // 3600 + 1200 + 1200
      movies_watched: 1,
      series_watched: 1, // 'series-uuid' extraído de dois episódios
      episodes_watched: 2,
      most_watched_genre: 'Ação'
    }));
  });

  test('deve identificar o gênero mais assistido corretamente', async () => {
    const mockHistory = [{ content_id: '1' }, { content_id: '2' }, { content_id: '3' }];
    const mockContentData = [
      { genres: ['Comédia', 'Drama'] },
      { genres: ['Terror'] },
      { genres: ['Comédia'] }
    ];

    mockSupabase.from.mockImplementation((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockImplementation(() => Promise.resolve({ data: mockContentData })),
      maybeSingle: jest.fn().mockImplementation(() => {
        if (table === 'view_progress') return Promise.resolve({ data: mockHistory });
        return Promise.resolve({ data: null });
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }));

    await updateProfileStatistics(userId);

    expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
      most_watched_genre: 'Comédia'
    }));
  });

  test('deve atualizar estatísticas existentes em vez de criar novas (Upsert)', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: mockHistoryData }); // history
    mockSupabase.in.mockResolvedValue({ data: [] }); // genres
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: 1 } }); // existing stats

    await updateProfileStatistics(userId);

    expect(mockSupabase.update).toHaveBeenCalled();
    expect(mockSupabase.insert).not.toHaveBeenCalled();
  });
});

const mockHistoryData = [{ content_id: 'test', last_position: 100, updated_at: '2026-01-01' }];