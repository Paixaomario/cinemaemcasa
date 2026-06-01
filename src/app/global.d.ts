declare module "*.css";

declare global {
  interface PerformanceEntry {
    [key: string]: any;
  }
}

export {};