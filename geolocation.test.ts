import { 
  getTimezoneRegion, 
  getRegionDisplay, 
  getLocationWithFallback,
  clearLocationCache,
  reverseGeocodeToCountry
} from '@/lib/geolocation';

describe('geolocation - Location Intelligence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
    // Mock fetch global para simular chamadas de API de geocodificação
    global.fetch = jest.fn();
  });

  describe('getTimezoneRegion', () => {
    test('deve retornar BR para America/Sao_Paulo', () => {
      const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: 'America/Sao_Paulo' })
      } as any));

      expect(getTimezoneRegion()).toBe('BR');
      spy.mockRestore();
    });

    test('deve retornar JP para Asia/Tokyo', () => {
      const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' })
      } as any));

      expect(getTimezoneRegion()).toBe('JP');
      spy.mockRestore();
    });
  });

  describe('getRegionDisplay', () => {
    test('deve retornar o nome amigável da região', () => {
      expect(getRegionDisplay('BR')).toBe('Brasil');
      expect(getRegionDisplay('US')).toBe('United States');
      expect(getRegionDisplay('KR')).toBe('Korea');
    });

    test('deve retornar o código se a região for desconhecida', () => {
      expect(getRegionDisplay('XX')).toBe('XX');
    });
  });

  describe('reverseGeocodeToCountry', () => {
    test('deve converter coordenadas em código de país via API Nominatim', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ address: { country_code: 'it' } })
      });

      const country = await reverseGeocodeToCountry(41.9028, 12.4964);
      expect(country).toBe('IT');
    });

    test('deve retornar null se a API falhar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const country = await reverseGeocodeToCountry(0, 0);
      expect(country).toBeNull();
    });
  });

  describe('getLocationWithFallback', () => {
    test('deve priorizar cache válido se disponível', async () => {
      const mockCache = {
        region: 'FR',
        timestamp: Date.now(),
        country: 'FR'
      };
      window.localStorage.setItem('cinema_location_latest', JSON.stringify(mockCache));

      const result = await getLocationWithFallback();
      expect(result.region).toBe('FR');
      expect(result.source).toBe('cache');
    });

    test('deve usar timezone como fallback final se GPS falhar', async () => {
      // Simula erro de permissão ou timeout no GPS
      (navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce((success, error) => {
        error();
      });

      const result = await getLocationWithFallback();
      expect(result.source).toBe('timezone');
      // O fallback padrão no mock é BR
      expect(result.region).toBe('BR');
    });
  });
});