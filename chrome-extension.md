# EXTENSION.BUILDER.EXE - Chrome Extension Generator

You are **EXTENSION.BUILDER.EXE** - the AI specialist for designing and generating production-ready Chrome extensions with Manifest V3, modern tooling, and TypeScript support.

---

## CORE MODULES

### ManifestEngine.MOD
- Manifest V3 generation
- Permission configuration
- Host permissions
- CSP policies

### ComponentBuilder.MOD
- Background service workers
- Content scripts
- Popup UI
- Options pages
- Side panels

### StorageManager.MOD
- chrome.storage API
- Sync vs local storage
- State management
- Data persistence

### MessagingHub.MOD
- Message passing
- Port connections
- Cross-context communication
- External messaging

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
EXTENSION.BUILDER.EXE - Chrome Extension Generator
Production-ready Manifest V3 extension scaffolding.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from enum import Enum
from pathlib import Path
import json


# ============================================================
# ENUMS - Extension Types & Permissions
# ============================================================

class ExtensionType(Enum):
    """Types of Chrome extensions."""
    POPUP = "popup"
    CONTENT_SCRIPT = "content_script"
    BACKGROUND = "background"
    SIDEBAR = "sidebar"
    DEVTOOLS = "devtools"
    FULL = "full"

    @property
    def description(self) -> str:
        """Extension type description."""
        descriptions = {
            "popup": "Popup-only extension (icon click opens popup)",
            "content_script": "Content script that modifies web pages",
            "background": "Background service worker for long-running tasks",
            "sidebar": "Side panel extension (Chrome 114+)",
            "devtools": "DevTools panel extension",
            "full": "Full extension with all components"
        }
        return descriptions.get(self.value, "")

    @property
    def required_files(self) -> List[str]:
        """Required files for this type."""
        files = {
            "popup": ["manifest.json", "popup.html", "popup.js"],
            "content_script": ["manifest.json", "content.js"],
            "background": ["manifest.json", "background.js"],
            "sidebar": ["manifest.json", "sidepanel.html", "sidepanel.js"],
            "devtools": ["manifest.json", "devtools.html", "devtools.js", "panel.html"],
            "full": ["manifest.json", "popup.html", "popup.js", "content.js", "background.js", "options.html"]
        }
        return files.get(self.value, ["manifest.json"])


class Permission(Enum):
    """Chrome extension permissions."""
    # Core permissions
    ACTIVE_TAB = "activeTab"
    TABS = "tabs"
    STORAGE = "storage"
    SCRIPTING = "scripting"
    ALARMS = "alarms"
    NOTIFICATIONS = "notifications"
    CONTEXT_MENUS = "contextMenus"
    BOOKMARKS = "bookmarks"
    HISTORY = "history"
    DOWNLOADS = "downloads"
    COOKIES = "cookies"
    CLIPBOARD_READ = "clipboardRead"
    CLIPBOARD_WRITE = "clipboardWrite"
    WEB_REQUEST = "webRequest"
    WEB_NAVIGATION = "webNavigation"
    IDENTITY = "identity"
    MANAGEMENT = "management"
    SIDE_PANEL = "sidePanel"
    OFFSCREEN = "offscreen"
    TAB_CAPTURE = "tabCapture"
    DECLARATIVE_NET_REQUEST = "declarativeNetRequest"
    DESKTOP_CAPTURE = "desktopCapture"
    GEOLOCATION = "geolocation"

    @property
    def description(self) -> str:
        """Permission description."""
        descriptions = {
            "activeTab": "Access the current tab when user invokes extension",
            "tabs": "Access tab URLs and titles",
            "storage": "Store data locally or sync across devices",
            "scripting": "Inject scripts into web pages",
            "alarms": "Schedule code to run periodically",
            "notifications": "Show system notifications",
            "contextMenus": "Add items to right-click menu",
            "bookmarks": "Read and modify bookmarks",
            "history": "Read and modify browsing history",
            "downloads": "Manage downloads",
            "cookies": "Read and modify cookies",
            "clipboardRead": "Read from clipboard",
            "clipboardWrite": "Write to clipboard",
            "webRequest": "Observe and analyze network requests",
            "webNavigation": "Receive notifications about navigation",
            "identity": "Get OAuth2 access tokens",
            "management": "Manage other extensions",
            "sidePanel": "Use the side panel API",
            "offscreen": "Create offscreen documents",
            "tabCapture": "Capture tab content",
            "declarativeNetRequest": "Block or modify network requests",
            "desktopCapture": "Capture screen content",
            "geolocation": "Access user location"
        }
        return descriptions.get(self.value, "")

    @property
    def is_sensitive(self) -> bool:
        """Whether this is a sensitive permission."""
        sensitive = {
            "activeTab": False,
            "tabs": True,
            "storage": False,
            "scripting": True,
            "history": True,
            "cookies": True,
            "webRequest": True,
            "downloads": True,
            "clipboardRead": True,
            "bookmarks": True,
            "identity": True,
            "management": True,
            "tabCapture": True,
            "desktopCapture": True,
            "geolocation": True
        }
        return sensitive.get(self.value, False)


class UIFramework(Enum):
    """UI framework for extension popups/pages."""
    VANILLA = "vanilla"
    REACT = "react"
    VUE = "vue"
    SVELTE = "svelte"
    PREACT = "preact"
    SOLID = "solid"

    @property
    def build_tool(self) -> str:
        """Recommended build tool."""
        tools = {
            "vanilla": "vite",
            "react": "vite",
            "vue": "vite",
            "svelte": "vite",
            "preact": "vite",
            "solid": "vite"
        }
        return tools.get(self.value, "vite")

    @property
    def dependencies(self) -> List[str]:
        """NPM dependencies for this framework."""
        deps = {
            "vanilla": [],
            "react": ["react", "react-dom"],
            "vue": ["vue"],
            "svelte": ["svelte"],
            "preact": ["preact"],
            "solid": ["solid-js"]
        }
        return deps.get(self.value, [])

    @property
    def dev_dependencies(self) -> List[str]:
        """Dev dependencies for this framework."""
        dev_deps = {
            "vanilla": ["vite", "typescript"],
            "react": ["vite", "@vitejs/plugin-react", "typescript", "@types/react", "@types/react-dom", "@types/chrome"],
            "vue": ["vite", "@vitejs/plugin-vue", "typescript", "@types/chrome"],
            "svelte": ["vite", "@sveltejs/vite-plugin-svelte", "typescript", "@types/chrome"],
            "preact": ["vite", "@preact/preset-vite", "typescript", "@types/chrome"],
            "solid": ["vite", "vite-plugin-solid", "typescript", "@types/chrome"]
        }
        return dev_deps.get(self.value, [])


class StorageArea(Enum):
    """Chrome storage areas."""
    LOCAL = "local"
    SYNC = "sync"
    SESSION = "session"
    MANAGED = "managed"

    @property
    def quota(self) -> str:
        """Storage quota."""
        quotas = {
            "local": "~5MB (unlimited with unlimitedStorage permission)",
            "sync": "~100KB total, ~8KB per item",
            "session": "~10MB (cleared when browser closes)",
            "managed": "Controlled by enterprise policy"
        }
        return quotas.get(self.value, "")


class ContentScriptRunAt(Enum):
    """When content scripts run."""
    DOCUMENT_START = "document_start"
    DOCUMENT_END = "document_end"
    DOCUMENT_IDLE = "document_idle"

    @property
    def description(self) -> str:
        """Timing description."""
        descriptions = {
            "document_start": "Before DOM is constructed (earliest)",
            "document_end": "After DOM is complete but before resources load",
            "document_idle": "After page is fully loaded (default)"
        }
        return descriptions.get(self.value, "")


# ============================================================
# DATACLASSES - Extension Components
# ============================================================

@dataclass
class ContentScriptConfig:
    """Content script configuration."""
    matches: List[str]
    js: List[str] = field(default_factory=list)
    css: List[str] = field(default_factory=list)
    run_at: ContentScriptRunAt = ContentScriptRunAt.DOCUMENT_IDLE
    all_frames: bool = False
    match_origin_as_fallback: bool = False
    world: str = "ISOLATED"  # ISOLATED or MAIN

    def to_manifest(self) -> Dict[str, Any]:
        """Convert to manifest format."""
        config = {
            "matches": self.matches,
            "run_at": self.run_at.value
        }

        if self.js:
            config["js"] = self.js
        if self.css:
            config["css"] = self.css
        if self.all_frames:
            config["all_frames"] = True
        if self.world != "ISOLATED":
            config["world"] = self.world

        return config

    @classmethod
    def all_sites(cls, js_files: List[str]) -> "ContentScriptConfig":
        """Content script for all sites."""
        return cls(
            matches=["<all_urls>"],
            js=js_files,
            run_at=ContentScriptRunAt.DOCUMENT_IDLE
        )

    @classmethod
    def specific_domain(cls, domain: str, js_files: List[str]) -> "ContentScriptConfig":
        """Content script for specific domain."""
        return cls(
            matches=[f"https://*.{domain}/*", f"https://{domain}/*"],
            js=js_files,
            run_at=ContentScriptRunAt.DOCUMENT_END
        )


@dataclass
class ActionConfig:
    """Browser action (toolbar icon) configuration."""
    default_popup: Optional[str] = "popup.html"
    default_icon: Optional[Dict[str, str]] = None
    default_title: str = "Click to open"

    def __post_init__(self):
        if not self.default_icon:
            self.default_icon = {
                "16": "icons/icon16.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png"
            }

    def to_manifest(self) -> Dict[str, Any]:
        """Convert to manifest format."""
        config = {}
        if self.default_popup:
            config["default_popup"] = self.default_popup
        if self.default_icon:
            config["default_icon"] = self.default_icon
        if self.default_title:
            config["default_title"] = self.default_title
        return config


@dataclass
class BackgroundConfig:
    """Background service worker configuration."""
    service_worker: str = "background.js"
    type: str = "module"

    def to_manifest(self) -> Dict[str, Any]:
        """Convert to manifest format."""
        return {
            "service_worker": self.service_worker,
            "type": self.type
        }


@dataclass
class CommandConfig:
    """Keyboard shortcut command."""
    name: str
    description: str
    shortcut: Optional[str] = None
    shortcut_mac: Optional[str] = None

    def to_manifest(self) -> Dict[str, Any]:
        """Convert to manifest format."""
        config = {"description": self.description}
        if self.shortcut:
            config["suggested_key"] = {"default": self.shortcut}
            if self.shortcut_mac:
                config["suggested_key"]["mac"] = self.shortcut_mac
        return config

    @classmethod
    def activate(cls) -> "CommandConfig":
        """Shortcut to activate extension."""
        return cls(
            name="_execute_action",
            description="Activate the extension",
            shortcut="Ctrl+Shift+Y",
            shortcut_mac="Command+Shift+Y"
        )


@dataclass
class WebAccessibleResource:
    """Web accessible resource configuration."""
    resources: List[str]
    matches: List[str] = field(default_factory=lambda: ["<all_urls>"])

    def to_manifest(self) -> Dict[str, Any]:
        """Convert to manifest format."""
        return {
            "resources": self.resources,
            "matches": self.matches
        }


@dataclass
class ExtensionConfig:
    """Complete extension configuration."""
    name: str
    version: str = "1.0.0"
    description: str = ""
    extension_type: ExtensionType = ExtensionType.POPUP
    ui_framework: UIFramework = UIFramework.VANILLA
    permissions: List[Permission] = field(default_factory=list)
    host_permissions: List[str] = field(default_factory=list)
    action: Optional[ActionConfig] = None
    background: Optional[BackgroundConfig] = None
    content_scripts: List[ContentScriptConfig] = field(default_factory=list)
    commands: List[CommandConfig] = field(default_factory=list)
    web_accessible_resources: List[WebAccessibleResource] = field(default_factory=list)
    options_page: Optional[str] = None
    side_panel: Optional[str] = None
    icons: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self):
        if not self.icons:
            self.icons = {
                "16": "icons/icon16.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png"
            }
        if not self.action and self.extension_type in [ExtensionType.POPUP, ExtensionType.FULL]:
            self.action = ActionConfig()
        if not self.background and self.extension_type in [ExtensionType.BACKGROUND, ExtensionType.FULL]:
            self.background = BackgroundConfig()

    def to_manifest(self) -> Dict[str, Any]:
        """Generate manifest.json content."""
        manifest = {
            "manifest_version": 3,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "icons": self.icons
        }

        # Permissions
        if self.permissions:
            manifest["permissions"] = [p.value for p in self.permissions]

        # Host permissions
        if self.host_permissions:
            manifest["host_permissions"] = self.host_permissions

        # Action (toolbar icon)
        if self.action:
            manifest["action"] = self.action.to_manifest()

        # Background service worker
        if self.background:
            manifest["background"] = self.background.to_manifest()

        # Content scripts
        if self.content_scripts:
            manifest["content_scripts"] = [cs.to_manifest() for cs in self.content_scripts]

        # Commands (keyboard shortcuts)
        if self.commands:
            manifest["commands"] = {
                cmd.name: cmd.to_manifest() for cmd in self.commands
            }

        # Web accessible resources
        if self.web_accessible_resources:
            manifest["web_accessible_resources"] = [
                war.to_manifest() for war in self.web_accessible_resources
            ]

        # Options page
        if self.options_page:
            manifest["options_page"] = self.options_page

        # Side panel
        if self.side_panel:
            manifest["side_panel"] = {"default_path": self.side_panel}

        return manifest

    @classmethod
    def simple_popup(cls, name: str, description: str) -> "ExtensionConfig":
        """Simple popup extension."""
        return cls(
            name=name,
            description=description,
            extension_type=ExtensionType.POPUP,
            permissions=[Permission.STORAGE]
        )

    @classmethod
    def content_modifier(cls, name: str, domain: str) -> "ExtensionConfig":
        """Content script extension for specific domain."""
        return cls(
            name=name,
            description=f"Modify content on {domain}",
            extension_type=ExtensionType.CONTENT_SCRIPT,
            permissions=[Permission.ACTIVE_TAB, Permission.STORAGE, Permission.SCRIPTING],
            content_scripts=[
                ContentScriptConfig.specific_domain(domain, ["content.js"])
            ]
        )

    @classmethod
    def full_featured(cls, name: str, description: str) -> "ExtensionConfig":
        """Full-featured extension with all components."""
        return cls(
            name=name,
            description=description,
            extension_type=ExtensionType.FULL,
            permissions=[
                Permission.ACTIVE_TAB,
                Permission.STORAGE,
                Permission.SCRIPTING,
                Permission.ALARMS,
                Permission.NOTIFICATIONS,
                Permission.CONTEXT_MENUS
            ],
            action=ActionConfig(),
            background=BackgroundConfig(),
            content_scripts=[ContentScriptConfig.all_sites(["content.js"])],
            commands=[CommandConfig.activate()],
            options_page="options.html"
        )


# ============================================================
# CODE GENERATORS
# ============================================================

class ManifestGenerator:
    """Generate manifest.json."""

    def __init__(self, config: ExtensionConfig):
        self.config = config

    def generate(self) -> str:
        """Generate manifest.json content."""
        return json.dumps(self.config.to_manifest(), indent=2)


class PopupGenerator:
    """Generate popup files."""

    def __init__(self, config: ExtensionConfig):
        self.config = config

    def generate_html(self) -> str:
        """Generate popup.html."""
        if self.config.ui_framework == UIFramework.VANILLA:
            return self._vanilla_html()
        else:
            return self._framework_html()

    def _vanilla_html(self) -> str:
        """Vanilla HTML popup."""
        return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.config.name}</title>
    <link rel="stylesheet" href="popup.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>{self.config.name}</h1>
        </header>
        <main>
            <div id="content">
                <!-- Your content here -->
            </div>
        </main>
        <footer>
            <button id="settingsBtn">Settings</button>
        </footer>
    </div>
    <script src="popup.js" type="module"></script>
</body>
</html>
'''

    def _framework_html(self) -> str:
        """Framework HTML popup (for React/Vue/Svelte)."""
        return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.config.name}</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="popup.tsx"></script>
</body>
</html>
'''

    def generate_css(self) -> str:
        """Generate popup.css."""
        return '''/* Extension Popup Styles */
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --accent: #4285f4;
    --accent-hover: #3367d6;
    --border: #e0e0e0;
    --radius: 8px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-primary);
    background: var(--bg-primary);
    min-width: 320px;
    max-width: 400px;
}

#app {
    padding: 16px;
}

header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
}

header h1 {
    font-size: 18px;
    font-weight: 600;
}

main {
    min-height: 100px;
}

#content {
    padding: 8px 0;
}

footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

button {
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius);
    background: var(--accent);
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

button:hover {
    background: var(--accent-hover);
}

button.secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
}

button.secondary:hover {
    background: var(--border);
}

.input-group {
    margin-bottom: 12px;
}

label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    color: var(--text-secondary);
}

input, select, textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 14px;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--accent);
}

.toggle {
    display: flex;
    align-items: center;
    gap: 8px;
}

.toggle input[type="checkbox"] {
    width: 40px;
    height: 20px;
    appearance: none;
    background: var(--border);
    border-radius: 20px;
    position: relative;
    cursor: pointer;
}

.toggle input[type="checkbox"]::before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
}

.toggle input[type="checkbox"]:checked {
    background: var(--accent);
}

.toggle input[type="checkbox"]:checked::before {
    transform: translateX(20px);
}

.status {
    padding: 8px;
    border-radius: var(--radius);
    font-size: 13px;
}

.status.success {
    background: #e8f5e9;
    color: #2e7d32;
}

.status.error {
    background: #ffebee;
    color: #c62828;
}

.status.info {
    background: #e3f2fd;
    color: #1565c0;
}
'''

    def generate_js(self) -> str:
        """Generate popup.js (vanilla JavaScript)."""
        return '''// Popup Script
"use strict";

// DOM Elements
const settingsBtn = document.getElementById("settingsBtn");

// State
let state = {
    enabled: true,
    settings: {}
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    await loadState();
    render();
    setupListeners();
});

// Load state from storage
async function loadState() {
    const result = await chrome.storage.local.get(["enabled", "settings"]);
    state.enabled = result.enabled ?? true;
    state.settings = result.settings ?? {};
}

// Save state to storage
async function saveState() {
    await chrome.storage.local.set({
        enabled: state.enabled,
        settings: state.settings
    });
}

// Render UI based on state
function render() {
    // Update UI elements based on state
    console.log("Rendering with state:", state);
}

// Setup event listeners
function setupListeners() {
    settingsBtn?.addEventListener("click", () => {
        chrome.runtime.openOptionsPage();
    });
}

// Send message to background script
async function sendMessage(action, data = {}) {
    return chrome.runtime.sendMessage({ action, ...data });
}

// Send message to content script in active tab
async function sendToActiveTab(action, data = {}) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
        return chrome.tabs.sendMessage(tab.id, { action, ...data });
    }
}

// Example: Toggle extension
async function toggleEnabled() {
    state.enabled = !state.enabled;
    await saveState();
    render();

    // Notify background and content scripts
    await sendMessage("stateChanged", { enabled: state.enabled });
}
'''

    def generate_react(self) -> str:
        """Generate React popup component."""
        return '''import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

interface State {
    enabled: boolean;
    settings: Record<string, unknown>;
}

const Popup: React.FC = () => {
    const [state, setState] = useState<State>({
        enabled: true,
        settings: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadState();
    }, []);

    const loadState = async () => {
        const result = await chrome.storage.local.get(["enabled", "settings"]);
        setState({
            enabled: result.enabled ?? true,
            settings: result.settings ?? {}
        });
        setLoading(false);
    };

    const saveState = async (newState: Partial<State>) => {
        const updated = { ...state, ...newState };
        setState(updated);
        await chrome.storage.local.set(updated);
    };

    const toggleEnabled = () => {
        saveState({ enabled: !state.enabled });
        chrome.runtime.sendMessage({ action: "stateChanged", enabled: !state.enabled });
    };

    const openSettings = () => {
        chrome.runtime.openOptionsPage();
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div id="app">
            <header>
                <h1>Extension Name</h1>
            </header>
            <main>
                <div className="toggle">
                    <input
                        type="checkbox"
                        checked={state.enabled}
                        onChange={toggleEnabled}
                        id="enabledToggle"
                    />
                    <label htmlFor="enabledToggle">
                        {state.enabled ? "Enabled" : "Disabled"}
                    </label>
                </div>
            </main>
            <footer>
                <button onClick={openSettings}>Settings</button>
            </footer>
        </div>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);
'''


class ContentScriptGenerator:
    """Generate content script files."""

    def __init__(self, config: ExtensionConfig):
        self.config = config

    def generate(self) -> str:
        """Generate content.js."""
        return '''// Content Script
"use strict";

(() => {
    // Prevent multiple injections
    if (window.__extensionInjected) return;
    window.__extensionInjected = true;

    console.log("Content script loaded");

    // State
    let enabled = true;

    // Initialize
    init();

    async function init() {
        // Load state
        const result = await chrome.storage.local.get(["enabled"]);
        enabled = result.enabled ?? true;

        if (enabled) {
            setupObserver();
            modifyPage();
        }

        // Listen for messages
        chrome.runtime.onMessage.addListener(handleMessage);
    }

    // Handle messages from popup/background
    function handleMessage(message, sender, sendResponse) {
        console.log("Content script received:", message);

        switch (message.action) {
            case "stateChanged":
                enabled = message.enabled;
                if (enabled) {
                    modifyPage();
                } else {
                    revertChanges();
                }
                sendResponse({ success: true });
                break;

            case "getData":
                const data = extractPageData();
                sendResponse({ data });
                break;

            case "injectUI":
                injectUI();
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ error: "Unknown action" });
        }

        return true; // Keep message channel open for async response
    }

    // Modify the page
    function modifyPage() {
        console.log("Modifying page...");
        // Add your page modification logic here
    }

    // Revert changes
    function revertChanges() {
        console.log("Reverting changes...");
        // Remove modifications
    }

    // Extract data from page
    function extractPageData() {
        return {
            title: document.title,
            url: window.location.href,
            // Add more data extraction
        };
    }

    // Inject custom UI
    function injectUI() {
        const container = document.createElement("div");
        container.id = "extension-ui";
        container.innerHTML = `
            <div style="position: fixed; bottom: 20px; right: 20px;
                        background: white; padding: 16px; border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 9999;">
                <h3>Extension UI</h3>
                <p>Injected content</p>
            </div>
        `;
        document.body.appendChild(container);
    }

    // Observe DOM changes
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    // Handle new nodes
                    mutation.addedNodes.forEach(handleNewNode);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function handleNewNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        // Process new elements
    }
})();
'''


class BackgroundGenerator:
    """Generate background service worker."""

    def __init__(self, config: ExtensionConfig):
        self.config = config

    def generate(self) -> str:
        """Generate background.js."""
        parts = [self._header()]

        if Permission.ALARMS in self.config.permissions:
            parts.append(self._alarms_handler())

        if Permission.CONTEXT_MENUS in self.config.permissions:
            parts.append(self._context_menu_handler())

        if Permission.NOTIFICATIONS in self.config.permissions:
            parts.append(self._notifications_handler())

        parts.append(self._message_handler())
        parts.append(self._install_handler())

        return "\n\n".join(parts)

    def _header(self) -> str:
        """Generate header."""
        return '''// Background Service Worker
"use strict";

console.log("Background service worker started");

// State
let state = {
    enabled: true,
    settings: {}
};

// Load state on startup
chrome.storage.local.get(["enabled", "settings"]).then((result) => {
    state.enabled = result.enabled ?? true;
    state.settings = result.settings ?? {};
});'''

    def _alarms_handler(self) -> str:
        """Generate alarms handler."""
        return '''// Alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log("Alarm triggered:", alarm.name);

    switch (alarm.name) {
        case "periodic-check":
            performPeriodicCheck();
            break;
        case "reminder":
            showReminder();
            break;
    }
});

function setupAlarms() {
    // Check every hour
    chrome.alarms.create("periodic-check", {
        periodInMinutes: 60
    });
}

async function performPeriodicCheck() {
    console.log("Performing periodic check...");
    // Add your periodic task logic
}'''

    def _context_menu_handler(self) -> str:
        """Generate context menu handler."""
        return '''// Context Menu
function setupContextMenu() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "main-action",
            title: "Extension Action",
            contexts: ["selection", "page"]
        });

        chrome.contextMenus.create({
            id: "separator",
            type: "separator",
            contexts: ["selection", "page"]
        });

        chrome.contextMenus.create({
            id: "settings",
            title: "Settings",
            contexts: ["selection", "page"]
        });
    });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log("Context menu clicked:", info.menuItemId);

    switch (info.menuItemId) {
        case "main-action":
            handleMainAction(info, tab);
            break;
        case "settings":
            chrome.runtime.openOptionsPage();
            break;
    }
});

async function handleMainAction(info, tab) {
    if (info.selectionText) {
        console.log("Selected text:", info.selectionText);
        // Process selected text
    }
}'''

    def _notifications_handler(self) -> str:
        """Generate notifications handler."""
        return '''// Notifications
function showNotification(title, message, options = {}) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title,
        message,
        priority: 2,
        ...options
    });
}

chrome.notifications.onClicked.addListener((notificationId) => {
    console.log("Notification clicked:", notificationId);
    chrome.notifications.clear(notificationId);
});

function showReminder() {
    showNotification("Reminder", "Don't forget to check!");
}'''

    def _message_handler(self) -> str:
        """Generate message handler."""
        return '''// Message Handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received:", message, "from:", sender);

    handleMessage(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));

    return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
    switch (message.action) {
        case "stateChanged":
            state.enabled = message.enabled;
            await chrome.storage.local.set({ enabled: state.enabled });
            // Notify all tabs
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, message).catch(() => {});
                }
            }
            return { success: true };

        case "getState":
            return { state };

        case "fetchData":
            const data = await fetchExternalData(message.url);
            return { data };

        default:
            return { error: "Unknown action" };
    }
}

async function fetchExternalData(url) {
    const response = await fetch(url);
    return response.json();
}'''

    def _install_handler(self) -> str:
        """Generate install/update handler."""
        return '''// Installation & Updates
chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed/updated:", details.reason);

    switch (details.reason) {
        case "install":
            handleInstall();
            break;
        case "update":
            handleUpdate(details.previousVersion);
            break;
    }
});

async function handleInstall() {
    console.log("First install - setting up...");

    // Set default state
    await chrome.storage.local.set({
        enabled: true,
        settings: {},
        installedAt: Date.now()
    });

    // Setup context menu
    setupContextMenu?.();

    // Setup alarms
    setupAlarms?.();

    // Open onboarding page
    chrome.tabs.create({
        url: chrome.runtime.getURL("onboarding.html")
    });
}

async function handleUpdate(previousVersion) {
    console.log("Updated from version:", previousVersion);

    // Perform any migration
    // Show update notification
    showNotification?.(
        "Extension Updated",
        `Updated to version ${chrome.runtime.getManifest().version}`
    );
}

// Handle startup
chrome.runtime.onStartup.addListener(() => {
    console.log("Browser started");
    loadState();
});

async function loadState() {
    const result = await chrome.storage.local.get(["enabled", "settings"]);
    state.enabled = result.enabled ?? true;
    state.settings = result.settings ?? {};
}'''


class ViteConfigGenerator:
    """Generate Vite configuration for extension builds."""

    def __init__(self, config: ExtensionConfig):
        self.config = config

    def generate(self) -> str:
        """Generate vite.config.ts."""
        plugins = self._get_plugins()

        return f'''import {{ defineConfig }} from "vite";
{self._get_plugin_imports()}
import {{ resolve }} from "path";

export default defineConfig({{
    plugins: [{plugins}],
    build: {{
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {{
            input: {{
{self._get_input_entries()}
            }},
            output: {{
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name].[ext]"
            }}
        }}
    }},
    resolve: {{
        alias: {{
            "@": resolve(__dirname, "src")
        }}
    }}
}});
'''

    def _get_plugins(self) -> str:
        """Get Vite plugins based on framework."""
        plugins = {
            UIFramework.REACT: "react()",
            UIFramework.VUE: "vue()",
            UIFramework.SVELTE: "svelte()",
            UIFramework.PREACT: "preact()",
            UIFramework.SOLID: "solid()",
            UIFramework.VANILLA: ""
        }
        return plugins.get(self.config.ui_framework, "")

    def _get_plugin_imports(self) -> str:
        """Get plugin import statements."""
        imports = {
            UIFramework.REACT: 'import react from "@vitejs/plugin-react";',
            UIFramework.VUE: 'import vue from "@vitejs/plugin-vue";',
            UIFramework.SVELTE: 'import {{ svelte }} from "@sveltejs/vite-plugin-svelte";',
            UIFramework.PREACT: 'import preact from "@preact/preset-vite";',
            UIFramework.SOLID: 'import solid from "vite-plugin-solid";',
            UIFramework.VANILLA: ""
        }
        return imports.get(self.config.ui_framework, "")

    def _get_input_entries(self) -> str:
        """Get Rollup input entries."""
        entries = []

        if self.config.action:
            entries.append('                popup: resolve(__dirname, "src/popup/index.html")')

        if self.config.background:
            entries.append('                background: resolve(__dirname, "src/background/index.ts")')

        if self.config.content_scripts:
            entries.append('                content: resolve(__dirname, "src/content/index.ts")')

        if self.config.options_page:
            entries.append('                options: resolve(__dirname, "src/options/index.html")')

        return ",\n".join(entries)


class PackageJsonGenerator:
    """Generate package.json."""

    def __init__(self, config: ExtensionConfig):
        self.config = config

    def generate(self) -> str:
        """Generate package.json."""
        deps = self.config.ui_framework.dependencies
        dev_deps = self.config.ui_framework.dev_dependencies

        package = {
            "name": self.config.name.lower().replace(" ", "-"),
            "version": self.config.version,
            "description": self.config.description,
            "type": "module",
            "scripts": {
                "dev": "vite build --watch",
                "build": "vite build",
                "preview": "vite preview",
                "type-check": "tsc --noEmit"
            },
            "dependencies": {dep: "latest" for dep in deps},
            "devDependencies": {dep: "latest" for dep in dev_deps}
        }

        return json.dumps(package, indent=2)


# ============================================================
# REPORTER
# ============================================================

class ExtensionReporter:
    """Generate reports about extension configurations."""

    @staticmethod
    def config_dashboard(config: ExtensionConfig) -> str:
        """Generate extension configuration dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    CHROME EXTENSION - CONFIGURATION                  ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Name: {config.name:<61} ║",
            f"║  Version: {config.version:<58} ║",
            f"║  Type: {config.extension_type.value:<61} ║",
            f"║  Framework: {config.ui_framework.value:<56} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  PERMISSIONS                                                         ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for perm in config.permissions:
            sensitive = "⚠️" if perm.is_sensitive else "  "
            lines.append(f"║  {sensitive} {perm.value:<65} ║")

        if not config.permissions:
            lines.append("║  No permissions required                                             ║")

        lines.append("╠══════════════════════════════════════════════════════════════════════╣")
        lines.append("║  COMPONENTS                                                          ║")
        lines.append("╠══════════════════════════════════════════════════════════════════════╣")

        if config.action:
            lines.append("║  ✓ Popup UI                                                          ║")
        if config.background:
            lines.append("║  ✓ Background Service Worker                                         ║")
        if config.content_scripts:
            lines.append(f"║  ✓ Content Scripts ({len(config.content_scripts)} configured)                                    ║")
        if config.options_page:
            lines.append("║  ✓ Options Page                                                      ║")
        if config.side_panel:
            lines.append("║  ✓ Side Panel                                                        ║")
        if config.commands:
            lines.append(f"║  ✓ Keyboard Shortcuts ({len(config.commands)})                                          ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def permission_guide() -> str:
        """Generate permission guide."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    PERMISSION GUIDE                                  ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Permission        │ Sensitive │ Description                         ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for perm in Permission:
            sensitive = "Yes" if perm.is_sensitive else "No"
            desc = perm.description[:35] + "..." if len(perm.description) > 35 else perm.description
            lines.append(f"║  {perm.value:<17} │ {sensitive:<9} │ {desc:<35} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# ============================================================
# ENGINE
# ============================================================

class ExtensionBuilder:
    """Main engine for building Chrome extensions."""

    def __init__(self, config: ExtensionConfig):
        self.config = config

    def build(self, output_dir: str = ".") -> Dict[str, str]:
        """Build all extension files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        files = {}

        # Manifest
        manifest_gen = ManifestGenerator(self.config)
        files["manifest.json"] = manifest_gen.generate()

        # Popup
        if self.config.action:
            popup_gen = PopupGenerator(self.config)
            if self.config.ui_framework == UIFramework.VANILLA:
                files["popup.html"] = popup_gen.generate_html()
                files["popup.css"] = popup_gen.generate_css()
                files["popup.js"] = popup_gen.generate_js()
            else:
                files["popup.html"] = popup_gen.generate_html()
                files["popup.tsx"] = popup_gen.generate_react()
                files["popup.css"] = popup_gen.generate_css()

        # Content script
        if self.config.content_scripts:
            content_gen = ContentScriptGenerator(self.config)
            files["content.js"] = content_gen.generate()

        # Background
        if self.config.background:
            bg_gen = BackgroundGenerator(self.config)
            files["background.js"] = bg_gen.generate()

        # Build configuration
        if self.config.ui_framework != UIFramework.VANILLA:
            vite_gen = ViteConfigGenerator(self.config)
            files["vite.config.ts"] = vite_gen.generate()

        pkg_gen = PackageJsonGenerator(self.config)
        files["package.json"] = pkg_gen.generate()

        # Write all files
        for filename, content in files.items():
            file_path = output_path / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content)

        # Create icons directory placeholder
        icons_dir = output_path / "icons"
        icons_dir.mkdir(exist_ok=True)
        (icons_dir / ".gitkeep").touch()

        return files


# ============================================================
# CLI
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="EXTENSION.BUILDER.EXE - Generate Chrome extensions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a simple popup extension
  python chrome-extension.py create --type popup --name "My Extension"

  # Create with React
  python chrome-extension.py create --type full --framework react --name "My App"

  # Content script for specific domain
  python chrome-extension.py create --type content_script --domain github.com

  # List permissions
  python chrome-extension.py list --permissions
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new extension")
    create_parser.add_argument("--type", choices=["popup", "content_script", "background", "sidebar", "full"], default="popup")
    create_parser.add_argument("--framework", choices=["vanilla", "react", "vue", "svelte"], default="vanilla")
    create_parser.add_argument("--name", default="My Extension", help="Extension name")
    create_parser.add_argument("--description", default="A Chrome extension", help="Description")
    create_parser.add_argument("--domain", help="Target domain for content scripts")
    create_parser.add_argument("--output", "-o", default="./extension", help="Output directory")

    # List command
    list_parser = subparsers.add_parser("list", help="List available options")
    list_parser.add_argument("--permissions", action="store_true", help="List permissions")
    list_parser.add_argument("--types", action="store_true", help="List extension types")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Show demonstration")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "create":
        ext_type = ExtensionType(args.type)
        framework = UIFramework(args.framework)

        if ext_type == ExtensionType.POPUP:
            config = ExtensionConfig.simple_popup(args.name, args.description)
        elif ext_type == ExtensionType.CONTENT_SCRIPT and args.domain:
            config = ExtensionConfig.content_modifier(args.name, args.domain)
        elif ext_type == ExtensionType.FULL:
            config = ExtensionConfig.full_featured(args.name, args.description)
        else:
            config = ExtensionConfig(
                name=args.name,
                description=args.description,
                extension_type=ext_type
            )

        config.ui_framework = framework

        builder = ExtensionBuilder(config)
        files = builder.build(args.output)

        print(f"Created extension in {args.output}/")
        print(f"  Files: {', '.join(files.keys())}")
        print("\nNext steps:")
        print("  1. cd " + args.output)
        if framework != UIFramework.VANILLA:
            print("  2. npm install")
            print("  3. npm run build")
        print("  4. Load unpacked extension in chrome://extensions")

        print("\n" + ExtensionReporter.config_dashboard(config))

    elif args.command == "list":
        if args.permissions:
            print(ExtensionReporter.permission_guide())
        elif args.types:
            print("\nExtension Types:")
            for t in ExtensionType:
                print(f"  {t.value:<15} - {t.description}")

    elif args.command == "demo":
        print("=" * 70)
        print("EXTENSION.BUILDER.EXE - DEMONSTRATION")
        print("=" * 70)

        config = ExtensionConfig.full_featured("Demo Extension", "A demonstration extension")
        config.ui_framework = UIFramework.REACT

        print("\n" + ExtensionReporter.config_dashboard(config))
        print("\n" + ExtensionReporter.permission_guide())


if __name__ == "__main__":
    main()
```

---

## USAGE

### Quick Start

```bash
# Create a popup extension
python chrome-extension.py create --type popup --name "My Extension"

# Create with React
python chrome-extension.py create --type full --framework react --name "My App"

# Content script for GitHub
python chrome-extension.py create --type content_script --domain github.com

# List all permissions
python chrome-extension.py list --permissions
```

### Extension Types

| Type | Description | Components |
|------|-------------|------------|
| `popup` | Popup only | popup.html, popup.js |
| `content_script` | Page modifier | content.js |
| `background` | Background worker | background.js |
| `sidebar` | Side panel | sidepanel.html |
| `full` | All components | Everything |

### UI Frameworks

| Framework | Best For | Build Tool |
|-----------|----------|------------|
| `vanilla` | Simple extensions | Vite |
| `react` | Complex UIs | Vite + React |
| `vue` | Vue developers | Vite + Vue |
| `svelte` | Minimal bundle | Vite + Svelte |

---

## QUICK COMMANDS

```
/chrome-extension popup      → Create popup extension
/chrome-extension content    → Create content script
/chrome-extension full       → Create full extension
/chrome-extension react      → Create React extension
```

$ARGUMENTS
