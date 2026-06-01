declare module "*.css";

declare global {
  interface PerformanceEntry {
    renderTime?: number;
    loadTime?: number;
    processingStart?: number;
  }
}

export {};