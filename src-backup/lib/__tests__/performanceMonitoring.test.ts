import { initializeMetrics, reportMetrics, checkTargets, performanceMetrics } from '../performanceMonitoring';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMetrics.lcp = null;
    performanceMetrics.fid = null;
    performanceMetrics.cls = null;
    performanceMetrics.ttfb = null;
    performanceMetrics.fcp = null;
  });

  describe('initializeMetrics', () => {
    it('should initialize without errors', () => {
      expect(() => initializeMetrics()).not.toThrow();
    });

    it('should not fail if PerformanceObserver not available', () => {
      delete (window as any).PerformanceObserver;
      expect(() => initializeMetrics()).not.toThrow();
    });
  });

  describe('reportMetrics', () => {
    it('should log metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      performanceMetrics.lcp = 1500;
      performanceMetrics.cls = 0.05;
      
      reportMetrics();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle missing gtag', () => {
      expect(() => reportMetrics()).not.toThrow();
    });
  });

  describe('checkTargets', () => {
    it('should pass LCP target when < 2500ms', () => {
      performanceMetrics.lcp = 2000;
      const targets = checkTargets();
      expect(targets.lcp_ok).toBe(true);
    });

    it('should fail LCP target when > 2500ms', () => {
      performanceMetrics.lcp = 3000;
      const targets = checkTargets();
      expect(targets.lcp_ok).toBe(false);
    });

    it('should pass FCP target when < 1800ms', () => {
      performanceMetrics.fcp = 1500;
      const targets = checkTargets();
      expect(targets.fcp_ok).toBe(true);
    });

    it('should fail FCP target when > 1800ms', () => {
      performanceMetrics.fcp = 2000;
      const targets = checkTargets();
      expect(targets.fcp_ok).toBe(false);
    });

    it('should pass CLS target when < 0.1', () => {
      performanceMetrics.cls = 0.08;
      const targets = checkTargets();
      expect(targets.cls_ok).toBe(true);
    });

    it('should fail CLS target when > 0.1', () => {
      performanceMetrics.cls = 0.15;
      const targets = checkTargets();
      expect(targets.cls_ok).toBe(false);
    });

    it('should pass null metrics', () => {
      const targets = checkTargets();
      expect(targets.lcp_ok).toBe(true);
      expect(targets.fcp_ok).toBe(true);
      expect(targets.cls_ok).toBe(true);
    });
  });

  describe('Metrics Object', () => {
    it('should have all required fields', () => {
      expect(performanceMetrics).toHaveProperty('lcp');
      expect(performanceMetrics).toHaveProperty('fid');
      expect(performanceMetrics).toHaveProperty('cls');
      expect(performanceMetrics).toHaveProperty('ttfb');
      expect(performanceMetrics).toHaveProperty('fcp');
    });

    it('should initialize with null values', () => {
      expect(performanceMetrics.lcp).toBeNull();
      expect(performanceMetrics.cls).toBeNull();
    });

    it('should allow values to be set', () => {
      performanceMetrics.lcp = 1500;
      performanceMetrics.cls = 0.05;
      
      expect(performanceMetrics.lcp).toBe(1500);
      expect(performanceMetrics.cls).toBe(0.05);
    });
  });
});
