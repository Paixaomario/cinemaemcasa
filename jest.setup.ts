import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test or fallback to process env; provide dummy supabase vars for tests
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock Web Speech API
(window as any).SpeechRecognition = class SpeechRecognition {
  start() {}
  stop() {}
  abort() {}
  addEventListener() {}
  removeEventListener() {}
};

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({}),
    register: jest.fn(),
  },
  writable: true,
});
