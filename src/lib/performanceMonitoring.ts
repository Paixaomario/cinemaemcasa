/**
 * Performance Monitoring Utilities
 * Track LCP, FID, CLS metrics
 */

interface PerformanceMetrics {
  lcp: any;
  fid: any;
  cls: any;
  ttfb: any;
  fcp: any;
}

export const performanceMetrics: PerformanceMetrics = {
  lcp: null,
  fid: null,
  cls: null,
  ttfb: null,
  fcp: null,
};

/**
 * Initialize Web Vitals monitoring
 */
export function initializeMetrics(): void {
  if (typeof window === 'undefined') return;

  // LCP - Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        // Fallback seguro para evitar o erro de build da Vercel
        performanceMetrics.lcp = lastEntry?.renderTime || lastEntry?.loadTime || 0;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // CLS - Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            performanceMetrics.cls = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // FCP - First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            performanceMetrics.fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer not supported');
    }
  }

  // TTFB - Time to First Byte
  if ('PerformanceTiming' in window) {
    performanceMetrics.ttfb =
      (window.performance as any).timing.responseStart -
      (window.performance as any).timing.navigationStart;
  }
}

/**
 * Report metrics for analytics
 */
export function reportMetrics(): void {
  if (typeof window === 'undefined') return;

  console.log('📊 Performance Metrics:');
  console.log(`  LCP: ${performanceMetrics.lcp?.toFixed(2)}ms`);
  console.log(`  FCP: ${performanceMetrics.fcp?.toFixed(2)}ms`);
  console.log(`  CLS: ${performanceMetrics.cls?.toFixed(3)}`);
  console.log(`  TTFB: ${performanceMetrics.ttfb?.toFixed(2)}ms`);

  // Send to analytics if available
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'web_vitals', {
      lcp: performanceMetrics.lcp,
      fcp: performanceMetrics.fcp,
      cls: performanceMetrics.cls,
      ttfb: performanceMetrics.ttfb,
    });
  }
}

/**
 * Check if metrics meet targets
 */
export function checkTargets(): {
  lcp_ok: boolean;
  fcp_ok: boolean;
  cls_ok: boolean;
} {
  return {
    lcp_ok: performanceMetrics.lcp === null || performanceMetrics.lcp < 2500,
    fcp_ok: performanceMetrics.fcp === null || performanceMetrics.fcp < 1800,
    cls_ok: performanceMetrics.cls === null || performanceMetrics.cls < 0.1,
  };
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  if (window.document.readyState === 'loading') {
    window.document.addEventListener('DOMContentLoaded', initializeMetrics);
  } else {
    initializeMetrics();
  }
}
