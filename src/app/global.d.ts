declare module "*.css";

declare global {
  interface PerformanceEntry {
    renderTime?: number | null;
    loadTime?: number | null;
    processingStart?: number | null;
    startTime: number;
    duration: number;
  }
}
export {};