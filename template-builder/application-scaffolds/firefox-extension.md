# Firefox Extension Template

## Overview

Production-ready Firefox browser extension with Manifest V3, TypeScript, React for popup UI, and comprehensive tooling. Features background service workers, content scripts, storage APIs, and cross-browser messaging patterns.

## Quick Start

```bash
# Create extension directory
mkdir my-extension && cd my-extension

# Initialize with npm
npm init -y

# Install dependencies
npm install react react-dom
npm install -D @anthropic-ai/claude-code \
  @types/firefox-webext-browser \
  @types/react \
  @types/react-dom \
  esbuild \
  typescript \
  web-ext

# Build extension
npm run build

# Run in Firefox with auto-reload
npm run dev
```

## Project Structure

```
my-extension/
├── src/
│   ├── background/
│   │   ├── index.ts              # Background service worker
│   │   ├── messaging.ts          # Message handlers
│   │   ├── storage.ts            # Storage utilities
│   │   └── api.ts                # External API calls
│   ├── content/
│   │   ├── index.ts              # Content script entry
│   │   ├── inject.ts             # DOM injection
│   │   └── styles.css            # Content styles
│   ├── popup/
│   │   ├── index.tsx             # Popup entry
│   │   ├── App.tsx               # Popup app component
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Status.tsx
│   │   ├── hooks/
│   │   │   ├── useStorage.ts
│   │   │   └── useMessage.ts
│   │   └── styles.css            # Popup styles
│   ├── options/
│   │   ├── index.tsx             # Options page entry
│   │   ├── App.tsx               # Options app
│   │   └── styles.css
│   ├── shared/
│   │   ├── types.ts              # Shared types
│   │   ├── constants.ts          # Constants
│   │   ├── utils.ts              # Utilities
│   │   └── storage.ts            # Storage wrapper
│   └── manifest.json             # Extension manifest
├── public/
│   ├── popup.html
│   ├── options.html
│   └── icons/
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       └── icon-128.png
├── scripts/
│   ├── build.ts
│   ├── dev.ts
│   └── package.ts
├── dist/                         # Built extension
├── package.json
├── tsconfig.json
├── esbuild.config.ts
└── README.md
```

## Configuration

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A production-ready Firefox extension",
  "author": "Your Name",
  "homepage_url": "https://github.com/yourname/my-extension",

  "browser_specific_settings": {
    "gecko": {
      "id": "my-extension@example.com",
      "strict_min_version": "109.0"
    }
  },

  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "permissions": [
    "storage",
    "activeTab",
    "tabs",
    "alarms",
    "contextMenus",
    "notifications"
  ],

  "optional_permissions": [
    "history",
    "bookmarks",
    "<all_urls>"
  ],

  "host_permissions": [
    "https://*.example.com/*"
  ],

  "background": {
    "scripts": ["background.js"],
    "type": "module"
  },

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
  ],

  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y",
        "mac": "Command+Shift+Y"
      },
      "description": "Open extension popup"
    },
    "toggle-feature": {
      "suggested_key": {
        "default": "Ctrl+Shift+F",
        "mac": "Command+Shift+F"
      },
      "description": "Toggle main feature"
    }
  }
}
```

### package.json

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx scripts/dev.ts",
    "build": "tsx scripts/build.ts",
    "build:prod": "NODE_ENV=production tsx scripts/build.ts",
    "package": "tsx scripts/package.ts",
    "lint": "web-ext lint --source-dir dist",
    "test": "vitest run",
    "test:watch": "vitest",
    "start:firefox": "web-ext run --source-dir dist --firefox=firefoxdeveloperedition",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "webextension-polyfill": "^0.10.0"
  },
  "devDependencies": {
    "@anthropic-ai/claude-code": "latest",
    "@types/firefox-webext-browser": "^111.0.0",
    "@types/node": "^20.10.4",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "@types/webextension-polyfill": "^0.10.5",
    "esbuild": "^0.19.8",
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
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### esbuild.config.ts

```typescript
import * as esbuild from 'esbuild';
import { copyFileSync, cpSync, mkdirSync, existsSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export async function build() {
  // Clean dist directory
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true });
  }
  mkdirSync('dist', { recursive: true });

  // Build background script
  await esbuild.build({
    entryPoints: ['src/background/index.ts'],
    bundle: true,
    outfile: 'dist/background.js',
    format: 'esm',
    platform: 'browser',
    target: 'firefox109',
    minify: isProduction,
    sourcemap: !isProduction,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  });

  // Build content script
  await esbuild.build({
    entryPoints: ['src/content/index.ts'],
    bundle: true,
    outfile: 'dist/content.js',
    format: 'iife',
    platform: 'browser',
    target: 'firefox109',
    minify: isProduction,
    sourcemap: !isProduction,
  });

  // Build popup
  await esbuild.build({
    entryPoints: ['src/popup/index.tsx'],
    bundle: true,
    outfile: 'dist/popup.js',
    format: 'esm',
    platform: 'browser',
    target: 'firefox109',
    minify: isProduction,
    sourcemap: !isProduction,
    loader: {
      '.css': 'css',
    },
  });

  // Build options page
  await esbuild.build({
    entryPoints: ['src/options/index.tsx'],
    bundle: true,
    outfile: 'dist/options.js',
    format: 'esm',
    platform: 'browser',
    target: 'firefox109',
    minify: isProduction,
    sourcemap: !isProduction,
  });

  // Copy static files
  copyFileSync('src/manifest.json', 'dist/manifest.json');
  copyFileSync('public/popup.html', 'dist/popup.html');
  copyFileSync('public/options.html', 'dist/options.html');
  copyFileSync('src/content/styles.css', 'dist/content.css');
  copyFileSync('src/popup/styles.css', 'dist/popup.css');
  copyFileSync('src/options/styles.css', 'dist/options.css');
  cpSync('public/icons', 'dist/icons', { recursive: true });

  console.log('Build complete!');
}

build();
```

## Background Service Worker

### src/background/index.ts

```typescript
import browser from 'webextension-polyfill';
import { handleMessage } from './messaging';
import { initStorage, getSettings } from './storage';
import { STORAGE_KEYS, ALARM_NAMES } from '@/shared/constants';
import type { Settings } from '@/shared/types';

// Initialize extension on install
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    await initStorage();
    await createContextMenus();
  }

  if (details.reason === 'update') {
    console.log('Extension updated to version:', browser.runtime.getManifest().version);
  }
});

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener(handleMessage);

// Create context menus
async function createContextMenus() {
  browser.contextMenus.create({
    id: 'my-extension-action',
    title: 'Process with My Extension',
    contexts: ['selection'],
  });

  browser.contextMenus.create({
    id: 'my-extension-page',
    title: 'Analyze Page',
    contexts: ['page'],
  });
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'my-extension-action' && info.selectionText) {
    await processSelection(info.selectionText, tab?.id);
  }

  if (info.menuItemId === 'my-extension-page' && tab?.id) {
    await analyzePage(tab.id);
  }
});

async function processSelection(text: string, tabId?: number) {
  if (!tabId) return;

  try {
    // Process the selected text
    const result = await processText(text);

    // Send result to content script
    await browser.tabs.sendMessage(tabId, {
      type: 'SELECTION_PROCESSED',
      payload: result,
    });
  } catch (error) {
    console.error('Error processing selection:', error);
  }
}

async function analyzePage(tabId: number) {
  try {
    // Get page content from content script
    const response = await browser.tabs.sendMessage(tabId, {
      type: 'GET_PAGE_CONTENT',
    });

    // Analyze content
    const analysis = await analyzeContent(response.content);

    // Show notification
    await browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('icons/icon-48.png'),
      title: 'Page Analysis Complete',
      message: `Found ${analysis.wordCount} words`,
    });
  } catch (error) {
    console.error('Error analyzing page:', error);
  }
}

async function processText(text: string) {
  // Implement text processing logic
  return {
    original: text,
    processed: text.toUpperCase(),
    wordCount: text.split(/\s+/).length,
  };
}

async function analyzeContent(content: string) {
  // Implement content analysis logic
  return {
    wordCount: content.split(/\s+/).length,
    charCount: content.length,
  };
}

// Handle keyboard shortcuts
browser.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-feature') {
    const settings = await getSettings();
    await browser.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: {
        ...settings,
        enabled: !settings.enabled,
      },
    });

    // Notify all tabs about the change
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            payload: { enabled: !settings.enabled },
          });
        } catch {
          // Tab might not have content script loaded
        }
      }
    }
  }
});

// Set up alarms for periodic tasks
browser.alarms.create(ALARM_NAMES.SYNC, { periodInMinutes: 30 });

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAMES.SYNC) {
    await syncData();
  }
});

async function syncData() {
  const settings = await getSettings();
  if (!settings.syncEnabled) return;

  // Implement sync logic
  console.log('Syncing data...');
}

// Handle extension icon click when popup is disabled
// browser.action.onClicked.addListener(async (tab) => {
//   // Do something when icon is clicked (only works without popup)
// });

console.log('Background script initialized');
```

### src/background/messaging.ts

```typescript
import browser from 'webextension-polyfill';
import type { Message, MessageResponse } from '@/shared/types';
import { getSettings, updateSettings } from './storage';
import { callExternalAPI } from './api';

export async function handleMessage(
  message: Message,
  sender: browser.Runtime.MessageSender
): Promise<MessageResponse> {
  console.log('Received message:', message.type, 'from:', sender.tab?.id);

  try {
    switch (message.type) {
      case 'GET_SETTINGS':
        const settings = await getSettings();
        return { success: true, data: settings };

      case 'UPDATE_SETTINGS':
        await updateSettings(message.payload);
        return { success: true };

      case 'GET_CURRENT_TAB':
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        return { success: true, data: tab };

      case 'FETCH_DATA':
        const data = await callExternalAPI(message.payload.url);
        return { success: true, data };

      case 'OPEN_OPTIONS':
        await browser.runtime.openOptionsPage();
        return { success: true };

      case 'CREATE_TAB':
        const newTab = await browser.tabs.create({ url: message.payload.url });
        return { success: true, data: newTab };

      case 'INJECT_SCRIPT':
        if (sender.tab?.id) {
          await browser.scripting.executeScript({
            target: { tabId: sender.tab.id },
            files: [message.payload.script],
          });
        }
        return { success: true };

      default:
        return { success: false, error: 'Unknown message type' };
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
import browser from 'webextension-polyfill';
import type { Settings, StorageData } from '@/shared/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/shared/constants';

export async function initStorage(): Promise<void> {
  const existing = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (!existing[STORAGE_KEYS.SETTINGS]) {
    await browser.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
    });
  }
}

export async function getSettings(): Promise<Settings> {
  const data = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
  return data[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS;
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await browser.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: updated,
  });
  return updated;
}

export async function getAllData(): Promise<StorageData> {
  return browser.storage.local.get() as Promise<StorageData>;
}

export async function clearData(): Promise<void> {
  await browser.storage.local.clear();
  await initStorage();
}

// Listen for storage changes
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(`Storage key "${key}" changed:`, { oldValue, newValue });
    }
  }
});
```

### src/background/api.ts

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function callExternalAPI<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function postToAPI<T, R>(url: string, data: T): Promise<R> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

## Content Script

### src/content/index.ts

```typescript
import browser from 'webextension-polyfill';
import type { Message, Settings } from '@/shared/types';
import { injectUI, removeUI } from './inject';

let settings: Settings | null = null;
let isInitialized = false;

async function init() {
  if (isInitialized) return;
  isInitialized = true;

  // Get initial settings
  const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
  if (response.success) {
    settings = response.data;
    if (settings?.enabled) {
      injectUI();
    }
  }

  // Listen for messages
  browser.runtime.onMessage.addListener(handleMessage);

  // Set up mutation observer for dynamic content
  observeDOM();

  console.log('Content script initialized');
}

function handleMessage(message: Message): Promise<unknown> | void {
  switch (message.type) {
    case 'SETTINGS_UPDATED':
      settings = { ...settings, ...message.payload } as Settings;
      if (settings.enabled) {
        injectUI();
      } else {
        removeUI();
      }
      break;

    case 'GET_PAGE_CONTENT':
      return Promise.resolve({
        content: document.body.innerText,
        title: document.title,
        url: window.location.href,
      });

    case 'SELECTION_PROCESSED':
      showProcessedResult(message.payload);
      break;

    case 'HIGHLIGHT_ELEMENT':
      highlightElement(message.payload.selector);
      break;
  }
}

function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Handle added nodes
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            processNewElement(node);
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function processNewElement(element: HTMLElement) {
  if (!settings?.enabled) return;
  // Process newly added elements
}

function showProcessedResult(result: { original: string; processed: string }) {
  // Show result in a tooltip or modal
  const tooltip = document.createElement('div');
  tooltip.className = 'my-extension-tooltip';
  tooltip.innerHTML = `
    <div class="tooltip-header">Processed Result</div>
    <div class="tooltip-content">${result.processed}</div>
  `;
  document.body.appendChild(tooltip);

  // Position near selection
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
  }

  // Remove after delay
  setTimeout(() => tooltip.remove(), 5000);
}

function highlightElement(selector: string) {
  const element = document.querySelector(selector);
  if (element) {
    element.classList.add('my-extension-highlight');
    setTimeout(() => {
      element.classList.remove('my-extension-highlight');
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

### src/content/inject.ts

```typescript
const CONTAINER_ID = 'my-extension-container';

export function injectUI() {
  if (document.getElementById(CONTAINER_ID)) return;

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.innerHTML = `
    <div class="my-extension-widget">
      <button class="my-extension-toggle" title="Toggle My Extension">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      </button>
      <div class="my-extension-panel hidden">
        <div class="panel-header">
          <span>My Extension</span>
          <button class="close-btn">&times;</button>
        </div>
        <div class="panel-content">
          <p>Extension is active on this page.</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Add event listeners
  const toggle = container.querySelector('.my-extension-toggle');
  const panel = container.querySelector('.my-extension-panel');
  const closeBtn = container.querySelector('.close-btn');

  toggle?.addEventListener('click', () => {
    panel?.classList.toggle('hidden');
  });

  closeBtn?.addEventListener('click', () => {
    panel?.classList.add('hidden');
  });
}

export function removeUI() {
  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    container.remove();
  }
}
```

### src/content/styles.css

```css
#my-extension-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.my-extension-widget {
  position: relative;
}

.my-extension-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3b82f6;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.my-extension-toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.my-extension-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.my-extension-panel.hidden {
  display: none;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #64748b;
}

.panel-content {
  padding: 16px;
}

.my-extension-tooltip {
  position: absolute;
  background: #1e293b;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 300px;
  z-index: 999999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tooltip-header {
  font-weight: 600;
  margin-bottom: 8px;
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
}

.my-extension-highlight {
  outline: 2px solid #3b82f6 !important;
  outline-offset: 2px;
}
```

## Popup UI

### src/popup/index.tsx

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
```

### src/popup/App.tsx

```typescript
import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { Status } from './components/Status';
import { useStorage } from './hooks/useStorage';
import type { Settings as SettingsType } from '@/shared/types';

export default function App() {
  const [settings, setSettings, loading] = useStorage<SettingsType>('settings');
  const [currentTab, setCurrentTab] = useState<browser.Tabs.Tab | null>(null);

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      setCurrentTab(tab);
    });
  }, []);

  const handleToggle = async () => {
    const newEnabled = !settings?.enabled;
    await setSettings({ ...settings!, enabled: newEnabled });

    // Notify content script
    if (currentTab?.id) {
      try {
        await browser.tabs.sendMessage(currentTab.id, {
          type: 'SETTINGS_UPDATED',
          payload: { enabled: newEnabled },
        });
      } catch {
        // Content script might not be loaded
      }
    }
  };

  const handleOpenOptions = () => {
    browser.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <Header />

      <Status
        enabled={settings?.enabled ?? false}
        currentUrl={currentTab?.url}
        onToggle={handleToggle}
      />

      <Settings
        settings={settings!}
        onUpdate={setSettings}
      />

      <div className="footer">
        <button className="link-button" onClick={handleOpenOptions}>
          Open Full Settings
        </button>
      </div>
    </div>
  );
}
```

### src/popup/components/Header.tsx

```typescript
import React from 'react';

export function Header() {
  return (
    <header className="header">
      <div className="logo">
        <img src="../icons/icon-32.png" alt="Logo" />
        <span>My Extension</span>
      </div>
      <span className="version">v1.0.0</span>
    </header>
  );
}
```

### src/popup/components/Status.tsx

```typescript
import React from 'react';

interface StatusProps {
  enabled: boolean;
  currentUrl?: string;
  onToggle: () => void;
}

export function Status({ enabled, currentUrl, onToggle }: StatusProps) {
  const isAllowedUrl = currentUrl?.startsWith('http');

  return (
    <div className="status-section">
      <div className="status-row">
        <span className="status-label">Status</span>
        <div className={`status-badge ${enabled ? 'active' : 'inactive'}`}>
          {enabled ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="status-row">
        <span className="status-label">Current Page</span>
        <span className="status-value truncate">
          {isAllowedUrl ? new URL(currentUrl!).hostname : 'Not available'}
        </span>
      </div>

      <button
        className={`toggle-button ${enabled ? 'enabled' : ''}`}
        onClick={onToggle}
        disabled={!isAllowedUrl}
      >
        {enabled ? 'Disable' : 'Enable'} on this page
      </button>

      {!isAllowedUrl && (
        <p className="help-text">
          Extension cannot run on this page type.
        </p>
      )}
    </div>
  );
}
```

### src/popup/components/Settings.tsx

```typescript
import React from 'react';
import type { Settings as SettingsType } from '@/shared/types';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: SettingsType) => void;
}

export function Settings({ settings, onUpdate }: SettingsProps) {
  const handleChange = (key: keyof SettingsType, value: unknown) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="settings-section">
      <h3>Quick Settings</h3>

      <label className="setting-item">
        <span>Show notifications</span>
        <input
          type="checkbox"
          checked={settings.showNotifications}
          onChange={(e) => handleChange('showNotifications', e.target.checked)}
        />
      </label>

      <label className="setting-item">
        <span>Auto-process</span>
        <input
          type="checkbox"
          checked={settings.autoProcess}
          onChange={(e) => handleChange('autoProcess', e.target.checked)}
        />
      </label>

      <label className="setting-item">
        <span>Theme</span>
        <select
          value={settings.theme}
          onChange={(e) => handleChange('theme', e.target.value)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
  );
}
```

### src/popup/hooks/useStorage.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';

export function useStorage<T>(key: string): [T | null, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    browser.storage.local.get(key).then((result) => {
      setValue(result[key] ?? null);
      setLoading(false);
    });

    const handleChange = (changes: browser.Storage.StorageAreaOnChangedChangesType) => {
      if (changes[key]) {
        setValue(changes[key].newValue);
      }
    };

    browser.storage.onChanged.addListener(handleChange);
    return () => {
      browser.storage.onChanged.removeListener(handleChange);
    };
  }, [key]);

  const updateValue = useCallback(
    async (newValue: T) => {
      await browser.storage.local.set({ [key]: newValue });
      setValue(newValue);
    },
    [key]
  );

  return [value, updateValue, loading];
}
```

### src/popup/styles.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 350px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #1e293b;
  background: #ffffff;
}

.popup-container {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.logo img {
  width: 24px;
  height: 24px;
}

.version {
  color: #64748b;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.status-section {
  margin-bottom: 16px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-label {
  color: #64748b;
  font-size: 13px;
}

.status-value {
  max-width: 180px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.toggle-button {
  width: 100%;
  padding: 10px;
  margin-top: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover:not(:disabled) {
  background: #e2e8f0;
}

.toggle-button.enabled {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.toggle-button.enabled:hover {
  background: #2563eb;
}

.toggle-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.help-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  text-align: center;
}

.settings-section {
  padding: 16px 0;
  border-top: 1px solid #e2e8f0;
}

.settings-section h3 {
  font-size: 13px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.setting-item select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
}

.footer {
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.link-button {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 13px;
}

.link-button:hover {
  text-decoration: underline;
}
```

## Shared Types

### src/shared/types.ts

```typescript
export interface Settings {
  enabled: boolean;
  showNotifications: boolean;
  autoProcess: boolean;
  syncEnabled: boolean;
  theme: 'system' | 'light' | 'dark';
  apiKey?: string;
}

export interface StorageData {
  settings: Settings;
  cache?: Record<string, unknown>;
  lastSync?: string;
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

export interface PageContent {
  content: string;
  title: string;
  url: string;
}

export interface ProcessedResult {
  original: string;
  processed: string;
  wordCount: number;
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
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_CURRENT_TAB: 'GET_CURRENT_TAB',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  GET_PAGE_CONTENT: 'GET_PAGE_CONTENT',
  SELECTION_PROCESSED: 'SELECTION_PROCESSED',
} as const;
```

## CLAUDE.md Integration

```markdown
# Firefox Extension Project

## Build & Run
- `npm run dev` - Build and watch for changes
- `npm run start:firefox` - Run in Firefox Developer Edition
- `npm run build:prod` - Production build
- `npm run package` - Create .xpi for distribution

## Architecture
- **background/** - Service worker for background tasks
- **content/** - Scripts injected into web pages
- **popup/** - Extension popup UI (React)
- **options/** - Full settings page (React)
- **shared/** - Types, constants, utilities

## Code Patterns
- Use `webextension-polyfill` for cross-browser compatibility
- Messages between contexts via `browser.runtime.sendMessage`
- Storage via `browser.storage.local` with typed wrappers

## Testing
- `npm test` - Run Vitest tests
- Use `web-ext lint` to validate manifest

## Key Files
- `manifest.json` - Extension configuration
- `background/index.ts` - Main background script
- `content/index.ts` - Content script entry
- `popup/App.tsx` - Popup UI root

## Permissions
- Add permissions to manifest.json as needed
- Use `optional_permissions` for runtime requests
```

## AI Suggestions

1. **Add Manifest V2 Fallback**: Create conditional manifest for older Firefox versions that don't fully support MV3.

2. **Implement Sync Storage**: Use `browser.storage.sync` for cross-device settings synchronization.

3. **Add Declarative Net Request**: Implement content blocking using DNR API for better performance.

4. **Create Sidebar Panel**: Add sidebar UI using `browser.sidebarAction` for persistent interface.

5. **Implement DevTools Panel**: Create custom DevTools panel for developer-focused features.

6. **Add Internationalization**: Use `browser.i18n` API with `_locales/` folder for multi-language support.

7. **Implement Content Script Isolation**: Use Shadow DOM for injected UI to prevent style conflicts.

8. **Add Offline Support**: Implement service worker caching for offline extension functionality.

9. **Create Update Mechanism**: Handle extension updates gracefully with migration logic.

10. **Add Telemetry**: Implement privacy-respecting analytics for usage insights.
