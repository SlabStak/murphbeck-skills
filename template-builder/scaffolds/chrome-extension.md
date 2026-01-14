# Chrome Extension Scaffold

Modern Chrome Extension (Manifest V3) with TypeScript, React, Vite, and TailwindCSS.

## Directory Structure

```
my-extension/
├── .claude/
│   ├── agents/
│   │   └── build-validator.md
│   └── settings.json
├── src/
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   ├── index.ts
│   │   └── styles.css
│   ├── popup/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── index.html
│   │   └── components/
│   │       ├── Header.tsx
│   │       └── Settings.tsx
│   ├── options/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.html
│   ├── sidepanel/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.html
│   ├── lib/
│   │   ├── storage.ts
│   │   ├── messaging.ts
│   │   └── api.ts
│   ├── hooks/
│   │   ├── useStorage.ts
│   │   └── useMessage.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── public/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── manifest.json
├── tests/
│   ├── background.test.ts
│   └── storage.test.ts
├── .env.example
├── .gitignore
├── CLAUDE.md
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Key Files

### CLAUDE.md

```markdown
# Chrome Extension Development Workflow

**Always use `bun`, not `npm`.**

## Commands
bun run dev          # Start dev mode (watches for changes)
bun run build        # Build for production
bun run zip          # Create .zip for Chrome Web Store
bun run lint         # Lint code
bun run typecheck    # TypeScript check
bun run test         # Run tests

## Loading the Extension
1. Run `bun run build`
2. Open chrome://extensions
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Code Style
- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions)
- Use chrome.storage.sync for user settings
- Use chrome.storage.local for large data

## Manifest V3 Rules
- No remote code execution
- Service workers (not background pages)
- Use declarativeNetRequest for blocking
- Minimal permissions (request only what's needed)

## Testing
- Unit tests for business logic
- Test in Chrome with unpacked extension
- Test in Edge (Chromium-based)
```

### public/manifest.json

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A Chrome extension built with React and TypeScript",

  "permissions": [
    "storage",
    "activeTab",
    "sidePanel"
  ],

  "optional_permissions": [
    "tabs",
    "history"
  ],

  "host_permissions": [
    "https://*.example.com/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_title": "My Extension"
  },

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },

  "content_scripts": [
    {
      "matches": ["https://*.example.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],

  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "web_accessible_resources": [
    {
      "resources": ["assets/*"],
      "matches": ["https://*.example.com/*"]
    }
  ]
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// Copy manifest and assets to dist
function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      const distDir = resolve(__dirname, 'dist')
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true })
      }

      // Copy manifest
      copyFileSync(
        resolve(__dirname, 'public/manifest.json'),
        resolve(distDir, 'manifest.json')
      )

      // Copy icons
      const iconsDir = resolve(distDir, 'icons')
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true })
      }
      for (const size of ['16', '32', '48', '128']) {
        copyFileSync(
          resolve(__dirname, `public/icons/icon-${size}.png`),
          resolve(iconsDir, `icon-${size}.png`)
        )
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
  },
})
```

### src/background/index.ts

```typescript
// Service Worker (Background Script)
import { storage } from '@/lib/storage'
import { MessageType, Message } from '@/types'

// Extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await storage.set({
      enabled: true,
      theme: 'system',
      notifications: true,
    })

    // Open options page on install
    chrome.runtime.openOptionsPage()
  }

  if (details.reason === 'update') {
    console.log('Extension updated to version', chrome.runtime.getManifest().version)
  }
})

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('Message handler error:', error)
        sendResponse({ error: error.message })
      })

    return true // Keep message channel open for async response
  }
)

async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case MessageType.GET_SETTINGS:
      return storage.getAll()

    case MessageType.UPDATE_SETTINGS:
      await storage.set(message.payload)
      return { success: true }

    case MessageType.GET_TAB_INFO:
      if (sender.tab) {
        return {
          tabId: sender.tab.id,
          url: sender.tab.url,
          title: sender.tab.title,
        }
      }
      return null

    case MessageType.INJECT_CONTENT:
      if (message.payload.tabId) {
        await chrome.scripting.executeScript({
          target: { tabId: message.payload.tabId },
          files: ['content.js'],
        })
        return { success: true }
      }
      throw new Error('Tab ID required')

    default:
      throw new Error(`Unknown message type: ${(message as Message).type}`)
  }
}

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'my-extension-action',
    title: 'Process with My Extension',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'my-extension-action' && info.selectionText) {
    // Handle context menu click
    console.log('Selected text:', info.selectionText)
  }
})

// Side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error) => console.error(error))

// Keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-feature') {
    // Handle keyboard shortcut
    console.log('Toggle feature shortcut pressed')
  }
})

// Alarm for periodic tasks
chrome.alarms.create('periodic-task', { periodInMinutes: 60 })

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodic-task') {
    // Perform periodic task
    console.log('Periodic task executed')
  }
})

export {}
```

### src/content/index.ts

```typescript
// Content Script - runs in the context of web pages
import { MessageType } from '@/types'
import './styles.css'

class ContentScript {
  private observer: MutationObserver | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Check if extension is enabled
    const settings = await chrome.runtime.sendMessage({
      type: MessageType.GET_SETTINGS,
    })

    if (!settings.enabled) {
      return
    }

    // Initialize features
    this.setupObserver()
    this.injectUI()
    this.addEventListeners()

    console.log('Content script initialized')
  }

  private setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          this.handleDOMChanges(mutation.addedNodes)
        }
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  private handleDOMChanges(nodes: NodeList) {
    nodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        // Process new elements
        this.processElement(node)
      }
    })
  }

  private processElement(element: HTMLElement) {
    // Add custom processing logic
    if (element.matches('.target-class')) {
      // Process matching elements
    }
  }

  private injectUI() {
    // Create floating button
    const button = document.createElement('button')
    button.id = 'my-extension-button'
    button.className = 'my-extension-floating-button'
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
      </svg>
    `
    button.addEventListener('click', () => this.handleButtonClick())

    document.body.appendChild(button)
  }

  private addEventListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'HIGHLIGHT_TEXT') {
        this.highlightText(message.payload.text)
        sendResponse({ success: true })
      }
      return true
    })

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        this.handleButtonClick()
      }
    })
  }

  private handleButtonClick() {
    // Send message to background script
    chrome.runtime.sendMessage({
      type: MessageType.GET_TAB_INFO,
    }).then((tabInfo) => {
      console.log('Current tab:', tabInfo)
    })
  }

  private highlightText(text: string) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    )

    const nodesToHighlight: { node: Text; start: number; end: number }[] = []

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const index = node.textContent?.indexOf(text) ?? -1

      if (index !== -1) {
        nodesToHighlight.push({
          node,
          start: index,
          end: index + text.length,
        })
      }
    }

    // Highlight found text
    nodesToHighlight.forEach(({ node, start, end }) => {
      const range = document.createRange()
      range.setStart(node, start)
      range.setEnd(node, end)

      const highlight = document.createElement('mark')
      highlight.className = 'my-extension-highlight'
      range.surroundContents(highlight)
    })
  }

  public destroy() {
    this.observer?.disconnect()
    document.getElementById('my-extension-button')?.remove()
  }
}

// Initialize
const contentScript = new ContentScript()

// Cleanup on unload
window.addEventListener('unload', () => {
  contentScript.destroy()
})
```

### src/content/styles.css

```css
.my-extension-floating-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.my-extension-floating-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.my-extension-highlight {
  background: #fef08a;
  padding: 2px;
  border-radius: 2px;
}
```

### src/popup/App.tsx

```tsx
import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Header } from './components/Header'
import { Settings } from './components/Settings'

type Tab = 'home' | 'settings'

export function App() {
  const [tab, setTab] = useState<Tab>('home')
  const { settings, updateSettings, loading } = useStorage()
  const [currentUrl, setCurrentUrl] = useState<string>('')

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url)
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="w-80 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="w-80 bg-white">
      <Header
        enabled={settings.enabled}
        onToggle={() => updateSettings({ enabled: !settings.enabled })}
      />

      <nav className="flex border-b">
        <button
          onClick={() => setTab('home')}
          className={`flex-1 py-2 text-sm font-medium ${
            tab === 'home'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex-1 py-2 text-sm font-medium ${
            tab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Settings
        </button>
      </nav>

      <div className="p-4">
        {tab === 'home' ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 truncate">
              Current: {currentUrl || 'No page loaded'}
            </div>

            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Open Full Options
            </button>

            <button
              onClick={() => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  if (tabs[0]?.id) {
                    chrome.sidePanel.open({ tabId: tabs[0].id })
                  }
                })
              }}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Open Side Panel
            </button>
          </div>
        ) : (
          <Settings settings={settings} onUpdate={updateSettings} />
        )}
      </div>

      <footer className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
        Version {chrome.runtime.getManifest().version}
      </footer>
    </div>
  )
}
```

### src/lib/storage.ts

```typescript
type StorageData = {
  enabled: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  apiKey?: string
  lastSync?: number
}

const DEFAULTS: StorageData = {
  enabled: true,
  theme: 'system',
  notifications: true,
}

export const storage = {
  async get<K extends keyof StorageData>(key: K): Promise<StorageData[K]> {
    const result = await chrome.storage.sync.get(key)
    return result[key] ?? DEFAULTS[key]
  },

  async getAll(): Promise<StorageData> {
    const result = await chrome.storage.sync.get(null)
    return { ...DEFAULTS, ...result }
  },

  async set(data: Partial<StorageData>): Promise<void> {
    await chrome.storage.sync.set(data)
  },

  async remove(keys: (keyof StorageData)[]): Promise<void> {
    await chrome.storage.sync.remove(keys)
  },

  async clear(): Promise<void> {
    await chrome.storage.sync.clear()
  },

  onChange(
    callback: (changes: {
      [key in keyof StorageData]?: {
        oldValue?: StorageData[key]
        newValue?: StorageData[key]
      }
    }) => void
  ): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync') {
        callback(changes as Parameters<typeof callback>[0])
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  },
}

// Local storage for larger data
export const localStorage = {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key)
    return result[key] ?? null
  },

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value })
  },

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key)
  },
}
```

### src/hooks/useStorage.ts

```typescript
import { useState, useEffect, useCallback } from 'react'
import { storage } from '@/lib/storage'

type StorageData = {
  enabled: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  apiKey?: string
}

export function useStorage() {
  const [settings, setSettings] = useState<StorageData>({
    enabled: true,
    theme: 'system',
    notifications: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial settings
    storage.getAll().then((data) => {
      setSettings(data)
      setLoading(false)
    })

    // Listen for changes
    const unsubscribe = storage.onChange((changes) => {
      setSettings((prev) => {
        const updated = { ...prev }
        for (const [key, change] of Object.entries(changes)) {
          if (change.newValue !== undefined) {
            ;(updated as Record<string, unknown>)[key] = change.newValue
          }
        }
        return updated
      })
    })

    return unsubscribe
  }, [])

  const updateSettings = useCallback(async (updates: Partial<StorageData>) => {
    await storage.set(updates)
    // State will be updated via onChange listener
  }, [])

  return { settings, updateSettings, loading }
}
```

### src/types/index.ts

```typescript
export const MessageType = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_TAB_INFO: 'GET_TAB_INFO',
  INJECT_CONTENT: 'INJECT_CONTENT',
} as const

export type MessageType = (typeof MessageType)[keyof typeof MessageType]

export type Message =
  | { type: typeof MessageType.GET_SETTINGS }
  | { type: typeof MessageType.UPDATE_SETTINGS; payload: Record<string, unknown> }
  | { type: typeof MessageType.GET_TAB_INFO }
  | { type: typeof MessageType.INJECT_CONTENT; payload: { tabId: number } }

export type TabInfo = {
  tabId: number
  url: string
  title: string
}
```

### package.json

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "vite build",
    "zip": "bun run build && cd dist && zip -r ../extension.zip .",
    "lint": "bunx eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.260",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0"
  }
}
```

### .claude/settings.json

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bunx prettier --write . || true"
          }
        ]
      }
    ]
  }
}
```

## Setup Commands

```bash
# Create project
mkdir my-extension && cd my-extension
bun init

# Install dependencies
bun add react react-dom
bun add -d vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/chrome tailwindcss postcss autoprefixer vitest

# Initialize TailwindCSS
bunx tailwindcss init -p

# Create directory structure
mkdir -p src/{background,content,popup/components,options,sidepanel,lib,hooks,types,styles}
mkdir -p public/icons

# Build extension
bun run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the dist folder
```

## Features Included

- **Manifest V3** - Latest Chrome extension standard
- **React + TypeScript** - Type-safe UI components
- **Vite** - Fast bundling with HMR
- **TailwindCSS** - Utility-first styling
- **Service Worker** - Background processing
- **Content Script** - Page manipulation
- **Side Panel** - Chrome side panel API
- **Storage API** - Sync and local storage
- **Message Passing** - Inter-script communication

## Testing in Development

1. Make changes to source files
2. Run `bun run dev` (watches for changes)
3. Go to chrome://extensions
4. Click refresh icon on your extension
5. Test changes in browser
