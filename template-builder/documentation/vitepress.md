# VitePress Documentation Template

## Overview
VitePress setup for fast, Vue-powered documentation sites with custom themes, components, and build optimization.

## Quick Start
```bash
npm init vitepress@latest my-docs
cd my-docs
npm install
npm run docs:dev
```

## VitePress Configuration

### config.ts
```typescript
// .vitepress/config.ts
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'My Project',
  description: 'A VitePress Site',
  lang: 'en-US',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'My Project' }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX' }],
    ['script', {}, `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    `]
  ],

  lastUpdated: true,
  cleanUrls: true,

  sitemap: {
    hostname: 'https://docs.myproject.com'
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true,
    math: true,
    container: {
      tipLabel: 'TIP',
      warningLabel: 'WARNING',
      dangerLabel: 'DANGER',
      infoLabel: 'INFO',
      detailsLabel: 'Details'
    },
    config: (md) => {
      // Custom markdown-it plugins
      md.use(require('markdown-it-task-lists'));
      md.use(require('markdown-it-attrs'));
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'My Project',

    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      { text: 'Examples', link: '/examples/', activeMatch: '/examples/' },
      {
        text: 'Resources',
        items: [
          { text: 'Blog', link: '/blog/' },
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' }
        ]
      },
      {
        text: 'v2.0.0',
        items: [
          { text: 'v2.0.0 (Latest)', link: '/' },
          { text: 'v1.x', link: 'https://v1.docs.myproject.com' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Core Concepts',
          collapsed: false,
          items: [
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Features', link: '/guide/features' },
            { text: 'Best Practices', link: '/guide/best-practices' }
          ]
        },
        {
          text: 'Advanced',
          collapsed: true,
          items: [
            { text: 'Plugins', link: '/guide/plugins' },
            { text: 'Themes', link: '/guide/themes' },
            { text: 'Deployment', link: '/guide/deployment' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Client', link: '/api/client' },
            { text: 'Types', link: '/api/types' },
            { text: 'Utilities', link: '/api/utilities' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/my-org/my-project' },
      { icon: 'twitter', link: 'https://twitter.com/myproject' },
      { icon: 'discord', link: 'https://discord.gg/myproject' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present My Org'
    },

    editLink: {
      pattern: 'https://github.com/my-org/my-project/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, headers: 3 }
          }
        }
      }
    },

    // Algolia search (alternative)
    // search: {
    //   provider: 'algolia',
    //   options: {
    //     appId: 'YOUR_APP_ID',
    //     apiKey: 'YOUR_API_KEY',
    //     indexName: 'myproject'
    //   }
    // },

    carbonAds: {
      code: 'XXXXXX',
      placement: 'myprojectcom'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },

    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'short'
      }
    },

    returnToTopLabel: 'Back to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme'
  },

  vite: {
    plugins: [],
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    ssr: {
      noExternal: ['@vue/repl']
    }
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('custom-')
      }
    }
  }
});
```

## Custom Theme

### Theme Extension
```typescript
// .vitepress/theme/index.ts
import { h, watch } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './custom.css';

// Custom components
import HomeFeatures from './components/HomeFeatures.vue';
import ApiEndpoint from './components/ApiEndpoint.vue';
import CodeGroup from './components/CodeGroup.vue';
import Badge from './components/Badge.vue';

// Layout enhancements
import Layout from './Layout.vue';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(Layout, null, {
      // Named slots for layout customization
      'nav-bar-title-before': () => h('span', { class: 'logo-prefix' }),
      'nav-bar-content-after': () => h('div', { class: 'nav-extra' }),
      'sidebar-nav-before': () => h('div', { class: 'sidebar-header' }),
      'doc-before': () => h('div', { class: 'doc-banner' }),
      'doc-footer-before': () => h('div', { class: 'feedback-widget' }),
      'aside-outline-after': () => h('div', { class: 'aside-ad' })
    });
  },
  enhanceApp({ app, router, siteData }) {
    // Register global components
    app.component('HomeFeatures', HomeFeatures);
    app.component('ApiEndpoint', ApiEndpoint);
    app.component('CodeGroup', CodeGroup);
    app.component('Badge', Badge);

    // Global properties
    app.config.globalProperties.$formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Route guards
    if (typeof window !== 'undefined') {
      watch(
        () => router.route.path,
        (path) => {
          // Analytics tracking
          if (window.gtag) {
            window.gtag('config', 'G-XXXXXXXXXX', {
              page_path: path
            });
          }
        },
        { immediate: true }
      );
    }
  }
} satisfies Theme;
```

### Custom Layout
```vue
<!-- .vitepress/theme/Layout.vue -->
<template>
  <DefaultTheme.Layout>
    <template #nav-bar-title-after>
      <Badge v-if="isDev" type="warning" text="Dev" />
    </template>

    <template #doc-top>
      <div v-if="frontmatter.banner" class="doc-banner">
        {{ frontmatter.banner }}
      </div>
    </template>

    <template #doc-footer-before>
      <DocFeedback />
    </template>

    <template #aside-ads-before>
      <AsideSponsors />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import Badge from './components/Badge.vue';
import DocFeedback from './components/DocFeedback.vue';
import AsideSponsors from './components/AsideSponsors.vue';

const { frontmatter, isDark } = useData();

const isDev = computed(() => {
  return typeof window !== 'undefined' &&
    window.location.hostname === 'localhost';
});
</script>

<style scoped>
.doc-banner {
  padding: 12px 24px;
  background: var(--vp-c-brand-soft);
  border-radius: 8px;
  margin-bottom: 24px;
}
</style>
```

## Custom Components

### API Endpoint Component
```vue
<!-- .vitepress/theme/components/ApiEndpoint.vue -->
<template>
  <div class="api-endpoint">
    <div class="endpoint-header">
      <span :class="['method', method.toLowerCase()]">{{ method }}</span>
      <code class="path">{{ path }}</code>
      <Badge v-if="auth" type="warning" text="Auth Required" />
      <Badge v-if="deprecated" type="danger" text="Deprecated" />
    </div>

    <p class="description">{{ description }}</p>

    <div v-if="parameters?.length" class="params-section">
      <h4>Parameters</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="param in parameters" :key="param.name">
            <td><code>{{ param.name }}</code></td>
            <td><code>{{ param.type }}</code></td>
            <td>{{ param.required ? '✓' : '—' }}</td>
            <td>{{ param.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="$slots.request" class="code-section">
      <h4>Request</h4>
      <slot name="request" />
    </div>

    <div v-if="$slots.response" class="code-section">
      <h4>Response</h4>
      <slot name="response" />
    </div>

    <div v-if="$slots.example" class="example-section">
      <h4>Example</h4>
      <slot name="example" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Badge from './Badge.vue';

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

defineProps<{
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  parameters?: Parameter[];
  auth?: boolean;
  deprecated?: boolean;
}>();
</script>

<style scoped>
.api-endpoint {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.method {
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.method.get { background: #61affe; color: white; }
.method.post { background: #49cc90; color: white; }
.method.put { background: #fca130; color: white; }
.method.patch { background: #50e3c2; color: white; }
.method.delete { background: #f93e3e; color: white; }

.path {
  font-size: 14px;
  background: var(--vp-c-bg-soft);
  padding: 4px 8px;
  border-radius: 4px;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.params-table th,
.params-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

.params-table th {
  font-weight: 600;
  background: var(--vp-c-bg-soft);
}

.code-section,
.example-section {
  margin-top: 16px;
}

.code-section h4,
.example-section h4 {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
</style>
```

### Interactive Code Playground
```vue
<!-- .vitepress/theme/components/Playground.vue -->
<template>
  <div class="playground">
    <div class="playground-header">
      <span class="title">{{ title || 'Interactive Example' }}</span>
      <div class="actions">
        <button @click="copyCode" title="Copy">
          <span v-if="copied">✓</span>
          <span v-else>📋</span>
        </button>
        <button @click="resetCode" title="Reset">🔄</button>
        <button @click="runCode" title="Run">▶️</button>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor" ref="editorRef"></div>
    </div>

    <div v-if="output" class="output">
      <div class="output-header">Output</div>
      <pre>{{ output }}</pre>
    </div>

    <div v-if="error" class="error">
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  code: string;
  title?: string;
  language?: string;
}>();

const editorRef = ref<HTMLElement>();
const currentCode = ref(props.code);
const output = ref('');
const error = ref('');
const copied = ref(false);

let editor: any;

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const monaco = await import('monaco-editor');

    editor = monaco.editor.create(editorRef.value!, {
      value: props.code,
      language: props.language || 'typescript',
      theme: 'vs-dark',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      automaticLayout: true
    });

    editor.onDidChangeModelContent(() => {
      currentCode.value = editor.getValue();
    });
  }
});

const copyCode = async () => {
  await navigator.clipboard.writeText(currentCode.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};

const resetCode = () => {
  if (editor) {
    editor.setValue(props.code);
  }
  output.value = '';
  error.value = '';
};

const runCode = () => {
  try {
    // Sandbox execution
    const fn = new Function(currentCode.value);
    const result = fn();
    output.value = JSON.stringify(result, null, 2);
    error.value = '';
  } catch (e) {
    error.value = String(e);
    output.value = '';
  }
};
</script>

<style scoped>
.playground {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
}

.playground-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.title {
  font-weight: 600;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 4px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
}

.actions button:hover {
  background: var(--vp-c-bg-mute);
}

.editor-container {
  height: 300px;
}

.output,
.error {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
}

.output-header {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.output pre,
.error pre {
  margin: 0;
  font-size: 13px;
  overflow-x: auto;
}

.error {
  background: #fef2f2;
  color: #dc2626;
}

:deep(.dark) .error {
  background: #450a0a;
  color: #fca5a5;
}
</style>
```

### Code Group Component
```vue
<!-- .vitepress/theme/components/CodeGroup.vue -->
<template>
  <div class="code-group">
    <div class="tabs">
      <button
        v-for="(tab, index) in tabs"
        :key="tab"
        :class="['tab', { active: activeTab === index }]"
        @click="activeTab = index"
      >
        {{ tab }}
      </button>
    </div>
    <div class="panels">
      <div
        v-for="(_, index) in tabs"
        :key="index"
        :class="['panel', { active: activeTab === index }]"
      >
        <slot :name="`tab-${index}`" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  tabs: string[];
}>();

const activeTab = ref(0);
</script>

<style scoped>
.code-group {
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.tabs {
  display: flex;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab:hover {
  color: var(--vp-c-text-1);
}

.tab.active {
  color: var(--vp-c-brand);
  border-bottom-color: var(--vp-c-brand);
}

.panel {
  display: none;
}

.panel.active {
  display: block;
}

.panel :deep(div[class*='language-']) {
  margin: 0;
  border-radius: 0;
}
</style>
```

## Documentation Pages

### guide/index.md
```markdown
---
title: Introduction
description: Get started with My Project
head:
  - - meta
    - name: keywords
      content: my project, documentation, guide
---

# Introduction

Welcome to **My Project** documentation!

::: tip What you'll learn
- How to install and set up My Project
- Core concepts and best practices
- Advanced configuration options
:::

## Quick Example

<CodeGroup :tabs="['npm', 'yarn', 'pnpm']">
  <template #tab-0>

```bash
npm install my-project
```

  </template>
  <template #tab-1>

```bash
yarn add my-project
```

  </template>
  <template #tab-2>

```bash
pnpm add my-project
```

  </template>
</CodeGroup>

## Features

| Feature | Description |
|---------|-------------|
| 🚀 Fast | Built on Vite for instant HMR |
| 📦 Simple | Minimal configuration needed |
| 🎨 Customizable | Easy theme customization |

## API Example

<ApiEndpoint
  method="GET"
  path="/api/users"
  description="Retrieve a list of users"
  :parameters="[
    { name: 'page', type: 'number', required: false, description: 'Page number' },
    { name: 'limit', type: 'number', required: false, description: 'Items per page' }
  ]"
  auth
>
  <template #response>

```json
{
  "users": [...],
  "total": 100,
  "page": 1
}
```

  </template>
</ApiEndpoint>

## Next Steps

- [Installation Guide](/guide/installation)
- [Configuration Reference](/guide/configuration)
- [API Reference](/api/)
```

### api/index.md
```markdown
---
title: API Reference
description: Complete API documentation
outline: [2, 3]
---

# API Reference

## Client

### Constructor

```typescript
const client = new Client(options: ClientOptions)
```

#### ClientOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `apiKey` | `string` | — | Your API key (required) |
| `baseUrl` | `string` | `'https://api.example.com'` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in ms |

### Methods

<ApiEndpoint
  method="POST"
  path="/query"
  description="Execute a query"
  :parameters="[
    { name: 'query', type: 'string', required: true, description: 'Query string' },
    { name: 'options', type: 'QueryOptions', required: false, description: 'Query options' }
  ]"
  auth
>
  <template #request>

```typescript
const result = await client.query('Hello', {
  temperature: 0.7,
  maxTokens: 1000
});
```

  </template>
  <template #response>

```json
{
  "result": "...",
  "usage": {
    "tokens": 150
  }
}
```

  </template>
</ApiEndpoint>
```

## Custom CSS

```css
/* .vitepress/theme/custom.css */
:root {
  --vp-c-brand-1: #3b82f6;
  --vp-c-brand-2: #2563eb;
  --vp-c-brand-3: #1d4ed8;
  --vp-c-brand-soft: rgba(59, 130, 246, 0.14);

  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(120deg, #3b82f6 30%, #8b5cf6);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #3b82f6 50%, #8b5cf6 50%);
  --vp-home-hero-image-filter: blur(44px);
}

.dark {
  --vp-c-brand-1: #60a5fa;
  --vp-c-brand-2: #3b82f6;
  --vp-c-brand-3: #2563eb;
}

/* Custom container styles */
.vp-doc .custom-block.tip {
  border-color: var(--vp-c-brand-1);
}

/* Improved code blocks */
.vp-doc div[class*='language-'] {
  border-radius: 8px;
}

/* Better tables */
.vp-doc table {
  display: table;
  width: 100%;
}

.vp-doc tr:nth-child(2n) {
  background-color: var(--vp-c-bg-soft);
}
```

## CLAUDE.md Integration

```markdown
## VitePress Documentation

### Structure
- `/docs` - Documentation source
- `/.vitepress/config.ts` - Site configuration
- `/.vitepress/theme` - Custom theme

### Commands
- `npm run docs:dev` - Development server
- `npm run docs:build` - Production build
- `npm run docs:preview` - Preview build

### Components
- `<ApiEndpoint>` - REST API documentation
- `<CodeGroup>` - Tabbed code blocks
- `<Playground>` - Interactive editor
- `<Badge>` - Status badges

### Markdown Features
- Custom containers: :::tip, :::warning, :::danger, :::info
- Code highlighting with line numbers
- Math equations with KaTeX
- Task lists
```

## AI Suggestions

1. **Auto-generate sidebar** - Create sidebar from directory structure
2. **Component scaffolding** - Generate Vue components for docs
3. **Search optimization** - Improve local search indexing
4. **i18n setup** - Configure multi-language documentation
5. **Theme customization** - Build custom VitePress themes
6. **API docs generation** - Generate API docs from TypeScript
7. **Link checking** - Validate internal and external links
8. **Image optimization** - Compress and lazy-load images
9. **SEO enhancement** - Generate meta tags and structured data
10. **Version management** - Handle multiple doc versions
