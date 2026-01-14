# Performance Optimization Workflow

A systematic workflow for identifying, analyzing, and fixing performance issues in web applications.

---

## WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                 PERFORMANCE OPTIMIZATION WORKFLOW                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ MEASURE  │ → │ ANALYZE  │ → │ OPTIMIZE │ → │ VALIDATE │        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│       ↓              ↓              ↓              ↓               │
│   Baseline       Bottleneck     Implement      Measure            │
│   Metrics        Analysis       Fixes          Improvement         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: MEASURE

### Skills Used
- `/observability` - Monitoring setup
- `/analytics` - Performance metrics

### Core Web Vitals

```typescript
// Metrics to capture:

interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number;   // Largest Contentful Paint (< 2.5s)
  FID: number;   // First Input Delay (< 100ms)
  CLS: number;   // Cumulative Layout Shift (< 0.1)
  INP: number;   // Interaction to Next Paint (< 200ms)

  // Additional metrics
  TTFB: number;  // Time to First Byte
  FCP: number;   // First Contentful Paint
  TTI: number;   // Time to Interactive
}
```

### Measurement Tools

```bash
# 1. Lighthouse audit
npx lighthouse https://yoursite.com --output=json --output-path=./lighthouse.json

# 2. Web Vitals in code
npm install web-vitals
```

```typescript
// src/lib/analytics.ts
import { onCLS, onFID, onLCP, onINP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: { name: string; value: number }) {
  console.log(metric);
  // Send to your analytics service
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

### Baseline Report

```markdown
## Performance Baseline Report

### Current Metrics (Desktop)
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | 3.2s | < 2.5s | ❌ |
| FID | 45ms | < 100ms | ✅ |
| CLS | 0.15 | < 0.1 | ❌ |
| TTFB | 800ms | < 600ms | ❌ |

### Current Metrics (Mobile)
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | 5.1s | < 2.5s | ❌ |
| FID | 120ms | < 100ms | ❌ |
| CLS | 0.22 | < 0.1 | ❌ |
| TTFB | 1.2s | < 600ms | ❌ |

### Lighthouse Scores
- Performance: 62
- Accessibility: 89
- Best Practices: 95
- SEO: 91
```

---

## PHASE 2: ANALYZE

### Skills Used
- `/debug` - Performance debugging
- `/explain` - Code analysis

### Bundle Analysis

```bash
# Next.js bundle analyzer
npm install @next/bundle-analyzer

# Run analysis
ANALYZE=true npm run build
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // config
});
```

### Common Bottlenecks

```markdown
## Bottleneck Analysis

### JavaScript
- [ ] Large bundle size (> 200KB gzipped)
- [ ] Render-blocking scripts
- [ ] Unnecessary polyfills
- [ ] Heavy third-party scripts

### Images
- [ ] Unoptimized images
- [ ] Missing lazy loading
- [ ] Wrong format (use WebP/AVIF)
- [ ] Missing dimensions

### CSS
- [ ] Unused CSS
- [ ] Render-blocking CSS
- [ ] Large CSS files

### Network
- [ ] Too many requests
- [ ] Large payloads
- [ ] Missing caching headers
- [ ] No compression

### Server
- [ ] Slow database queries
- [ ] Missing caching
- [ ] Cold starts (serverless)
- [ ] Unoptimized API responses
```

### Profiling Code

```typescript
// Performance profiling
console.time('operation');
await expensiveOperation();
console.timeEnd('operation');

// Memory profiling
const used = process.memoryUsage();
console.log({
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
});

// React profiler
import { Profiler } from 'react';

<Profiler id="Component" onRender={(id, phase, actualDuration) => {
  console.log({ id, phase, actualDuration });
}}>
  <ExpensiveComponent />
</Profiler>
```

---

## PHASE 3: OPTIMIZE

### Skills Used
- `/refactor` - Code optimization
- `/next-builder` - Next.js optimizations

### Image Optimization

```typescript
// Before: Unoptimized
<img src="/hero.png" />

// After: Optimized with Next.js Image
import Image from 'next/image';

<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  priority  // For LCP images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Code Splitting

```typescript
// Before: Everything in main bundle
import HeavyComponent from './HeavyComponent';

// After: Dynamic import
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,  // Skip SSR if not needed
});
```

### React Optimization

```typescript
// Memoization
import { memo, useMemo, useCallback } from 'react';

// Memoize component
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});

// Memoize computation
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Memoize callback
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);
```

### Database Query Optimization

```typescript
// Before: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
}

// After: Single query with include
const users = await prisma.user.findMany({
  include: {
    posts: {
      take: 10,
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

### Caching Strategy

```typescript
// API route with caching
export async function GET(request: Request) {
  const data = await getExpensiveData();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

// Redis caching
import { redis } from '@/lib/redis';

async function getCachedData(key: string) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchData();
  await redis.set(key, JSON.stringify(data), 'EX', 3600);
  return data;
}
```

### Font Optimization

```typescript
// next.config.js - Enable font optimization
module.exports = {
  optimizeFonts: true,
};

// Use next/font
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Script Optimization

```typescript
// Defer non-critical scripts
import Script from 'next/script';

<Script
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload"  // Load after page is interactive
/>

// Inline critical scripts
<Script id="critical-script" strategy="beforeInteractive">
  {`window.dataLayer = window.dataLayer || [];`}
</Script>
```

---

## PHASE 4: VALIDATE

### Skills Used
- `/test-gen` - Performance tests
- `/playwright-builder` - E2E performance tests

### Performance Tests

```typescript
// tests/performance.test.ts
import { test, expect } from '@playwright/test';

test('homepage loads within performance budget', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);  // 3 second budget

  // Check Core Web Vitals
  const lcpValue = await page.evaluate(() => {
    return new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        resolve(entries[entries.length - 1].startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });

  expect(lcpValue).toBeLessThan(2500);  // LCP < 2.5s
});

test('bundle size within budget', async ({ page }) => {
  const responses: { url: string; size: number }[] = [];

  page.on('response', async response => {
    const url = response.url();
    if (url.endsWith('.js') || url.endsWith('.css')) {
      const buffer = await response.body();
      responses.push({ url, size: buffer.length });
    }
  });

  await page.goto('/');

  const totalJS = responses
    .filter(r => r.url.endsWith('.js'))
    .reduce((sum, r) => sum + r.size, 0);

  expect(totalJS).toBeLessThan(300 * 1024);  // 300KB budget
});
```

### Before/After Comparison

```markdown
## Performance Improvement Report

### Before Optimization
| Metric | Value |
|--------|-------|
| LCP | 3.2s |
| FID | 45ms |
| CLS | 0.15 |
| Bundle Size | 450KB |
| Lighthouse Score | 62 |

### After Optimization
| Metric | Value | Improvement |
|--------|-------|-------------|
| LCP | 1.8s | -44% ✅ |
| FID | 32ms | -29% ✅ |
| CLS | 0.05 | -67% ✅ |
| Bundle Size | 180KB | -60% ✅ |
| Lighthouse Score | 94 | +52% ✅ |

### Optimizations Applied
1. Image optimization with next/image
2. Code splitting for heavy components
3. Added Redis caching for API routes
4. Optimized database queries (N+1 → includes)
5. Font optimization with next/font
6. Removed unused CSS
7. Lazy loaded below-fold content
```

### Continuous Monitoring

```typescript
// Set up performance monitoring
// vercel.json
{
  "crons": [
    {
      "path": "/api/monitor-performance",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}

// app/api/monitor-performance/route.ts
export async function GET() {
  const result = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(process.env.SITE_URL!)}&strategy=mobile`
  );

  const data = await result.json();
  const score = data.lighthouseResult.categories.performance.score * 100;

  if (score < 80) {
    // Alert via Slack/email
    await sendAlert(`Performance score dropped to ${score}`);
  }

  return Response.json({ score });
}
```

---

## WORKFLOW COMMAND

```bash
# Full performance optimization workflow
claude "Optimize performance for our Next.js app:
1. Measure current Core Web Vitals
2. Analyze bundle size and bottlenecks
3. Optimize images, code splitting, caching
4. Validate improvements with Lighthouse
5. Set up continuous monitoring"
```

---

## SUCCESS CRITERIA

- [ ] Baseline metrics captured
- [ ] Bottlenecks identified
- [ ] LCP < 2.5s
- [ ] FID/INP < 100ms
- [ ] CLS < 0.1
- [ ] Lighthouse Performance > 90
- [ ] Bundle size reduced by 30%+
- [ ] Monitoring in place

$ARGUMENTS
