declare module "*.css";

declare global {
  interface PerformanceEntry {
    readonly renderTime?: number;
    readonly loadTime?: number;
    readonly processingStart?: number;
  }
}

export {};