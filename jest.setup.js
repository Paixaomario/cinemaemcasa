import '@testing-library/jest-dom'

// Mock do IntersectionObserver (comum em carrosséis e banners)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {} observe() {} unobserve() {} disconnect() {}
}