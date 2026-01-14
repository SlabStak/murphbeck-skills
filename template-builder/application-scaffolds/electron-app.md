# Electron Application Template

## Overview
Production-ready Electron application with React, TypeScript, secure IPC patterns, SQLite database, auto-updates, native menus, system tray, code signing, and cross-platform builds for Windows, macOS, and Linux.

## Quick Start
```bash
# Create new Electron project
npx create-electron-app my-app --template=webpack-typescript
cd my-app

# Or use this template
npx degit template/electron-app my-app
cd my-app
npm install

# Start development
npm run dev

# Build for production
npm run build
npm run package
```

## Project Structure
```
my-app/
├── src/
│   ├── main/                    # Main process
│   │   ├── index.ts
│   │   ├── preload.ts
│   │   ├── ipc/
│   │   │   ├── handlers.ts
│   │   │   └── channels.ts
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   ├── migrations.ts
│   │   │   └── repositories/
│   │   ├── menu/
│   │   │   ├── index.ts
│   │   │   └── templates.ts
│   │   ├── tray/
│   │   │   └── index.ts
│   │   ├── updater/
│   │   │   └── index.ts
│   │   ├── windows/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── paths.ts
│   ├── renderer/                # Renderer process (React)
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Dialog.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── TitleBar.tsx
│   │   │   └── features/
│   │   ├── hooks/
│   │   │   ├── useIpc.ts
│   │   │   ├── useUpdater.ts
│   │   │   └── useDatabase.ts
│   │   ├── stores/
│   │   │   ├── appStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── About.tsx
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── styles/
│   │       └── globals.css
│   └── shared/                  # Shared types
│       ├── types.ts
│       └── constants.ts
├── assets/
│   ├── icons/
│   │   ├── icon.icns
│   │   ├── icon.ico
│   │   └── icon.png
│   └── tray/
│       ├── iconTemplate.png
│       └── iconTemplate@2x.png
├── scripts/
│   ├── notarize.js
│   └── sign.js
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.renderer.json
├── webpack.main.config.js
├── webpack.renderer.config.js
└── electron-builder.yml
```

## Configuration Files

### package.json
```json
{
  "name": "electron-app",
  "version": "1.0.0",
  "description": "A production-ready Electron application",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "cross-env NODE_ENV=development webpack --config webpack.main.config.js --mode development --watch",
    "dev:renderer": "cross-env NODE_ENV=development webpack serve --config webpack.renderer.config.js --mode development",
    "build": "npm run build:main && npm run build:renderer",
    "build:main": "cross-env NODE_ENV=production webpack --config webpack.main.config.js --mode production",
    "build:renderer": "cross-env NODE_ENV=production webpack --config webpack.renderer.config.js --mode production",
    "start": "electron .",
    "package": "electron-builder build --publish never",
    "package:mac": "electron-builder build --mac --publish never",
    "package:win": "electron-builder build --win --publish never",
    "package:linux": "electron-builder build --linux --publish never",
    "publish": "electron-builder build --publish always",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "better-sqlite3": "^9.2.0",
    "electron-log": "^5.0.0",
    "electron-store": "^8.1.0",
    "electron-updater": "^6.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.294.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "autoprefixer": "^10.4.16",
    "concurrently": "^8.2.0",
    "cross-env": "^7.0.3",
    "css-loader": "^6.8.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "electron-devtools-installer": "^3.2.0",
    "electron-notarize": "^1.2.0",
    "eslint": "^8.54.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "html-webpack-plugin": "^5.5.0",
    "jest": "^29.7.0",
    "mini-css-extract-plugin": "^2.7.0",
    "postcss": "^8.4.31",
    "postcss-loader": "^7.3.0",
    "prettier": "^3.1.0",
    "style-loader": "^3.3.0",
    "tailwindcss": "^3.3.5",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.5.0",
    "typescript": "^5.3.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.0",
    "webpack-dev-server": "^4.15.0"
  },
  "build": {
    "extends": "electron-builder.yml"
  }
}
```

### electron-builder.yml
```yaml
appId: com.example.electronapp
productName: My Electron App
copyright: Copyright © 2024

directories:
  output: release
  buildResources: assets

files:
  - dist/**/*
  - assets/**/*
  - package.json

extraResources:
  - from: assets/
    to: assets/
    filter:
      - "**/*"

asar: true
compression: maximum

mac:
  category: public.app-category.productivity
  icon: assets/icons/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: entitlements.mac.plist
  entitlementsInherit: entitlements.mac.plist
  target:
    - target: dmg
      arch:
        - x64
        - arm64
    - target: zip
      arch:
        - x64
        - arm64

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
  window:
    width: 540
    height: 400

win:
  icon: assets/icons/icon.ico
  target:
    - target: nsis
      arch:
        - x64
        - ia32
    - target: portable
      arch:
        - x64

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: false
  createDesktopShortcut: true
  createStartMenuShortcut: true

linux:
  icon: assets/icons
  category: Utility
  target:
    - target: AppImage
      arch:
        - x64
    - target: deb
      arch:
        - x64
    - target: rpm
      arch:
        - x64

appImage:
  artifactName: "${productName}-${version}.${ext}"

publish:
  - provider: github
    owner: your-username
    repo: electron-app
    releaseType: release

afterSign: scripts/notarize.js
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"],
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "release"]
}
```

## Main Process

### src/main/index.ts
```typescript
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import { initDatabase } from './database';
import { setupMenu } from './menu';
import { setupTray } from './tray';
import { setupUpdater } from './updater';
import { registerIpcHandlers } from './ipc/handlers';
import { getWindowState, saveWindowState } from './windows';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const isDevelopment = process.env.NODE_ENV === 'development';

async function createWindow(): Promise<void> {
  // Get saved window state
  const windowState = getWindowState();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    frame: process.platform === 'darwin', // Frameless on Windows/Linux
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (isDevelopment) {
    await mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log.info('Main window created');
}

// Initialize the app
async function initialize(): Promise<void> {
  try {
    // Initialize database
    await initDatabase();
    log.info('Database initialized');

    // Register IPC handlers
    registerIpcHandlers();
    log.info('IPC handlers registered');

    // Create main window
    await createWindow();

    // Setup menu
    setupMenu(mainWindow!);
    log.info('Application menu set up');

    // Setup system tray
    setupTray(mainWindow!);
    log.info('System tray set up');

    // Setup auto-updater
    setupUpdater(mainWindow!);
    log.info('Auto-updater set up');

    log.info('Application initialized successfully');
  } catch (error) {
    log.error('Failed to initialize application:', error);
    app.quit();
  }
}

// App lifecycle events
app.on('ready', initialize);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security best practices
app.on('web-contents-created', (event, contents) => {
  // Disable navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:8080') {
      event.preventDefault();
    }
  });

  // Disable new windows
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Export for testing
export { mainWindow };
```

### src/main/preload.ts
```typescript
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IpcChannels } from './ipc/channels';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
const electronAPI = {
  // Invoke (request-response pattern)
  invoke: <T>(channel: string, ...args: unknown[]): Promise<T> => {
    const validChannels = Object.values(IpcChannels);
    if (validChannels.includes(channel as IpcChannels)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  // Send (fire-and-forget pattern)
  send: (channel: string, ...args: unknown[]): void => {
    const validChannels = Object.values(IpcChannels);
    if (validChannels.includes(channel as IpcChannels)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  // Listen for events from main process
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const validChannels = Object.values(IpcChannels);
    if (validChannels.includes(channel as IpcChannels)) {
      const subscription = (event: IpcRendererEvent, ...args: unknown[]) =>
        callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  // Listen for one-time events
  once: (channel: string, callback: (...args: unknown[]) => void): void => {
    const validChannels = Object.values(IpcChannels);
    if (validChannels.includes(channel as IpcChannels)) {
      ipcRenderer.once(channel, (event, ...args) => callback(...args));
    }
  },

  // Platform info
  platform: process.platform,

  // App version
  version: process.env.npm_package_version || '1.0.0',
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

export type ElectronAPI = typeof electronAPI;
```

### src/main/ipc/channels.ts
```typescript
export enum IpcChannels {
  // Database
  DB_GET_ALL = 'db:get-all',
  DB_GET_ONE = 'db:get-one',
  DB_CREATE = 'db:create',
  DB_UPDATE = 'db:update',
  DB_DELETE = 'db:delete',

  // File system
  FS_READ_FILE = 'fs:read-file',
  FS_WRITE_FILE = 'fs:write-file',
  FS_SELECT_FILE = 'fs:select-file',
  FS_SELECT_DIRECTORY = 'fs:select-directory',

  // App
  APP_GET_VERSION = 'app:get-version',
  APP_GET_PATH = 'app:get-path',
  APP_QUIT = 'app:quit',
  APP_RELAUNCH = 'app:relaunch',

  // Window
  WINDOW_MINIMIZE = 'window:minimize',
  WINDOW_MAXIMIZE = 'window:maximize',
  WINDOW_CLOSE = 'window:close',
  WINDOW_IS_MAXIMIZED = 'window:is-maximized',

  // Updates
  UPDATE_CHECK = 'update:check',
  UPDATE_DOWNLOAD = 'update:download',
  UPDATE_INSTALL = 'update:install',
  UPDATE_STATUS = 'update:status',
  UPDATE_PROGRESS = 'update:progress',

  // Settings
  SETTINGS_GET = 'settings:get',
  SETTINGS_SET = 'settings:set',

  // Shell
  SHELL_OPEN_EXTERNAL = 'shell:open-external',
  SHELL_OPEN_PATH = 'shell:open-path',

  // Notifications
  NOTIFICATION_SHOW = 'notification:show',

  // Clipboard
  CLIPBOARD_READ = 'clipboard:read',
  CLIPBOARD_WRITE = 'clipboard:write',
}
```

### src/main/ipc/handlers.ts
```typescript
import { ipcMain, dialog, app, shell, BrowserWindow, clipboard, Notification } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import log from 'electron-log';
import Store from 'electron-store';
import { IpcChannels } from './channels';
import { itemRepository } from '../database/repositories/itemRepository';

const store = new Store();

export function registerIpcHandlers(): void {
  // Database handlers
  ipcMain.handle(IpcChannels.DB_GET_ALL, async () => {
    return itemRepository.getAll();
  });

  ipcMain.handle(IpcChannels.DB_GET_ONE, async (_, id: string) => {
    return itemRepository.getById(id);
  });

  ipcMain.handle(IpcChannels.DB_CREATE, async (_, data: { title: string; content?: string }) => {
    return itemRepository.create(data);
  });

  ipcMain.handle(IpcChannels.DB_UPDATE, async (_, id: string, data: { title: string; content?: string }) => {
    return itemRepository.update(id, data);
  });

  ipcMain.handle(IpcChannels.DB_DELETE, async (_, id: string) => {
    return itemRepository.delete(id);
  });

  // File system handlers
  ipcMain.handle(IpcChannels.FS_READ_FILE, async (_, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      log.error('Failed to read file:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannels.FS_WRITE_FILE, async (_, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      log.error('Failed to write file:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannels.FS_SELECT_FILE, async (event, options?: Electron.OpenDialogOptions) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile'],
      ...options,
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(IpcChannels.FS_SELECT_DIRECTORY, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
    });

    return result.canceled ? null : result.filePaths[0];
  });

  // App handlers
  ipcMain.handle(IpcChannels.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(IpcChannels.APP_GET_PATH, (_, name: 'home' | 'appData' | 'userData' | 'temp' | 'desktop' | 'documents' | 'downloads') => {
    return app.getPath(name);
  });

  ipcMain.handle(IpcChannels.APP_QUIT, () => {
    app.quit();
  });

  ipcMain.handle(IpcChannels.APP_RELAUNCH, () => {
    app.relaunch();
    app.quit();
  });

  // Window handlers
  ipcMain.handle(IpcChannels.WINDOW_MINIMIZE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  ipcMain.handle(IpcChannels.WINDOW_MAXIMIZE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.handle(IpcChannels.WINDOW_CLOSE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  ipcMain.handle(IpcChannels.WINDOW_IS_MAXIMIZED, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window?.isMaximized() ?? false;
  });

  // Settings handlers
  ipcMain.handle(IpcChannels.SETTINGS_GET, (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle(IpcChannels.SETTINGS_SET, (_, key: string, value: unknown) => {
    store.set(key, value);
  });

  // Shell handlers
  ipcMain.handle(IpcChannels.SHELL_OPEN_EXTERNAL, async (_, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.handle(IpcChannels.SHELL_OPEN_PATH, async (_, filePath: string) => {
    await shell.openPath(filePath);
  });

  // Notification handlers
  ipcMain.handle(IpcChannels.NOTIFICATION_SHOW, (_, options: { title: string; body: string }) => {
    new Notification(options).show();
  });

  // Clipboard handlers
  ipcMain.handle(IpcChannels.CLIPBOARD_READ, () => {
    return clipboard.readText();
  });

  ipcMain.handle(IpcChannels.CLIPBOARD_WRITE, (_, text: string) => {
    clipboard.writeText(text);
  });

  log.info('IPC handlers registered');
}
```

### src/main/database/index.ts
```typescript
import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
import { runMigrations } from './migrations';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'data.db');

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  log.info(`Initializing database at: ${dbPath}`);

  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(db);

  log.info('Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    log.info('Database closed');
  }
}

// Ensure database is closed on app quit
app.on('quit', () => {
  closeDatabase();
});
```

### src/main/database/migrations.ts
```typescript
import Database from 'better-sqlite3';
import log from 'electron-log';

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_items_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
      `);
    },
  },
  {
    version: 2,
    name: 'add_items_category',
    up: (db) => {
      db.exec(`
        ALTER TABLE items ADD COLUMN category TEXT DEFAULT 'general';
        CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
      `);
    },
  },
];

export function runMigrations(db: Database.Database): void {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // Get current version
  const result = db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null };
  const currentVersion = result?.version ?? 0;

  log.info(`Current database version: ${currentVersion}`);

  // Run pending migrations
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    log.info('No pending migrations');
    return;
  }

  log.info(`Running ${pendingMigrations.length} migrations...`);

  const insertMigration = db.prepare(
    'INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)'
  );

  for (const migration of pendingMigrations) {
    log.info(`Running migration ${migration.version}: ${migration.name}`);

    try {
      db.transaction(() => {
        migration.up(db);
        insertMigration.run(migration.version, migration.name, new Date().toISOString());
      })();

      log.info(`Migration ${migration.version} completed`);
    } catch (error) {
      log.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  log.info('All migrations completed');
}
```

### src/main/database/repositories/itemRepository.ts
```typescript
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../index';

export interface Item {
  id: string;
  title: string;
  content: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemData {
  title: string;
  content?: string;
  category?: string;
}

export interface UpdateItemData {
  title?: string;
  content?: string;
  category?: string;
}

export const itemRepository = {
  getAll(): Item[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, title, content, category, created_at, updated_at
      FROM items
      ORDER BY created_at DESC
    `);
    return stmt.all() as Item[];
  },

  getById(id: string): Item | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, title, content, category, created_at, updated_at
      FROM items
      WHERE id = ?
    `);
    return (stmt.get(id) as Item) || null;
  },

  getByCategory(category: string): Item[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, title, content, category, created_at, updated_at
      FROM items
      WHERE category = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(category) as Item[];
  },

  search(query: string): Item[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, title, content, category, created_at, updated_at
      FROM items
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY created_at DESC
    `);
    const searchPattern = `%${query}%`;
    return stmt.all(searchPattern, searchPattern) as Item[];
  },

  create(data: CreateItemData): Item {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO items (id, title, content, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.title, data.content || null, data.category || 'general', now, now);

    return this.getById(id)!;
  },

  update(id: string, data: UpdateItemData): Item | null {
    const db = getDatabase();
    const existing = this.getById(id);

    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE items
      SET title = ?, content = ?, category = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      data.title ?? existing.title,
      data.content ?? existing.content,
      data.category ?? existing.category,
      now,
      id
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  count(): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM items');
    const result = stmt.get() as { count: number };
    return result.count;
  },
};
```

### src/main/menu/index.ts
```typescript
import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';
import log from 'electron-log';

export function setupMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                  mainWindow.webContents.send('navigate', '/settings');
                },
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu:new');
          },
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu:open');
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu:save');
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu:save-as');
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const },
            ]
          : [
              { role: 'delete' as const },
              { type: 'separator' as const },
              { role: 'selectAll' as const },
            ]),
      ],
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },

    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://docs.myapp.com');
          },
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/myapp/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            mainWindow.webContents.send('menu:check-updates');
          },
        },
        ...(!isMac
          ? [
              { type: 'separator' as const },
              {
                label: 'About',
                click: () => {
                  mainWindow.webContents.send('menu:about');
                },
              },
            ]
          : []),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  log.info('Application menu set up');
}
```

### src/main/updater/index.ts
```typescript
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import { IpcChannels } from '../ipc/channels';

export function setupUpdater(mainWindow: BrowserWindow): void {
  // Configure logging
  autoUpdater.logger = log;
  (autoUpdater.logger as typeof log).transports.file.level = 'info';

  // Configure update settings
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Update events
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    mainWindow.webContents.send(IpcChannels.UPDATE_STATUS, { status: 'checking' });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Update available:', info);
    mainWindow.webContents.send(IpcChannels.UPDATE_STATUS, {
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    log.info('No update available:', info);
    mainWindow.webContents.send(IpcChannels.UPDATE_STATUS, {
      status: 'not-available',
      version: info.version,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info(`Download progress: ${progress.percent}%`);
    mainWindow.webContents.send(IpcChannels.UPDATE_PROGRESS, {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.info('Update downloaded:', info);
    mainWindow.webContents.send(IpcChannels.UPDATE_STATUS, {
      status: 'downloaded',
      version: info.version,
    });
  });

  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
    mainWindow.webContents.send(IpcChannels.UPDATE_STATUS, {
      status: 'error',
      error: error.message,
    });
  });

  // Check for updates on startup (after a delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('Failed to check for updates:', error);
    });
  }, 3000);
}

export function checkForUpdates(): Promise<UpdateInfo | null> {
  return autoUpdater.checkForUpdates().then((result) => result?.updateInfo ?? null);
}

export function downloadUpdate(): Promise<string[]> {
  return autoUpdater.downloadUpdate();
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall();
}
```

## Renderer Process

### src/renderer/App.tsx
```tsx
import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import About from './pages/About';
import { useSettingsStore } from './stores/settingsStore';
import { Toaster } from './components/ui/Toast';

export default function App() {
  const navigate = useNavigate();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    // Load settings on mount
    loadSettings();

    // Listen for navigation from main process
    const unsubscribe = window.electronAPI.on('navigate', (path: string) => {
      navigate(path);
    });

    return unsubscribe;
  }, [navigate, loadSettings]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="settings" element={<Settings />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
```

### src/renderer/components/layout/TitleBar.tsx
```tsx
import { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = window.electronAPI.platform === 'darwin';

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.invoke<boolean>('window:is-maximized');
      setIsMaximized(maximized);
    };

    checkMaximized();

    // Poll for changes (or use IPC events)
    const interval = setInterval(checkMaximized, 500);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => window.electronAPI.invoke('window:minimize');
  const handleMaximize = () => {
    window.electronAPI.invoke('window:maximize');
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.electronAPI.invoke('window:close');

  // macOS uses native traffic lights
  if (isMac) {
    return (
      <div
        className="h-8 w-full bg-background/80 backdrop-blur-sm border-b"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-medium">My Electron App</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-8 items-center justify-between bg-background/80 backdrop-blur-sm border-b"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center gap-2 px-3">
        <img src="/icon.png" alt="Logo" className="h-4 w-4" />
        <span className="text-sm font-medium">My Electron App</span>
      </div>

      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className="flex h-8 w-12 items-center justify-center hover:bg-muted transition-colors"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-8 w-12 items-center justify-center hover:bg-muted transition-colors"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy className="h-3 w-3" /> : <Square className="h-3 w-3" />}
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-12 items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

### src/renderer/hooks/useIpc.ts
```typescript
import { useCallback } from 'react';
import { IpcChannels } from '../../main/ipc/channels';

export function useIpc() {
  const invoke = useCallback(<T>(channel: IpcChannels, ...args: unknown[]): Promise<T> => {
    return window.electronAPI.invoke<T>(channel, ...args);
  }, []);

  const send = useCallback((channel: IpcChannels, ...args: unknown[]): void => {
    window.electronAPI.send(channel, ...args);
  }, []);

  const on = useCallback(
    (channel: IpcChannels, callback: (...args: unknown[]) => void): (() => void) => {
      return window.electronAPI.on(channel, callback);
    },
    []
  );

  return { invoke, send, on };
}

// Typed hooks for specific operations
export function useDatabase() {
  const { invoke } = useIpc();

  return {
    getAll: () => invoke<Item[]>(IpcChannels.DB_GET_ALL),
    getOne: (id: string) => invoke<Item | null>(IpcChannels.DB_GET_ONE, id),
    create: (data: CreateItemData) => invoke<Item>(IpcChannels.DB_CREATE, data),
    update: (id: string, data: UpdateItemData) => invoke<Item | null>(IpcChannels.DB_UPDATE, id, data),
    delete: (id: string) => invoke<boolean>(IpcChannels.DB_DELETE, id),
  };
}

export function useFileSystem() {
  const { invoke } = useIpc();

  return {
    readFile: (path: string) =>
      invoke<{ success: boolean; content?: string; error?: string }>(IpcChannels.FS_READ_FILE, path),
    writeFile: (path: string, content: string) =>
      invoke<{ success: boolean; error?: string }>(IpcChannels.FS_WRITE_FILE, path, content),
    selectFile: (options?: Electron.OpenDialogOptions) =>
      invoke<string | null>(IpcChannels.FS_SELECT_FILE, options),
    selectDirectory: () => invoke<string | null>(IpcChannels.FS_SELECT_DIRECTORY),
  };
}

interface Item {
  id: string;
  title: string;
  content: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

interface CreateItemData {
  title: string;
  content?: string;
  category?: string;
}

interface UpdateItemData {
  title?: string;
  content?: string;
  category?: string;
}
```

### src/renderer/stores/appStore.ts
```typescript
import { create } from 'zustand';
import { IpcChannels } from '../../main/ipc/channels';

interface Item {
  id: string;
  title: string;
  content: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

interface AppState {
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  createItem: (title: string, content?: string) => Promise<Item>;
  updateItem: (id: string, title: string, content?: string) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await window.electronAPI.invoke<Item[]>(IpcChannels.DB_GET_ALL);
      set({ items, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createItem: async (title: string, content?: string) => {
    const item = await window.electronAPI.invoke<Item>(IpcChannels.DB_CREATE, { title, content });
    set((state) => ({ items: [item, ...state.items] }));
    return item;
  },

  updateItem: async (id: string, title: string, content?: string) => {
    const item = await window.electronAPI.invoke<Item | null>(IpcChannels.DB_UPDATE, id, { title, content });
    if (item) {
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? item : i)),
      }));
    }
    return item;
  },

  deleteItem: async (id: string) => {
    const success = await window.electronAPI.invoke<boolean>(IpcChannels.DB_DELETE, id);
    if (success) {
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      }));
    }
    return success;
  },
}));
```

### src/renderer/pages/Settings.tsx
```tsx
import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Select } from '../components/ui/Select';

export default function Settings() {
  const { settings, isLoading, updateSettings } = useSettingsStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <Card.Header>
          <Card.Title>Appearance</Card.Title>
          <Card.Description>Customize the look and feel of the application</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <p className="text-sm text-muted-foreground">Select your preferred theme</p>
            </div>
            <Select
              value={settings.theme}
              onChange={(value) => updateSettings({ theme: value as 'light' | 'dark' | 'system' })}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Font Size</label>
              <p className="text-sm text-muted-foreground">Base font size in pixels</p>
            </div>
            <Select
              value={settings.fontSize.toString()}
              onChange={(value) => updateSettings({ fontSize: parseInt(value) })}
              options={[
                { value: '12', label: '12px' },
                { value: '14', label: '14px' },
                { value: '16', label: '16px' },
                { value: '18', label: '18px' },
              ]}
            />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Behavior</Card.Title>
          <Card.Description>Configure application behavior</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Start at Login</label>
              <p className="text-sm text-muted-foreground">Launch the app when you log in</p>
            </div>
            <Switch
              checked={settings.autoStart}
              onChange={(checked) => updateSettings({ autoStart: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Minimize to Tray</label>
              <p className="text-sm text-muted-foreground">Keep running in system tray when closed</p>
            </div>
            <Switch
              checked={settings.minimizeToTray}
              onChange={(checked) => updateSettings({ minimizeToTray: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Notifications</label>
              <p className="text-sm text-muted-foreground">Show desktop notifications</p>
            </div>
            <Switch
              checked={settings.notifications}
              onChange={(checked) => updateSettings({ notifications: checked })}
            />
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
```

## Testing

### src/renderer/pages/Home.test.tsx
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Home from './Home';

// Mock electron API
const mockElectronAPI = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(() => () => {}),
  platform: 'darwin',
  version: '1.0.0',
};

vi.stubGlobal('electronAPI', mockElectronAPI);

describe('Home', () => {
  beforeEach(() => {
    mockElectronAPI.invoke.mockClear();
  });

  it('renders home page', async () => {
    mockElectronAPI.invoke.mockResolvedValueOnce([]);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  it('displays items from database', async () => {
    const mockItems = [
      {
        id: '1',
        title: 'Test Item',
        content: 'Test content',
        category: 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    mockElectronAPI.invoke.mockResolvedValueOnce(mockItems);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });
});
```

## Code Signing and Notarization

### scripts/notarize.js
```javascript
const { notarize } = require('@electron/notarize');
const { build } = require('../package.json');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn('Skipping notarization: APPLE_ID and APPLE_ID_PASSWORD env vars not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${build.appId}...`);

  await notarize({
    appBundleId: build.appId,
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log('Notarization complete!');
};
```

## CLAUDE.md Integration

```markdown
# Electron Application

## Commands
- `npm run dev` - Start development mode
- `npm run build` - Build production bundles
- `npm run package` - Package for current platform
- `npm run package:mac` - Package for macOS
- `npm run package:win` - Package for Windows
- `npm run package:linux` - Package for Linux
- `npm run publish` - Build and publish to GitHub releases

## Architecture
- Main process: Node.js backend in src/main/
- Renderer process: React frontend in src/renderer/
- Preload script: Secure bridge between processes
- Context isolation: Security boundary enforced

## Security Patterns
- Context isolation enabled
- Node integration disabled
- Sandbox enabled
- Validated IPC channels
- CSP headers configured

## IPC Communication
- Main → Renderer: webContents.send()
- Renderer → Main: ipcRenderer.invoke() (via preload)
- Always use typed channels from IpcChannels enum
- Never expose ipcRenderer directly

## Native Features
- SQLite database: better-sqlite3
- Secure storage: electron-store
- Auto-updates: electron-updater
- System tray: Tray API
- Native menus: Menu API
- Notifications: Notification API
```

## AI Suggestions

1. **Add protocol handling** - Register custom protocol handlers (myapp://) for deep linking and OAuth callbacks

2. **Implement crash reporting** - Integrate Sentry or Crashpad for production crash reporting with source maps

3. **Add native modules** - Use node-gyp and prebuild for native modules that work across different Electron versions

4. **Implement hardware acceleration** - Configure GPU acceleration settings for optimal performance on different platforms

5. **Add touch bar support** - Implement macOS Touch Bar controls for MacBook Pro users using TouchBar API

6. **Create installer customization** - Customize NSIS installer with custom pages, license agreements, and branding

7. **Implement differential updates** - Use blockmap for faster incremental updates instead of full downloads

8. **Add accessibility features** - Implement keyboard navigation, screen reader support, and reduced motion preferences

9. **Create portable mode** - Support running from USB with user data stored in the app directory

10. **Implement remote debugging** - Add remote debugging support for troubleshooting issues in production builds
