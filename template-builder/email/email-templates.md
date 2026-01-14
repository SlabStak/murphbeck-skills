# Email Templates

## Overview
Responsive email template system with MJML, Handlebars templating, CSS inlining, and preview functionality for consistent cross-client rendering.

## Quick Start

```bash
npm install mjml handlebars juice html-minifier-terser
```

## Full Implementation

### TypeScript Template Engine

```typescript
// email/template-engine.ts
import mjml2html from 'mjml';
import Handlebars from 'handlebars';
import juice from 'juice';
import { minify } from 'html-minifier-terser';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TemplateConfig {
  templatesDir: string;
  layoutsDir: string;
  partialsDir: string;
  cacheTemplates: boolean;
  minifyOutput: boolean;
  defaultLocale: string;
}

interface RenderOptions {
  data: Record<string, any>;
  locale?: string;
  preview?: boolean;
}

interface CompiledTemplate {
  subject: (data: any) => string;
  html: (data: any) => string;
  text?: (data: any) => string;
}

export class EmailTemplateEngine {
  private config: TemplateConfig;
  private templateCache: Map<string, CompiledTemplate> = new Map();
  private handlebars: typeof Handlebars;

  constructor(config: Partial<TemplateConfig> = {}) {
    this.config = {
      templatesDir: config.templatesDir || './email-templates',
      layoutsDir: config.layoutsDir || './email-templates/layouts',
      partialsDir: config.partialsDir || './email-templates/partials',
      cacheTemplates: config.cacheTemplates ?? true,
      minifyOutput: config.minifyOutput ?? true,
      defaultLocale: config.defaultLocale || 'en'
    };

    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  async initialize(): Promise<void> {
    await this.loadPartials();
  }

  private registerHelpers(): void {
    // Date formatting
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date);
      const formats: Record<string, string> = {
        short: d.toLocaleDateString(),
        long: d.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        time: d.toLocaleTimeString(),
        iso: d.toISOString()
      };
      return formats[format] || d.toLocaleDateString();
    });

    // Currency formatting
    this.handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });

    // Number formatting
    this.handlebars.registerHelper('formatNumber', (num: number) => {
      return new Intl.NumberFormat().format(num);
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('and', (a: any, b: any) => a && b);
    this.handlebars.registerHelper('or', (a: any, b: any) => a || b);

    // String helpers
    this.handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    this.handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str?.charAt(0).toUpperCase() + str?.slice(1);
    });
    this.handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str || str.length <= length) return str;
      return str.slice(0, length) + '...';
    });

    // Array helpers
    this.handlebars.registerHelper('first', (arr: any[]) => arr?.[0]);
    this.handlebars.registerHelper('last', (arr: any[]) => arr?.[arr.length - 1]);
    this.handlebars.registerHelper('length', (arr: any[]) => arr?.length || 0);
    this.handlebars.registerHelper('join', (arr: any[], separator: string) => arr?.join(separator));

    // Iteration with index
    this.handlebars.registerHelper('times', function(n: number, options: any) {
      let result = '';
      for (let i = 0; i < n; i++) {
        result += options.fn({ index: i, first: i === 0, last: i === n - 1 });
      }
      return result;
    });

    // Default value
    this.handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value ?? defaultValue;
    });

    // JSON stringify
    this.handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));

    // Pluralize
    this.handlebars.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });
  }

  private async loadPartials(): Promise<void> {
    try {
      const partialsDir = this.config.partialsDir;
      const files = await fs.readdir(partialsDir);

      for (const file of files) {
        if (file.endsWith('.mjml') || file.endsWith('.hbs') || file.endsWith('.html')) {
          const name = path.basename(file, path.extname(file));
          const content = await fs.readFile(path.join(partialsDir, file), 'utf-8');
          this.handlebars.registerPartial(name, content);
        }
      }
    } catch (error) {
      console.warn('Failed to load partials:', error);
    }
  }

  async compileTemplate(templateName: string): Promise<CompiledTemplate> {
    // Check cache
    if (this.config.cacheTemplates && this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(this.config.templatesDir, templateName);

    // Load template files
    const mjmlPath = `${templatePath}.mjml`;
    const subjectPath = `${templatePath}.subject.hbs`;
    const textPath = `${templatePath}.text.hbs`;

    const [mjmlContent, subjectContent, textContent] = await Promise.all([
      fs.readFile(mjmlPath, 'utf-8'),
      fs.readFile(subjectPath, 'utf-8').catch(() => '{{subject}}'),
      fs.readFile(textPath, 'utf-8').catch(() => null)
    ]);

    // Compile Handlebars in MJML
    const mjmlTemplate = this.handlebars.compile(mjmlContent);

    // Compile subject and text templates
    const subjectTemplate = this.handlebars.compile(subjectContent);
    const textTemplate = textContent ? this.handlebars.compile(textContent) : undefined;

    const compiled: CompiledTemplate = {
      subject: subjectTemplate,
      html: (data: any) => {
        // First render Handlebars
        const renderedMjml = mjmlTemplate(data);

        // Then convert MJML to HTML
        const { html, errors } = mjml2html(renderedMjml, {
          validationLevel: 'soft',
          minify: false // We'll minify later
        });

        if (errors.length > 0) {
          console.warn('MJML warnings:', errors);
        }

        return html;
      },
      text: textTemplate
    };

    if (this.config.cacheTemplates) {
      this.templateCache.set(templateName, compiled);
    }

    return compiled;
  }

  async render(
    templateName: string,
    options: RenderOptions
  ): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.compileTemplate(templateName);

    // Add common data
    const data = {
      ...options.data,
      currentYear: new Date().getFullYear(),
      locale: options.locale || this.config.defaultLocale,
      preview: options.preview || false
    };

    let html = template.html(data);
    const subject = template.subject(data);
    const text = template.text?.(data);

    // Inline CSS
    html = juice(html, {
      preserveMediaQueries: true,
      preserveFontFaces: true,
      preserveKeyFrames: true,
      applyWidthAttributes: true,
      applyHeightAttributes: true,
      preserveImportant: true
    });

    // Minify if enabled
    if (this.config.minifyOutput && !options.preview) {
      html = await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true
      });
    }

    return { subject, html, text };
  }

  // Preview template with sample data
  async preview(
    templateName: string,
    sampleData: Record<string, any>
  ): Promise<string> {
    const { html } = await this.render(templateName, {
      data: sampleData,
      preview: true
    });

    // Wrap in preview container
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Preview: ${templateName}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              font-family: system-ui, sans-serif;
            }
            .preview-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .preview-header {
              padding: 10px 20px;
              background: #333;
              color: white;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="preview-header">
            Template: ${templateName}
          </div>
          <div class="preview-container">
            ${html}
          </div>
        </body>
      </html>
    `;
  }

  // Clear template cache
  clearCache(): void {
    this.templateCache.clear();
  }

  // Register custom helper
  registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    this.handlebars.registerHelper(name, fn);
  }

  // Register custom partial
  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template);
  }
}
```

### Common Email Templates (MJML)

```html
<!-- email-templates/layouts/base.mjml -->
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="14px" line-height="1.5" color="#333333" />
      <mj-button background-color="#007bff" color="white" border-radius="4px" />
    </mj-attributes>
    <mj-style>
      .preheader { display: none !important; visibility: hidden; }
      a { color: #007bff; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <!-- Preheader -->
    <mj-section padding="0">
      <mj-column>
        <mj-text css-class="preheader">{{preheader}}</mj-text>
      </mj-column>
    </mj-section>

    <!-- Header -->
    <mj-section background-color="#ffffff" padding="20px 0">
      <mj-column>
        <mj-image src="{{logoUrl}}" alt="{{companyName}}" width="150px" />
      </mj-column>
    </mj-section>

    <!-- Content -->
    {{{content}}}

    <!-- Footer -->
    <mj-section background-color="#333333" padding="20px">
      <mj-column>
        <mj-social font-size="15px" icon-size="30px" mode="horizontal">
          {{#if socialLinks.twitter}}
          <mj-social-element name="twitter" href="{{socialLinks.twitter}}" />
          {{/if}}
          {{#if socialLinks.facebook}}
          <mj-social-element name="facebook" href="{{socialLinks.facebook}}" />
          {{/if}}
          {{#if socialLinks.linkedin}}
          <mj-social-element name="linkedin" href="{{socialLinks.linkedin}}" />
          {{/if}}
        </mj-social>
        <mj-text color="#ffffff" font-size="12px" align="center">
          {{companyName}}<br>
          {{companyAddress}}
        </mj-text>
        <mj-text color="#888888" font-size="11px" align="center">
          <a href="{{unsubscribeUrl}}" style="color: #888888;">Unsubscribe</a> |
          <a href="{{preferencesUrl}}" style="color: #888888;">Email Preferences</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

```html
<!-- email-templates/welcome.mjml -->
<mjml>
  <mj-head>
    <mj-title>Welcome to {{companyName}}</mj-title>
    <mj-preview>We're excited to have you on board!</mj-preview>
    {{> styles}}
  </mj-head>
  <mj-body background-color="#f4f4f4">
    {{> header}}

    <!-- Hero -->
    <mj-section background-color="#007bff" padding="40px 20px">
      <mj-column>
        <mj-text color="#ffffff" font-size="28px" font-weight="bold" align="center">
          Welcome, {{firstName}}!
        </mj-text>
        <mj-text color="#ffffff" font-size="16px" align="center">
          We're thrilled to have you join {{companyName}}.
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Main Content -->
    <mj-section background-color="#ffffff" padding="40px 20px">
      <mj-column>
        <mj-text font-size="16px">
          Hi {{firstName}},
        </mj-text>
        <mj-text>
          Thank you for signing up! We're excited to help you get the most out of {{companyName}}.
        </mj-text>
        <mj-text font-size="18px" font-weight="bold" padding-top="20px">
          Here's what you can do next:
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Steps -->
    <mj-section background-color="#ffffff" padding="0 20px">
      {{#each steps}}
      <mj-column width="33%">
        <mj-text align="center" font-size="40px" color="#007bff">
          {{this.icon}}
        </mj-text>
        <mj-text align="center" font-weight="bold">
          {{this.title}}
        </mj-text>
        <mj-text align="center" font-size="13px" color="#666666">
          {{this.description}}
        </mj-text>
      </mj-column>
      {{/each}}
    </mj-section>

    <!-- CTA -->
    <mj-section background-color="#ffffff" padding="30px 20px">
      <mj-column>
        <mj-button href="{{dashboardUrl}}" font-size="16px" padding="15px 30px">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>

    <!-- Help Section -->
    <mj-section background-color="#f9f9f9" padding="30px 20px">
      <mj-column>
        <mj-text align="center" font-size="16px" font-weight="bold">
          Need Help?
        </mj-text>
        <mj-text align="center" font-size="14px" color="#666666">
          Our support team is here for you. Check out our
          <a href="{{helpUrl}}">Help Center</a> or
          <a href="mailto:{{supportEmail}}">contact us</a>.
        </mj-text>
      </mj-column>
    </mj-section>

    {{> footer}}
  </mj-body>
</mjml>
```

```html
<!-- email-templates/order-confirmation.mjml -->
<mjml>
  <mj-head>
    <mj-title>Order Confirmation #{{orderNumber}}</mj-title>
    <mj-preview>Your order has been confirmed!</mj-preview>
    {{> styles}}
  </mj-head>
  <mj-body background-color="#f4f4f4">
    {{> header}}

    <!-- Order Confirmed Banner -->
    <mj-section background-color="#28a745" padding="30px 20px">
      <mj-column>
        <mj-text color="#ffffff" font-size="24px" font-weight="bold" align="center">
          ✓ Order Confirmed
        </mj-text>
        <mj-text color="#ffffff" align="center">
          Order #{{orderNumber}}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Order Summary -->
    <mj-section background-color="#ffffff" padding="30px 20px">
      <mj-column>
        <mj-text font-size="18px" font-weight="bold">
          Order Summary
        </mj-text>
        <mj-divider border-width="1px" border-color="#eeeeee" />
      </mj-column>
    </mj-section>

    <!-- Order Items -->
    {{#each items}}
    <mj-section background-color="#ffffff" padding="10px 20px">
      <mj-column width="20%">
        <mj-image src="{{this.imageUrl}}" alt="{{this.name}}" width="80px" />
      </mj-column>
      <mj-column width="50%">
        <mj-text font-weight="bold">{{this.name}}</mj-text>
        <mj-text font-size="12px" color="#666666">
          {{#if this.variant}}{{this.variant}}{{/if}}
          Qty: {{this.quantity}}
        </mj-text>
      </mj-column>
      <mj-column width="30%">
        <mj-text align="right" font-weight="bold">
          {{formatCurrency this.price}}
        </mj-text>
      </mj-column>
    </mj-section>
    {{/each}}

    <!-- Order Totals -->
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-divider border-width="1px" border-color="#eeeeee" />
        <mj-table>
          <tr>
            <td style="padding: 10px 0;">Subtotal</td>
            <td style="padding: 10px 0; text-align: right;">{{formatCurrency subtotal}}</td>
          </tr>
          {{#if discount}}
          <tr>
            <td style="padding: 10px 0; color: #28a745;">Discount</td>
            <td style="padding: 10px 0; text-align: right; color: #28a745;">-{{formatCurrency discount}}</td>
          </tr>
          {{/if}}
          <tr>
            <td style="padding: 10px 0;">Shipping</td>
            <td style="padding: 10px 0; text-align: right;">
              {{#if (eq shipping 0)}}Free{{else}}{{formatCurrency shipping}}{{/if}}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">Tax</td>
            <td style="padding: 10px 0; text-align: right;">{{formatCurrency tax}}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 18px;">
            <td style="padding: 15px 0; border-top: 2px solid #333;">Total</td>
            <td style="padding: 15px 0; border-top: 2px solid #333; text-align: right;">{{formatCurrency total}}</td>
          </tr>
        </mj-table>
      </mj-column>
    </mj-section>

    <!-- Shipping & Billing -->
    <mj-section background-color="#f9f9f9" padding="30px 20px">
      <mj-column width="50%">
        <mj-text font-weight="bold">Shipping Address</mj-text>
        <mj-text font-size="14px">
          {{shippingAddress.name}}<br>
          {{shippingAddress.street}}<br>
          {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zip}}<br>
          {{shippingAddress.country}}
        </mj-text>
      </mj-column>
      <mj-column width="50%">
        <mj-text font-weight="bold">Billing Address</mj-text>
        <mj-text font-size="14px">
          {{billingAddress.name}}<br>
          {{billingAddress.street}}<br>
          {{billingAddress.city}}, {{billingAddress.state}} {{billingAddress.zip}}<br>
          {{billingAddress.country}}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Track Order -->
    <mj-section background-color="#ffffff" padding="30px 20px">
      <mj-column>
        <mj-text align="center">
          We'll send you a shipping confirmation with tracking info once your order ships.
        </mj-text>
        <mj-button href="{{trackingUrl}}">
          Track Your Order
        </mj-button>
      </mj-column>
    </mj-section>

    {{> footer}}
  </mj-body>
</mjml>
```

```html
<!-- email-templates/password-reset.mjml -->
<mjml>
  <mj-head>
    <mj-title>Reset Your Password</mj-title>
    <mj-preview>Here's your password reset link</mj-preview>
    {{> styles}}
  </mj-head>
  <mj-body background-color="#f4f4f4">
    {{> header}}

    <mj-section background-color="#ffffff" padding="40px 20px">
      <mj-column>
        <mj-text font-size="24px" font-weight="bold" align="center">
          Reset Your Password
        </mj-text>
        <mj-text padding-top="20px">
          Hi {{firstName}},
        </mj-text>
        <mj-text>
          We received a request to reset your password. Click the button below to create a new password:
        </mj-text>
        <mj-button href="{{resetUrl}}" padding="30px 0">
          Reset Password
        </mj-button>
        <mj-text color="#666666" font-size="13px">
          This link will expire in {{expiryHours}} hours.
        </mj-text>
        <mj-divider border-width="1px" border-color="#eeeeee" padding="20px 0" />
        <mj-text color="#666666" font-size="13px">
          If you didn't request a password reset, you can safely ignore this email.
          Your password won't be changed.
        </mj-text>
        <mj-text color="#666666" font-size="12px" padding-top="20px">
          <strong>Security tip:</strong> Never share your password or this reset link with anyone.
        </mj-text>
      </mj-column>
    </mj-section>

    {{> footer}}
  </mj-body>
</mjml>
```

### Express API Routes

```typescript
// routes/templates.ts
import { Router, Request, Response } from 'express';
import { EmailTemplateEngine } from '../email/template-engine';

const router = Router();
const templateEngine = new EmailTemplateEngine({
  templatesDir: './email-templates',
  cacheTemplates: process.env.NODE_ENV === 'production'
});

// Initialize on startup
templateEngine.initialize();

// Render template
router.post('/render', async (req: Request, res: Response) => {
  try {
    const { template, data, locale } = req.body;
    const result = await templateEngine.render(template, { data, locale });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Preview template
router.get('/preview/:template', async (req: Request, res: Response) => {
  try {
    // Sample data for preview
    const sampleData = getSampleData(req.params.template);
    const html = await templateEngine.preview(req.params.template, sampleData);
    res.type('html').send(html);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List available templates
router.get('/list', async (req: Request, res: Response) => {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const templatesDir = './email-templates';
    const files = await fs.readdir(templatesDir);
    const templates = files
      .filter((f: string) => f.endsWith('.mjml') && !f.includes('layout'))
      .map((f: string) => f.replace('.mjml', ''));
    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cache
router.post('/cache/clear', (req: Request, res: Response) => {
  templateEngine.clearCache();
  res.json({ success: true });
});

// Sample data helper
function getSampleData(template: string): Record<string, any> {
  const common = {
    companyName: 'Acme Inc',
    logoUrl: 'https://via.placeholder.com/150x50?text=Logo',
    unsubscribeUrl: '#',
    preferencesUrl: '#',
    supportEmail: 'support@example.com',
    socialLinks: {
      twitter: 'https://twitter.com',
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com'
    }
  };

  const samples: Record<string, any> = {
    welcome: {
      ...common,
      firstName: 'John',
      dashboardUrl: '#',
      helpUrl: '#',
      steps: [
        { icon: '📝', title: 'Complete Profile', description: 'Add your details' },
        { icon: '⚙️', title: 'Configure Settings', description: 'Customize your experience' },
        { icon: '🚀', title: 'Start Using', description: 'Explore all features' }
      ]
    },
    'order-confirmation': {
      ...common,
      orderNumber: 'ORD-12345',
      items: [
        { name: 'Product One', variant: 'Size: M, Color: Blue', quantity: 2, price: 49.99, imageUrl: 'https://via.placeholder.com/80' },
        { name: 'Product Two', quantity: 1, price: 29.99, imageUrl: 'https://via.placeholder.com/80' }
      ],
      subtotal: 129.97,
      discount: 10,
      shipping: 0,
      tax: 10.40,
      total: 130.37,
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States'
      },
      billingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States'
      },
      trackingUrl: '#'
    },
    'password-reset': {
      ...common,
      firstName: 'John',
      resetUrl: '#',
      expiryHours: 24
    }
  };

  return samples[template] || common;
}

export default router;
```

### React Template Preview Component

```tsx
// components/EmailPreview.tsx
import React, { useState, useEffect } from 'react';

interface EmailPreviewProps {
  template: string;
  data?: Record<string, any>;
}

export function EmailPreview({ template, data }: EmailPreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreview();
  }, [template, data]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const url = data
        ? '/api/templates/render'
        : `/api/templates/preview/${template}`;

      const response = data
        ? await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template, data })
          })
        : await fetch(url);

      if (data) {
        const result = await response.json();
        setHtml(result.html);
      } else {
        setHtml(await response.text());
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerStyles: React.CSSProperties = {
    width: viewMode === 'mobile' ? '375px' : '100%',
    maxWidth: viewMode === 'desktop' ? '800px' : '375px',
    margin: '0 auto',
    transition: 'width 0.3s ease',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff'
  };

  return (
    <div className="email-preview">
      <div className="preview-toolbar">
        <div className="view-toggle">
          <button
            className={viewMode === 'desktop' ? 'active' : ''}
            onClick={() => setViewMode('desktop')}
          >
            Desktop
          </button>
          <button
            className={viewMode === 'mobile' ? 'active' : ''}
            onClick={() => setViewMode('mobile')}
          >
            Mobile
          </button>
        </div>
        <button onClick={loadPreview} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="preview-container" style={containerStyles}>
        {loading ? (
          <div className="loading">Loading preview...</div>
        ) : (
          <iframe
            srcDoc={html}
            title="Email Preview"
            style={{
              width: '100%',
              height: '600px',
              border: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
}
```

## Python Implementation

```python
# email_templates/template_engine.py
import os
from pathlib import Path
from typing import Optional, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape
import mjml
import premailer
from datetime import datetime


class EmailTemplateEngine:
    def __init__(
        self,
        templates_dir: str = './email-templates',
        cache_templates: bool = True
    ):
        self.templates_dir = Path(templates_dir)
        self.cache_templates = cache_templates
        self.template_cache: Dict[str, Any] = {}

        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )

        self._register_filters()

    def _register_filters(self):
        self.env.filters['format_date'] = self._format_date
        self.env.filters['format_currency'] = self._format_currency
        self.env.filters['format_number'] = self._format_number

    def _format_date(self, value, format='short'):
        if isinstance(value, str):
            value = datetime.fromisoformat(value)
        formats = {
            'short': value.strftime('%m/%d/%Y'),
            'long': value.strftime('%B %d, %Y'),
            'time': value.strftime('%I:%M %p'),
            'iso': value.isoformat()
        }
        return formats.get(format, formats['short'])

    def _format_currency(self, value, currency='USD'):
        symbols = {'USD': '$', 'EUR': '\u20ac', 'GBP': '\u00a3'}
        symbol = symbols.get(currency, '$')
        return f'{symbol}{value:,.2f}'

    def _format_number(self, value):
        return f'{value:,}'

    def render(
        self,
        template_name: str,
        data: Dict[str, Any],
        locale: str = 'en'
    ) -> Dict[str, str]:
        cache_key = f'{template_name}_{locale}'

        if self.cache_templates and cache_key in self.template_cache:
            mjml_template = self.template_cache[cache_key]
        else:
            mjml_path = self.templates_dir / f'{template_name}.mjml'
            mjml_content = mjml_path.read_text()

            mjml_template = self.env.from_string(mjml_content)

            if self.cache_templates:
                self.template_cache[cache_key] = mjml_template

        common_data = {
            'current_year': datetime.now().year,
            'locale': locale,
            **data
        }

        rendered_mjml = mjml_template.render(**common_data)
        html_result = mjml.mjml2html(rendered_mjml)
        html = html_result['html']

        html = premailer.transform(
            html,
            preserve_internal_links=True,
            strip_important=False
        )

        subject_path = self.templates_dir / f'{template_name}.subject.txt'
        subject = ''
        if subject_path.exists():
            subject_template = self.env.from_string(subject_path.read_text())
            subject = subject_template.render(**common_data)
        else:
            subject = data.get('subject', '')

        text = None
        text_path = self.templates_dir / f'{template_name}.text.txt'
        if text_path.exists():
            text_template = self.env.from_string(text_path.read_text())
            text = text_template.render(**common_data)

        return {
            'subject': subject.strip(),
            'html': html,
            'text': text
        }

    def preview(
        self,
        template_name: str,
        sample_data: Dict[str, Any]
    ) -> str:
        result = self.render(template_name, sample_data)

        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Preview: {template_name}</title>
            <style>
                body {{ margin: 0; padding: 20px; background: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            </style>
        </head>
        <body>
            <div class="container">{result['html']}</div>
        </body>
        </html>
        '''

    def clear_cache(self):
        self.template_cache.clear()
```

### FastAPI Routes

```python
# routes/template_routes.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional

from email_templates.template_engine import EmailTemplateEngine

router = APIRouter(prefix="/api/templates", tags=["Templates"])
template_engine = EmailTemplateEngine()


class RenderRequest(BaseModel):
    template: str
    data: Dict[str, Any]
    locale: str = 'en'


@router.post("/render")
async def render_template(request: RenderRequest):
    try:
        result = template_engine.render(
            request.template,
            request.data,
            request.locale
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preview/{template}", response_class=HTMLResponse)
async def preview_template(template: str):
    sample_data = get_sample_data(template)
    try:
        html = template_engine.preview(template, sample_data)
        return HTMLResponse(content=html)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache():
    template_engine.clear_cache()
    return {"success": True}


def get_sample_data(template: str) -> Dict[str, Any]:
    samples = {
        'welcome': {
            'first_name': 'John',
            'company_name': 'Acme Inc',
            'dashboard_url': '#'
        },
        'password-reset': {
            'first_name': 'John',
            'reset_url': '#',
            'expiry_hours': 24
        }
    }
    return samples.get(template, {})
```

## CLAUDE.md Integration

```markdown
## Email Templates

### Template Structure
Templates use MJML + Handlebars:
- `{template}.mjml` - Main MJML template
- `{template}.subject.hbs` - Subject line template
- `{template}.text.hbs` - Plain text version (optional)

### Available Templates
- welcome, password-reset, email-verification
- order-confirmation, shipping-notification
- invoice, receipt, subscription-renewal

### Template Helpers
- `{{formatDate date 'long'}}` - Date formatting
- `{{formatCurrency amount 'USD'}}` - Currency formatting
- `{{#each items}}...{{/each}}` - Iteration
- `{{#if condition}}...{{/if}}` - Conditionals

### Rendering
```typescript
const { subject, html, text } = await templateEngine.render('welcome', {
  data: { firstName: 'John', ... },
  locale: 'en'
});
```

### Preview
GET `/api/templates/preview/{templateName}` - Browser preview
Uses sample data for each template type

### Best Practices
- Always provide text fallback
- Test in multiple email clients
- Use MJML components for consistency
- Keep templates under 100KB after compilation
```

## AI Suggestions

1. **Add template versioning** - Track template changes with version history
2. **Build visual editor** - Drag-and-drop email builder
3. **Implement A/B variants** - Multiple versions for testing
4. **Add dynamic content blocks** - Personalized sections based on user data
5. **Create template analytics** - Track which templates perform best
6. **Build template validation** - Lint templates for common issues
7. **Add dark mode support** - Automatic dark mode styles
8. **Implement template inheritance** - Extend base templates
9. **Create email client testing** - Preview in Gmail, Outlook, etc.
10. **Add accessibility checking** - Ensure emails are accessible
