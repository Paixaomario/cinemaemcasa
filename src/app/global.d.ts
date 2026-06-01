declare module "*.css";

declare global {
  interface PerformanceEntry {
    renderTime: any;
    loadTime: any;
    processingStart: any;
  }
}

export {};