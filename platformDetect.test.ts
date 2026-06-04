import { detectDeviceType } from '@/lib/deviceManager';

describe('Platform Detection - Multi-Device Support', () => {
  test('deve identificar LG WebOS via User Agent', () => {
    const webOSUA = 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36';
    expect(detectDeviceType(webOSUA)).toBe('tv');
  });

  test('deve identificar Samsung Tizen via User Agent', () => {
    const tizenUA = 'Mozilla/5.0 (Linux; Tizen 5.0; TV) AppleWebKit/537.36';
    expect(detectDeviceType(tizenUA)).toBe('tv');
  });

  test('deve identificar Roku via User Agent', () => {
    const rokuUA = 'Mozilla/5.0 (Roku; AppName)';
    expect(detectDeviceType(rokuUA)).toBe('tv');
  });

  test('deve identificar iPad como tablet', () => {
    const ipadUA = 'Mozilla/5.0 (iPad; CPU OS 13_0 like Mac OS X)';
    expect(detectDeviceType(ipadUA)).toBe('tablet');
  });

  test('deve identificar Android Phone como mobile', () => {
    const androidUA = 'Mozilla/5.0 (Linux; Android 10; SM-G973F)';
    expect(detectDeviceType(androidUA)).toBe('mobile');
  });

  test('deve identificar PlayStation 5 como console', () => {
    const ps5UA = 'Mozilla/5.0 (PlayStation 5 3.10)';
    expect(detectDeviceType(ps5UA)).toBe('console');
  });

  test('deve retornar desktop para agentes desconhecidos em telas grandes', () => {
    expect(detectDeviceType('Mozilla/5.0 (Windows NT 10.0)')).toBe('desktop');
  });
});