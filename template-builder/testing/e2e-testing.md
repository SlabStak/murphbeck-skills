# End-to-End Testing Templates

Production-ready E2E testing patterns with Playwright and Cypress for web application testing.

## Overview

- **Playwright Testing**: Cross-browser E2E with auto-wait
- **Cypress Testing**: Developer-friendly E2E testing
- **Test Patterns**: Page Objects, fixtures, and utilities
- **CI Integration**: Parallel execution and reporting

## Quick Start

```bash
# Playwright
npm init playwright@latest
npx playwright test

# Cypress
npm install -D cypress
npx cypress open
```

## Playwright Testing

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    await use(page);
  },

  adminPage: async ({ page }, use) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'adminpass123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/admin');

    await use(page);
  },
});

export { expect } from '@playwright/test';
```

```typescript
// e2e/pages/login.page.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('email');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error-message');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoggedIn() {
    await this.page.waitForURL('/dashboard');
  }
}
```

```typescript
// e2e/pages/dashboard.page.ts
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly navigationLinks: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.userMenu = page.getByTestId('user-menu');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.navigationLinks = page.getByRole('navigation').getByRole('link');
    this.statsCards = page.getByTestId('stats-card');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('/login');
  }

  async navigateTo(linkName: string) {
    await this.page.getByRole('link', { name: linkName }).click();
  }

  async getStatsValue(cardName: string): Promise<string> {
    const card = this.page.getByTestId('stats-card').filter({ hasText: cardName });
    return await card.getByTestId('stats-value').textContent() || '';
  }
}
```

```typescript
// e2e/tests/auth.spec.ts
import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login('user@example.com', 'password123');

      await expect(page).toHaveURL('/dashboard');
      await expect(dashboardPage.welcomeMessage).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login('wrong@example.com', 'wrongpassword');

      await loginPage.expectError('Invalid email or password');
      await expect(page).toHaveURL('/login');
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.loginButton.click();

      await expect(page.getByText('Email is required')).toBeVisible();
      await expect(page.getByText('Password is required')).toBeVisible();
    });

    test('should navigate to forgot password', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.forgotPasswordLink.click();

      await expect(page).toHaveURL('/forgot-password');
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.logout();

      await expect(authenticatedPage).toHaveURL('/login');
    });

    test('should redirect to login when accessing protected route after logout', async ({
      authenticatedPage,
    }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.logout();
      await authenticatedPage.goto('/dashboard');

      await expect(authenticatedPage).toHaveURL(/\/login/);
    });
  });

  test.describe('Session Management', () => {
    test('should persist session across page reloads', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.reload();

      await expect(authenticatedPage).toHaveURL('/dashboard');
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
```

```typescript
// e2e/tests/user-management.spec.ts
import { test, expect } from '../fixtures/auth.fixture';

test.describe('User Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin/users');
  });

  test('should display list of users', async ({ adminPage }) => {
    const userTable = adminPage.getByTestId('users-table');
    await expect(userTable).toBeVisible();

    const rows = userTable.getByRole('row');
    await expect(rows).toHaveCount(await rows.count());
  });

  test('should create a new user', async ({ adminPage }) => {
    // Click create button
    await adminPage.getByRole('button', { name: 'Create User' }).click();

    // Fill form
    await adminPage.getByLabel('Email').fill('newuser@example.com');
    await adminPage.getByLabel('Name').fill('New User');
    await adminPage.getByLabel('Role').selectOption('user');

    // Submit
    await adminPage.getByRole('button', { name: 'Save' }).click();

    // Verify success
    await expect(adminPage.getByText('User created successfully')).toBeVisible();
    await expect(adminPage.getByText('newuser@example.com')).toBeVisible();
  });

  test('should edit an existing user', async ({ adminPage }) => {
    // Find user row and click edit
    const userRow = adminPage.getByRole('row').filter({ hasText: 'user@example.com' });
    await userRow.getByRole('button', { name: 'Edit' }).click();

    // Update name
    await adminPage.getByLabel('Name').fill('Updated Name');
    await adminPage.getByRole('button', { name: 'Save' }).click();

    // Verify update
    await expect(adminPage.getByText('User updated successfully')).toBeVisible();
    await expect(adminPage.getByText('Updated Name')).toBeVisible();
  });

  test('should delete a user with confirmation', async ({ adminPage }) => {
    // Find user row and click delete
    const userRow = adminPage.getByRole('row').filter({ hasText: 'delete@example.com' });
    await userRow.getByRole('button', { name: 'Delete' }).click();

    // Confirm deletion
    await adminPage.getByRole('button', { name: 'Confirm' }).click();

    // Verify deletion
    await expect(adminPage.getByText('User deleted successfully')).toBeVisible();
    await expect(adminPage.getByText('delete@example.com')).not.toBeVisible();
  });

  test('should filter users by search query', async ({ adminPage }) => {
    await adminPage.getByPlaceholder('Search users...').fill('admin');
    await adminPage.keyboard.press('Enter');

    const rows = adminPage.getByTestId('users-table').getByRole('row');
    for (const row of await rows.all()) {
      await expect(row).toContainText(/admin/i);
    }
  });

  test('should paginate user list', async ({ adminPage }) => {
    // Go to page 2
    await adminPage.getByRole('button', { name: 'Next' }).click();
    await expect(adminPage.getByText('Page 2')).toBeVisible();

    // Go back to page 1
    await adminPage.getByRole('button', { name: 'Previous' }).click();
    await expect(adminPage.getByText('Page 1')).toBeVisible();
  });
});
```

## Cypress Testing

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      // Task plugins
      on('task', {
        seedDatabase(data) {
          // Seed test database
          return null;
        },
        clearDatabase() {
          // Clear test database
          return null;
        },
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
```

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      seedData(fixture: string): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      waitForApi(alias: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login');
      cy.getByTestId('email').type(email);
      cy.getByTestId('password').type(password);
      cy.getByTestId('login-button').click();
      cy.url().should('include', '/dashboard');
    },
    {
      validate() {
        cy.getCookie('session').should('exist');
      },
    }
  );
});

Cypress.Commands.add('logout', () => {
  cy.getByTestId('user-menu').click();
  cy.contains('button', 'Logout').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('seedData', (fixture: string) => {
  cy.task('seedDatabase', fixture);
});

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`).its('response.statusCode').should('be.oneOf', [200, 201]);
});

export {};
```

```typescript
// cypress/e2e/checkout.cy.ts
describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/cart').as('getCart');
    cy.intercept('POST', '/api/orders').as('createOrder');
    cy.intercept('GET', '/api/products/*').as('getProduct');

    cy.login('user@example.com', 'password123');
  });

  it('should complete full checkout flow', () => {
    // Add product to cart
    cy.visit('/products/1');
    cy.waitForApi('getProduct');

    cy.getByTestId('add-to-cart').click();
    cy.getByTestId('cart-count').should('contain', '1');

    // Go to cart
    cy.getByTestId('cart-icon').click();
    cy.waitForApi('getCart');

    cy.url().should('include', '/cart');
    cy.getByTestId('cart-item').should('have.length', 1);

    // Proceed to checkout
    cy.getByTestId('checkout-button').click();
    cy.url().should('include', '/checkout');

    // Fill shipping info
    cy.getByTestId('shipping-address').type('123 Test Street');
    cy.getByTestId('shipping-city').type('Test City');
    cy.getByTestId('shipping-zip').type('12345');

    // Fill payment info
    cy.getByTestId('card-number').type('4242424242424242');
    cy.getByTestId('card-expiry').type('12/25');
    cy.getByTestId('card-cvc').type('123');

    // Place order
    cy.getByTestId('place-order').click();
    cy.waitForApi('createOrder');

    // Verify confirmation
    cy.url().should('include', '/order-confirmation');
    cy.getByTestId('order-number').should('be.visible');
    cy.contains('Thank you for your order').should('be.visible');
  });

  it('should show validation errors for invalid payment', () => {
    cy.visit('/checkout');

    // Fill invalid card
    cy.getByTestId('card-number').type('1234567890123456');
    cy.getByTestId('card-expiry').type('01/20'); // Expired
    cy.getByTestId('card-cvc').type('12'); // Too short

    cy.getByTestId('place-order').click();

    // Check errors
    cy.contains('Invalid card number').should('be.visible');
    cy.contains('Card has expired').should('be.visible');
    cy.contains('Invalid CVC').should('be.visible');
  });

  it('should apply discount code', () => {
    cy.visit('/cart');

    cy.getByTestId('discount-input').type('SAVE20');
    cy.getByTestId('apply-discount').click();

    cy.getByTestId('discount-applied').should('contain', '20% off');
    cy.getByTestId('total-price').should('contain', '$80.00'); // After 20% discount
  });

  it('should handle out of stock during checkout', () => {
    // Simulate out of stock response
    cy.intercept('POST', '/api/orders', {
      statusCode: 400,
      body: { error: 'Product out of stock' },
    });

    cy.visit('/checkout');
    // Fill form...
    cy.getByTestId('place-order').click();

    cy.contains('Product out of stock').should('be.visible');
    cy.getByTestId('return-to-cart').should('be.visible');
  });
});
```

## CLAUDE.md Integration

```markdown
# E2E Testing Integration

## Commands
- `npx playwright test` - Run Playwright tests
- `npx cypress run` - Run Cypress tests
- `npx playwright test --ui` - Playwright UI mode
- `npx cypress open` - Cypress interactive mode

## Test Patterns
- Page Object Model for maintainability
- Fixtures for auth and data setup
- API mocking for edge cases
- Visual regression with screenshots

## CI Configuration
- Run in parallel across browsers
- Upload test artifacts on failure
- Generate HTML and JUnit reports
```

## AI Suggestions

1. **Visual regression testing** - Add Percy or Chromatic integration
2. **Accessibility testing** - Add axe-core checks in E2E tests
3. **Performance metrics** - Capture Core Web Vitals during E2E
4. **Cross-browser matrix** - Test on more browser/device combinations
5. **API contract validation** - Verify API responses match contracts
6. **Test data factories** - Generate realistic test data
7. **Network condition testing** - Test under slow network conditions
8. **Mobile gesture testing** - Test swipe, pinch, zoom gestures
9. **Error boundary testing** - Test error recovery flows
10. **Analytics verification** - Verify analytics events fire correctly
