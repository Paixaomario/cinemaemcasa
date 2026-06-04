import '@testing-library/jest-dom';

// Mock do LocalStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do Supabase Client
jest.mock('@/lib/supabase', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    or: jest.fn().mockReturnThis(),
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
    },
  }),
}));

// Mock do Navigator para detecção de rede e voz
Object.defineProperty(window, 'navigator', {
  value: {
    connection: { saveData: false, type: 'wifi', effectiveType: '4g' },
    geolocation: { getCurrentPosition: jest.fn(), watchPosition: jest.fn() }
  },
  configurable: true
});