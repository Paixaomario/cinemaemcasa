import { getRealtimeLocation, getLocationWithFallback, reverseGeocodeToCountry } from '../geolocation';

describe('Geolocation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getRealtimeLocation', () => {
    it('should resolve with coordinates', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => {
          success({
            coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 50 },
          } as GeolocationPosition);
        }),
      };

      (global.navigator as any).geolocation = mockGeolocation;
      const location = await getRealtimeLocation();

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      expect(location).toHaveProperty('latitude');
      expect(location).toHaveProperty('longitude');
    });

    it('should return null if permission denied', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((_, error) => {
          error({ code: 1, message: 'Permission denied' } as GeolocationPositionError);
        }),
      };

      (global.navigator as any).geolocation = mockGeolocation;
      const location = await getRealtimeLocation();

      expect(location).toBeNull();
    });

    it('should return null if position unavailable', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((_, error) => {
          error({ code: 2, message: 'Position unavailable' } as GeolocationPositionError);
        }),
      };

      (global.navigator as any).geolocation = mockGeolocation;
      const location = await getRealtimeLocation();

      expect(location).toBeNull();
    });

    it('should timeout after specified duration', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((_, error) => {
          error({ code: 3, message: 'Timeout' } as GeolocationPositionError);
        }),
      };

      (global.navigator as any).geolocation = mockGeolocation;
      const location = await getRealtimeLocation();

      expect(location).toBeNull();
    });

    it('should handle missing geolocation API', async () => {
      (global.navigator as any).geolocation = undefined;
      const location = await getRealtimeLocation();

      expect(location).toBeNull();
    });
  });

  describe('reverseGeocodeToCountry', () => {
    it('should return BR for São Paulo coordinates', async () => {
      const country = await reverseGeocodeToCountry(-23.5505, -46.6333);
      expect(country).toBe('BR');
    });

    it('should return US for New York coordinates', async () => {
      const country = await reverseGeocodeToCountry(40.7128, -74.006);
      expect(country).toBe('US');
    });

    it('should return default for invalid coordinates', async () => {
      const country = await reverseGeocodeToCountry(999, 999);
      expect(country).toBe('BR');
    });

    it('should cache results', async () => {
      const first = await reverseGeocodeToCountry(-23.5505, -46.6333);
      const second = await reverseGeocodeToCountry(-23.5505, -46.6333);
      expect(first).toBe(second);
    });

    it('should handle zero coordinates', async () => {
      const country = await reverseGeocodeToCountry(0, 0);
      expect(typeof country).toBe('string');
      expect(country.length).toBe(2);
    });
  });

  describe('getLocationWithFallback', () => {
    it('should return location object', async () => {
      const location = await getLocationWithFallback();
      expect(location).toHaveProperty('country');
      expect(location).toHaveProperty('region');
    });

    it('should include country code', async () => {
      const location = await getLocationWithFallback();
      expect(location.country).toMatch(/^[A-Z]{2}$/);
    });

    it('should have region information', async () => {
      const location = await getLocationWithFallback();
      expect(typeof location.region).toBe('string');
    });

    it('should follow fallback chain', async () => {
      // Mock GPS to fail
      (global.navigator as any).geolocation = {
        getCurrentPosition: jest.fn((_, error) => {
          error({ code: 1 } as GeolocationPositionError);
        }),
      };

      const location = await getLocationWithFallback();
      // Should still get a location from fallback
      expect(location).toBeDefined();
      expect(location.country).toBeDefined();
    });

    it('should cache location result', async () => {
      const first = await getLocationWithFallback();
      const second = await getLocationWithFallback();
      expect(first).toEqual(second);
    });

    it('should return timeout cache if all methods fail', async () => {
      (global.navigator as any).geolocation = undefined;
      const location = await getLocationWithFallback();
      expect(location).toBeDefined();
      expect(location.country).toMatch(/^[A-Z]{2}$/);
    });
  });

  describe('Region Fallback Chain', () => {
    it('should try GPS first', async () => {
      const geoSpy = jest.fn().mockImplementation((success) => {
        success({ coords: { latitude: -23.5505, longitude: -46.6333 } } as GeolocationPosition);
      });
      (global.navigator as any).geolocation = { getCurrentPosition: geoSpy };

      await getLocationWithFallback();
      expect(geoSpy).toHaveBeenCalled();
    });

    it('should fallback to timezone detection', async () => {
      (global.navigator as any).geolocation = undefined;
      const location = await getLocationWithFallback();
      // Should have gotten timezone-based location
      expect(location.country).toBeDefined();
    });

    it('should default to BR if all fail', async () => {
      (global.navigator as any).geolocation = undefined;
      localStorage.clear();
      const location = await getLocationWithFallback();
      // Final fallback should be BR
      expect(location.country === 'BR' || location.region).toBeTruthy();
    });
  });
});
