declare module "*.css";

declare global {
  interface PerformanceEntry {
    renderTime: number | null;
    loadTime: number | null;
    processingStart: number | null;
  }
}

export {};