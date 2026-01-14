# Cross-Browser Extension Template

## Overview

Production-ready cross-browser extension supporting Chrome, Firefox, Safari, and Edge with unified codebase. Features Manifest V3 with V2 fallback, WebExtension polyfill, automated builds per browser, and comprehensive testing across platforms.

## Quick Start

```bash
# Create extension directory
mkdir my-extension && cd my-extension

# Initialize project
npm init -y

# Install dependencies
npm install webextension-polyfill
npm install -D @anthropic-ai/claude-code \
  @anthropic-ai/claude-code-types \
  @anthropic-ai/claude-code-webext-types \
  esbuild \
  typescript \
  web-ext \
  archiver \
  chokidar

# Build for all browsers
npm run build

# Build for specific browser
npm run build:chrome
npm run build:firefox
npm run build:safari
npm run build:edge

# Development mode
npm run dev
```

## Project Structure

```
my-extension/
├── src/
│   ├── background/
│   │   ├── index.ts              # Background service worker
│   │   ├── messaging.ts          # Cross-context messaging
│   │   ├── storage.ts            # Storage utilities
│   │   └── api.ts                # External API calls
│   ├── content/
│   │   ├── index.ts              # Content script entry
│   │   ├── inject.ts             # DOM injection
│   │   └── styles.css            # Content styles
│   ├── popup/
│   │   ├── index.tsx             # Popup entry (React)
│   │   ├── App.tsx               # Popup app
│   │   ├── components/
│   │   └── styles.css
│   ├── options/
│   │   ├── index.tsx             # Options page entry
│   │   ├── App.tsx               # Options app
│   │   └── styles.css
│   ├── shared/
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── constants.ts          # Constants
│   │   ├── utils.ts              # Utilities
│   │   ├── browser.ts            # Browser detection
│   │   └── polyfill.ts           # API polyfills
│   └── manifest/
│       ├── base.json             # Base manifest
│       ├── chrome.json           # Chrome-specific overrides
│       ├── firefox.json          # Firefox-specific overrides
│       ├── safari.json           # Safari-specific overrides
│       └── edge.json             # Edge-specific overrides
├── public/
│   ├── popup.html
│   ├── options.html
│   └── icons/
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── icon-512.png
├── scripts/
│   ├── build.ts                  # Build script
│   ├── dev.ts                    # Development watcher
│   ├── package.ts                # Package for distribution
│   └── manifest.ts               # Manifest generator
├── dist/
│   ├── chrome/
│   ├── firefox/
│   ├── safari/
│   └── edge/
├── package.json
├── tsconfig.json
├── esbuild.config.ts
└── README.md
```

## Configuration

### package.json

```json
{
  "name": "my-cross-browser-extension",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx scripts/dev.ts",
    "build": "tsx scripts/build.ts",
    "build:chrome": "BROWSER=chrome tsx scripts/build.ts",
    "build:firefox": "BROWSER=firefox tsx scripts/build.ts",
    "build:safari": "BROWSER=safari tsx scripts/build.ts",
    "build:edge": "BROWSER=edge tsx scripts/build.ts",
    "package": "tsx scripts/package.ts",
    "package:all": "npm run package -- --all",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "start:chrome": "web-ext run --source-dir dist/chrome --target chromium",
    "start:firefox": "web-ext run --source-dir dist/firefox --target firefox-desktop",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "webextension-polyfill": "^0.10.0"
  },
  "devDependencies": {
    "@anthropic-ai/claude-code": "latest",
    "@anthropic-ai/claude-code-types": "latest",
    "@anthropic-ai/claude-code-webext-types": "latest",
    "@anthropic-ai/claude-code-chrome-types": "latest",
    "@types/node": "^20.10.4",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "@types/webextension-polyfill": "^0.10.5",
    "archiver": "^6.0.1",
    "chokidar": "^3.5.3",
    "esbuild": "^0.19.8",
    "eslint": "^8.55.0",
    "rimraf": "^5.0.5",
    "tsx": "^4.6.2",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4",
    "web-ext": "^7.8.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Manifest Configuration

### src/manifest/base.json

```json
{
  "manifest_version": 3,
  "name": "My Cross-Browser Extension",
  "version": "1.0.0",
  "description": "A powerful cross-browser extension",
  "author": "Your Name",
  "homepage_url": "https://example.com",

  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "permissions": [
    "storage",
    "activeTab",
    "tabs"
  ],

  "optional_permissions": [
    "history",
    "bookmarks"
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    },
    "default_title": "My Extension"
  },

  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],

  "web_accessible_resources": [
    {
      "resources": ["icons/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### src/manifest/chrome.json

```json
{
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "host_permissions": [
    "https://*.example.com/*"
  ],
  "minimum_chrome_version": "102"
}
```

### src/manifest/firefox.json

```json
{
  "background": {
    "scripts": ["background.js"],
    "type": "module"
  },
  "host_permissions": [
    "https://*.example.com/*"
  ],
  "browser_specific_settings": {
    "gecko": {
      "id": "my-extension@example.com",
      "strict_min_version": "109.0"
    }
  }
}
```

### src/manifest/safari.json

```json
{
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "host_permissions": [
    "https://*.example.com/*"
  ]
}
```

### src/manifest/edge.json

```json
{
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "host_permissions": [
    "https://*.example.com/*"
  ],
  "minimum_edge_version": "102"
}
```

## Build Scripts

### scripts/build.ts

```typescript
import * as esbuild from 'esbuild';
import { copyFileSync, cpSync, mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

type Browser = 'chrome' | 'firefox' | 'safari' | 'edge';

const browsers: Browser[] = process.env.BROWSER
  ? [process.env.BROWSER as Browser]
  : ['chrome', 'firefox', 'safari', 'edge'];

const isProduction = process.env.NODE_ENV === 'production';

async function buildForBrowser(browser: Browser) {
  const distDir = resolve(projectRoot, 'dist', browser);

  // Clean and create dist directory
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true });
  }
  mkdirSync(distDir, { recursive: true });

  // Generate manifest
  const manifest = generateManifest(browser);
  writeFileSync(resolve(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Build background script
  await esbuild.build({
    entryPoints: [resolve(projectRoot, 'src/background/index.ts')],
    bundle: true,
    outfile: resolve(distDir, 'background.js'),
    format: browser === 'firefox' ? 'iife' : 'esm',
    platform: 'browser',
    target: getTarget(browser),
    minify: isProduction,
    sourcemap: !isProduction,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.BROWSER': JSON.stringify(browser),
    },
  });

  // Build content script
  await esbuild.build({
    entryPoints: [resolve(projectRoot, 'src/content/index.ts')],
    bundle: true,
    outfile: resolve(distDir, 'content.js'),
    format: 'iife',
    platform: 'browser',
    target: getTarget(browser),
    minify: isProduction,
    sourcemap: !isProduction,
  });

  // Build popup
  await esbuild.build({
    entryPoints: [resolve(projectRoot, 'src/popup/index.tsx')],
    bundle: true,
    outfile: resolve(distDir, 'popup.js'),
    format: 'esm',
    platform: 'browser',
    target: getTarget(browser),
    minify: isProduction,
    sourcemap: !isProduction,
  });

  // Build options page
  await esbuild.build({
    entryPoints: [resolve(projectRoot, 'src/options/index.tsx')],
    bundle: true,
    outfile: resolve(distDir, 'options.js'),
    format: 'esm',
    platform: 'browser',
    target: getTarget(browser),
    minify: isProduction,
    sourcemap: !isProduction,
  });

  // Copy static files
  copyFileSync(resolve(projectRoot, 'public/popup.html'), resolve(distDir, 'popup.html'));
  copyFileSync(resolve(projectRoot, 'public/options.html'), resolve(distDir, 'options.html'));
  copyFileSync(resolve(projectRoot, 'src/content/styles.css'), resolve(distDir, 'content.css'));
  copyFileSync(resolve(projectRoot, 'src/popup/styles.css'), resolve(distDir, 'popup.css'));
  copyFileSync(resolve(projectRoot, 'src/options/styles.css'), resolve(distDir, 'options.css'));
  cpSync(resolve(projectRoot, 'public/icons'), resolve(distDir, 'icons'), { recursive: true });

  console.log(`Built for ${browser}`);
}

function generateManifest(browser: Browser): Record<string, unknown> {
  const base = JSON.parse(readFileSync(resolve(projectRoot, 'src/manifest/base.json'), 'utf-8'));
  const browserSpecific = JSON.parse(
    readFileSync(resolve(projectRoot, `src/manifest/${browser}.json`), 'utf-8')
  );

  return deepMerge(base, browserSpecific);
}

function getTarget(browser: Browser): string {
  switch (browser) {
    case 'chrome':
    case 'edge':
      return 'chrome102';
    case 'firefox':
      return 'firefox109';
    case 'safari':
      return 'safari16';
    default:
      return 'es2022';
  }
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(
          (result[key] as Record<string, unknown>) || {},
          source[key] as Record<string, unknown>
        ) as T[typeof key];
      } else {
        result[key] = source[key] as T[typeof key];
      }
    }
  }
  return result;
}

async function main() {
  console.log(`Building for: ${browsers.join(', ')}`);
  console.log(`Mode: ${isProduction ? 'production' : 'development'}`);

  for (const browser of browsers) {
    await buildForBrowser(browser);
  }

  console.log('Build complete!');
}

main().catch(console.error);
```

### scripts/package.ts

```typescript
import archiver from 'archiver';
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

type Browser = 'chrome' | 'firefox' | 'safari' | 'edge';

async function packageExtension(browser: Browser) {
  const distDir = resolve(projectRoot, 'dist', browser);
  const packagesDir = resolve(projectRoot, 'packages');

  if (!existsSync(distDir)) {
    console.error(`No build found for ${browser}. Run build first.`);
    return;
  }

  if (!existsSync(packagesDir)) {
    mkdirSync(packagesDir, { recursive: true });
  }

  const extension = browser === 'firefox' ? 'xpi' : 'zip';
  const outputPath = resolve(packagesDir, `my-extension-${browser}-v1.0.0.${extension}`);

  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise<void>((resolvePromise, reject) => {
    output.on('close', () => {
      console.log(`Packaged ${browser}: ${archive.pointer()} bytes`);
      resolvePromise();
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add all files from dist directory
    archive.directory(distDir, false);

    archive.finalize();
  });
}

async function main() {
  const browsers: Browser[] = process.argv.includes('--all')
    ? ['chrome', 'firefox', 'safari', 'edge']
    : process.env.BROWSER
      ? [process.env.BROWSER as Browser]
      : ['chrome'];

  console.log(`Packaging for: ${browsers.join(', ')}`);

  for (const browser of browsers) {
    await packageExtension(browser);
  }

  console.log('Packaging complete!');
}

main().catch(console.error);
```

### scripts/dev.ts

```typescript
import * as esbuild from 'esbuild';
import chokidar from 'chokidar';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const browser = (process.env.BROWSER || 'chrome') as 'chrome' | 'firefox';

async function build() {
  console.log('Building...');
  const child = spawn('tsx', ['scripts/build.ts'], {
    stdio: 'inherit',
    env: { ...process.env, BROWSER: browser, NODE_ENV: 'development' },
    cwd: projectRoot,
  });

  return new Promise<void>((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build failed with code ${code}`));
    });
  });
}

async function main() {
  await build();

  console.log('Watching for changes...');

  const watcher = chokidar.watch(['src/**/*', 'public/**/*'], {
    cwd: projectRoot,
    ignoreInitial: true,
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watcher.on('all', (event, path) => {
    console.log(`File ${event}: ${path}`);

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      await build();
    }, 300);
  });

  // Start web-ext for live reload
  const webExt = spawn('npx', [
    'web-ext',
    'run',
    '--source-dir', `dist/${browser}`,
    '--target', browser === 'firefox' ? 'firefox-desktop' : 'chromium',
    '--no-reload',
  ], {
    stdio: 'inherit',
    cwd: projectRoot,
  });

  process.on('SIGINT', () => {
    watcher.close();
    webExt.kill();
    process.exit(0);
  });
}

main().catch(console.error);
```

## Browser Detection & Polyfills

### src/shared/browser.ts

```typescript
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';

export function detectBrowser(): BrowserType {
  // Check build-time environment variable
  if (typeof process !== 'undefined' && process.env.BROWSER) {
    return process.env.BROWSER as BrowserType;
  }

  // Runtime detection
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('edg/')) return 'edge';
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';

  return 'unknown';
}

export const currentBrowser = detectBrowser();

export function isChrome(): boolean {
  return currentBrowser === 'chrome';
}

export function isFirefox(): boolean {
  return currentBrowser === 'firefox';
}

export function isSafari(): boolean {
  return currentBrowser === 'safari';
}

export function isEdge(): boolean {
  return currentBrowser === 'edge';
}

export function supportsManifestV3(): boolean {
  return !isFirefox() || parseInt(navigator.userAgent.match(/Firefox\/(\d+)/)?.[1] || '0') >= 109;
}

export function supportsServiceWorker(): boolean {
  return isChrome() || isEdge() || isSafari();
}

export function supportsDeclarativeNetRequest(): boolean {
  return isChrome() || isEdge();
}
```

### src/shared/polyfill.ts

```typescript
import browser from 'webextension-polyfill';
import { isChrome, isEdge, isSafari } from './browser';

// Re-export polyfilled browser API
export { browser };

// Ensure chrome.* API compatibility for MV3
export function getRuntime() {
  return browser.runtime;
}

export function getStorage() {
  return browser.storage;
}

export function getTabs() {
  return browser.tabs;
}

// Polyfill for APIs not in webextension-polyfill
export async function openOptionsPage(): Promise<void> {
  if (browser.runtime.openOptionsPage) {
    await browser.runtime.openOptionsPage();
  } else {
    // Fallback for older browsers
    const optionsUrl = browser.runtime.getURL('options.html');
    await browser.tabs.create({ url: optionsUrl });
  }
}

// Unified storage API that works across browsers
export const storage = {
  async get<T>(keys?: string | string[] | null): Promise<T> {
    return browser.storage.local.get(keys) as Promise<T>;
  },

  async set(items: Record<string, unknown>): Promise<void> {
    return browser.storage.local.set(items);
  },

  async remove(keys: string | string[]): Promise<void> {
    return browser.storage.local.remove(keys);
  },

  async clear(): Promise<void> {
    return browser.storage.local.clear();
  },

  onChanged: browser.storage.onChanged,
};

// Unified messaging API
export const messaging = {
  async sendMessage<T>(message: unknown): Promise<T> {
    return browser.runtime.sendMessage(message) as Promise<T>;
  },

  async sendTabMessage<T>(tabId: number, message: unknown): Promise<T> {
    return browser.tabs.sendMessage(tabId, message) as Promise<T>;
  },

  onMessage: browser.runtime.onMessage,
};

// Action API (MV3) with browser_action fallback (MV2)
export const action = browser.action || (browser as any).browserAction;

// Alarms API
export const alarms = browser.alarms;

// Notifications API
export const notifications = browser.notifications;

// Scripting API (MV3 only)
export async function executeScript(
  tabId: number,
  details: { files?: string[]; func?: () => void }
): Promise<unknown[]> {
  if (browser.scripting) {
    return browser.scripting.executeScript({
      target: { tabId },
      files: details.files,
      func: details.func,
    });
  } else {
    // Fallback for MV2
    return (browser.tabs as any).executeScript(tabId, {
      file: details.files?.[0],
      code: details.func?.toString(),
    });
  }
}
```

## Background Script

### src/background/index.ts

```typescript
import { browser, storage, messaging, alarms, notifications } from '@/shared/polyfill';
import { currentBrowser } from '@/shared/browser';
import { handleMessage } from './messaging';
import { initStorage, getSettings } from './storage';
import type { Settings, ExtensionState } from '@/shared/types';
import { STORAGE_KEYS, ALARM_NAMES, DEFAULT_SETTINGS } from '@/shared/constants';

// Extension state
const state: ExtensionState = {
  enabled: true,
  processedCount: 0,
  browser: currentBrowser,
};

// Initialize on install
browser.runtime.onInstalled.addListener(async (details) => {
  console.log(`Extension installed (${currentBrowser}):`, details.reason);

  if (details.reason === 'install') {
    await initStorage();
    await createContextMenus();
  }

  if (details.reason === 'update') {
    await handleUpdate(details.previousVersion);
  }
});

async function handleUpdate(previousVersion: string | undefined) {
  console.log(`Updated from ${previousVersion} to ${browser.runtime.getManifest().version}`);

  // Handle migration if needed
  const settings = await getSettings();

  // Example migration
  if (previousVersion && previousVersion < '1.0.0') {
    // Migrate old settings
  }
}

async function createContextMenus() {
  // Chrome/Edge use chrome.contextMenus, Firefox uses browser.contextMenus
  const contextMenus = browser.contextMenus;

  if (!contextMenus) {
    console.log('Context menus not supported');
    return;
  }

  await contextMenus.removeAll();

  contextMenus.create({
    id: 'process-selection',
    title: 'Process with My Extension',
    contexts: ['selection'],
  });

  contextMenus.create({
    id: 'analyze-page',
    title: 'Analyze Page',
    contexts: ['page'],
  });
}

// Handle context menu clicks
browser.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'process-selection' && info.selectionText) {
    const result = await processText(info.selectionText);
    await messaging.sendTabMessage(tab.id, {
      type: 'SHOW_RESULT',
      payload: result,
    });
  }

  if (info.menuItemId === 'analyze-page') {
    try {
      const content = await messaging.sendTabMessage<{ content: string }>(tab.id, {
        type: 'GET_PAGE_CONTENT',
      });
      const analysis = analyzeContent(content.content);

      await notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
        title: 'Page Analysis',
        message: `Words: ${analysis.wordCount}, Characters: ${analysis.charCount}`,
      });
    } catch (error) {
      console.error('Failed to analyze page:', error);
    }
  }
});

// Handle messages
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, state)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true; // Keep channel open for async
});

// Set up alarms
alarms.create(ALARM_NAMES.SYNC, { periodInMinutes: 30 });

alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAMES.SYNC) {
    await syncData();
  }
});

async function syncData() {
  const settings = await getSettings();
  if (!settings.syncEnabled) return;

  console.log('Syncing data...');
  // Implement sync logic
}

function processText(text: string) {
  state.processedCount++;
  return {
    original: text,
    processed: text.toUpperCase(),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    timestamp: Date.now(),
  };
}

function analyzeContent(content: string) {
  return {
    wordCount: content.split(/\s+/).filter(Boolean).length,
    charCount: content.length,
    paragraphs: content.split(/\n\n+/).length,
  };
}

// Storage change listener
storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEYS.SETTINGS]) {
    const newSettings = changes[STORAGE_KEYS.SETTINGS].newValue as Settings;
    state.enabled = newSettings.enabled;

    // Notify all tabs
    notifyAllTabs({
      type: 'SETTINGS_UPDATED',
      payload: newSettings,
    });
  }
});

async function notifyAllTabs(message: unknown) {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await messaging.sendTabMessage(tab.id, message);
      } catch {
        // Tab might not have content script
      }
    }
  }
}

console.log(`Background script initialized (${currentBrowser})`);
```

### src/background/messaging.ts

```typescript
import { browser, storage, messaging, openOptionsPage } from '@/shared/polyfill';
import type { Message, MessageResponse, ExtensionState } from '@/shared/types';
import { getSettings, updateSettings } from './storage';

export async function handleMessage(
  message: Message,
  sender: browser.Runtime.MessageSender,
  state: ExtensionState
): Promise<MessageResponse> {
  console.log('Received message:', message.type);

  try {
    switch (message.type) {
      case 'GET_STATE':
        return { success: true, data: state };

      case 'GET_SETTINGS':
        const settings = await getSettings();
        return { success: true, data: settings };

      case 'UPDATE_SETTINGS':
        await updateSettings(message.payload);
        return { success: true };

      case 'GET_CURRENT_TAB':
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        return { success: true, data: tab };

      case 'OPEN_OPTIONS':
        await openOptionsPage();
        return { success: true };

      case 'CREATE_TAB':
        const newTab = await browser.tabs.create({ url: message.payload.url });
        return { success: true, data: newTab };

      case 'GET_BROWSER_INFO':
        return {
          success: true,
          data: {
            browser: state.browser,
            version: browser.runtime.getManifest().version,
            manifestVersion: browser.runtime.getManifest().manifest_version,
          },
        };

      default:
        return { success: false, error: `Unknown message type: ${message.type}` };
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### src/background/storage.ts

```typescript
import { storage } from '@/shared/polyfill';
import type { Settings, StorageData } from '@/shared/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/shared/constants';

export async function initStorage(): Promise<void> {
  const existing = await storage.get<StorageData>(STORAGE_KEYS.SETTINGS);
  if (!existing[STORAGE_KEYS.SETTINGS]) {
    await storage.set({
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
    });
  }
}

export async function getSettings(): Promise<Settings> {
  const data = await storage.get<StorageData>(STORAGE_KEYS.SETTINGS);
  return data[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS;
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await storage.set({
    [STORAGE_KEYS.SETTINGS]: updated,
  });
  return updated;
}

export async function clearStorage(): Promise<void> {
  await storage.clear();
  await initStorage();
}
```

## Shared Types

### src/shared/types.ts

```typescript
import type { BrowserType } from './browser';

export interface Settings {
  enabled: boolean;
  showNotifications: boolean;
  autoProcess: boolean;
  syncEnabled: boolean;
  theme: 'system' | 'light' | 'dark';
}

export interface StorageData {
  settings: Settings;
  cache?: Record<string, unknown>;
  lastSync?: string;
}

export interface ExtensionState {
  enabled: boolean;
  processedCount: number;
  browser: BrowserType;
}

export interface Message {
  type: string;
  payload?: unknown;
}

export interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ProcessedResult {
  original: string;
  processed: string;
  wordCount: number;
  timestamp: number;
}

export interface PageContent {
  title: string;
  url: string;
  content: string;
}

export interface BrowserInfo {
  browser: BrowserType;
  version: string;
  manifestVersion: number;
}
```

### src/shared/constants.ts

```typescript
import type { Settings } from './types';

export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CACHE: 'cache',
  LAST_SYNC: 'lastSync',
} as const;

export const ALARM_NAMES = {
  SYNC: 'sync-alarm',
  CLEANUP: 'cleanup-alarm',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  showNotifications: true,
  autoProcess: false,
  syncEnabled: false,
  theme: 'system',
};

export const MESSAGE_TYPES = {
  GET_STATE: 'GET_STATE',
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_CURRENT_TAB: 'GET_CURRENT_TAB',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  GET_PAGE_CONTENT: 'GET_PAGE_CONTENT',
  SHOW_RESULT: 'SHOW_RESULT',
} as const;
```

## Content Script

### src/content/index.ts

```typescript
import { browser, messaging, storage } from '@/shared/polyfill';
import { currentBrowser } from '@/shared/browser';
import type { Message, Settings } from '@/shared/types';
import { injectUI, removeUI, showResult, showNotification } from './inject';

let settings: Settings | null = null;
let isInitialized = false;

async function init() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const response = await messaging.sendMessage<{ success: boolean; data: Settings }>({
      type: 'GET_SETTINGS',
    });

    if (response.success) {
      settings = response.data;
      if (settings?.enabled) {
        injectUI(currentBrowser);
      }
    }
  } catch (error) {
    console.error('Failed to get settings:', error);
  }

  browser.runtime.onMessage.addListener(handleMessage);

  console.log(`Content script initialized (${currentBrowser})`);
}

function handleMessage(message: Message): Promise<unknown> | void {
  switch (message.type) {
    case 'SETTINGS_UPDATED':
      settings = message.payload as Settings;
      if (settings.enabled) {
        injectUI(currentBrowser);
      } else {
        removeUI();
      }
      break;

    case 'GET_PAGE_CONTENT':
      return Promise.resolve({
        title: document.title,
        url: window.location.href,
        content: document.body.innerText,
      });

    case 'SHOW_RESULT':
      showResult(message.payload as { original: string; processed: string; wordCount: number });
      break;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

## CLAUDE.md Integration

```markdown
# Cross-Browser Extension Project

## Build & Run
- `npm run build` - Build for all browsers
- `npm run build:chrome` - Build for Chrome
- `npm run build:firefox` - Build for Firefox
- `npm run dev` - Watch mode with browser reload
- `npm run package:all` - Create distribution packages

## Architecture
- **src/manifest/** - Per-browser manifest overrides
- **src/background/** - Service worker/background script
- **src/content/** - Content scripts
- **src/popup/** - Extension popup (React)
- **src/shared/** - Cross-browser utilities and polyfills

## Code Patterns
- Use `webextension-polyfill` for unified browser API
- Import browser detection: `import { currentBrowser } from '@/shared/browser'`
- Use `@/shared/polyfill` for storage, messaging, etc.

## Testing
- `npm run start:chrome` - Run in Chrome
- `npm run start:firefox` - Run in Firefox
- Test in each browser before release

## Key Files
- `src/manifest/base.json` - Shared manifest
- `src/manifest/<browser>.json` - Browser-specific overrides
- `scripts/build.ts` - Build orchestration

## Browser Differences
- Chrome/Edge: Service worker, scripting API
- Firefox: Background script, may need MV2 fallback
- Safari: Requires Xcode conversion
```

## AI Suggestions

1. **Add MV2 Fallback**: Create automatic Manifest V2 fallback for older Firefox versions.

2. **Implement Feature Detection**: Add runtime feature detection for graceful API fallbacks.

3. **Add E2E Testing**: Set up Playwright for cross-browser E2E testing automation.

4. **Create Browser Sync**: Implement `browser.storage.sync` with graceful degradation.

5. **Add Hot Reload**: Implement live reload using extension-specific reload APIs.

6. **Create Release Pipeline**: Set up GitHub Actions for automated multi-browser releases.

7. **Add Analytics Abstraction**: Create privacy-respecting analytics that works across browsers.

8. **Implement Service Worker Persistence**: Handle service worker lifecycle across browsers.

9. **Add Declarative Net Request**: Create abstraction for content blocking with fallbacks.

10. **Create Documentation Site**: Generate cross-browser compatibility documentation.
