import { 
  initializeContentSession, 
  getDisplayedCache, 
  addBatchToDisplayedCache,
  getTrendingContent 
} from '@/lib/homeContentManager';
import { createClient } from '@/lib/supabase';

const mockSupabase = createClient() as any;

describe('homeContentManager - Core Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('deve inicializar e gerenciar o cache de exibição corretamente', () => {
    initializeContentSession();
    addBatchToDisplayedCache(['movie-1', 'movie-2']);
    
    const cache = getDisplayedCache();
    expect(cache.has('movie-1')).toBe(true);
    expect(cache.has('movie-2')).toBe(true);
    expect(cache.size).toBe(2);
  });

  test('filtro isChild deve aplicar restrições de categoria no Supabase', async () => {
    // Configura o mock para retornar dados vazios mas capturar a query
    mockSupabase.maybeSingle.mockResolvedValue({ data: [], error: null });
    
    await getTrendingContent(10, true); // isChild = true

    // Verifica se os filtros de restrição foram chamados
    expect(mockSupabase.from).toHaveBeenCalledWith('cinema');
    // O código usa .filter() para o trending em modo child
    expect(mockSupabase.from().select().filter).toHaveBeenCalledWith(
      'category', 'not.ilike', '%+18%'
    );
  });

  test('deve remover duplicatas por título mantendo a integridade', () => {
    // Testando a lógica interna de remoção de duplicatas indiretamente
    // através de um mock de dados retornados
    mockSupabase.limit.mockImplementationOnce(() => Promise.resolve({
      data: [
        { id: 1, titulo: 'Avatar', rating: 9 },
        { id: 2, titulo: 'avatar', rating: 8 } // Duplicata case-insensitive
      ],
      error: null
    }));

    // Mock para a tabela series (retornando vazio)
    mockSupabase.limit.mockImplementationOnce(() => Promise.resolve({ data: [], error: null }));

    return getTrendingContent(10).then(items => {
      expect(items.length).toBe(1);
      expect(items[0].titulo).toBe('Avatar');
    });
  });

  test('sessão deve expirar após 1 hora', () => {
    const oneHourAgo = Date.now() - (61 * 60 * 1000);
    
    // Força uma sessão antiga no localStorage
    window.localStorage.setItem('home_session_start', oneHourAgo.toString());
    window.localStorage.setItem('home_content_cache', JSON.stringify(['old-id']));

    // Ao tentar adicionar novo item, o sistema deve resetar o cache
    addBatchToDisplayedCache(['new-id']);
    
    const cache = getDisplayedCache();
    expect(cache.has('old-id')).toBe(false);
    expect(cache.has('new-id')).toBe(true);
  });
});