# Visual Regression Testing Templates

Production-ready visual regression testing with Playwright, Percy, and Chromatic for UI stability.

## Overview

- **Screenshot Comparison**: Pixel-level diff detection
- **Component Testing**: Storybook visual testing
- **Cross-Browser Testing**: Multi-browser visual validation
- **Responsive Testing**: Viewport-based visual testing

## Quick Start

```bash
# Playwright visual testing
npm install -D @playwright/test

# Percy
npm install -D @percy/cli @percy/playwright

# Chromatic (Storybook)
npm install -D chromatic

# BackstopJS
npm install -D backstopjs
```

## Playwright Visual Testing

```typescript
// tests/visual/pages.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
  });

  test('homepage visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="timestamp"]'),
        page.locator('[data-testid="dynamic-content"]'),
      ],
    });
  });

  test('login page visual', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
    });
  });

  test('dashboard visual', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      mask: [page.locator('.user-avatar'), page.locator('.timestamp')],
    });
  });

  test('product page visual', async ({ page }) => {
    await page.goto('/products/1');
    await page.waitForLoadState('networkidle');

    // Wait for images to load
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).every(img => img.complete);
    });

    await expect(page).toHaveScreenshot('product-page.png', {
      fullPage: true,
    });
  });
});

test.describe('Responsive Visual Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'wide', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`homepage @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(
        `homepage-${viewport.name}.png`,
        { fullPage: true }
      );
    });
  }
});

test.describe('Component Visual Tests', () => {
  test('button states', async ({ page }) => {
    await page.goto('/storybook/button');

    // Default state
    await expect(page.locator('.btn-primary')).toHaveScreenshot(
      'button-primary.png'
    );

    // Hover state
    await page.locator('.btn-primary').hover();
    await expect(page.locator('.btn-primary')).toHaveScreenshot(
      'button-primary-hover.png'
    );

    // Disabled state
    await expect(page.locator('.btn-disabled')).toHaveScreenshot(
      'button-disabled.png'
    );
  });

  test('form validation states', async ({ page }) => {
    await page.goto('/storybook/form');

    // Valid state
    await page.fill('[name="email"]', 'valid@example.com');
    await page.locator('[name="email"]').blur();
    await expect(page.locator('.form-group')).toHaveScreenshot(
      'form-field-valid.png'
    );

    // Error state
    await page.fill('[name="email"]', 'invalid');
    await page.locator('[name="email"]').blur();
    await expect(page.locator('.form-group')).toHaveScreenshot(
      'form-field-error.png'
    );
  });

  test('modal dialog', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[role="dialog"]');

    await expect(page.locator('[role="dialog"]')).toHaveScreenshot(
      'modal-dialog.png'
    );
  });
});
```

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Screenshot comparison settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
    toMatchSnapshot: {
      maxDiffPixels: 100,
    },
  },

  // Snapshot directory
  snapshotDir: './tests/visual/__snapshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-{projectName}/{arg}{ext}',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Percy Integration

```typescript
// tests/visual/percy.visual.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Percy Visual Tests', () => {
  test('homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Homepage', {
      widths: [375, 768, 1280],
      minHeight: 1024,
    });
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Login Page', {
      widths: [375, 768, 1280],
    });
  });

  test('dashboard', async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await percySnapshot(page, 'Dashboard', {
      widths: [1280],
      percyCSS: `
        .timestamp { visibility: hidden; }
        .avatar { filter: blur(5px); }
      `,
    });
  });

  test('product listing', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Wait for lazy-loaded images
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });

    await percySnapshot(page, 'Product Listing', {
      widths: [375, 768, 1280],
    });
  });
});
```

```yaml
# .percy.yml
version: 2
snapshot:
  widths:
    - 375
    - 768
    - 1280
  min-height: 1024
  percy-css: |
    .no-percy { display: none !important; }
    * { animation-duration: 0s !important; }
  enable-javascript: true

discovery:
  allowed-hostnames:
    - localhost
    - cdn.example.com
  network-idle-timeout: 250
  disable-cache: true
```

## Chromatic Integration (Storybook)

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    chromatic: {
      viewports: [375, 768, 1280],
      delay: 300,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading Button',
    loading: true,
  },
  parameters: {
    chromatic: {
      // Disable animations for snapshot
      pauseAnimationAtEnd: true,
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    chromatic: {
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
      },
    },
  },
};
```

```yaml
# chromatic.config.json
{
  "projectId": "Project:abc123",
  "buildScriptName": "build-storybook",
  "onlyChanged": true,
  "externals": ["public/**"],
  "skip": "@(*.stories.mdx|CHANGELOG.md)",
  "storybookBaseDir": ".storybook",
  "zip": true
}
```

## BackstopJS Configuration

```javascript
// backstop.config.js
module.exports = {
  id: 'visual-regression',
  viewports: [
    { label: 'phone', width: 375, height: 667 },
    { label: 'tablet', width: 768, height: 1024 },
    { label: 'desktop', width: 1280, height: 800 },
  ],
  scenarios: [
    {
      label: 'Homepage',
      url: 'http://localhost:3000/',
      selectors: ['document'],
      delay: 500,
      misMatchThreshold: 0.1,
      requireSameDimensions: true,
    },
    {
      label: 'Login Page',
      url: 'http://localhost:3000/login',
      selectors: ['document'],
      delay: 300,
    },
    {
      label: 'Header Navigation',
      url: 'http://localhost:3000/',
      selectors: ['header'],
      hoverSelector: '.nav-dropdown-trigger',
      postInteractionWait: 500,
    },
    {
      label: 'Product Card',
      url: 'http://localhost:3000/products',
      selectors: ['.product-card:first-child'],
      selectorExpansion: true,
    },
    {
      label: 'Modal Dialog',
      url: 'http://localhost:3000/',
      selectors: ['[role="dialog"]'],
      clickSelector: '[data-testid="open-modal"]',
      postInteractionWait: 300,
    },
    {
      label: 'Form Validation',
      url: 'http://localhost:3000/contact',
      selectors: ['form'],
      onReadyScript: 'fillInvalidForm.js',
    },
  ],
  paths: {
    bitmaps_reference: 'tests/visual/reference',
    bitmaps_test: 'tests/visual/test',
    engine_scripts: 'tests/visual/scripts',
    html_report: 'reports/visual/html',
    ci_report: 'reports/visual/ci',
  },
  report: ['browser', 'CI'],
  engine: 'playwright',
  engineOptions: {
    browser: 'chromium',
    args: ['--no-sandbox'],
  },
  asyncCaptureLimit: 5,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false,
};
```

```javascript
// tests/visual/scripts/fillInvalidForm.js
module.exports = async (page) => {
  await page.fill('[name="email"]', 'invalid-email');
  await page.fill('[name="phone"]', 'abc');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.error-message');
};
```

## CI Integration

```yaml
# .github/workflows/visual.yml
name: Visual Regression

on:
  pull_request:
    branches: [main]

jobs:
  visual-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run visual tests
        run: npx playwright test --project=chromium tests/visual/

      - name: Upload diff images
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff
          path: |
            tests/visual/__snapshots__/
            test-results/

  percy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build and start
        run: npm run build && npm run start &

      - name: Percy snapshot
        run: npx percy exec -- npx playwright test tests/visual/percy.visual.spec.ts
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install dependencies
        run: npm ci

      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
          exitOnceUploaded: true
```

## CLAUDE.md Integration

```markdown
# Visual Regression Testing

## Commands
- `npm run test:visual` - Run Playwright visual tests
- `npm run test:visual:update` - Update snapshots
- `npx percy exec -- npm test` - Run Percy tests
- `npx chromatic` - Run Chromatic tests

## Snapshot Management
- Snapshots stored in `__snapshots__/`
- Update with `--update-snapshots`
- Review diffs in CI artifacts

## Best Practices
- Disable animations
- Mask dynamic content
- Test multiple viewports
- Use consistent test data

## Thresholds
- maxDiffPixels: 100
- maxDiffPixelRatio: 1%
- threshold: 0.2
```

## AI Suggestions

1. **Smart diff detection** - AI-powered visual diff analysis
2. **Flaky test detection** - Identify unstable visual tests
3. **Auto-masking** - Automatically detect dynamic regions
4. **Visual test generation** - Generate tests from Figma
5. **Cross-browser comparison** - Compare across browsers
6. **Accessibility contrast** - Visual accessibility testing
7. **Layout shift detection** - Detect CLS issues
8. **Dark mode testing** - Theme-aware visual testing
9. **Animation testing** - Test animation sequences
10. **Performance screenshots** - Visual performance budgets
