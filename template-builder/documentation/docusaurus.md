# Docusaurus Documentation Template

## Overview
Complete Docusaurus setup for documentation websites with versioning, i18n, search, and custom components.

## Quick Start
```bash
npx create-docusaurus@latest my-docs classic --typescript
cd my-docs
npm install @docusaurus/plugin-content-docs @docusaurus/theme-search-algolia
```

## Docusaurus Configuration

### docusaurus.config.ts
```typescript
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'My Project',
  tagline: 'Documentation for My Project',
  favicon: 'img/favicon.ico',
  url: 'https://docs.myproject.com',
  baseUrl: '/',
  organizationName: 'my-org',
  projectName: 'my-project',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'ja'],
    localeConfigs: {
      en: { label: 'English', htmlLang: 'en-US' },
      es: { label: 'Español', htmlLang: 'es-ES' },
      fr: { label: 'Français', htmlLang: 'fr-FR' },
      de: { label: 'Deutsch', htmlLang: 'de-DE' },
      ja: { label: '日本語', htmlLang: 'ja-JP' }
    }
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/my-org/my-project/tree/main/docs/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          versions: {
            current: {
              label: 'Next 🚧',
              path: 'next',
              banner: 'unreleased'
            }
          },
          lastVersion: 'current',
          includeCurrentVersion: true,
          remarkPlugins: [
            [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]
          ],
          rehypePlugins: [],
          breadcrumbs: true
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/my-org/my-project/tree/main/blog/',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} My Org`
          },
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All posts'
        },
        theme: {
          customCss: './src/css/custom.css'
        },
        gtag: {
          trackingID: 'G-XXXXXXXXXX',
          anonymizeIP: true
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml'
        }
      } satisfies Preset.Options
    ]
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api',
        path: 'api',
        routeBasePath: 'api',
        sidebarPath: './sidebarsApi.ts',
        editUrl: 'https://github.com/my-org/my-project/tree/main/api/'
      }
    ],
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2,
        disableInDev: false
      }
    ],
    'docusaurus-plugin-sass',
    [
      '@docusaurus/plugin-pwa',
      {
        debug: true,
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          { tagName: 'link', rel: 'icon', href: '/img/logo.png' },
          { tagName: 'link', rel: 'manifest', href: '/manifest.json' },
          { tagName: 'meta', name: 'theme-color', content: '#3b82f6' }
        ]
      }
    ]
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    metadata: [
      { name: 'keywords', content: 'documentation, api, developer' },
      { name: 'twitter:card', content: 'summary_large_image' }
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true
    },
    announcementBar: {
      id: 'announcement',
      content: '⭐️ If you like this project, give it a star on <a href="https://github.com/my-org/my-project">GitHub</a>!',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      isCloseable: true
    },
    navbar: {
      title: 'My Project',
      logo: {
        alt: 'My Project Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg'
      },
      hideOnScroll: true,
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs'
        },
        {
          to: '/api/introduction',
          label: 'API',
          position: 'left'
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true
        },
        {
          type: 'localeDropdown',
          position: 'right'
        },
        {
          href: 'https://github.com/my-org/my-project',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/intro' },
            { label: 'API Reference', to: '/api/introduction' },
            { label: 'Examples', to: '/docs/examples' }
          ]
        },
        {
          title: 'Community',
          items: [
            { label: 'Discord', href: 'https://discord.gg/myproject' },
            { label: 'Twitter', href: 'https://twitter.com/myproject' },
            { label: 'Stack Overflow', href: 'https://stackoverflow.com/questions/tagged/myproject' }
          ]
        },
        {
          title: 'More',
          items: [
            { label: 'Blog', to: '/blog' },
            { label: 'GitHub', href: 'https://github.com/my-org/my-project' },
            { label: 'npm', href: 'https://www.npmjs.com/package/myproject' }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Org. Built with Docusaurus.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'python', 'rust', 'go']
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'myproject',
      contextualSearch: true,
      searchPagePath: 'search'
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true
      }
    }
  } satisfies Preset.ThemeConfig
};

export default config;
```

### Sidebar Configuration
```typescript
// sidebars.ts
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction'
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      collapsible: true,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/configuration'
      ],
      link: {
        type: 'generated-index',
        title: 'Getting Started',
        description: 'Learn how to get started with My Project',
        slug: '/getting-started'
      }
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        {
          type: 'autogenerated',
          dirName: 'guides'
        }
      ]
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        {
          type: 'link',
          label: 'Full API Docs',
          href: '/api/introduction'
        },
        'api-reference/overview',
        'api-reference/authentication',
        'api-reference/endpoints'
      ]
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/plugins',
        'advanced/custom-themes',
        'advanced/performance'
      ]
    },
    {
      type: 'html',
      value: '<hr style="margin: 1rem 0;" />',
      defaultStyle: true
    },
    {
      type: 'link',
      label: 'Changelog',
      href: 'https://github.com/my-org/my-project/blob/main/CHANGELOG.md'
    }
  ]
};

export default sidebars;
```

## Custom Components

### Code Block with Tabs
```tsx
// src/components/CodeTabs/index.tsx
import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';

interface CodeExample {
  language: string;
  label: string;
  code: string;
}

interface CodeTabsProps {
  examples: CodeExample[];
  groupId?: string;
}

export default function CodeTabs({ examples, groupId = 'code-tabs' }: CodeTabsProps): JSX.Element {
  return (
    <Tabs groupId={groupId}>
      {examples.map(({ language, label, code }) => (
        <TabItem key={language} value={language} label={label}>
          <CodeBlock language={language}>{code}</CodeBlock>
        </TabItem>
      ))}
    </Tabs>
  );
}

// Usage in MDX:
// <CodeTabs examples={[
//   { language: 'javascript', label: 'JavaScript', code: 'const x = 1;' },
//   { language: 'typescript', label: 'TypeScript', code: 'const x: number = 1;' }
// ]} />
```

### API Endpoint Component
```tsx
// src/components/ApiEndpoint/index.tsx
import React from 'react';
import styles from './styles.module.css';

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  parameters?: Parameter[];
  requestBody?: string;
  response?: string;
  auth?: boolean;
}

const methodColors: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e'
};

export default function ApiEndpoint({
  method,
  path,
  description,
  parameters = [],
  requestBody,
  response,
  auth = true
}: ApiEndpointProps): JSX.Element {
  return (
    <div className={styles.endpoint}>
      <div className={styles.header}>
        <span
          className={styles.method}
          style={{ backgroundColor: methodColors[method] }}
        >
          {method}
        </span>
        <code className={styles.path}>{path}</code>
        {auth && <span className={styles.authBadge}>🔒 Auth Required</span>}
      </div>

      <p className={styles.description}>{description}</p>

      {parameters.length > 0 && (
        <div className={styles.section}>
          <h4>Parameters</h4>
          <table className={styles.paramsTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map(param => (
                <tr key={param.name}>
                  <td><code>{param.name}</code></td>
                  <td><code>{param.type}</code></td>
                  <td>{param.required ? '✓' : '—'}</td>
                  <td>{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {requestBody && (
        <div className={styles.section}>
          <h4>Request Body</h4>
          <pre><code>{requestBody}</code></pre>
        </div>
      )}

      {response && (
        <div className={styles.section}>
          <h4>Response</h4>
          <pre><code>{response}</code></pre>
        </div>
      )}
    </div>
  );
}
```

### Interactive Playground
```tsx
// src/components/Playground/index.tsx
import React, { useState, useCallback } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { themes } from 'prism-react-renderer';
import styles from './styles.module.css';

interface PlaygroundProps {
  code: string;
  scope?: Record<string, unknown>;
  noInline?: boolean;
  transformCode?: (code: string) => string;
}

export default function Playground({
  code,
  scope = {},
  noInline = false,
  transformCode
}: PlaygroundProps): JSX.Element {
  const [editorCode, setEditorCode] = useState(code.trim());
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCodeChange = useCallback((newCode: string) => {
    setEditorCode(newCode);
  }, []);

  const handleReset = useCallback(() => {
    setEditorCode(code.trim());
  }, [code]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editorCode);
  }, [editorCode]);

  return (
    <div className={styles.playground}>
      <LiveProvider
        code={editorCode}
        scope={scope}
        noInline={noInline}
        transformCode={transformCode}
        theme={themes.nightOwl}
      >
        <div className={styles.header}>
          <span className={styles.title}>Interactive Example</span>
          <div className={styles.actions}>
            <button onClick={handleCopy} title="Copy code">
              📋
            </button>
            <button onClick={handleReset} title="Reset code">
              🔄
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className={styles.editor}>
              <LiveEditor onChange={handleCodeChange} />
            </div>
            <LiveError className={styles.error} />
          </>
        )}

        <div className={styles.preview}>
          <div className={styles.previewLabel}>Preview</div>
          <LivePreview />
        </div>
      </LiveProvider>
    </div>
  );
}
```

### Feature Comparison Table
```tsx
// src/components/FeatureTable/index.tsx
import React from 'react';
import styles from './styles.module.css';

interface Feature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

interface FeatureTableProps {
  features: Feature[];
}

function renderValue(value: boolean | string): React.ReactNode {
  if (typeof value === 'boolean') {
    return value ? '✅' : '❌';
  }
  return value;
}

export default function FeatureTable({ features }: FeatureTableProps): JSX.Element {
  return (
    <table className={styles.featureTable}>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Free</th>
          <th>Pro</th>
          <th>Enterprise</th>
        </tr>
      </thead>
      <tbody>
        {features.map(feature => (
          <tr key={feature.name}>
            <td>{feature.name}</td>
            <td>{renderValue(feature.free)}</td>
            <td>{renderValue(feature.pro)}</td>
            <td>{renderValue(feature.enterprise)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## MDX Documentation

### docs/intro.mdx
```mdx
---
id: intro
title: Introduction
description: Get started with My Project
slug: /
sidebar_position: 1
tags:
  - getting-started
  - introduction
keywords:
  - my project
  - documentation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeTabs from '@site/src/components/CodeTabs';
import ApiEndpoint from '@site/src/components/ApiEndpoint';

# Introduction

Welcome to **My Project** documentation! 🎉

:::tip What you'll learn
- How to install and configure My Project
- Core concepts and architecture
- Best practices and patterns
:::

## Installation

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm install my-project
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```bash
    yarn add my-project
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm add my-project
    ```
  </TabItem>
</Tabs>

## Quick Example

<CodeTabs examples={[
  {
    language: 'typescript',
    label: 'TypeScript',
    code: `import { Client } from 'my-project';

const client = new Client({
  apiKey: process.env.API_KEY,
});

const result = await client.query('Hello, world!');
console.log(result);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `from my_project import Client

client = Client(api_key=os.environ["API_KEY"])

result = client.query("Hello, world!")
print(result)`
  }
]} />

## API Overview

<ApiEndpoint
  method="POST"
  path="/api/v1/query"
  description="Execute a query against the service"
  parameters={[
    { name: 'query', type: 'string', required: true, description: 'The query to execute' },
    { name: 'options', type: 'object', required: false, description: 'Query options' }
  ]}
  requestBody={`{
  "query": "Hello, world!",
  "options": {
    "timeout": 5000
  }
}`}
  response={`{
  "result": "...",
  "metadata": {
    "duration": 123
  }
}`}
/>

## Features

| Feature | Description |
|---------|-------------|
| 🚀 Fast | Optimized for performance |
| 🔒 Secure | Enterprise-grade security |
| 🌐 Global | CDN-backed infrastructure |

:::info Version Requirements
This documentation is for version 2.x. For older versions, see the [version dropdown](/docs/versions).
:::

## Next Steps

- [Quick Start Guide](/docs/getting-started/quick-start)
- [Configuration Reference](/docs/getting-started/configuration)
- [API Reference](/api/introduction)
```

## Versioning

### Version Commands
```bash
# Create a new version
npm run docusaurus docs:version 1.0.0

# Structure after versioning:
# docs/                  # Next (development) version
# versioned_docs/
#   version-1.0.0/       # 1.0.0 docs
# versioned_sidebars/
#   version-1.0.0-sidebars.json
# versions.json          # List of versions
```

### versions.json
```json
[
  "2.0.0",
  "1.2.0",
  "1.1.0",
  "1.0.0"
]
```

## Custom Theme

### Theme Override
```tsx
// src/theme/DocItem/Layout/index.tsx
import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import type { Props } from '@theme/DocItem/Layout';
import Feedback from '@site/src/components/Feedback';

export default function LayoutWrapper(props: Props): JSX.Element {
  return (
    <>
      <Layout {...props} />
      <Feedback
        pageId={props.children.props.content.metadata.id}
        pageTitle={props.children.props.content.metadata.title}
      />
    </>
  );
}
```

### Custom CSS
```css
/* src/css/custom.css */
:root {
  --ifm-color-primary: #3b82f6;
  --ifm-color-primary-dark: #2563eb;
  --ifm-color-primary-darker: #1d4ed8;
  --ifm-color-primary-darkest: #1e40af;
  --ifm-color-primary-light: #60a5fa;
  --ifm-color-primary-lighter: #93c5fd;
  --ifm-color-primary-lightest: #bfdbfe;

  --ifm-code-font-size: 95%;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.1);

  --ifm-font-family-base: 'Inter', system-ui, -apple-system, sans-serif;
  --ifm-font-family-monospace: 'JetBrains Mono', monospace;
}

[data-theme='dark'] {
  --ifm-color-primary: #60a5fa;
  --ifm-color-primary-dark: #3b82f6;
  --ifm-color-primary-darker: #2563eb;
  --ifm-color-primary-darkest: #1d4ed8;
  --ifm-color-primary-light: #93c5fd;
  --ifm-color-primary-lighter: #bfdbfe;
  --ifm-color-primary-lightest: #dbeafe;

  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.3);
}

/* Custom admonition styles */
.alert--tip {
  --ifm-alert-background-color: #ecfdf5;
  --ifm-alert-border-color: #10b981;
}

[data-theme='dark'] .alert--tip {
  --ifm-alert-background-color: #064e3b;
}

/* Enhanced code blocks */
.prism-code {
  border-radius: 0.5rem;
}

/* Responsive improvements */
@media (max-width: 996px) {
  .navbar__items {
    gap: 0.5rem;
  }
}
```

## Search Configuration

### Local Search Plugin
```typescript
// docusaurus.config.ts plugins section
plugins: [
  [
    require.resolve('@easyops-cn/docusaurus-search-local'),
    {
      hashed: true,
      language: ['en', 'es'],
      highlightSearchTermsOnTargetPage: true,
      explicitSearchResultPath: true,
      docsRouteBasePath: '/docs',
      indexBlog: true,
      indexPages: true
    }
  ]
]
```

## CLAUDE.md Integration

```markdown
## Docusaurus Documentation

### Structure
- `/docs` - Main documentation
- `/api` - API reference docs
- `/blog` - Blog posts
- `/src/components` - Custom components

### Commands
- `npm start` - Development server
- `npm run build` - Production build
- `npm run serve` - Serve production build
- `npm run docusaurus docs:version X.X.X` - Create version

### Custom Components
- `<CodeTabs>` - Multi-language code examples
- `<ApiEndpoint>` - REST endpoint documentation
- `<Playground>` - Interactive code editor
- `<FeatureTable>` - Feature comparison

### MDX Features
- Admonitions: :::tip, :::info, :::warning, :::danger
- Tabs for multi-platform content
- Import React components in docs
```

## AI Suggestions

1. **Doc structure generation** - Create sidebar from file structure
2. **MDX component creation** - Build custom documentation components
3. **Version management** - Automate versioning workflow
4. **Translation setup** - Configure i18n for multiple languages
5. **Search optimization** - Improve search index coverage
6. **Link validation** - Check for broken internal links
7. **Image optimization** - Compress and lazy-load images
8. **SEO enhancement** - Generate meta tags from content
9. **API docs sync** - Keep API docs in sync with code
10. **Changelog integration** - Auto-generate release notes
