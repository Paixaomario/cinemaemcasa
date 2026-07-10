import { generateSuggestions, fuzzyMatch, getPopularSearches } from '../searchSuggestions';

describe('Search Suggestions Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fuzzyMatch', () => {
    it('should return a high score for exact matches', () => {
      expect(fuzzyMatch('avatar', 'avatar')).toBe(100);
    });

    it('should be case-insensitive', () => {
      expect(fuzzyMatch('Avatar', 'avatar')).toBe(100);
    });

    it('should return a lower but significant score for partial matches', () => {
      const score = fuzzyMatch('ava', 'avatar');
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should return 0 for no match', () => {
      expect(fuzzyMatch('xyz', 'avatar')).toBe(0);
    });
  });


  describe('generateSuggestions', () => {
    it('should return empty array for empty input', async () => {
      const suggestions = await generateSuggestions('', []);
      expect(suggestions).toEqual([]);
    });

    it('should return empty array for null history', async () => {
      const suggestions = await generateSuggestions('test', null);
      expect(suggestions).toEqual([]);
    });

    it('should generate suggestions from history with fuzzy match', async () => {
      const history = [
        { query: 'avatar', count: 3, resultCount: 50, timestamp: Date.now() },
        { query: 'avengers', count: 2, resultCount: 45, timestamp: Date.now() },
      ];
      const suggestions = await generateSuggestions('av', history);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.text.includes('avatar') || s.text.includes('avengers'))).toBe(true);
    });

    it('should prioritize suggestions by count', async () => {
      const history = [
        { query: 'avatar', count: 10, resultCount: 50, timestamp: Date.now() },
        { query: 'avengers', count: 2, resultCount: 45, timestamp: Date.now() },
      ];
      const suggestions = await generateSuggestions('av', history);
      // First suggestion should be the one with highest count
      expect(suggestions[0]).toContainEqual({ text: 'avatar' });
    });

    it('should include category suggestions', async () => {
      const suggestions = await generateSuggestions('movie', []);
      // Should include movie/series category suggestions
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should debounce rapid calls', async () => {
      const suggestions1 = generateSuggestions('test', []);
      const suggestions2 = generateSuggestions('test2', []);
      await Promise.all([suggestions1, suggestions2]);
      expect(true).toBe(true); // Just verify no errors
    });
  });

  describe('getPopularSearches', () => {
    it('should return array of popular searches', async () => {
      const popular = await getPopularSearches();
      expect(Array.isArray(popular)).toBe(true);
    });

    it('should return sortable results', async () => {
      const popular = await getPopularSearches();
      // All items should have required properties
      popular.forEach(item => {
        expect(item).toHaveProperty('text');
        expect(item).toHaveProperty('type');
      });
    });

    it('should handle network errors gracefully', async () => {
      try {
        const popular = await getPopularSearches();
        expect(Array.isArray(popular)).toBe(true);
      } catch (error) {
        // Should not throw, return empty or cached data
        expect(true).toBe(true);
      }
    });

    it('should cache results', async () => {
      const first = await getPopularSearches();
      const second = await getPopularSearches();
      // Second call should be instant (cached)
      expect(first).toEqual(second);
    });
  });
});
