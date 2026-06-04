import { detectDeviceType, detectDeviceName, getViewportMetadata } from '@/lib/deviceManager';

describe('deviceManager - Platform Intelligence', () => {
  describe('detectDeviceType', () => {
    test('deve detectar Smart TVs corretamente', () => {
      const webOSUA = 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager';
      const tizenUA = 'Mozilla/5.0 (Linux; Tizen 5.0; TV) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.111 TV Safari/537.36';
      
      expect(detectDeviceType(webOSUA)).toBe('tv');
      expect(detectDeviceType(tizenUA)).toBe('tv');
    });

    test('deve detectar dispositivos móveis', () => {
      const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
      expect(detectDeviceType(iPhoneUA)).toBe('mobile');
    });

    test('deve detectar consoles de jogos', () => {
      const ps5UA = 'Mozilla/5.0 (PlayStation 5 3.10) AppleWebKit/605.1.15 (KHTML, like Gecko) Java/1.16';
      expect(detectDeviceType(ps5UA)).toBe('console');
    });
  });

  describe('detectDeviceName', () => {
    test('deve retornar o nome amigável do sistema', () => {
      expect(detectDeviceName('Windows NT 10.0; Win64; x64')).toBe('Windows PC');
      expect(detectDeviceName('Macintosh; Intel Mac OS X 10_15_7')).toBe('Mac');
      expect(detectDeviceName('iPhone; CPU iPhone OS 14_4')).toBe('iPhone');
    });
  });

  describe('getViewportMetadata', () => {
    test('deve detectar telas grandes (Big Screen)', () => {
      // Mock das propriedades da janela
      Object.defineProperty(window, 'innerWidth', { value: 3840, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 2160, writable: true });
      Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });

      const meta = getViewportMetadata();
      expect(meta.isBigScreen).toBe(true);
    });

    test('deve calcular aspect ratio corretamente', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
      
      const meta = getViewportMetadata();
      expect(meta.aspectRatio).toBeCloseTo(1.77, 1);
    });
  });
});