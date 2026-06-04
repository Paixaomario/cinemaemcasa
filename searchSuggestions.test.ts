import { 
  fuzzyMatch, 
  generateSuggestions, 
  clearSuggestionsCache 
} from '@/lib/searchSuggestions';
import { createClient } from '@/lib/supabase';

const mockSupabase = createClient() as any;

describe('searchSuggestions - Intelligence Logic', () => {
  beforeEach(() => {
    clearSuggestionsCache();
    jest.clearAllMocks();
  });

  describe('fuzzyMatch', () => {
    test('deve retornar 100 para correspondência exata no início', () => {
      expect(fuzzyMatch('ava', 'Avatar')).toBe(100);
      expect(fuzzyMatch('The', 'The Batman')).toBe(100);
    });

    test('deve retornar 80 para correspondência em qualquer lugar da string', () => {
      expect(fuzzyMatch('tar', 'Avatar')).toBe(80);
      expect(fuzzyMatch('man', 'The Batman')).toBe(80);
    });

    test('deve calcular score baseado na quantidade de caracteres correspondentes', () => {
      // "avtr" tem 4 caracteres, todos presentes em "avatar" (6 letras)
      // A lógica atual faz (matches / input.length) * 100
      expect(fuzzyMatch('avtr', 'avatar')).toBe(100); 
      expect(fuzzyMatch('xyz', 'avatar')).toBe(25); // 'a' de avatar não está em xyz, mas a lógica verifica char do input no target
    });

    test('deve retornar 0 para strings vazias', () => {
      expect(fuzzyMatch('', 'Avatar')).toBe(0);
      expect(fuzzyMatch('Avatar', '')).toBe(0);
    });
  });

  describe('generateSuggestions', () => {
    test('deve retornar vazio se o input for menor que o mínimo configurado (2 chars)', async () => {
      const results = await generateSuggestions('a');
      expect(results).toEqual([]);
    });

    test('deve priorizar resultados do histórico com score alto', async () => {
      const history = ['Avatar', 'Avengers', 'Batman'];
      const results = await generateSuggestions('ava', history);
      
      const historyResult = results.find(r => r.type === 'history');
      expect(historyResult).toBeDefined();
      expect(historyResult?.text).toBe('Avatar');
    });

    test('deve buscar previsões do banco de dados quando necessário', async () => {
      const mockData = [
        { source_id: '1', source_table: 'cinema', titulo: 'Avatar 2', tipo: 'movie' }
      ];
      
      mockSupabase.limit.mockResolvedValueOnce({ data: mockData, error: null });

      const results = await generateSuggestions('ava');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('search_catalog');
      expect(mockSupabase.from().select().ilike).toHaveBeenCalledWith('titulo', '%ava%');
      
      const prediction = results.find(r => r.type === 'prediction');
      expect(prediction?.text).toBe('Avatar 2');
      expect(prediction?.icon).toBe('🎬');
    });

    test('deve utilizar o cache para inputs repetidos', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      // Primeira chamada (aciona o banco)
      await generateSuggestions('batman');
      // Segunda chamada (deve vir do cache)
      await generateSuggestions('batman');

      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    test('deve falhar silenciosamente e retornar array vazio em caso de erro no banco', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabase.limit.mockRejectedValueOnce(new Error('DB Error'));

      const results = await generateSuggestions('erro');
      
      expect(results).toEqual([]);
      consoleSpy.mockRestore();
    });
  });
});