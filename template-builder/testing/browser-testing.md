# Browser Testing Templates

Production-ready cross-browser testing patterns with Playwright, Selenium, and BrowserStack.

## Overview

- **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge
- **Browser Matrix**: Version and platform combinations
- **Browser-Specific Fixes**: Polyfills and workarounds
- **Cloud Testing**: BrowserStack, Sauce Labs integration

## Quick Start

```bash
# Playwright (recommended)
npm install -D @playwright/test
npx playwright install

# Selenium WebDriver
npm install -D selenium-webdriver chromedriver
pip install selenium webdriver-manager

# WebdriverIO
npm install -D @wdio/cli
npx wdio config
```

## Playwright Multi-Browser Testing

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },

    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

```typescript
// tests/e2e/cross-browser.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('homepage renders correctly', async ({ page, browserName }) => {
    await page.goto('/');

    // Common assertions
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();

    // Browser-specific checks
    if (browserName === 'webkit') {
      // Safari-specific test
      const hasWebkitScrollbar = await page.evaluate(() => {
        return CSS.supports('-webkit-overflow-scrolling', 'touch');
      });
      expect(hasWebkitScrollbar).toBe(true);
    }
  });

  test('form submission works', async ({ page, browserName }) => {
    await page.goto('/contact');

    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="message"]', 'Test message');

    // Handle different date picker implementations
    if (browserName === 'webkit') {
      // Safari date input
      await page.locator('[name="date"]').fill('2024-03-15');
    } else {
      await page.locator('[name="date"]').fill('2024-03-15');
    }

    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('CSS features are supported', async ({ page, browserName }) => {
    await page.goto('/');

    const cssSupport = await page.evaluate(() => {
      return {
        grid: CSS.supports('display', 'grid'),
        flexbox: CSS.supports('display', 'flex'),
        customProperties: CSS.supports('--test', 'value'),
        containerQueries: CSS.supports('container-type', 'inline-size'),
        subgrid: CSS.supports('grid-template-columns', 'subgrid'),
      };
    });

    // All modern browsers should support these
    expect(cssSupport.grid).toBe(true);
    expect(cssSupport.flexbox).toBe(true);
    expect(cssSupport.customProperties).toBe(true);

    // Log browser-specific support
    console.log(`${browserName} CSS support:`, cssSupport);
  });

  test('JavaScript APIs work correctly', async ({ page, browserName }) => {
    await page.goto('/');

    const apiSupport = await page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        promise: typeof Promise !== 'undefined',
        asyncIterator: typeof Symbol.asyncIterator !== 'undefined',
        intersectionObserver: typeof IntersectionObserver !== 'undefined',
        resizeObserver: typeof ResizeObserver !== 'undefined',
        webAnimations: typeof Element.prototype.animate !== 'undefined',
        structuredClone: typeof structuredClone !== 'undefined',
      };
    });

    expect(apiSupport.fetch).toBe(true);
    expect(apiSupport.promise).toBe(true);
    expect(apiSupport.intersectionObserver).toBe(true);
  });

  test('media queries work', async ({ page }) => {
    // Test responsive breakpoints
    const breakpoints = [
      { width: 375, expected: 'mobile' },
      { width: 768, expected: 'tablet' },
      { width: 1024, expected: 'desktop' },
      { width: 1440, expected: 'wide' },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: 800 });
      await page.goto('/');

      const layoutClass = await page.evaluate(() => {
        return document.body.dataset.layout;
      });

      expect(layoutClass).toBe(bp.expected);
    }
  });
});
```

## Selenium WebDriver Testing

```typescript
// tests/browser/selenium.test.ts
import { Builder, Browser, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import edge from 'selenium-webdriver/edge';

describe('Selenium Cross-Browser Tests', () => {
  const browsers = [Browser.CHROME, Browser.FIREFOX, Browser.EDGE];

  browsers.forEach((browserName) => {
    describe(`${browserName} browser`, () => {
      let driver: WebDriver;

      beforeAll(async () => {
        const builder = new Builder().forBrowser(browserName);

        // Browser-specific options
        if (browserName === Browser.CHROME) {
          const options = new chrome.Options();
          options.addArguments('--headless', '--no-sandbox', '--disable-gpu');
          builder.setChromeOptions(options);
        } else if (browserName === Browser.FIREFOX) {
          const options = new firefox.Options();
          options.addArguments('-headless');
          builder.setFirefoxOptions(options);
        } else if (browserName === Browser.EDGE) {
          const options = new edge.Options();
          options.addArguments('--headless');
          builder.setEdgeOptions(options);
        }

        driver = await builder.build();
      }, 30000);

      afterAll(async () => {
        await driver?.quit();
      });

      it('loads homepage', async () => {
        await driver.get('http://localhost:3000');
        const title = await driver.getTitle();
        expect(title).toContain('My App');
      });

      it('navigates to about page', async () => {
        await driver.get('http://localhost:3000');
        await driver.findElement(By.linkText('About')).click();
        await driver.wait(until.urlContains('/about'), 5000);

        const heading = await driver.findElement(By.css('h1')).getText();
        expect(heading).toBe('About Us');
      });

      it('submits contact form', async () => {
        await driver.get('http://localhost:3000/contact');

        await driver.findElement(By.name('name')).sendKeys('Test User');
        await driver.findElement(By.name('email')).sendKeys('test@example.com');
        await driver.findElement(By.name('message')).sendKeys('Hello');
        await driver.findElement(By.css('button[type="submit"]')).click();

        const success = await driver.wait(
          until.elementLocated(By.css('.success-message')),
          5000
        );
        expect(await success.isDisplayed()).toBe(true);
      });

      it('handles JavaScript interactions', async () => {
        await driver.get('http://localhost:3000');

        // Click dropdown
        await driver.findElement(By.css('[data-testid="dropdown"]')).click();

        // Wait for menu
        const menu = await driver.wait(
          until.elementLocated(By.css('[role="menu"]')),
          3000
        );
        expect(await menu.isDisplayed()).toBe(true);

        // Click outside to close
        await driver.findElement(By.css('body')).click();
        await driver.wait(until.stalenessOf(menu), 3000);
      });
    });
  });
});
```

## Python Selenium Testing

```python
# tests/browser/test_cross_browser.py
"""Cross-browser tests using Selenium."""
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.edge.options import Options as EdgeOptions


@pytest.fixture(params=["chrome", "firefox", "edge"])
def browser(request):
    """Create browser driver for each browser type."""
    browser_name = request.param

    if browser_name == "chrome":
        options = ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        driver = webdriver.Chrome(options=options)
    elif browser_name == "firefox":
        options = FirefoxOptions()
        options.add_argument("-headless")
        driver = webdriver.Firefox(options=options)
    elif browser_name == "edge":
        options = EdgeOptions()
        options.add_argument("--headless")
        driver = webdriver.Edge(options=options)

    driver.implicitly_wait(10)
    yield driver
    driver.quit()


class TestCrossBrowser:
    """Cross-browser compatibility tests."""

    def test_homepage_loads(self, browser):
        """Test homepage loads in all browsers."""
        browser.get("http://localhost:3000")

        assert "My App" in browser.title
        assert browser.find_element(By.TAG_NAME, "h1").is_displayed()

    def test_navigation(self, browser):
        """Test navigation works in all browsers."""
        browser.get("http://localhost:3000")

        # Click nav link
        browser.find_element(By.LINK_TEXT, "Products").click()

        # Wait for page
        WebDriverWait(browser, 10).until(
            EC.url_contains("/products")
        )

        assert "/products" in browser.current_url

    def test_form_submission(self, browser):
        """Test form submission in all browsers."""
        browser.get("http://localhost:3000/contact")

        browser.find_element(By.NAME, "name").send_keys("Test User")
        browser.find_element(By.NAME, "email").send_keys("test@example.com")
        browser.find_element(By.NAME, "message").send_keys("Test message")
        browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        success = WebDriverWait(browser, 10).until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, ".success-message")
            )
        )
        assert success.is_displayed()

    def test_responsive_layout(self, browser):
        """Test responsive layout in all browsers."""
        browser.get("http://localhost:3000")

        # Desktop
        browser.set_window_size(1280, 800)
        assert browser.find_element(By.CSS_SELECTOR, ".desktop-nav").is_displayed()

        # Mobile
        browser.set_window_size(375, 667)
        mobile_menu = browser.find_element(By.CSS_SELECTOR, ".mobile-menu-button")
        assert mobile_menu.is_displayed()

    def test_css_features(self, browser):
        """Test CSS feature support."""
        browser.get("http://localhost:3000")

        result = browser.execute_script("""
            return {
                grid: CSS.supports('display', 'grid'),
                flexbox: CSS.supports('display', 'flex'),
                customProperties: CSS.supports('--test', 'value'),
            };
        """)

        assert result["grid"] is True
        assert result["flexbox"] is True
        assert result["customProperties"] is True
```

## BrowserStack Integration

```typescript
// tests/browser/browserstack.config.ts
export const browserstackConfig = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  capabilities: {
    'bstack:options': {
      projectName: 'My App',
      buildName: process.env.BUILD_ID || 'local',
      debug: true,
      networkLogs: true,
      consoleLogs: 'verbose',
    },
  },
};

export const browsers = [
  {
    browserName: 'Chrome',
    browserVersion: 'latest',
    'bstack:options': {
      os: 'Windows',
      osVersion: '11',
    },
  },
  {
    browserName: 'Firefox',
    browserVersion: 'latest',
    'bstack:options': {
      os: 'Windows',
      osVersion: '11',
    },
  },
  {
    browserName: 'Safari',
    browserVersion: '17',
    'bstack:options': {
      os: 'OS X',
      osVersion: 'Sonoma',
    },
  },
  {
    browserName: 'Edge',
    browserVersion: 'latest',
    'bstack:options': {
      os: 'Windows',
      osVersion: '11',
    },
  },
  // Mobile
  {
    browserName: 'Chrome',
    'bstack:options': {
      deviceName: 'Samsung Galaxy S23',
      osVersion: '13.0',
      realMobile: true,
    },
  },
  {
    browserName: 'Safari',
    'bstack:options': {
      deviceName: 'iPhone 15',
      osVersion: '17',
      realMobile: true,
    },
  },
];
```

```typescript
// tests/browser/browserstack.test.ts
import { remote, RemoteOptions } from 'webdriverio';
import { browserstackConfig, browsers } from './browserstack.config';

describe('BrowserStack Cross-Browser Tests', () => {
  browsers.forEach((browserConfig) => {
    const browserName = `${browserConfig.browserName} ${browserConfig['bstack:options'].deviceName || browserConfig['bstack:options'].os}`;

    describe(browserName, () => {
      let browser: WebdriverIO.Browser;

      beforeAll(async () => {
        const options: RemoteOptions = {
          ...browserstackConfig,
          capabilities: {
            ...browserstackConfig.capabilities,
            ...browserConfig,
          },
        };

        browser = await remote(options);
      }, 60000);

      afterAll(async () => {
        await browser?.deleteSession();
      });

      it('loads homepage', async () => {
        await browser.url('https://staging.myapp.com');
        const title = await browser.getTitle();
        expect(title).toContain('My App');
      });

      it('handles user interactions', async () => {
        await browser.url('https://staging.myapp.com');

        const button = await browser.$('[data-testid="cta-button"]');
        await button.click();

        const modal = await browser.$('[role="dialog"]');
        await modal.waitForDisplayed({ timeout: 5000 });

        expect(await modal.isDisplayed()).toBe(true);
      });
    });
  });
});
```

## WebdriverIO Configuration

```typescript
// wdio.conf.ts
import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./tests/browser/**/*.spec.ts'],
  maxInstances: 10,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['--headless', '--no-sandbox'],
      },
    },
    {
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: ['-headless'],
      },
    },
  ],
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost:3000',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec', ['html-nice', { outputDir: './reports/browser' }]],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
  services: ['chromedriver', 'geckodriver'],
};
```

## CI Browser Matrix

```yaml
# .github/workflows/browser-tests.yml
name: Browser Tests

on:
  pull_request:
    branches: [main]

jobs:
  playwright:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browser
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run tests
        run: npx playwright test --project=${{ matrix.browser }}

      - name: Upload results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.browser }}
          path: test-results/

  browserstack:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Setup BrowserStack Local
        uses: browserstack/github-actions/setup-local@master
        with:
          local-testing: start
          local-identifier: ${{ github.run_id }}

      - name: Run BrowserStack tests
        run: npm run test:browserstack
        env:
          BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
          BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
          BROWSERSTACK_LOCAL_IDENTIFIER: ${{ github.run_id }}

      - name: Stop BrowserStack Local
        uses: browserstack/github-actions/setup-local@master
        with:
          local-testing: stop
```

## CLAUDE.md Integration

```markdown
# Browser Testing

## Commands
- `npx playwright test` - Run all browsers
- `npx playwright test --project=chromium` - Chrome only
- `npx playwright test --project=firefox` - Firefox only
- `npx playwright test --project=webkit` - Safari only

## Browser Matrix
- Chrome (latest, latest-1)
- Firefox (latest, ESR)
- Safari (latest)
- Edge (latest)

## Mobile Testing
- Chrome Android (Pixel 5)
- Safari iOS (iPhone 13)
- Tablet (iPad Pro)

## Debugging
- `npx playwright test --headed` - See browser
- `npx playwright test --debug` - Step through
- `npx playwright show-report` - View report
```

## AI Suggestions

1. **Browser coverage analysis** - Track tested browser combinations
2. **Polyfill detection** - Identify needed polyfills
3. **CSS prefix analysis** - Check vendor prefix needs
4. **Feature detection** - Runtime feature checking
5. **Performance comparison** - Compare across browsers
6. **Error pattern detection** - Find browser-specific errors
7. **Test prioritization** - Focus on common browsers
8. **Parallel execution** - Optimize browser matrix
9. **Screenshot comparison** - Cross-browser visual diff
10. **Browser support documentation** - Auto-generate support matrix
