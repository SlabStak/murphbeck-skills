# Cookie Consent Template

GDPR and ePrivacy compliant cookie consent management with granular controls and consent recording.

## Overview

This template provides a complete cookie consent solution including banner UI, preference management, consent storage, and integration with analytics and advertising platforms.

## Quick Start

```bash
npm install uuid js-cookie
npm install -D typescript @types/node
```

## Cookie Consent Framework

```typescript
// src/cookies/consent-manager.ts
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

// Cookie categories
export type CookieCategory = 'essential' | 'functional' | 'analytics' | 'advertising' | 'social';

// Cookie definition
export interface CookieDefinition {
  name: string;
  category: CookieCategory;
  provider: string;
  purpose: string;
  expiry: string;
  type: 'first_party' | 'third_party';
}

// Consent state
export interface ConsentState {
  id: string;
  timestamp: Date;
  categories: Record<CookieCategory, boolean>;
  version: string;
}

// Consent configuration
export interface ConsentConfig {
  cookieName: string;
  cookieExpiry: number; // days
  version: string;
  categories: CookieCategory[];
  defaultState: Record<CookieCategory, boolean>;
  strictMode: boolean; // Require consent before any non-essential cookies
  geoTargeting?: {
    enabled: boolean;
    euOnly: boolean;
  };
}

// Cookie Consent Manager
export class CookieConsentManager {
  private config: ConsentConfig;
  private consent: ConsentState | null = null;
  private cookies: Map<string, CookieDefinition> = new Map();
  private listeners: ((consent: ConsentState) => void)[] = [];

  constructor(config: ConsentConfig) {
    this.config = config;
    this.loadConsent();
  }

  // Load existing consent
  private loadConsent(): void {
    const stored = Cookies.get(this.config.cookieName);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.consent = {
          ...parsed,
          timestamp: new Date(parsed.timestamp),
        };
      } catch {
        this.consent = null;
      }
    }
  }

  // Check if consent is needed
  needsConsent(): boolean {
    if (!this.consent) return true;
    if (this.consent.version !== this.config.version) return true;
    return false;
  }

  // Check if category is allowed
  isAllowed(category: CookieCategory): boolean {
    if (category === 'essential') return true;
    if (!this.consent) {
      return this.config.strictMode ? false : this.config.defaultState[category];
    }
    return this.consent.categories[category] ?? false;
  }

  // Update consent
  updateConsent(categories: Partial<Record<CookieCategory, boolean>>): ConsentState {
    const newConsent: ConsentState = {
      id: this.consent?.id || uuidv4(),
      timestamp: new Date(),
      categories: {
        essential: true, // Always true
        ...this.config.defaultState,
        ...this.consent?.categories,
        ...categories,
      },
      version: this.config.version,
    };

    this.consent = newConsent;

    // Store consent
    Cookies.set(this.config.cookieName, JSON.stringify(newConsent), {
      expires: this.config.cookieExpiry,
      sameSite: 'Lax',
    });

    // Notify listeners
    this.notifyListeners();

    // Remove non-consented cookies
    this.enforceConsent();

    return newConsent;
  }

  // Accept all
  acceptAll(): ConsentState {
    const allAccepted: Record<CookieCategory, boolean> = {
      essential: true,
      functional: true,
      analytics: true,
      advertising: true,
      social: true,
    };
    return this.updateConsent(allAccepted);
  }

  // Accept essential only
  acceptEssentialOnly(): ConsentState {
    const essentialOnly: Record<CookieCategory, boolean> = {
      essential: true,
      functional: false,
      analytics: false,
      advertising: false,
      social: false,
    };
    return this.updateConsent(essentialOnly);
  }

  // Register a cookie
  registerCookie(cookie: CookieDefinition): void {
    this.cookies.set(cookie.name, cookie);
  }

  // Get cookies by category
  getCookiesByCategory(category: CookieCategory): CookieDefinition[] {
    return Array.from(this.cookies.values()).filter((c) => c.category === category);
  }

  // Get all registered cookies
  getAllCookies(): CookieDefinition[] {
    return Array.from(this.cookies.values());
  }

  // Enforce consent by removing non-allowed cookies
  private enforceConsent(): void {
    for (const [name, cookie] of this.cookies) {
      if (!this.isAllowed(cookie.category)) {
        Cookies.remove(name);
        // Also remove from localStorage/sessionStorage if applicable
        localStorage.removeItem(name);
        sessionStorage.removeItem(name);
      }
    }
  }

  // Add consent change listener
  onConsentChange(listener: (consent: ConsentState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    if (this.consent) {
      for (const listener of this.listeners) {
        listener(this.consent);
      }
    }
  }

  // Get current consent state
  getConsent(): ConsentState | null {
    return this.consent;
  }

  // Withdraw consent
  withdrawConsent(): void {
    this.consent = null;
    Cookies.remove(this.config.cookieName);

    // Remove all non-essential cookies
    for (const [name, cookie] of this.cookies) {
      if (cookie.category !== 'essential') {
        Cookies.remove(name);
      }
    }
  }

  // Export consent for compliance
  exportConsent(): object {
    return {
      consent: this.consent,
      exportedAt: new Date().toISOString(),
      registeredCookies: Array.from(this.cookies.values()),
    };
  }
}
```

## Cookie Banner UI

```typescript
// src/cookies/banner.ts
import { CookieConsentManager, CookieCategory } from './consent-manager';

export interface BannerConfig {
  position: 'top' | 'bottom' | 'center';
  theme: 'light' | 'dark' | 'custom';
  layout: 'banner' | 'popup' | 'sidebar';
  showCategoryToggles: boolean;
  showCookieDetails: boolean;
  texts: BannerTexts;
  styles?: CustomStyles;
}

export interface BannerTexts {
  title: string;
  description: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  save: string;
  privacyPolicy: string;
  cookiePolicy: string;
  categories: Record<CookieCategory, { name: string; description: string }>;
}

export interface CustomStyles {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonRadius?: string;
  fontFamily?: string;
}

// Default texts
export const DEFAULT_TEXTS: BannerTexts = {
  title: 'We value your privacy',
  description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
  acceptAll: 'Accept All',
  rejectAll: 'Reject All',
  customize: 'Customize',
  save: 'Save Preferences',
  privacyPolicy: 'Privacy Policy',
  cookiePolicy: 'Cookie Policy',
  categories: {
    essential: {
      name: 'Essential',
      description: 'Required for the website to function. Cannot be disabled.',
    },
    functional: {
      name: 'Functional',
      description: 'Enable enhanced functionality and personalization.',
    },
    analytics: {
      name: 'Analytics',
      description: 'Help us understand how visitors interact with our website.',
    },
    advertising: {
      name: 'Advertising',
      description: 'Used to deliver relevant advertisements.',
    },
    social: {
      name: 'Social Media',
      description: 'Enable social media features and sharing.',
    },
  },
};

// Cookie Banner Component
export class CookieBanner {
  private manager: CookieConsentManager;
  private config: BannerConfig;
  private element: HTMLElement | null = null;
  private isCustomizing = false;

  constructor(manager: CookieConsentManager, config: Partial<BannerConfig> = {}) {
    this.manager = manager;
    this.config = {
      position: config.position || 'bottom',
      theme: config.theme || 'light',
      layout: config.layout || 'banner',
      showCategoryToggles: config.showCategoryToggles ?? true,
      showCookieDetails: config.showCookieDetails ?? false,
      texts: { ...DEFAULT_TEXTS, ...config.texts },
      styles: config.styles,
    };
  }

  // Show banner if needed
  show(): void {
    if (!this.manager.needsConsent()) return;
    this.render();
  }

  // Hide banner
  hide(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  // Render banner
  private render(): void {
    this.element = document.createElement('div');
    this.element.id = 'cookie-consent-banner';
    this.element.className = `cookie-banner cookie-banner--${this.config.position} cookie-banner--${this.config.theme}`;
    this.element.innerHTML = this.getHTML();
    this.applyStyles();
    this.attachEventListeners();
    document.body.appendChild(this.element);
  }

  private getHTML(): string {
    const texts = this.config.texts;

    if (this.isCustomizing) {
      return this.getCustomizeHTML();
    }

    return `
      <div class="cookie-banner__content">
        <div class="cookie-banner__text">
          <h3 class="cookie-banner__title">${texts.title}</h3>
          <p class="cookie-banner__description">${texts.description}</p>
          <div class="cookie-banner__links">
            <a href="/privacy" class="cookie-banner__link">${texts.privacyPolicy}</a>
            <a href="/cookies" class="cookie-banner__link">${texts.cookiePolicy}</a>
          </div>
        </div>
        <div class="cookie-banner__actions">
          <button class="cookie-banner__btn cookie-banner__btn--secondary" data-action="reject">
            ${texts.rejectAll}
          </button>
          <button class="cookie-banner__btn cookie-banner__btn--secondary" data-action="customize">
            ${texts.customize}
          </button>
          <button class="cookie-banner__btn cookie-banner__btn--primary" data-action="accept">
            ${texts.acceptAll}
          </button>
        </div>
      </div>
    `;
  }

  private getCustomizeHTML(): string {
    const texts = this.config.texts;
    const categories: CookieCategory[] = ['essential', 'functional', 'analytics', 'advertising', 'social'];
    const consent = this.manager.getConsent();

    const categoryHTML = categories.map((cat) => {
      const catTexts = texts.categories[cat];
      const isEssential = cat === 'essential';
      const isChecked = isEssential || consent?.categories[cat] || false;

      return `
        <div class="cookie-category">
          <div class="cookie-category__header">
            <label class="cookie-category__toggle">
              <input
                type="checkbox"
                name="cookie_${cat}"
                ${isChecked ? 'checked' : ''}
                ${isEssential ? 'disabled' : ''}
              />
              <span class="cookie-category__slider"></span>
            </label>
            <div class="cookie-category__info">
              <h4 class="cookie-category__name">${catTexts.name}</h4>
              <p class="cookie-category__description">${catTexts.description}</p>
            </div>
          </div>
          ${this.config.showCookieDetails ? this.getCookieDetailsHTML(cat) : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="cookie-banner__content cookie-banner__content--customize">
        <div class="cookie-banner__header">
          <h3 class="cookie-banner__title">Cookie Preferences</h3>
          <button class="cookie-banner__close" data-action="close">&times;</button>
        </div>
        <div class="cookie-banner__categories">
          ${categoryHTML}
        </div>
        <div class="cookie-banner__actions">
          <button class="cookie-banner__btn cookie-banner__btn--secondary" data-action="reject">
            ${texts.rejectAll}
          </button>
          <button class="cookie-banner__btn cookie-banner__btn--primary" data-action="save">
            ${texts.save}
          </button>
        </div>
      </div>
    `;
  }

  private getCookieDetailsHTML(category: CookieCategory): string {
    const cookies = this.manager.getCookiesByCategory(category);
    if (cookies.length === 0) return '';

    const cookieRows = cookies.map((c) => `
      <tr>
        <td>${c.name}</td>
        <td>${c.provider}</td>
        <td>${c.purpose}</td>
        <td>${c.expiry}</td>
      </tr>
    `).join('');

    return `
      <div class="cookie-category__details">
        <table class="cookie-table">
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            ${cookieRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private applyStyles(): void {
    if (!this.element) return;

    const styles = this.config.styles;
    if (!styles) return;

    if (styles.primaryColor) {
      this.element.style.setProperty('--cookie-primary', styles.primaryColor);
    }
    if (styles.backgroundColor) {
      this.element.style.setProperty('--cookie-bg', styles.backgroundColor);
    }
    if (styles.textColor) {
      this.element.style.setProperty('--cookie-text', styles.textColor);
    }
    if (styles.buttonRadius) {
      this.element.style.setProperty('--cookie-radius', styles.buttonRadius);
    }
    if (styles.fontFamily) {
      this.element.style.setProperty('--cookie-font', styles.fontFamily);
    }
  }

  private attachEventListeners(): void {
    if (!this.element) return;

    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'accept':
          this.manager.acceptAll();
          this.hide();
          break;
        case 'reject':
          this.manager.acceptEssentialOnly();
          this.hide();
          break;
        case 'customize':
          this.isCustomizing = true;
          this.element!.innerHTML = this.getHTML();
          this.attachEventListeners();
          break;
        case 'close':
          this.isCustomizing = false;
          this.element!.innerHTML = this.getHTML();
          this.attachEventListeners();
          break;
        case 'save':
          this.savePreferences();
          this.hide();
          break;
      }
    });
  }

  private savePreferences(): void {
    if (!this.element) return;

    const categories: Partial<Record<CookieCategory, boolean>> = {};
    const checkboxes = this.element.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((cb) => {
      const input = cb as HTMLInputElement;
      const category = input.name.replace('cookie_', '') as CookieCategory;
      categories[category] = input.checked;
    });

    this.manager.updateConsent(categories);
  }

  // Get CSS
  static getStyles(): string {
    return `
      .cookie-banner {
        --cookie-primary: #2563eb;
        --cookie-bg: #ffffff;
        --cookie-text: #1f2937;
        --cookie-border: #e5e7eb;
        --cookie-radius: 8px;
        --cookie-font: system-ui, -apple-system, sans-serif;

        position: fixed;
        left: 0;
        right: 0;
        z-index: 99999;
        font-family: var(--cookie-font);
        color: var(--cookie-text);
      }

      .cookie-banner--bottom { bottom: 0; }
      .cookie-banner--top { top: 0; }
      .cookie-banner--center {
        top: 50%;
        left: 50%;
        right: auto;
        transform: translate(-50%, -50%);
        max-width: 600px;
        border-radius: var(--cookie-radius);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .cookie-banner--dark {
        --cookie-bg: #1f2937;
        --cookie-text: #f9fafb;
        --cookie-border: #374151;
      }

      .cookie-banner__content {
        background: var(--cookie-bg);
        padding: 24px;
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid var(--cookie-border);
      }

      .cookie-banner__title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .cookie-banner__description {
        margin: 0 0 12px 0;
        font-size: 14px;
        line-height: 1.5;
        opacity: 0.9;
      }

      .cookie-banner__links {
        display: flex;
        gap: 16px;
      }

      .cookie-banner__link {
        font-size: 14px;
        color: var(--cookie-primary);
        text-decoration: none;
      }

      .cookie-banner__actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .cookie-banner__btn {
        padding: 10px 20px;
        border-radius: var(--cookie-radius);
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: opacity 0.2s;
      }

      .cookie-banner__btn:hover {
        opacity: 0.9;
      }

      .cookie-banner__btn--primary {
        background: var(--cookie-primary);
        color: white;
      }

      .cookie-banner__btn--secondary {
        background: transparent;
        border: 1px solid var(--cookie-border);
        color: var(--cookie-text);
      }

      .cookie-category {
        padding: 16px;
        border: 1px solid var(--cookie-border);
        border-radius: var(--cookie-radius);
        margin-bottom: 12px;
      }

      .cookie-category__header {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }

      .cookie-category__toggle {
        position: relative;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
      }

      .cookie-category__toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .cookie-category__slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--cookie-border);
        transition: 0.3s;
        border-radius: 24px;
      }

      .cookie-category__slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      .cookie-category__toggle input:checked + .cookie-category__slider {
        background-color: var(--cookie-primary);
      }

      .cookie-category__toggle input:checked + .cookie-category__slider:before {
        transform: translateX(20px);
      }

      .cookie-category__toggle input:disabled + .cookie-category__slider {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .cookie-category__name {
        margin: 0 0 4px 0;
        font-size: 15px;
        font-weight: 600;
      }

      .cookie-category__description {
        margin: 0;
        font-size: 13px;
        opacity: 0.8;
      }

      .cookie-table {
        width: 100%;
        margin-top: 12px;
        font-size: 12px;
        border-collapse: collapse;
      }

      .cookie-table th,
      .cookie-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid var(--cookie-border);
      }

      @media (max-width: 640px) {
        .cookie-banner__content {
          flex-direction: column;
          align-items: stretch;
        }

        .cookie-banner__actions {
          flex-direction: column;
        }

        .cookie-banner__btn {
          width: 100%;
        }
      }
    `;
  }
}
```

## Usage Example

```typescript
import { CookieConsentManager } from './cookies/consent-manager';
import { CookieBanner } from './cookies/banner';

// Initialize manager
const manager = new CookieConsentManager({
  cookieName: 'consent_preferences',
  cookieExpiry: 365,
  version: '1.0',
  categories: ['essential', 'functional', 'analytics', 'advertising'],
  defaultState: {
    essential: true,
    functional: false,
    analytics: false,
    advertising: false,
    social: false,
  },
  strictMode: true,
});

// Register cookies
manager.registerCookie({
  name: '_ga',
  category: 'analytics',
  provider: 'Google Analytics',
  purpose: 'Used to distinguish users',
  expiry: '2 years',
  type: 'third_party',
});

manager.registerCookie({
  name: 'session_id',
  category: 'essential',
  provider: 'First Party',
  purpose: 'Session management',
  expiry: 'Session',
  type: 'first_party',
});

// Initialize banner
const banner = new CookieBanner(manager, {
  position: 'bottom',
  theme: 'light',
  showCategoryToggles: true,
});

// Add styles
const style = document.createElement('style');
style.textContent = CookieBanner.getStyles();
document.head.appendChild(style);

// Show banner
banner.show();

// Listen for consent changes
manager.onConsentChange((consent) => {
  if (consent.categories.analytics) {
    // Initialize analytics
    console.log('Analytics enabled');
  }
});
```

## CLAUDE.md Integration

```markdown
## Cookie Consent

GDPR-compliant cookie consent management.

### Categories
- Essential: Always enabled
- Functional: Enhanced features
- Analytics: Usage tracking
- Advertising: Ad targeting
- Social: Social media integration

### Usage
```typescript
const manager = new CookieConsentManager(config);
const banner = new CookieBanner(manager);
banner.show();
```

### Checking Consent
```typescript
if (manager.isAllowed('analytics')) {
  // Load analytics
}
```
```

## AI Suggestions

1. **Add geo-targeting** - Show only in required regions
2. **Implement consent logging** - Server-side consent records
3. **Add A/B testing** - Test banner variations
4. **Create analytics integration** - Auto-block scripts
5. **Add cookie scanning** - Detect undeclared cookies
6. **Implement consent sync** - Cross-subdomain consent
7. **Add accessibility** - WCAG compliance
8. **Create admin dashboard** - Consent analytics
9. **Add cookie policy generator** - Auto-generate policy
10. **Implement TCF support** - IAB Transparency framework
