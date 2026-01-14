# Astro Documentation Site Template

## Overview
Fast, content-focused documentation site with full-text search, versioning, and multi-language support.

## Quick Start

```bash
# Create project with Starlight (official docs theme)
npm create astro@latest my-docs -- --template starlight

cd my-docs

# Or manual setup
npm create astro@latest my-docs
cd my-docs

# Install documentation dependencies
npm install @astrojs/starlight
npm install @astrojs/mdx @astrojs/sitemap
npm install astro-expressive-code
npm install sharp

# Search (optional)
npm install @pagefind/default-ui
```

## Project Structure

```
src/
├── content/
│   ├── docs/
│   │   ├── index.mdx                   # Homepage
│   │   ├── getting-started/
│   │   │   ├── installation.mdx
│   │   │   ├── configuration.mdx
│   │   │   └── quick-start.mdx
│   │   ├── guides/
│   │   │   ├── basic-usage.mdx
│   │   │   ├── advanced-features.mdx
│   │   │   └── best-practices.mdx
│   │   ├── api/
│   │   │   ├── overview.mdx
│   │   │   ├── endpoints.mdx
│   │   │   └── authentication.mdx
│   │   └── reference/
│   │       ├── configuration.mdx
│   │       └── cli.mdx
│   └── config.ts                       # Content collections
├── components/
│   ├── Card.astro
│   ├── CardGrid.astro
│   ├── Tabs.astro
│   ├── TabItem.astro
│   ├── Badge.astro
│   └── LinkCard.astro
├── styles/
│   └── custom.css
└── pages/
    └── [...slug].astro                 # Catch-all for custom pages
```

## Astro Configuration

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://docs.yoursite.com',
  integrations: [
    starlight({
      title: 'My Documentation',
      description: 'Documentation for My Product',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: true,
      },
      social: {
        github: 'https://github.com/yourorg/yourrepo',
        twitter: 'https://twitter.com/yourhandle',
        discord: 'https://discord.gg/yourserver',
      },
      editLink: {
        baseUrl: 'https://github.com/yourorg/docs/edit/main/',
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'script',
          attrs: {
            src: 'https://plausible.io/js/script.js',
            'data-domain': 'docs.yoursite.com',
            defer: true,
          },
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Configuration', link: '/getting-started/configuration/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
          ],
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'API Reference',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/api/overview/' },
            { label: 'Endpoints', link: '/api/endpoints/' },
            { label: 'Authentication', link: '/api/authentication/' },
          ],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        es: {
          label: 'Español',
          lang: 'es',
        },
        ja: {
          label: '日本語',
          lang: 'ja',
        },
      },
      defaultLocale: 'root',
      pagination: true,
      lastUpdated: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      components: {
        // Override default components
        // Header: './src/components/Header.astro',
      },
    }),
    sitemap(),
  ],
});
```

## Environment Variables

```bash
# .env
# Site
PUBLIC_SITE_URL="https://docs.yoursite.com"

# Search (if using Algolia)
PUBLIC_ALGOLIA_APP_ID="your-app-id"
PUBLIC_ALGOLIA_SEARCH_KEY="your-search-key"
PUBLIC_ALGOLIA_INDEX_NAME="docs"

# Analytics
PUBLIC_PLAUSIBLE_DOMAIN="docs.yoursite.com"
```

## Content Collections

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    schema: docsSchema({
      extend: z.object({
        // Custom frontmatter fields
        version: z.string().optional(),
        platform: z.enum(['web', 'mobile', 'desktop', 'all']).default('all'),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      }),
    }),
  }),
};
```

## Custom Components

### Card Grid
```astro
---
// src/components/CardGrid.astro
interface Props {
  columns?: 2 | 3 | 4;
}

const { columns = 3 } = Astro.props;

const gridClass = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}[columns];
---

<div class={`grid gap-4 ${gridClass} not-content`}>
  <slot />
</div>
```

### Feature Card
```astro
---
// src/components/Card.astro
interface Props {
  title: string;
  icon?: string;
  href?: string;
}

const { title, icon, href } = Astro.props;
const Tag = href ? 'a' : 'div';
---

<Tag
  href={href}
  class:list={[
    'block p-6 rounded-xl border bg-card transition-all',
    href && 'hover:border-primary hover:shadow-md',
  ]}
>
  {icon && (
    <div class="text-3xl mb-4">{icon}</div>
  )}
  <h3 class="text-lg font-semibold mb-2">{title}</h3>
  <div class="text-sm text-muted-foreground">
    <slot />
  </div>
</Tag>
```

### Tabs Component
```astro
---
// src/components/Tabs.astro
interface Props {
  items: string[];
}

const { items } = Astro.props;
---

<div class="tabs-container not-content" data-tabs>
  <div class="tabs-list flex border-b">
    {items.map((item, index) => (
      <button
        class:list={[
          'tabs-trigger px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
          index === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
        ]}
        data-tab-trigger={index}
      >
        {item}
      </button>
    ))}
  </div>
  <div class="tabs-content">
    <slot />
  </div>
</div>

<script>
  document.querySelectorAll('[data-tabs]').forEach((container) => {
    const triggers = container.querySelectorAll('[data-tab-trigger]');
    const panels = container.querySelectorAll('[data-tab-panel]');

    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', () => {
        // Update triggers
        triggers.forEach((t, i) => {
          t.classList.toggle('border-primary', i === index);
          t.classList.toggle('text-primary', i === index);
          t.classList.toggle('border-transparent', i !== index);
          t.classList.toggle('text-muted-foreground', i !== index);
        });

        // Update panels
        panels.forEach((panel, i) => {
          panel.classList.toggle('hidden', i !== index);
        });
      });
    });
  });
</script>
```

### Tab Item
```astro
---
// src/components/TabItem.astro
interface Props {
  label: string;
}

const { label } = Astro.props;
---

<div data-tab-panel class="py-4 first:block hidden">
  <slot />
</div>
```

### Code Group
```astro
---
// src/components/CodeGroup.astro
interface Props {
  titles: string[];
}

const { titles } = Astro.props;
---

<div class="code-group not-content rounded-lg border overflow-hidden">
  <div class="flex bg-muted border-b">
    {titles.map((title, index) => (
      <button
        class:list={[
          'px-4 py-2 text-sm font-medium transition-colors',
          index === 0 ? 'bg-background' : 'hover:bg-background/50',
        ]}
        data-code-tab={index}
      >
        {title}
      </button>
    ))}
  </div>
  <div class="code-panels">
    <slot />
  </div>
</div>

<script>
  document.querySelectorAll('.code-group').forEach((group) => {
    const tabs = group.querySelectorAll('[data-code-tab]');
    const panels = group.querySelectorAll('.code-panel');

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t, i) => {
          t.classList.toggle('bg-background', i === index);
        });
        panels.forEach((panel, i) => {
          panel.classList.toggle('hidden', i !== index);
        });
      });
    });
  });
</script>
```

### Callout/Aside
```astro
---
// src/components/Callout.astro
interface Props {
  type?: 'note' | 'tip' | 'warning' | 'danger' | 'info';
  title?: string;
}

const { type = 'note', title } = Astro.props;

const styles = {
  note: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  tip: 'border-green-500 bg-green-50 dark:bg-green-950',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  danger: 'border-red-500 bg-red-50 dark:bg-red-950',
  info: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
};

const icons = {
  note: '📝',
  tip: '💡',
  warning: '⚠️',
  danger: '🚨',
  info: 'ℹ️',
};

const defaultTitles = {
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
  danger: 'Danger',
  info: 'Info',
};
---

<aside class={`my-6 rounded-lg border-l-4 p-4 ${styles[type]} not-content`}>
  <div class="flex items-center gap-2 font-semibold mb-2">
    <span>{icons[type]}</span>
    <span>{title || defaultTitles[type]}</span>
  </div>
  <div class="text-sm">
    <slot />
  </div>
</aside>
```

## Example Documentation Page

```mdx
---
title: Getting Started
description: Learn how to install and configure My Product
sidebar:
  order: 1
  badge:
    text: New
    variant: tip
---

import { Card, CardGrid, Tabs, TabItem, Callout } from '@components';

# Getting Started

Welcome to My Product! This guide will help you get up and running quickly.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18 or later
- npm or pnpm
- Git

<Callout type="tip">
  We recommend using pnpm for faster installations.
</Callout>

## Installation

<Tabs items={['npm', 'pnpm', 'yarn']}>
  <TabItem label="npm">
    ```bash
    npm install my-product
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```bash
    pnpm add my-product
    ```
  </TabItem>
  <TabItem label="yarn">
    ```bash
    yarn add my-product
    ```
  </TabItem>
</Tabs>

## Quick Start

1. Create a configuration file:

```js title="my-product.config.js"
export default {
  // Your configuration options
  name: 'My App',
  debug: process.env.NODE_ENV === 'development',
};
```

2. Initialize the product:

```js title="src/index.js" {3-5}
import { init } from 'my-product';
import config from './my-product.config.js';

const app = init(config);
app.start();
```

## Features

<CardGrid columns={2}>
  <Card title="Fast" icon="⚡">
    Built for speed with optimized performance out of the box.
  </Card>
  <Card title="Secure" icon="🔒">
    Enterprise-grade security with built-in protection.
  </Card>
  <Card title="Flexible" icon="🔧">
    Highly configurable to match your exact needs.
  </Card>
  <Card title="Scalable" icon="📈">
    Grows with your application without compromises.
  </Card>
</CardGrid>

## Next Steps

- [Configuration Guide](/guides/configuration) - Learn about all configuration options
- [API Reference](/api/overview) - Explore the complete API
- [Examples](/examples) - See real-world usage examples

<Callout type="info" title="Need Help?">
  Join our [Discord community](https://discord.gg/example) for support and discussions.
</Callout>
```

## Search Integration

### Pagefind (Static Search)
```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      pagefind: true, // Built-in with Starlight
    }),
  ],
});
```

### Algolia DocSearch
```astro
---
// src/components/Search.astro
---

<div id="docsearch"></div>

<script>
  import docsearch from '@docsearch/js';
  import '@docsearch/css';

  docsearch({
    appId: import.meta.env.PUBLIC_ALGOLIA_APP_ID,
    apiKey: import.meta.env.PUBLIC_ALGOLIA_SEARCH_KEY,
    indexName: import.meta.env.PUBLIC_ALGOLIA_INDEX_NAME,
    container: '#docsearch',
    searchParameters: {
      facetFilters: ['version:latest'],
    },
  });
</script>
```

## Versioning

### Version Selector Component
```astro
---
// src/components/VersionSelector.astro
interface Props {
  versions: string[];
  current: string;
}

const { versions, current } = Astro.props;
---

<div class="version-selector">
  <select
    class="px-3 py-1 rounded border bg-background"
    onchange="window.location.href = this.value"
  >
    {versions.map((version) => (
      <option
        value={`/${version}/`}
        selected={version === current}
      >
        {version === 'latest' ? `${version} (current)` : version}
      </option>
    ))}
  </select>
</div>
```

### Version Configuration
```typescript
// src/lib/versions.ts
export const versions = ['latest', 'v2', 'v1'] as const;
export type Version = typeof versions[number];

export function getVersionFromUrl(url: string): Version {
  const match = url.match(/^\/(v\d+|latest)\//);
  return (match?.[1] as Version) || 'latest';
}

export function getDocsPath(version: Version, path: string): string {
  return version === 'latest' ? path : `/${version}${path}`;
}
```

## Custom Styling

```css
/* src/styles/custom.css */
:root {
  --sl-color-accent-low: #1e3a5f;
  --sl-color-accent: #3b82f6;
  --sl-color-accent-high: #93c5fd;
  --sl-color-white: #ffffff;
  --sl-color-gray-1: #f8fafc;
  --sl-color-gray-2: #e2e8f0;
  --sl-color-gray-3: #cbd5e1;
  --sl-color-gray-4: #94a3b8;
  --sl-color-gray-5: #64748b;
  --sl-color-gray-6: #475569;
  --sl-color-black: #0f172a;
}

/* Custom code block styling */
.expressive-code {
  --ec-codeFontSize: 0.875rem;
  --ec-uiFontSize: 0.75rem;
}

/* Card hover effects */
.card-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Custom sidebar styling */
.sidebar-content {
  scrollbar-width: thin;
  scrollbar-color: var(--sl-color-gray-3) transparent;
}

/* Table of contents highlighting */
.toc-link[aria-current='true'] {
  color: var(--sl-color-accent);
  font-weight: 500;
}
```

## API Documentation Generation

```typescript
// scripts/generate-api-docs.ts
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Parameter[];
  responses: Response[];
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Response {
  status: number;
  description: string;
  schema?: string;
}

function generateEndpointDoc(endpoint: APIEndpoint): string {
  return `---
title: ${endpoint.method} ${endpoint.path}
description: ${endpoint.description}
---

# ${endpoint.method} ${endpoint.path}

${endpoint.description}

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
${endpoint.parameters.map(p =>
  `| ${p.name} | \`${p.type}\` | ${p.required ? 'Yes' : 'No'} | ${p.description} |`
).join('\n')}

## Responses

${endpoint.responses.map(r => `
### ${r.status}

${r.description}

${r.schema ? `\`\`\`json\n${r.schema}\n\`\`\`` : ''}
`).join('\n')}
`;
}

// Generate docs from OpenAPI spec
async function generateAPIDocs(openApiSpec: any) {
  const outputDir = join(process.cwd(), 'src/content/docs/api');
  mkdirSync(outputDir, { recursive: true });

  for (const [path, methods] of Object.entries(openApiSpec.paths)) {
    for (const [method, spec] of Object.entries(methods as any)) {
      const endpoint: APIEndpoint = {
        method: method.toUpperCase(),
        path,
        description: spec.summary || spec.description,
        parameters: (spec.parameters || []).map((p: any) => ({
          name: p.name,
          type: p.schema?.type || 'string',
          required: p.required || false,
          description: p.description || '',
        })),
        responses: Object.entries(spec.responses || {}).map(([status, r]: [string, any]) => ({
          status: parseInt(status),
          description: r.description,
          schema: r.content?.['application/json']?.schema
            ? JSON.stringify(r.content['application/json'].schema, null, 2)
            : undefined,
        })),
      };

      const filename = `${method}-${path.replace(/\//g, '-').replace(/[{}]/g, '')}.mdx`;
      writeFileSync(join(outputDir, filename), generateEndpointDoc(endpoint));
    }
  }
}
```

## Testing

```typescript
// tests/docs.test.ts
import { getCollection } from 'astro:content';
import { describe, it, expect } from 'vitest';

describe('Documentation', () => {
  it('should have valid frontmatter in all docs', async () => {
    const docs = await getCollection('docs');

    for (const doc of docs) {
      expect(doc.data.title).toBeDefined();
      expect(doc.data.title.length).toBeGreaterThan(0);
    }
  });

  it('should have no broken internal links', async () => {
    const docs = await getCollection('docs');
    const slugs = new Set(docs.map((d) => d.slug));

    for (const doc of docs) {
      const internalLinks = doc.body.match(/\]\(\/[^)]+\)/g) || [];

      for (const link of internalLinks) {
        const path = link.slice(2, -1).replace(/\/$/, '');
        // Check if path exists
        expect(
          slugs.has(path) || path.startsWith('http'),
          `Broken link in ${doc.slug}: ${path}`
        ).toBe(true);
      }
    }
  });
});
```

## CLAUDE.md Integration

```markdown
# Documentation Site

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build static site
- `npm run preview` - Preview production build

## Content Structure
- Docs: `src/content/docs/`
- Components: `src/components/`
- Styles: `src/styles/custom.css`

## Adding Documentation
1. Create MDX file in `src/content/docs/`
2. Add frontmatter (title, description)
3. Use custom components as needed
4. Update sidebar in `astro.config.mjs` if needed

## Custom Components
- `<Card>` - Feature card
- `<CardGrid>` - Grid layout for cards
- `<Tabs>` / `<TabItem>` - Tabbed content
- `<Callout>` - Note/tip/warning boxes
- `<CodeGroup>` - Multiple code blocks

## Search
- Pagefind for static search (built-in)
- Configure in astro.config.mjs
```

## AI Suggestions

1. **Intelligent Search** - Implement semantic search that understands context and synonyms
2. **Content Suggestions** - AI-powered "You might also like" recommendations based on reading patterns
3. **Auto-Generated Summaries** - Create TL;DR sections automatically for long documentation pages
4. **Link Validation** - Automated broken link detection and fix suggestions
5. **Reading Time Optimization** - Suggest content restructuring for better readability
6. **Translation Assistance** - AI-powered translation suggestions for multi-language docs
7. **Code Example Generation** - Auto-generate code examples in multiple languages
8. **FAQ Generation** - Automatically create FAQ pages from common search queries
9. **Changelog Integration** - Auto-generate "What's New" pages from git commits
10. **User Journey Optimization** - Analyze navigation patterns and suggest documentation restructuring
