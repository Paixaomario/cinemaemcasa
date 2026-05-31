# 🎬 CRONOGRAMA PROFISSIONAL: Cinema em Casa v2.0
## Busca Profissional + Suporte Multi-Plataforma (8 semanas)

**Versão:** 1.0  
**Data Início:** 28 de Maio de 2026  
**Data Conclusão:** 23 de Julho de 2026  
**Status:** 🟢 ATIVO  
**Prioridade:** P0 (Crítica)

---

# 📊 VISÃO GERAL DO PROJETO

## Objetivo Final
Sistema **100% profissional** em:
- ✅ 8+ plataformas (Desktop, Mobile, TV, WebOS, Samsung, Roku, FireStick, etc)
- ✅ 4+ SOs (Windows, Linux, macOS, Android, iOS)
- ✅ Zero downtime deployment
- ✅ Testes automatizados (Unit + E2E + Performance)
- ✅ Monitoramento 24/7
- ✅ Documentação completa para manutenção

## Constraints (OURO)
```
🔴 NUNCA tirar o sistema do ar
🔴 NUNCA danificar dados de usuários
🔴 NUNCA deixar projeto incompleto/abandonado
🔴 NUNCA se perder no meio do caminho
📋 Documentar TUDO (para entender depois)
```

---

# 📅 SEMANA 1: Foundation & Database (28 Mai - 3 Jun)

## ✅ Dia 1-2: Database & Build Fix (28-29 Mai)

### Checklist
- [x] Resolver erro `generateStaticParams` (FEITO)
- [ ] Deploy SQL migration (sem Supabase CLI)
- [ ] Build validation `npm run build`
- [ ] Testes locais `npm run dev`

### SQL Deploy (SEM Supabase CLI)

**Opção 1: Supabase Dashboard**
```
1. Abrir https://supabase.com/dashboard
2. Selecionar projeto Cinema em Casa
3. SQL Editor → New Query
4. Copiar conteúdo de: supabase/migrations/018_search_analytics.sql
5. Executar
6. Verificar: SELECT COUNT(*) FROM search_analytics;
```

**Opção 2: pgAdmin (se tiver acesso)** 
```
1. Conectar com PostgreSQL
2. Execute SQL:
   CREATE TABLE search_analytics (...)
   CREATE TABLE user_search_history (...)
```

**Verificação:**
```sql
-- Testar tabelas
SELECT COUNT(*) FROM search_analytics;
SELECT COUNT(*) FROM user_search_history;

-- Testar RLS
SELECT * FROM search_analytics;  -- Deve retornar linhas
SELECT * FROM user_search_history;  -- RLS deve aplicar
```

### Build Validation
```bash
# 1. Clean build
rm -rf .next
npm run build

# Expected: ✓ next build && next export completed
# No errors in: search pages, search components

# 2. File size check
du -sh .next/
# Expected: < 100MB total

# 3. Local test
npm run dev
# Go to: http://localhost:3000/search
# Test: Type "Avatar" → Suggestions appear
```

**Estimativa:** 2-4 horas  
**Owner:** Dev Principal  
**Blocker:** Nenhum (usar Dashboard Supabase)

---

## ✅ Dia 3-4: Unit Tests Setup (31 Mai - 1 Jun)

### Test Framework Setup
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev ts-jest @types/jest
```

### Criar Estrutura
```
src/__tests__/
├── lib/
│   ├── searchSuggestions.test.ts
│   ├── geolocation.test.ts
│   └── advancedVoiceSearch.test.ts
└── components/
    ├── SearchSuggestions.test.tsx
    └── VoiceSearchButton.test.tsx
```

### Jest Config (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
```

### Initial Tests (Scaffolding Only)
```typescript
// src/__tests__/lib/searchSuggestions.test.ts
describe('searchSuggestions', () => {
  test('generateSuggestions returns array', () => {
    expect(Array.isArray([])).toBe(true);
  });
});
```

**Run:**
```bash
npm run test -- --coverage
# Expected: 0% coverage (will grow)
```

**Estimativa:** 2-3 horas  
**Owner:** QA Engineer  
**Deliverable:** `jest.config.js` + scaffolding tests

---

## ✅ Dia 5-7: Performance Baseline (2-3 Jun)

### Web Vitals Baseline
```bash
npm install --save-dev @web-vitals

# Measure locally
npm run dev
# Open DevTools → Lighthouse
# Record: LCP, FID, CLS scores
```

### Documentar (IMPORTANTE!)
Create: `PERFORMANCE_BASELINE.md`
```markdown
# Performance Baseline - 28 Mai 2026

## Metrics (Local Dev)
- LCP: XXms
- FID: XXms
- CLS: XX
- Build time: XXs
- Page load: XXms

## Thresholds (Production)
- LCP: < 2.5s ✅
- FID: < 100ms ✅
- CLS: < 0.1 ✅
```

**Estimativa:** 1-2 horas  
**Deliverable:** Performance baseline doc

---

# 📅 SEMANA 2: Unit Tests Complete (4-10 Jun)

## ✅ Tests para 3 Módulos Lib

### Módulo 1: `searchSuggestions.test.ts` (20 testes)
```typescript
describe('searchSuggestions', () => {
  describe('generateSuggestions', () => {
    test('returns 4-layer suggestions', () => {
      // Test: History → Categories → Popular → Predictions
    });
    
    test('respects query length limit', () => {
      // Test: Queries > 100 chars blocked
    });
    
    // 17 mais testes...
  });
  
  describe('fuzzyMatch', () => {
    test('matches with 60%+ relevancy', () => {
      expect(fuzzyMatch('Avatar', 'avatr')).toBeGreaterThanOrEqual(0.6);
    });
  });
});
```

### Módulo 2: `geolocation.test.ts` (15 testes)
```typescript
describe('geolocation', () => {
  describe('getRealtimeLocation', () => {
    test('returns lat/lon when GPS available', async () => {
      // Mock GPS
      const location = await getRealtimeLocation();
      expect(location).toHaveProperty('latitude');
      expect(location).toHaveProperty('longitude');
    });
  });
  
  describe('5-level fallback', () => {
    test('falls back to timezone when GPS fails', () => {
      // Test fallback chain
    });
  });
});
```

### Módulo 3: `advancedVoiceSearch.test.ts` (15 testes)
```typescript
describe('AdvancedVoiceSearch', () => {
  test('initializes Web Speech API', () => {
    const vs = new AdvancedVoiceSearch();
    expect(vs.isSupported()).toBe(true);
  });
  
  test('tracks confidence scores', () => {
    // Test: Result > 80% confidence
  });
});
```

### Coverage Target
```bash
npm run test -- --coverage

# Expected Coverage
- searchSuggestions.ts: > 85%
- geolocation.ts: > 80%
- advancedVoiceSearch.ts: > 75%
- Overall: > 80%
```

**Estimativa:** 3-4 dias  
**Owner:** QA Engineer  
**Deliverable:** 50+ tests, > 80% coverage

---

## ✅ Component Tests (2 componentes)

### `SearchSuggestions.test.tsx` (12 testes)
```typescript
describe('SearchSuggestions', () => {
  test('renders dropdown when input focused', () => {
    render(<SearchSuggestions input="avatar" />);
    expect(screen.getByRole('listbox')).toBeVisible();
  });
  
  test('D-Pad navigation works', () => {
    // Simulate D-Pad: ↓ ↓ Enter
    fireEvent.keyDown(window, { keyCode: 40 }); // Down
    fireEvent.keyDown(window, { keyCode: 13 }); // Enter
    expect(onSelect).toHaveBeenCalled();
  });
});
```

### `VoiceSearchButton.test.tsx` (10 testes)
```typescript
describe('VoiceSearchButton', () => {
  test('shows recording state', async () => {
    render(<VoiceSearchButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(button).toHaveClass('recording');
    });
  });
});
```

**Estimativa:** 2 dias  
**Deliverable:** 22 tests passing

---

# 📅 SEMANA 3: E2E Tests + WebOS (11-17 Jun)

## ✅ E2E Tests Setup (Cypress)

### Install & Config
```bash
npm install --save-dev cypress

# cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1920,
    viewportHeight: 1080,
  },
});
```

### Writing E2E Tests

**Arquivo: `cypress/e2e/search.cy.ts`**

#### Test 1: Basic Search Flow
```typescript
describe('Search Flow', () => {
  beforeEach(() => {
    cy.visit('/search');
  });

  it('displays suggestions on input', () => {
    cy.get('[data-testid="search-input"]').type('Avatar');
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible');
    cy.get('[data-testid="suggestion-item"]').should('have.length.greaterThan', 0);
  });

  it('searches and displays results', () => {
    cy.get('[data-testid="search-input"]').type('Avatar{enter}');
    cy.get('[data-testid="results-grid"]').should('be.visible');
    cy.get('[data-testid="result-card"]').should('have.length.greaterThan', 0);
  });
});
```

#### Test 2: Voice Search
```typescript
describe('Voice Search', () => {
  it('records audio and searches', () => {
    cy.get('[data-testid="voice-button"]').click();
    cy.get('[data-testid="voice-button"]').should('have.class', 'recording');
    
    // Simulate voice (mock)
    cy.window().then(win => {
      win.dispatchEvent(new CustomEvent('voiceResult', {
        detail: { transcript: 'Avatar', confidence: 0.95 }
      }));
    });
    
    cy.get('[data-testid="results-grid"]').should('be.visible');
  });
});
```

#### Test 3: Geolocation
```typescript
describe('Geolocation Suggestions', () => {
  it('shows regional suggestions when location granted', () => {
    cy.visit('/search');
    
    // Grant geolocation
    cy.window().then(win => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition')
        .callsArgWith(0, {
          coords: { latitude: -23.5, longitude: -46.6 } // São Paulo
        });
    });
    
    cy.get('[data-testid="search-input"]').type('filme');
    cy.get('[data-testid="suggestions-dropdown"]')
      .should('exist')
      .within(() => {
        cy.contains('Filmes em São Paulo').should('be.visible');
      });
  });
});
```

#### Test 4: History Persistence
```typescript
describe('Search History', () => {
  it('saves and displays search history', () => {
    cy.get('[data-testid="search-input"]').type('Avatar{enter}');
    cy.visit('/search');
    
    cy.get('[data-testid="history-grid"]')
      .should('be.visible')
      .within(() => {
        cy.contains('Avatar').should('be.visible');
      });
  });
});
```

### Run Tests
```bash
# Interactive
npm run cypress:open

# Headless
npm run cypress:run

# Expected: ✓ All tests passing
```

**Estimativa:** 2-3 dias  
**Owner:** QA Engineer  
**Deliverable:** 8-10 E2E tests passing

---

## ✅ WebOS Optimization (3-4 dias)

### Step 1: Safe Area Styling
```css
/* src/globals.css */

@supports (padding: max(env(safe-area-inset-top))) {
  body.webos {
    padding: max(env(safe-area-inset-top), 40px)
             max(env(safe-area-inset-right), 80px)
             max(env(safe-area-inset-bottom), 40px)
             max(env(safe-area-inset-left), 80px);
  }
}

@media (min-width: 1920px) {
  body.webos {
    font-size: 20px;
  }
  
  button { min-height: 48px; }
}

@media (min-width: 3840px) {
  /* 4K */
  body.webos {
    font-size: 28px;
  }
  
  button { min-height: 64px; }
}
```

### Step 2: Focus Visual
```typescript
// src/components/SearchSuggestions.tsx
const itemClass = `
  p-4 rounded-lg transition-all
  border-2
  ${isHighlighted 
    ? 'border-yellow-400 shadow-lg shadow-yellow-500/50 bg-yellow-500/10'
    : 'border-gray-600'
  }
  ${isWebOS && isHighlighted && 'ring-4 ring-yellow-400/50'}
`;
```

### Step 3: D-Pad Event Handlers
```typescript
// src/lib/webosNav.ts
export function useWebOSNavigation(onNavigate) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const KEY_MAP = {
        37: 'LEFT',   // ←
        38: 'UP',     // ↑
        39: 'RIGHT',  // →
        40: 'DOWN',   // ↓
        13: 'ENTER',  // OK
        27: 'BACK',   // ESC
      };
      
      if (e.keyCode in KEY_MAP) {
        e.preventDefault();
        onNavigate(KEY_MAP[e.keyCode]);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}
```

### Step 4: Performance (60 FPS)
```css
/* Force GPU acceleration */
.webos-scroll {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}
```

### Checklist WebOS
- [ ] Safe area styling applied
- [ ] Font sizes 20px+ (1080p), 28px+ (4K)
- [ ] Focus rings visible
- [ ] D-Pad navigation smooth
- [ ] Performance profiler shows 60 FPS
- [ ] Tested em emulator

**Estimativa:** 2-3 dias  
**Deliverable:** WebOS fully optimized

---

# 📅 SEMANA 4: Mobile + Platform Optimization (18-24 Jun)

## ✅ Mobile Optimization (Android + iOS)

### Step 1: Responsive Grid
```css
/* src/app/search/page.tsx */

const gridClass = `
  grid gap-4
  grid-cols-1       /* Mobile: 375px */
  sm:grid-cols-2    /* Tablet: 640px */
  md:grid-cols-3    /* Desktop: 768px */
  lg:grid-cols-5    /* Large: 1024px */
  xl:grid-cols-7    /* 4K: 1920px */
`;
```

### Step 2: Touch-Friendly
```typescript
<button
  className="
    px-4 py-3
    sm:px-6 sm:py-4
    min-h-[48px]      /* Touch target */
    active:scale-95   /* Feedback */
    touch-highlight-color-transparent
  "
  onTouchEnd={handleTouchEnd}
/>
```

### Step 3: Virtual Keyboard Handling
```typescript
// iOS: Disable zoom on input
<input
  style={{ fontSize: '16px' }}  // Prevents auto-zoom
  onFocus={() => {
    window.scrollTo(0, 0);       // Keep in view
  }}
/>
```

### Step 4: Battery Optimization
```typescript
// Disable geolocation if user not interested
export function useOptionalGeolocation() {
  const [enabled, setEnabled] = useState(false);
  
  if (!enabled) return null;
  
  return getRealtimeLocation(); // Only if enabled
}
```

### Checklist Mobile
- [ ] Chrome DevTools: 375px layout OK
- [ ] iOS Safari: 390px layout OK
- [ ] Android 5.0+: Voice API works
- [ ] Touch: All buttons min 48px
- [ ] Performance: LCP < 3s
- [ ] Battery: No unnecessary geolocation

**Estimativa:** 2-3 dias

---

## ✅ Roku + Amazon FireStick (TV Streaming)

### Roku SDK Integration
```typescript
// src/lib/rokuCompat.ts
export const rokuCompatibility = {
  deepLink: (target: string) => {
    // Roku deeplink format
    window.location.href = `http://localhost:8060/keydown/${target}`;
  },
  
  trackEvent: (name: string, data: object) => {
    // Roku analytics
    if (window.Fresco) {
      window.Fresco.analytics.trackEvent(name, data);
    }
  },
};
```

### FireStick Optimization
```typescript
// src/lib/firestickCompat.ts
export const firestickCompatibility = {
  getDeviceInfo: () => ({
    model: navigator.userAgent.includes('Fire') ? 'FireStick' : null,
  }),
  
  handleRemoteControl: (keyCode: number) => {
    // FireStick remote codes
    const FIRE_CODES = { 29443: 'SELECT', 29460: 'BACK' };
    // ...
  },
};
```

**Estimativa:** 1-2 dias

---

## ✅ Desktop (Windows + Linux + macOS)

### Electron App (Optional, Future)
```typescript
// electron/main.ts (para depois, v2.1)
// Permite usar como app desktop standalone
```

### Web Optimization for Desktop
```typescript
// Keyboard shortcuts
Ctrl+F: Focus search
Ctrl+G: Geolocation
Ctrl+V: Voice search
```

**Estimativa:** 1 dia

---

# 📅 SEMANA 5: Samsung SmartTV + Backend APIs (25-1 Jul)

## ✅ Samsung SmartTV Integration

### Tizen OS Support
```typescript
// src/lib/tizenCompat.ts
export const tizenCompatibility = {
  getTV: () => {
    // Tizen API
    return window.webapis?.tv || null;
  },
  
  keyListener: (keyCode: number, handler: () => void) => {
    if (window.webapis?.tv?.usb?.keydown) {
      document.addEventListener('keydown', (e) => {
        if (e.keyCode === keyCode) handler();
      });
    }
  },
};
```

**Estimativa:** 1-2 dias

---

## ✅ Backend APIs Setup

### Create API Routes

**`src/app/api/search/route.ts`**
```typescript
import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query, resultCount, location } = await req.json();
  
  const supabase = createClient();
  
  // Track search
  const { data, error } = await supabase
    .from('user_search_history')
    .insert({
      user_id: user?.id,
      query,
      result_count: resultCount,
      created_at: new Date(),
      created_date: new Date(),
    });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
```

**`src/app/api/search/suggestions/route.ts`**
```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  
  // Call generateSuggestions
  const suggestions = await generateSuggestions(query);
  
  return NextResponse.json(suggestions);
}
```

**`src/app/api/search/analytics/route.ts`**
```typescript
export async function GET(req: NextRequest) {
  // Admin only endpoint
  const supabase = createClient();
  
  const { data: topSearches } = await supabase
    .from('search_analytics')
    .select('query, count')
    .order('count', { ascending: false })
    .limit(10);
  
  return NextResponse.json({ topSearches });
}
```

### Rate Limiting (Middleware)
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const key = `ratelimit:${ip}`;
  
  // Redis rate limit
  const limit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 h'),
  });
  
  return limit.limit(key);
}

export const config = {
  matcher: ['/api/search/:path*'],
};
```

**Estimativa:** 2-3 dias

---

## ✅ Supabase Functions

**`supabase/functions/aggregate_searches/index.ts`** (Cron)
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Aggregate user_search_history → search_analytics
  const { data } = await supabase
    .from('user_search_history')
    .select('query, result_count')
    .eq('created_date', new Date().toISOString().split('T')[0]);

  // Group and insert
  // ...
  
  return new Response(JSON.stringify({ ok: true }));
})
```

Deploy:
```bash
supabase functions deploy aggregate_searches
supabase functions secrets set --env-file .env.local
```

**Estimativa:** 1-2 dias

---

# 📅 SEMANA 6: Analytics Dashboard + Monitoring (2-8 Jul)

## ✅ Analytics Dashboard

Create: `src/app/admin/search-analytics/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function SearchAnalytics() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('search_analytics')
        .select('date, count, result_count')
        .order('date', { ascending: true })
      
      setData(data || [])
    }
    
    fetchAnalytics()
    
    // Realtime updates
    const sub = supabase
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'search_analytics' },
        () => fetchAnalytics()
      )
      .subscribe()
    
    return () => sub.unsubscribe()
  }, [])
  
  return (
    <div className="p-8">
      <h1>Search Analytics</h1>
      
      <LineChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Line type="monotone" dataKey="count" stroke="#8884d8" />
      </LineChart>
    </div>
  )
}
```

### Widgets
- [ ] Top 10 Searches (pie chart)
- [ ] 7-day trend (line chart)
- [ ] Regional distribution (map)
- [ ] Click-through rate
- [ ] Avg result count
- [ ] Voice vs Text ratio

**Estimativa:** 2-3 dias

---

## ✅ Monitoring Setup

### Sentry Integration
```bash
npm install @sentry/react @sentry/nextjs
```

**`src/instrumentation.ts`**
```typescript
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
  }
}
```

### Web Vitals Tracking
```typescript
// src/app/layout.tsx
import { reportWebVitals } from 'next-web-vitals'

export function reportWebVitals(metric) {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
    });
  }
}
```

**Estimativa:** 1-2 dias

---

# 📅 SEMANA 7: Staging Deployment + Beta Testing (9-15 Jul)

## ✅ Staging Deployment (Zero Downtime)

### Branch Strategy
```bash
# Create staging branch
git checkout -b staging-search
git push --set-upstream origin staging-search

# Vercel automatically deploys to staging.cinemaemcasa.com
```

### Pre-Deployment Checklist
```
BUILD VERIFICATION
✅ npm run build (no errors)
✅ npm run test (all pass)
✅ npm run cypress:run (all pass)
✅ Performance: LCP < 2.5s

DATABASE
✅ Migrations applied
✅ RLS policies active
✅ Indices created

SECURITY
✅ No secrets in code
✅ HTTPS enabled
✅ CORS configured
✅ Rate limiting active

ANALYTICS
✅ Sentry connected
✅ Web Vitals tracking
✅ CloudFlare analytics

DOCUMENTATION
✅ Deployment runbook
✅ Emergency procedures
✅ Rollback plan
```

### Staging Tests (1 dia)
```bash
# 1. Smoke tests
curl https://staging.cinemaemcasa.com/search
# Expected: 200 OK

# 2. E2E tests against staging
npm run cypress:run -- --baseUrl=https://staging.cinemaemcasa.com

# 3. Performance audit
lighthouse https://staging.cinemaemcasa.com/search

# 4. Manual testing (all 8 platforms)
```

## ✅ Beta Testing Program

### Recruit Beta Testers
```
Target: 20-30 users
Mix: 
  - 5 WebOS TV users
  - 5 Mobile (iOS + Android)
  - 5 Desktop users
  - 5 All devices
  - Extra: Accessibility testers
```

### Beta Feedback Form
```
1. Device/OS
2. Voice accuracy (1-10)
3. Suggestions relevance (1-10)
4. Geolocation accuracy (1-10)
5. Performance rating (1-10)
6. UI/UX rating (1-10)
7. Major issues found
8. Likes/Dislikes
```

### Feedback Loop (5 dias)
```
Day 1: Send beta version
Day 2-4: Collect feedback
Day 5: Analyze + Prioritize fixes
```

### Iteration (2-3 mais small issues)
- Fuzzy matching threshold adjustment
- Voice alternative sorting
- UI tweaks based on feedback

**Estimativa:** 5-6 dias

---

# 📅 SEMANA 8: Production Deployment + Monitoring (16-22 Jul)

## ✅ Production Deployment

### Pre-Production Checklist
```
SAME AS STAGING +
✅ Backup database
✅ Rollback plan documented and tested
✅ On-call schedule set up
✅ Emergency contact list
✅ Monitoring alerts configured
```

### Deployment Steps
```bash
# 1. Tag release
git tag -a v2.0.0-search -m "Professional search with voice + geolocation"

# 2. Merge to main
git checkout main
git merge staging-search
git tag -publish v2.0.0-search

# 3. Vercel production deploys (automatic on main push)
# Checks: Build success + tests pass

# 4. Post-deployment verification
curl https://cinemaemcasa.com/search
npm run lighthouse:production

# 5. Monitor
## Check Sentry for errors
## Check analytics data
## Check performance metrics
```

### Gradual Rollout (Canary Deployment)
```
Opção 1: Vercel + Preview (se disponível)
- Deploy novo em branch feature
- Share preview URL
- Gradual traffic shift

Opção 2: Feature Flag
- featureFlags.searchV2Enabled = 100% (after monitoring)
- Start at 10% traffic
- 50% at 8h
- 100% at 24h
```

## ✅ Monitoring (24/7)

### Alerting Setup
```
🔴 CRITICAL (Page immediately)
- Error rate > 1%
- API response time > 5s
- Database connection failed
- Sentry issue: P0 severity

🟠 WARNING (Check within 1h)
- LCP degradation > 20%
- 5xx errors spike
- Storage quota > 80%
```

### Daily Monitoring Schedule
```
Hour 0-2: Manual spot checks (every 30min)
Hour 2-24: Auto monitoring (Sentry + PagerDuty)

Daily Report:
- Total searches
- Top queries
- Error rate
- Performance metrics
- User feedback count
```

### Rollback Plan (if needed)
```bash
# If critical issues in < 1 hour:
git revert <commit-hash>
git push origin main
# Vercel redeploys automatically

# If database issue:
# Restore from pre-deployment backup
```

**Estimativa:** 2-3 dias (including monitoring)

---

# 📅 POST-LAUNCH (23+ Jul)

## Week 2-8: Continuous Monitoring + Optimization
```
DAILY:
- Monitor error rates
- Check analytics
- Review user feedback
- Performance metrics

WEEKLY:
- Analytics deep dive
- Performance optimization
- Security audit
- User interview (if feedback negative)

2-4 WEEKS:
- ML ranking implementation (v2.1)
- Elasticsearch integration (v2.2)
- Advanced visualizations (v2.3)
```

---

# 📋 DELIVERABLES CHECKLIST

## BY END (23 JUL)

### Code
- [x] Busca módulos (5 arquivos criados) - ✅ JÁ FEITO
- [ ] 50+ unit tests (> 80% coverage)
- [ ] 10+ E2E tests (all passing)
- [ ] WebOS optimized + D-Pad nav
- [ ] Mobile responsive (375px-1920px+)
- [ ] 5+ TV platform compatible
- [ ] 4+ API endpoints
- [ ] 2 Supabase functions
- [ ] Zero TypeScript errors

### Infrastructure
- [ ] SQL migration applied
- [ ] Rate limiting active
- [ ] Sentry monitoring
- [ ] CloudFlare analytics
- [ ] Staging environment
- [ ] Production environment

### Documentation
- [ ] Deployment runbook
- [ ] Emergency procedures
- [ ] API documentation
- [ ] Analytics dashboard
- [ ] Monitoring alerts
- [ ] User guide
- [ ] Developer guide

### Testing
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Performance audit (LCP < 2.5s)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Security audit (OWASP)
- [ ] Beta testing (20+ users)

### Release
- [ ] Staging deployment ✅
- [ ] Beta feedback collected ✅
- [ ] Issues fixed ✅
- [ ] Production deployment ✅
- [ ] 24/7 monitoring active ✅
- [ ] Runbook team trained ✅

---

# 🚨 RISK MITIGATION

## Known Risks

### Risk 1: Database Migration Fails
**Probability:** Medium  
**Impact:** High (system broken)  
**Mitigation:** 
- [ ] Test em staging first
- [ ] Backup database before
- [ ] Rollback script ready
- [ ] DBA on-call

### Risk 2: Performance Degradation
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- [ ] Load test before deploy
- [ ] Monitoring alerts active
- [ ] Canary deployment
- [ ] Rollback ready

### Risk 3: Voice API Rate Limits
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- [ ] Cache aggregation
- [ ] Rate limiting client-side
- [ ] Fallback to text search
- [ ] Budget monitoring

### Risk 4: Geolocation Inaccuracy
**Probability:** Medium  
**Impact:** Low  
**Mitigation:**
- [ ] 5-level fallback chain
- [ ] Allow manual override
- [ ] User preference saving
- [ ] accuracy metadata

---

# 📞 TEAM & RESPONSIBILITIES

| Role | Name | Responsibility |
|------|------|-----------------|
| Dev Lead | [Your name] | Architecture + Code review |
| Dev 1 | - | Unit tests + Components |
| Dev 2 | - | Backend APIs + Databases |
| QA Lead | - | E2E tests + Performance |
| DevOps | - | Deployment + Monitoring |

---

# 🎯 SUCCESS CRITERIA

### Launch Day (23 Jul)
```
✅ Zero downtime deployment
✅ All tests passing
✅ Monitoring active
✅ Team trained
```

### Launch + 1 Week
```
✅ Error rate < 0.1%
✅ LCP consistently < 2s
✅ 1000+ users tested
✅ Performance stable
```

### Launch + 1 Month
```
✅ 10,000+ searches/day
✅ Voice accuracy > 90%
✅ User satisfaction > 8/10
✅ Zero critical issues
```

---

# 📝 SIGN-OFF

```
PROJECT: Cinema em Casa v2.0 - Busca Profissional
STATUS: 🟢 READY TO START
TIMELINE: 28 Mai - 23 Jul 2026 (8 semanas)
BUDGET: ⏱️ ~480 hours (6 devs × 8 sem × 10h/sem)
RISK LEVEL: 🟡 MEDIUM (mitigated)

Aprovado por: _________________
Data: _________________
```

---

# 🎓 APPENDIX

## Terminal Commands Reference

```bash
# Database
supabase db push supabase/migrations/018_search_analytics.sql

# Build
npm run build
npm run lint
npx tsc --noEmit

# Tests
npm run test -- --coverage
npm run cypress:run
npm run lighthouse:production

# Deploy
git tag v2.0.0-search
git push origin main
git push --tags

# Monitor
tail -f /var/log/cinema-em-casa.log
curl https://api.sentry.io/api/events/?query=...
```

## Contact Info
```
Issues? paixaomario@example.com
On-call: +55 11 9XXXX-XXXX
Slack: #cinema-em-casa-deploy
```

---

**🎉 Este cronograma garante sistema profissional, seguro e completo!**

**Nunca deixar cair. Nunca danificar users. Sempre documentado. Sempre terminado.** ✅
