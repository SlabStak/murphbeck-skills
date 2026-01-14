# Accessibility Testing Templates

Production-ready accessibility testing patterns with axe-core, Pa11y, and WCAG validation.

## Overview

- **Automated Testing**: axe-core, Pa11y integration
- **Component Testing**: React, Vue accessibility tests
- **E2E Accessibility**: Playwright/Cypress a11y testing
- **WCAG Compliance**: Level A, AA, AAA validation

## Quick Start

```bash
# React/Jest
npm install -D @axe-core/react jest-axe @testing-library/jest-dom

# Playwright
npm install -D @axe-core/playwright

# Cypress
npm install -D cypress-axe axe-core

# Pa11y CLI
npm install -g pa11y pa11y-ci

# Python
pip install axe-selenium-python pytest-axe
```

## Jest + axe-core Testing

```typescript
// tests/a11y/components.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../../src/components/Button';
import { Form } from '../../src/components/Form';
import { Modal } from '../../src/components/Modal';
import { Navigation } from '../../src/components/Navigation';

expect.extend(toHaveNoViolations);

describe('Component Accessibility', () => {
  describe('Button', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Button onClick={() => {}}>Click me</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible name', async () => {
      const { container } = render(
        <Button onClick={() => {}} aria-label="Submit form">
          <span className="icon">✓</span>
        </Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('disabled button is accessible', async () => {
      const { container } = render(
        <Button disabled onClick={() => {}}>
          Disabled Button
        </Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form', () => {
    it('form fields have labels', async () => {
      const { container } = render(
        <Form onSubmit={() => {}}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" required />

          <button type="submit">Submit</button>
        </Form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('error messages are accessible', async () => {
      const { container } = render(
        <Form onSubmit={() => {}}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <span id="email-error" role="alert">
            Please enter a valid email
          </span>
        </Form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('required fields are indicated', async () => {
      const { container } = render(
        <Form onSubmit={() => {}}>
          <label htmlFor="name">
            Name <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input id="name" type="text" required aria-required="true" />
        </Form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Modal', () => {
    it('modal has proper ARIA attributes', async () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Confirm Action"
        >
          <p>Are you sure you want to proceed?</p>
          <button>Cancel</button>
          <button>Confirm</button>
        </Modal>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('focus is trapped in modal', async () => {
      const { container, getByRole } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <button>First</button>
          <button>Last</button>
        </Modal>
      );

      const modal = getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Navigation', () => {
    it('navigation is accessible', async () => {
      const { container } = render(
        <Navigation
          items={[
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ]}
          currentPath="/"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('current page is indicated', async () => {
      const { container, getByText } = render(
        <Navigation
          items={[
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
          ]}
          currentPath="/"
        />
      );

      const homeLink = getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('aria-current', 'page');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

```typescript
// tests/a11y/pages.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HomePage } from '../../src/pages/Home';
import { ProductPage } from '../../src/pages/Product';
import { CheckoutPage } from '../../src/pages/Checkout';

expect.extend(toHaveNoViolations);

describe('Page Accessibility', () => {
  describe('HomePage', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<HomePage />);

      const results = await axe(container, {
        rules: {
          // Customize rules if needed
          'color-contrast': { enabled: true },
          'heading-order': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('has proper heading hierarchy', async () => {
      const { container } = render(<HomePage />);

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingLevels = Array.from(headings).map((h) =>
        parseInt(h.tagName[1])
      );

      // Check h1 exists and is first
      expect(headingLevels[0]).toBe(1);

      // Check heading levels don't skip
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    it('has accessible images', async () => {
      const { container } = render(<HomePage />);

      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        // All images should have alt text or be decorative
        expect(
          img.hasAttribute('alt') || img.getAttribute('role') === 'presentation'
        ).toBe(true);
      });
    });
  });

  describe('ProductPage', () => {
    it('product cards are accessible', async () => {
      const { container } = render(
        <ProductPage
          product={{
            id: '1',
            name: 'Test Product',
            price: 99.99,
            description: 'A great product',
            image: '/product.jpg',
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CheckoutPage', () => {
    it('checkout form is accessible', async () => {
      const { container } = render(<CheckoutPage />);

      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'autocomplete-valid': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });
});
```

## Playwright Accessibility Testing

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.third-party-widget') // Exclude external content
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('checkout flow is accessible', async ({ page }) => {
    await page.goto('/products/1');
    await page.click('button:has-text("Add to Cart")');
    await page.goto('/checkout');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations:',
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('modal dialogs are accessible', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Open Modal")');

    // Wait for modal to be visible
    await page.waitForSelector('[role="dialog"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Check focus trap
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeFocused();

    // Tab through modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should still be in modal
    const focusedElement = await page.evaluate(() =>
      document.activeElement?.closest('[role="dialog"]')
    );
    expect(focusedElement).not.toBeNull();
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Navigate with keyboard only
    await page.keyboard.press('Tab');

    // First focusable element should be focused
    const firstFocusable = await page.evaluate(() =>
      document.activeElement?.tagName
    );
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocusable);

    // Skip link should be present
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeVisible({ visible: false }); // Hidden until focused

    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });
});

// Custom fixture for a11y testing
test.describe('Accessibility with custom rules', () => {
  test('color contrast meets WCAG AA', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        rules: {
          'color-contrast': { enabled: true },
        },
      })
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        rules: {
          'image-alt': { enabled: true },
        },
      })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

## Cypress Accessibility Testing

```typescript
// cypress/support/commands.ts
import 'cypress-axe';

declare global {
  namespace Cypress {
    interface Chainable {
      checkA11y(options?: {
        context?: string;
        skipFailures?: boolean;
      }): void;
    }
  }
}

Cypress.Commands.add('checkA11y', (options = {}) => {
  cy.injectAxe();

  const context = options.context || undefined;
  const axeOptions = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  };

  cy.checkA11y(context, axeOptions, (violations) => {
    if (violations.length > 0 && !options.skipFailures) {
      cy.task('log', `${violations.length} accessibility violations found`);

      violations.forEach((violation) => {
        const nodes = violation.nodes.map(n => n.html).join('\n');
        cy.task('log', `
          ${violation.id}: ${violation.description}
          Impact: ${violation.impact}
          Help: ${violation.helpUrl}
          Nodes: ${nodes}
        `);
      });
    }
  });
});
```

```typescript
// cypress/e2e/accessibility.cy.ts
describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('homepage has no detectable a11y violations', () => {
    cy.checkA11y();
  });

  it('navigation is keyboard accessible', () => {
    cy.get('body').tab();
    cy.focused().should('have.attr', 'href');

    // Navigate through menu
    cy.focused().type('{enter}');
    cy.url().should('not.eq', '/');
  });

  it('forms have proper labels', () => {
    cy.visit('/contact');
    cy.injectAxe();

    cy.checkA11y('form');

    // All inputs should have associated labels
    cy.get('input').each(($input) => {
      const id = $input.attr('id');
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      }
    });
  });

  it('color contrast is sufficient', () => {
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
  });

  it('interactive elements are focusable', () => {
    cy.get('button, a, input, select, textarea').each(($el) => {
      cy.wrap($el).should('not.have.attr', 'tabindex', '-1');
    });
  });

  it('skip link works correctly', () => {
    cy.get('body').tab();
    cy.focused().should('contain', 'Skip to main');
    cy.focused().type('{enter}');
    cy.focused().should('have.attr', 'id', 'main');
  });
});

describe('Dynamic Content Accessibility', () => {
  it('modal dialog is accessible', () => {
    cy.visit('/');
    cy.get('[data-testid="open-modal"]').click();

    cy.get('[role="dialog"]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y('[role="dialog"]');

    // Focus should be trapped
    cy.focused().should('be.within', '[role="dialog"]');

    // Escape closes modal
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('dropdown menu is accessible', () => {
    cy.visit('/');
    cy.get('[data-testid="dropdown-trigger"]').click();

    cy.get('[role="menu"]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y('[role="menu"]');

    // Arrow keys navigate menu
    cy.get('[role="menu"]').type('{downarrow}');
    cy.focused().should('have.attr', 'role', 'menuitem');
  });

  it('toast notifications are accessible', () => {
    cy.visit('/');
    cy.get('[data-testid="show-toast"]').click();

    // Toast should have role="alert" or aria-live
    cy.get('[role="alert"], [aria-live="polite"]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y('[role="alert"], [aria-live="polite"]');
  });
});
```

## Pa11y CI Configuration

```javascript
// .pa11yci.js
module.exports = {
  defaults: {
    standard: 'WCAG2AA',
    runners: ['axe', 'htmlcs'],
    chromeLaunchConfig: {
      args: ['--no-sandbox'],
    },
    timeout: 30000,
    wait: 1000,
    ignore: [
      // Ignore specific rules if needed
      // 'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail',
    ],
    hideElements: '.third-party-content',
  },
  urls: [
    {
      url: 'http://localhost:3000/',
      screenCapture: './reports/screenshots/home.png',
    },
    {
      url: 'http://localhost:3000/login',
      screenCapture: './reports/screenshots/login.png',
    },
    {
      url: 'http://localhost:3000/products',
      screenCapture: './reports/screenshots/products.png',
    },
    {
      url: 'http://localhost:3000/checkout',
      actions: [
        'set field #email to test@example.com',
        'click element [data-testid="continue"]',
        'wait for element #payment-form to be visible',
      ],
      screenCapture: './reports/screenshots/checkout.png',
    },
    {
      url: 'http://localhost:3000/dashboard',
      headers: {
        Cookie: 'session=test-session-id',
      },
      screenCapture: './reports/screenshots/dashboard.png',
    },
  ],
};
```

```yaml
# .github/workflows/a11y.yml
name: Accessibility Tests

on:
  pull_request:
    branches: [main]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Pa11y CI
        run: npx pa11y-ci

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: a11y-screenshots
          path: reports/screenshots/
```

## Python Accessibility Testing

```python
# tests/a11y/test_accessibility.py
"""Accessibility tests using axe-selenium-python."""
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from axe_selenium_python import Axe


@pytest.fixture
def driver():
    """Create Selenium WebDriver."""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()


@pytest.fixture
def axe(driver):
    """Create Axe instance."""
    return Axe(driver)


class TestAccessibility:
    """Accessibility test suite."""

    def test_homepage_accessibility(self, driver, axe):
        """Test homepage for accessibility violations."""
        driver.get("http://localhost:3000/")

        axe.inject()
        results = axe.run()

        violations = results["violations"]
        assert len(violations) == 0, self._format_violations(violations)

    def test_login_page_accessibility(self, driver, axe):
        """Test login page accessibility."""
        driver.get("http://localhost:3000/login")

        axe.inject()
        results = axe.run()

        assert len(results["violations"]) == 0

    def test_form_labels(self, driver, axe):
        """Test that all form inputs have labels."""
        driver.get("http://localhost:3000/contact")

        axe.inject()
        results = axe.run(options={
            "runOnly": ["label", "label-title-only"]
        })

        assert len(results["violations"]) == 0

    def test_color_contrast(self, driver, axe):
        """Test color contrast meets WCAG AA."""
        driver.get("http://localhost:3000/")

        axe.inject()
        results = axe.run(options={
            "runOnly": ["color-contrast"]
        })

        violations = results["violations"]
        assert len(violations) == 0, self._format_violations(violations)

    def test_keyboard_navigation(self, driver):
        """Test keyboard navigation works."""
        driver.get("http://localhost:3000/")

        # Tab to first interactive element
        body = driver.find_element(By.TAG_NAME, "body")
        body.send_keys("\t")

        active = driver.switch_to.active_element
        assert active.tag_name in ["a", "button", "input"]

        # Check skip link
        skip_link = driver.find_element(By.CSS_SELECTOR, 'a[href="#main"]')
        assert skip_link is not None

    def test_aria_landmarks(self, driver):
        """Test ARIA landmarks are present."""
        driver.get("http://localhost:3000/")

        # Check required landmarks
        main = driver.find_elements(By.CSS_SELECTOR, 'main, [role="main"]')
        assert len(main) == 1, "Page should have exactly one main landmark"

        nav = driver.find_elements(By.CSS_SELECTOR, 'nav, [role="navigation"]')
        assert len(nav) >= 1, "Page should have at least one navigation"

    def test_heading_structure(self, driver):
        """Test heading hierarchy is correct."""
        driver.get("http://localhost:3000/")

        headings = driver.find_elements(
            By.CSS_SELECTOR, "h1, h2, h3, h4, h5, h6"
        )

        # Should have exactly one h1
        h1_count = len([h for h in headings if h.tag_name == "h1"])
        assert h1_count == 1, f"Should have 1 h1, found {h1_count}"

        # Check heading order
        levels = [int(h.tag_name[1]) for h in headings]
        for i in range(1, len(levels)):
            diff = levels[i] - levels[i-1]
            assert diff <= 1, f"Heading level skipped from h{levels[i-1]} to h{levels[i]}"

    def _format_violations(self, violations):
        """Format violations for readable output."""
        messages = []
        for v in violations:
            nodes = ", ".join([n["html"][:50] for n in v["nodes"]])
            messages.append(f"{v['id']}: {v['description']} ({nodes})")
        return "\n".join(messages)
```

## CLAUDE.md Integration

```markdown
# Accessibility Testing

## Commands
- `npm run test:a11y` - Run accessibility tests
- `npx pa11y-ci` - Run Pa11y CI
- `npm run cypress:a11y` - Run Cypress a11y tests

## WCAG Levels
- Level A: Basic accessibility
- Level AA: Standard (recommended)
- Level AAA: Enhanced accessibility

## Common Issues
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Broken heading hierarchy
- Missing keyboard navigation

## Tools
- axe-core: Automated testing
- Pa11y: CI/CD integration
- WAVE: Browser extension
- VoiceOver/NVDA: Screen reader testing
```

## AI Suggestions

1. **Visual regression a11y** - Detect accessibility changes visually
2. **Screen reader testing** - Automated screen reader simulation
3. **Color blindness testing** - Test for different color vision types
4. **Motion sensitivity** - Test reduced motion preferences
5. **Text scaling** - Test with different font sizes
6. **High contrast mode** - Test Windows high contrast
7. **Touch target testing** - Verify touch target sizes
8. **Focus indicator testing** - Verify visible focus states
9. **Reading order testing** - Verify logical reading order
10. **ARIA validation** - Validate ARIA attribute usage
