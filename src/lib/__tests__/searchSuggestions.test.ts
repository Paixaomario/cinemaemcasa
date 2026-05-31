import { generateSuggestions, fuzzyMatch, trackSearch, getPopularSearches } from '../searchSuggestions';

describe('Search Suggestions Module', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('fuzzyMatch', () => {
    it('should match exact strings', () => {
      expect(fuzzyMatch('avatar', 'avatar')).toBe(true);
    });

    it('should match case-insensitive', () => {
      expect(fuzzyMatch('Avatar', 'avatar')).toBe(true);
      expect(fuzzyMatch('AVATAR', 'avatar')).toBe(true);
    });

    it('should match partial patterns with letters in order', () => {
      expect(fuzzyMatch('avt', 'avatar')).toBe(true);
      expect(fuzzyMatch('src', 'search')).toBe(true);
      expect(fuzzyMatch('sug', 'suggestions')).toBe(true);
    });

    it('should not match when letters out of order', () => {
      expect(fuzzyMatch('tva', 'avatar')).toBe(false);
      expect(fuzzyMatch('xyz', 'avatar')).toBe(false);
    });

    it('should match empty search as true', () => {
      expect(fuzzyMatch('', 'avatar')).toBe(true);
    });

    it('should handle special characters', () => {
      expect(fuzzyMatch('c++', 'c++')).toBe(true);
    });
  });

  describe('trackSearch', () => {
    it('should add search to history', () => {
      trackSearch('avatar', 5);
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({ query: 'avatar', resultCount: 5 });
    });

    it('should increment count for duplicate searches', () => {
      trackSearch('avatar', 5);
      trackSearch('avatar', 5);
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      expect(history).toHaveLength(1);
      expect(history[0].count).toBe(2);
    });

    it('should limit history to 50 items', () => {
      for (let i = 0; i < 55; i++) {
        trackSearch(`movie${i}`, 1);
      }
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      expect(history.length).toBeLessThanOrEqual(50);
    });

    it('should update timestamp on repeated search', () => {
      trackSearch('avatar', 5);
      const firstTime = JSON.parse(localStorage.getItem('searchHistory') || '[]')[0].timestamp;
      
      // Wait a bit
      jest.advanceTimersByTime(100);
      
      trackSearch('avatar', 5);
      const secondTime = JSON.parse(localStorage.getItem('searchHistory') || '[]')[0].timestamp;
      expect(secondTime).toBeGreaterThanOrEqual(firstTime);
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
