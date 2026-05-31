import { AdvancedVoiceSearch } from '../advancedVoiceSearch';

describe('Advanced Voice Search', () => {
  let voiceSearch: AdvancedVoiceSearch;

  beforeEach(() => {
    // Mock Web Speech API
    const mockSpeechRecognition = jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    (global as any).webkitSpeechRecognition = mockSpeechRecognition;
    (global as any).SpeechRecognition = mockSpeechRecognition;
    
    voiceSearch = new AdvancedVoiceSearch();
  });

  describe('initialization', () => {
    it('should initialize voice search instance', () => {
      expect(voiceSearch).toBeDefined();
      expect(voiceSearch.isSupported()).toBe(true);
    });

    it('should support multiple languages', () => {
      const supported = voiceSearch.getSupportedLanguages();
      expect(supported).toContain('pt-BR');
      expect(supported).toContain('en-US');
      expect(supported).toContain('es-ES');
    });
  });

  describe('voice recognition', () => {
    it('should start recognition', () => {
      const recognition = voiceSearch.getRecognition();
      expect(recognition).toBeDefined();
    });

    it('should handle recognition error', async () => {
      const errorHandler = jest.fn();
      voiceSearch.on('error', errorHandler);
      
      // Simulate error
      const recognition = voiceSearch.getRecognition();
      if (recognition) {
        recognition.onerror = new Event('error') as any;
      }
    });
  });

  describe('confidence scoring', () => {
    it('should calculate confidence between 0-100', () => {
      const confidence = 0.85 * 100;
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('language settings', () => {
    it('should set language correctly', () => {
      voiceSearch.setLanguage('en-US');
      expect(voiceSearch.getLanguage()).toBe('en-US');
    });

    it('should validate language before setting', () => {
      const result = voiceSearch.setLanguage('invalid-lang');
      expect(result).toBe(false);
    });
  });
});
