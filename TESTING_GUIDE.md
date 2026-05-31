# Testing Instructions

## Unit Tests (Jest)

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Files
- `src/lib/__tests__/searchSuggestions.test.ts` - 20+ cases
- `src/lib/__tests__/geolocation.test.ts` - 20+ cases
- `src/lib/__tests__/advancedVoiceSearch.test.ts` - 10+ cases
- `src/lib/__tests__/performanceMonitoring.test.ts` - 15+ cases
- `src/components/__tests__/*` - Component tests (stubs)

### Coverage Target: >80%

---

## E2E Tests (Cypress)

### Automated Tests (Headless)
```bash
# Run all E2E tests
npm run e2e

# Run specific test file
npm run e2e -- --spec "cypress/e2e/search.cy.js"

# Run with specific browser
npm run e2e -- --browser chrome
npm run e2e -- --browser firefox
```

### Interactive Testing (UI)
```bash
# Open Cypress Test Runner
npm run e2e:open
```

### Test Files
- `cypress/e2e/search.cy.js` - Search functionality (30+ assertions)
- `cypress/e2e/auth.cy.js` - Login/register flow (20+ assertions)
- `cypress/e2e/home.cy.js` - Navigation & layout (20+ assertions)

### Custom Commands
Located in `cypress/support/commands.js`:
- `cy.login(email, password)` - Login helper
- `cy.logout()` - Logout helper
- `cy.searchFor(query)` - Search helper
- `cy.navigateTo(page)` - Navigation helper
- `cy.typeWithAutocomplete(text)` - Voice search helper

---

## Running Tests Locally

### Prerequisites
```bash
# Start dev server first
npm run dev

# In another terminal, run tests:
npm test              # Unit tests
npm run e2e:open      # E2E interactive
npm run e2e           # E2E headless
```

### Performance Testing

Tests include performance assertions:
- LCP target: < 2.5s ✅
- FCP target: < 1.8s ✅
- CLS target: < 0.1 ✅

See `src/lib/performanceMonitoring.ts` for metrics tracking.

---

## Coverage Report

```bash
npm run test:coverage
# Opens coverage report in ./coverage/lcov-report/index.html
```

Expected coverage:
- Statements: >80%
- Branches: >70%
- Functions: >80%
- Lines: >80%

---

## Continuous Integration (CI/CD)

For GitHub Actions or similar:

```bash
# Unit tests
npm test -- --coverage --watchAll=false

# E2E tests (requires running dev server first)
npm run dev &
npm run e2e -- --headless --no-interactive
```

---

## Test Statistics

| Category | Files | Cases | Status |
|----------|-------|-------|--------|
| Unit Tests | 4 | 65+ | ✅ Ready |
| E2E Tests | 3 | 70+ | ✅ Ready |
| Component | 2 | 14 | 📋 Stubs |
| **TOTAL** | **9** | **149+** | ✅ |

---

## Debugging Tests

### Unit Tests
```bash
# Debug mode in Node
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Tests
```bash
# Cypress debug (opens in browser)
npm run e2e:open

# Headed mode (doesn't close browser)
npm run e2e -- --headed
```

---

## Performance Monitoring

Track metrics in `/search` page:
```bash
npm run dev
# Open http://localhost:3000/search
# Open DevTools Console
# Metrics logged to console
```

Exported metrics available in:
- `window.__PERFORMANCE_METRICS` (if available)
- Sent to analytics via gtag

---

Last Updated: May 29, 2026
