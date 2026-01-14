# Safari Web Extension Template

## Overview

Production-ready Safari Web Extension with Xcode integration, Swift native messaging, and cross-platform support for macOS and iOS. Features content scripts, background service workers, native app communication, and App Store distribution support.

## Quick Start

```bash
# Prerequisites: Xcode 14+ with Safari Web Extension template

# Create new Safari Web Extension project
# 1. Open Xcode
# 2. File > New > Project
# 3. Select "Safari Extension App" under Multiplatform or macOS/iOS
# 4. Enter product name and configure

# Or convert existing extension
xcrun safari-web-extension-converter /path/to/extension \
  --project-location /path/to/output \
  --app-name "My Extension" \
  --bundle-identifier com.example.my-extension

# Build and run
xcodebuild -project MyExtension.xcodeproj -scheme "My Extension (macOS)" build

# For development, run from Xcode with Safari debugging enabled
```

## Project Structure

```
MyExtension/
├── MyExtension.xcodeproj/
├── Shared (App)/
│   ├── Assets.xcassets/
│   │   ├── AccentColor.colorset/
│   │   ├── AppIcon.appiconset/
│   │   └── Contents.json
│   ├── ViewController.swift
│   └── Resources/
│       ├── Main.storyboard
│       └── Script.js
├── Shared (Extension)/
│   ├── Resources/
│   │   ├── _locales/
│   │   │   └── en/
│   │   │       └── messages.json
│   │   ├── images/
│   │   │   ├── icon-16.png
│   │   │   ├── icon-32.png
│   │   │   ├── icon-48.png
│   │   │   ├── icon-64.png
│   │   │   ├── icon-96.png
│   │   │   ├── icon-128.png
│   │   │   ├── icon-256.png
│   │   │   └── icon-512.png
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   ├── popup.css
│   │   │   └── popup.js
│   │   ├── options/
│   │   │   ├── options.html
│   │   │   ├── options.css
│   │   │   └── options.js
│   │   ├── background.js
│   │   ├── content.js
│   │   ├── content.css
│   │   └── manifest.json
│   ├── SafariWebExtensionHandler.swift
│   └── Info.plist
├── macOS (App)/
│   ├── AppDelegate.swift
│   ├── Main.storyboard
│   └── Info.plist
├── macOS (Extension)/
│   └── Info.plist
├── iOS (App)/
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── Main.storyboard
│   ├── LaunchScreen.storyboard
│   └── Info.plist
├── iOS (Extension)/
│   └── Info.plist
└── README.md
```

## Configuration

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "__MSG_extension_name__",
  "version": "1.0.0",
  "default_locale": "en",
  "description": "__MSG_extension_description__",
  "homepage_url": "https://example.com",

  "icons": {
    "16": "images/icon-16.png",
    "32": "images/icon-32.png",
    "48": "images/icon-48.png",
    "64": "images/icon-64.png",
    "96": "images/icon-96.png",
    "128": "images/icon-128.png",
    "256": "images/icon-256.png",
    "512": "images/icon-512.png"
  },

  "permissions": [
    "storage",
    "activeTab",
    "tabs",
    "nativeMessaging"
  ],

  "optional_permissions": [
    "history",
    "bookmarks"
  ],

  "host_permissions": [
    "https://*.example.com/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "images/icon-16.png",
      "32": "images/icon-32.png",
      "48": "images/icon-48.png"
    },
    "default_title": "__MSG_extension_name__"
  },

  "options_ui": {
    "page": "options/options.html",
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
      "resources": ["images/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### _locales/en/messages.json

```json
{
  "extension_name": {
    "message": "My Safari Extension",
    "description": "The name of the extension"
  },
  "extension_description": {
    "message": "A powerful Safari extension for enhanced browsing",
    "description": "The description of the extension"
  },
  "popup_title": {
    "message": "Extension Settings",
    "description": "Title shown in the popup"
  },
  "enable_button": {
    "message": "Enable",
    "description": "Button to enable the extension"
  },
  "disable_button": {
    "message": "Disable",
    "description": "Button to disable the extension"
  }
}
```

## Swift Native Handler

### Shared (Extension)/SafariWebExtensionHandler.swift

```swift
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    private let logger = Logger(subsystem: "com.example.myextension", category: "ExtensionHandler")

    func beginRequest(with context: NSExtensionContext) {
        guard let item = context.inputItems.first as? NSExtensionItem,
              let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            logger.error("Failed to get message from extension context")
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }

        logger.info("Received message from web extension: \(String(describing: message))")

        // Handle different message types
        if let action = message["action"] as? String {
            switch action {
            case "getSettings":
                handleGetSettings(context: context)
            case "saveSettings":
                if let settings = message["settings"] as? [String: Any] {
                    handleSaveSettings(settings: settings, context: context)
                }
            case "performNativeAction":
                if let data = message["data"] as? [String: Any] {
                    handleNativeAction(data: data, context: context)
                }
            case "openURL":
                if let urlString = message["url"] as? String {
                    handleOpenURL(urlString: urlString, context: context)
                }
            default:
                sendResponse(["error": "Unknown action"], context: context)
            }
        } else {
            sendResponse(["error": "No action specified"], context: context)
        }
    }

    private func handleGetSettings(context: NSExtensionContext) {
        let defaults = UserDefaults.standard

        let settings: [String: Any] = [
            "enabled": defaults.bool(forKey: "extensionEnabled"),
            "theme": defaults.string(forKey: "theme") ?? "system",
            "autoProcess": defaults.bool(forKey: "autoProcess"),
            "syncEnabled": defaults.bool(forKey: "syncEnabled")
        ]

        sendResponse(["settings": settings], context: context)
    }

    private func handleSaveSettings(settings: [String: Any], context: NSExtensionContext) {
        let defaults = UserDefaults.standard

        if let enabled = settings["enabled"] as? Bool {
            defaults.set(enabled, forKey: "extensionEnabled")
        }
        if let theme = settings["theme"] as? String {
            defaults.set(theme, forKey: "theme")
        }
        if let autoProcess = settings["autoProcess"] as? Bool {
            defaults.set(autoProcess, forKey: "autoProcess")
        }
        if let syncEnabled = settings["syncEnabled"] as? Bool {
            defaults.set(syncEnabled, forKey: "syncEnabled")
        }

        sendResponse(["success": true], context: context)
    }

    private func handleNativeAction(data: [String: Any], context: NSExtensionContext) {
        // Perform native Swift operations
        // This could include:
        // - Keychain access
        // - Core Data operations
        // - System integrations
        // - App Group shared data

        logger.info("Performing native action with data: \(String(describing: data))")

        // Example: Process data and return result
        let result: [String: Any] = [
            "processed": true,
            "timestamp": Date().timeIntervalSince1970
        ]

        sendResponse(result, context: context)
    }

    private func handleOpenURL(urlString: String, context: NSExtensionContext) {
        guard let url = URL(string: urlString) else {
            sendResponse(["error": "Invalid URL"], context: context)
            return
        }

        #if os(macOS)
        NSWorkspace.shared.open(url)
        #elseif os(iOS)
        // For iOS, we need to communicate back to the containing app
        // or use Universal Links
        #endif

        sendResponse(["success": true], context: context)
    }

    private func sendResponse(_ response: [String: Any], context: NSExtensionContext) {
        let item = NSExtensionItem()
        item.userInfo = [SFExtensionMessageKey: response]
        context.completeRequest(returningItems: [item], completionHandler: nil)
    }
}
```

## Background Script

### background.js

```javascript
// Safari Web Extension Background Script

// State management
let extensionState = {
  enabled: true,
  processedCount: 0
};

// Initialize on install
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Initialize storage with defaults
    await browser.storage.local.set({
      enabled: true,
      theme: 'system',
      autoProcess: false,
      showNotifications: true
    });

    // Get settings from native app
    try {
      const response = await browser.runtime.sendNativeMessage(
        'application.id',
        { action: 'getSettings' }
      );
      console.log('Native settings:', response);
    } catch (error) {
      console.log('Native messaging not available:', error);
    }
  }
});

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message, 'from:', sender);

  (async () => {
    try {
      const response = await handleMessage(message, sender);
      sendResponse(response);
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'GET_STATE':
      return { success: true, data: extensionState };

    case 'GET_SETTINGS':
      const settings = await browser.storage.local.get();
      return { success: true, data: settings };

    case 'UPDATE_SETTINGS':
      await browser.storage.local.set(message.payload);

      // Sync with native app
      try {
        await browser.runtime.sendNativeMessage('application.id', {
          action: 'saveSettings',
          settings: message.payload
        });
      } catch (error) {
        console.log('Failed to sync with native app:', error);
      }

      // Notify content scripts
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            payload: message.payload
          });
        } catch (e) {
          // Tab might not have content script
        }
      }

      return { success: true };

    case 'PROCESS_CONTENT':
      const result = await processContent(message.payload);
      extensionState.processedCount++;
      return { success: true, data: result };

    case 'GET_CURRENT_TAB':
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      return { success: true, data: tab };

    case 'NATIVE_ACTION':
      try {
        const nativeResponse = await browser.runtime.sendNativeMessage(
          'application.id',
          message.payload
        );
        return { success: true, data: nativeResponse };
      } catch (error) {
        return { success: false, error: 'Native messaging failed' };
      }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

async function processContent(content) {
  // Implement content processing logic
  return {
    original: content,
    processed: content.toUpperCase(),
    wordCount: content.split(/\s+/).filter(Boolean).length,
    timestamp: Date.now()
  };
}

// Handle toolbar icon click (if no popup)
// browser.action.onClicked.addListener(async (tab) => {
//   console.log('Extension icon clicked on tab:', tab.id);
// });

// Storage change listener
browser.storage.onChanged.addListener((changes, areaName) => {
  console.log('Storage changed:', areaName, changes);

  if (changes.enabled) {
    extensionState.enabled = changes.enabled.newValue;
  }
});

// Handle extension being enabled/disabled in Safari
browser.management?.onEnabled?.addListener((info) => {
  if (info.id === browser.runtime.id) {
    console.log('Extension enabled');
  }
});

browser.management?.onDisabled?.addListener((info) => {
  if (info.id === browser.runtime.id) {
    console.log('Extension disabled');
  }
});

console.log('Background script initialized');
```

## Content Script

### content.js

```javascript
// Safari Web Extension Content Script

(function() {
  'use strict';

  let settings = null;
  let isInitialized = false;

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Get settings from background
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success) {
        settings = response.data;
        if (settings.enabled) {
          injectUI();
        }
      }
    } catch (error) {
      console.error('Failed to get settings:', error);
    }

    // Listen for messages
    browser.runtime.onMessage.addListener(handleMessage);

    console.log('Content script initialized');
  }

  function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'SETTINGS_UPDATED':
        settings = { ...settings, ...message.payload };
        if (settings.enabled) {
          injectUI();
        } else {
          removeUI();
        }
        break;

      case 'GET_PAGE_CONTENT':
        sendResponse({
          title: document.title,
          url: window.location.href,
          content: document.body.innerText
        });
        break;

      case 'HIGHLIGHT_ELEMENT':
        highlightElement(message.selector);
        break;

      case 'INJECT_STYLES':
        injectStyles(message.css);
        break;
    }
  }

  function injectUI() {
    if (document.getElementById('my-extension-container')) return;

    const container = document.createElement('div');
    container.id = 'my-extension-container';
    container.innerHTML = `
      <div class="my-extension-widget">
        <button class="my-extension-fab" title="My Extension">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
            <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <div class="my-extension-panel hidden">
          <div class="panel-header">
            <span>My Extension</span>
            <button class="close-button">×</button>
          </div>
          <div class="panel-body">
            <p>Extension active on this page</p>
            <button class="action-button" data-action="analyze">
              Analyze Page
            </button>
            <button class="action-button" data-action="process">
              Process Selection
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Add event listeners
    const fab = container.querySelector('.my-extension-fab');
    const panel = container.querySelector('.my-extension-panel');
    const closeBtn = container.querySelector('.close-button');
    const actionButtons = container.querySelectorAll('.action-button');

    fab.addEventListener('click', () => {
      panel.classList.toggle('hidden');
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
    });

    actionButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        await handleAction(action);
      });
    });
  }

  function removeUI() {
    const container = document.getElementById('my-extension-container');
    if (container) {
      container.remove();
    }
  }

  async function handleAction(action) {
    switch (action) {
      case 'analyze':
        const pageContent = document.body.innerText;
        const response = await browser.runtime.sendMessage({
          type: 'PROCESS_CONTENT',
          payload: pageContent
        });
        if (response.success) {
          showResult(response.data);
        }
        break;

      case 'process':
        const selection = window.getSelection().toString();
        if (selection) {
          const result = await browser.runtime.sendMessage({
            type: 'PROCESS_CONTENT',
            payload: selection
          });
          if (result.success) {
            showResult(result.data);
          }
        } else {
          showNotification('Please select some text first');
        }
        break;
    }
  }

  function showResult(data) {
    const existing = document.querySelector('.my-extension-result');
    if (existing) existing.remove();

    const result = document.createElement('div');
    result.className = 'my-extension-result';
    result.innerHTML = `
      <div class="result-header">
        <span>Result</span>
        <button class="close-result">×</button>
      </div>
      <div class="result-body">
        <p><strong>Word Count:</strong> ${data.wordCount}</p>
        <p><strong>Processed:</strong></p>
        <pre>${data.processed.slice(0, 500)}${data.processed.length > 500 ? '...' : ''}</pre>
      </div>
    `;

    document.body.appendChild(result);

    result.querySelector('.close-result').addEventListener('click', () => {
      result.remove();
    });

    setTimeout(() => result.remove(), 10000);
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'my-extension-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  function highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('my-extension-highlight');
      setTimeout(() => {
        element.classList.remove('my-extension-highlight');
      }, 3000);
    }
  }

  function injectStyles(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### content.css

```css
#my-extension-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  font-size: 14px;
}

.my-extension-widget {
  position: relative;
}

.my-extension-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.my-extension-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.5);
}

.my-extension-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 280px;
  background: white;
  border-radius: 16px;
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
  padding: 16px;
  background: #f5f5f7;
  border-bottom: 1px solid #e5e5e7;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #86868b;
  cursor: pointer;
  line-height: 1;
}

.panel-body {
  padding: 16px;
}

.action-button {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.action-button:hover {
  background: #0056CC;
}

.my-extension-result {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  z-index: 2147483646;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f7;
  font-weight: 600;
}

.close-result {
  background: none;
  border: none;
  font-size: 20px;
  color: #86868b;
  cursor: pointer;
}

.result-body {
  padding: 16px;
}

.result-body pre {
  background: #f5f5f7;
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
  max-height: 200px;
  font-size: 12px;
  margin-top: 8px;
}

.my-extension-notification {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1d1d1f;
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  z-index: 2147483647;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.my-extension-highlight {
  outline: 3px solid #007AFF !important;
  outline-offset: 2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .my-extension-panel,
  .my-extension-result {
    background: #1d1d1f;
    color: #f5f5f7;
  }

  .panel-header,
  .result-header {
    background: #2d2d2f;
    border-color: #3d3d3f;
  }

  .result-body pre {
    background: #2d2d2f;
  }
}
```

## Popup UI

### popup/popup.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Extension</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <header class="header">
      <div class="logo">
        <img src="../images/icon-32.png" alt="Logo">
        <span>My Extension</span>
      </div>
      <span class="version" id="version">v1.0.0</span>
    </header>

    <section class="status-section">
      <div class="status-row">
        <span>Status</span>
        <span class="status-badge" id="status-badge">Active</span>
      </div>
      <div class="status-row">
        <span>Current Page</span>
        <span class="truncate" id="current-page">-</span>
      </div>
      <button class="toggle-button" id="toggle-btn">Disable</button>
    </section>

    <section class="settings-section">
      <h3>Quick Settings</h3>
      <label class="setting-row">
        <span>Show Notifications</span>
        <input type="checkbox" id="notifications-toggle">
      </label>
      <label class="setting-row">
        <span>Auto Process</span>
        <input type="checkbox" id="auto-process-toggle">
      </label>
      <label class="setting-row">
        <span>Theme</span>
        <select id="theme-select">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </section>

    <section class="actions-section">
      <button class="action-button" id="analyze-btn">Analyze Current Page</button>
      <button class="action-button secondary" id="options-btn">Open Settings</button>
    </section>

    <footer class="footer">
      <span id="stats">Processed: 0 pages</span>
    </footer>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### popup/popup.js

```javascript
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load current settings
  const settings = await browser.storage.local.get();
  updateUI(settings);

  // Get current tab
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try {
      const hostname = new URL(tab.url).hostname;
      document.getElementById('current-page').textContent = hostname;
    } catch {
      document.getElementById('current-page').textContent = 'Not available';
    }
  }

  // Get state from background
  const stateResponse = await browser.runtime.sendMessage({ type: 'GET_STATE' });
  if (stateResponse.success) {
    document.getElementById('stats').textContent =
      `Processed: ${stateResponse.data.processedCount} pages`;
  }

  // Add event listeners
  setupEventListeners();
}

function updateUI(settings) {
  const enabled = settings.enabled ?? true;

  // Status
  const statusBadge = document.getElementById('status-badge');
  const toggleBtn = document.getElementById('toggle-btn');

  statusBadge.textContent = enabled ? 'Active' : 'Inactive';
  statusBadge.className = `status-badge ${enabled ? 'active' : 'inactive'}`;
  toggleBtn.textContent = enabled ? 'Disable' : 'Enable';
  toggleBtn.className = `toggle-button ${enabled ? 'enabled' : ''}`;

  // Settings
  document.getElementById('notifications-toggle').checked = settings.showNotifications ?? true;
  document.getElementById('auto-process-toggle').checked = settings.autoProcess ?? false;
  document.getElementById('theme-select').value = settings.theme ?? 'system';
}

function setupEventListeners() {
  // Toggle extension
  document.getElementById('toggle-btn').addEventListener('click', async () => {
    const settings = await browser.storage.local.get('enabled');
    const newEnabled = !(settings.enabled ?? true);
    await browser.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { enabled: newEnabled }
    });
    updateUI({ ...settings, enabled: newEnabled });
  });

  // Notifications toggle
  document.getElementById('notifications-toggle').addEventListener('change', async (e) => {
    await browser.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { showNotifications: e.target.checked }
    });
  });

  // Auto process toggle
  document.getElementById('auto-process-toggle').addEventListener('change', async (e) => {
    await browser.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { autoProcess: e.target.checked }
    });
  });

  // Theme select
  document.getElementById('theme-select').addEventListener('change', async (e) => {
    await browser.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { theme: e.target.value }
    });
  });

  // Analyze button
  document.getElementById('analyze-btn').addEventListener('click', async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await browser.tabs.sendMessage(tab.id, {
          type: 'HIGHLIGHT_ELEMENT',
          selector: 'body'
        });
      } catch (error) {
        console.log('Could not communicate with page');
      }
    }
  });

  // Options button
  document.getElementById('options-btn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
}
```

### popup/popup.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  font-size: 14px;
  color: #1d1d1f;
  background: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.popup-container {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e5e7;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
}

.logo img {
  width: 28px;
  height: 28px;
}

.version {
  color: #86868b;
  font-size: 12px;
}

.status-section {
  padding: 16px 0;
  border-bottom: 1px solid #e5e5e7;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-row span:first-child {
  color: #86868b;
}

.truncate {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.toggle-button {
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  background: #f5f5f7;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-button:hover {
  background: #e5e5e7;
}

.toggle-button.enabled {
  background: #007AFF;
  color: white;
}

.toggle-button.enabled:hover {
  background: #0056CC;
}

.settings-section {
  padding: 16px 0;
  border-bottom: 1px solid #e5e5e7;
}

.settings-section h3 {
  font-size: 12px;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
}

.setting-row select {
  padding: 6px 10px;
  border: 1px solid #e5e5e7;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.actions-section {
  padding: 16px 0;
}

.action-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.action-button:hover {
  background: #0056CC;
}

.action-button.secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.action-button.secondary:hover {
  background: #e5e5e7;
}

.footer {
  padding-top: 12px;
  text-align: center;
  color: #86868b;
  font-size: 12px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  body {
    background: #1d1d1f;
    color: #f5f5f7;
  }

  .header,
  .status-section,
  .settings-section {
    border-color: #3d3d3f;
  }

  .toggle-button,
  .action-button.secondary {
    background: #2d2d2f;
    color: #f5f5f7;
  }

  .toggle-button:hover,
  .action-button.secondary:hover {
    background: #3d3d3f;
  }

  .setting-row select {
    background: #2d2d2f;
    border-color: #3d3d3f;
    color: #f5f5f7;
  }

  .status-row span:first-child,
  .version,
  .footer {
    color: #86868b;
  }
}
```

## macOS App Delegate

### macOS (App)/AppDelegate.swift

```swift
import Cocoa
import SafariServices

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Check extension state
        SFSafariExtensionManager.getStateOfSafariExtension(
            withIdentifier: extensionBundleIdentifier
        ) { state, error in
            guard let state = state, error == nil else {
                return
            }

            DispatchQueue.main.async {
                if state.isEnabled {
                    NSLog("Extension is enabled")
                } else {
                    NSLog("Extension is disabled")
                }
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let extensionBundleIdentifier = "com.example.myextension.Extension"
```

## CLAUDE.md Integration

```markdown
# Safari Web Extension Project

## Build & Run
- Open project in Xcode
- Select scheme (macOS or iOS)
- Build and Run (Cmd+R)
- Enable extension in Safari > Preferences > Extensions

## Architecture
- **Shared (App)/** - Native container app
- **Shared (Extension)/** - Extension resources and Swift handler
- **Resources/** - Web extension files (JS, HTML, CSS)

## Code Patterns
- Use `browser.*` API (WebExtension polyfill compatible)
- Native messaging via `SafariWebExtensionHandler.swift`
- Storage sync between JS and Swift via messages

## Testing
- Enable "Allow Unsigned Extensions" in Safari Develop menu
- Use Safari Web Inspector for debugging
- Test on both macOS and iOS simulators

## Key Files
- `manifest.json` - Extension manifest
- `SafariWebExtensionHandler.swift` - Native message handler
- `background.js` - Service worker
- `Info.plist` - App/extension configuration

## Distribution
- Archive in Xcode
- Submit to App Store Connect
- Extension distributed via Mac/iOS App Store
```

## AI Suggestions

1. **Add App Groups**: Use App Groups for sharing data between container app and extension.

2. **Implement Keychain Access**: Store sensitive data in Keychain via native handler.

3. **Add Core Data Sync**: Implement Core Data for persistent storage with CloudKit sync.

4. **Create Shortcuts Integration**: Add Siri Shortcuts support for extension actions.

5. **Implement Share Extension**: Add a Share Extension for integration with Safari share sheet.

6. **Add Widget Support**: Create Home Screen widgets (iOS) or Today widgets (macOS).

7. **Implement Universal Links**: Handle deep links to open specific extension views.

8. **Add In-App Purchase**: Implement subscription or one-time purchase for premium features.

9. **Create WatchOS Companion**: Add Apple Watch app for quick actions and notifications.

10. **Implement Privacy Report**: Add privacy manifest and tracking transparency compliance.
