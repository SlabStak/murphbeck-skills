# Tauri Desktop Application Template

## Overview
Production-ready Tauri 2.0 desktop application with React frontend, Rust backend commands, SQLite database, auto-updates, system tray, native menus, multi-window support, and cross-platform builds for Windows, macOS, and Linux.

## Quick Start
```bash
# Prerequisites: Rust, Node.js, platform-specific dependencies
# See: https://tauri.app/v2/guides/getting-started/prerequisites

# Create new Tauri project
npm create tauri-app@latest my-app -- --template react-ts
cd my-app
npm install

# Or use this template
npx degit template/tauri-desktop my-app
cd my-app
npm install

# Start development
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure
```
my-app/
├── src/                        # React frontend
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── TitleBar.tsx
│   │   │   └── Layout.tsx
│   │   └── features/
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── useUpdater.ts
│   │   ├── useShortcuts.ts
│   │   ├── useWindow.ts
│   │   └── useTray.ts
│   ├── lib/
│   │   ├── tauri.ts
│   │   ├── database.ts
│   │   ├── storage.ts
│   │   └── utils.ts
│   ├── stores/
│   │   ├── appStore.ts
│   │   ├── settingsStore.ts
│   │   └── authStore.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Settings.tsx
│   │   └── About.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/
│       ├── globals.css
│       └── themes.css
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── files.rs
│   │   │   ├── database.rs
│   │   │   └── system.rs
│   │   ├── database/
│   │   │   ├── mod.rs
│   │   │   ├── schema.rs
│   │   │   └── migrations.rs
│   │   ├── menu/
│   │   │   ├── mod.rs
│   │   │   └── handlers.rs
│   │   ├── tray/
│   │   │   ├── mod.rs
│   │   │   └── handlers.rs
│   │   ├── updater/
│   │   │   └── mod.rs
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── migrations/
│   │   └── 001_initial.sql
│   ├── icons/
│   │   ├── 32x32.png
│   │   ├── 128x128.png
│   │   ├── icon.icns
│   │   └── icon.ico
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Configuration Files

### package.json
```json
{
  "name": "tauri-desktop-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:debug": "tauri build --debug",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-autostart": "^2.0.0",
    "@tauri-apps/plugin-clipboard-manager": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-notification": "^2.0.0",
    "@tauri-apps/plugin-os": "^2.0.0",
    "@tauri-apps/plugin-process": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tauri-apps/plugin-sql": "^2.0.0",
    "@tauri-apps/plugin-store": "^2.0.0",
    "@tauri-apps/plugin-updater": "^2.0.0",
    "@tauri-apps/plugin-window-state": "^2.0.0",
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
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.54.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.31",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### src-tauri/Cargo.toml
```toml
[package]
name = "tauri-desktop-app"
version = "1.0.0"
description = "A Tauri Desktop Application"
authors = ["Your Name"]
license = "MIT"
repository = ""
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = ["tray-icon", "macos-private-api"] }
tauri-plugin-autostart = "2.0"
tauri-plugin-clipboard-manager = "2.0"
tauri-plugin-dialog = "2.0"
tauri-plugin-fs = "2.0"
tauri-plugin-notification = "2.0"
tauri-plugin-os = "2.0"
tauri-plugin-process = "2.0"
tauri-plugin-shell = "2.0"
tauri-plugin-sql = { version = "2.0", features = ["sqlite"] }
tauri-plugin-store = "2.0"
tauri-plugin-updater = "2.0"
tauri-plugin-window-state = "2.0"

serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.34", features = ["full"] }
thiserror = "1.0"
log = "0.4"
env_logger = "0.10"
rusqlite = { version = "0.30", features = ["bundled"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.6", features = ["v4", "serde"] }
bcrypt = "0.15"
base64 = "0.21"
directories = "5.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

### src-tauri/tauri.conf.json
```json
{
  "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "My Tauri App",
  "version": "1.0.0",
  "identifier": "com.example.myapp",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "security": {
      "csp": "default-src 'self'; img-src 'self' data: https:; script-src 'self'",
      "dangerousDisableAssetCspModification": false
    },
    "windows": [
      {
        "title": "My Tauri App",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true,
        "decorations": true,
        "transparent": false,
        "dragDropEnabled": true,
        "visible": true
      }
    ],
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false
    },
    "macOSPrivateApi": true
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "category": "Utility",
    "copyright": "Copyright © 2024",
    "shortDescription": "A desktop application built with Tauri",
    "longDescription": "A cross-platform desktop application built with Tauri 2.0, React, and Rust.",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "macOS": {
      "entitlements": null,
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null,
      "minimumSystemVersion": "10.15"
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com",
      "wix": null,
      "nsis": {
        "license": null,
        "headerImage": null,
        "sidebarImage": null,
        "installerIcon": null,
        "installMode": "currentUser"
      }
    },
    "linux": {
      "appimage": {
        "bundleMediaFramework": true
      },
      "deb": {
        "depends": []
      },
      "rpm": {
        "epoch": 0,
        "files": {},
        "release": "1"
      }
    }
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.myapp.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

## Rust Backend

### src-tauri/src/main.rs
```rust
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod database;
mod menu;
mod tray;

use tauri::Manager;
use log::info;

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            info!("Setting up application...");

            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = database::init(&app_handle).await {
                    log::error!("Failed to initialize database: {}", e);
                }
            });

            // Setup system tray
            tray::setup(app)?;

            // Setup menu
            menu::setup(app)?;

            info!("Application setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::files::read_file,
            commands::files::write_file,
            commands::files::list_directory,
            commands::database::get_items,
            commands::database::create_item,
            commands::database::update_item,
            commands::database::delete_item,
            commands::system::get_system_info,
            commands::system::open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### src-tauri/src/lib.rs
```rust
pub mod commands;
pub mod database;
pub mod menu;
pub mod tray;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("{0}")]
    Custom(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

### src-tauri/src/commands/mod.rs
```rust
pub mod database;
pub mod files;
pub mod system;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.into()),
        }
    }
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Tauri.", name)
}
```

### src-tauri/src/commands/files.rs
```rust
use crate::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<u64>,
}

#[tauri::command]
pub async fn read_file(path: String) -> AppResult<String> {
    let content = fs::read_to_string(&path)?;
    Ok(content)
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> AppResult<()> {
    fs::write(&path, content)?;
    Ok(())
}

#[tauri::command]
pub async fn list_directory(path: String) -> AppResult<Vec<FileInfo>> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(AppError::Custom(format!("Path does not exist: {}", path)));
    }

    if !path_buf.is_dir() {
        return Err(AppError::Custom(format!("Path is not a directory: {}", path)));
    }

    let mut entries = Vec::new();

    for entry in fs::read_dir(&path_buf)? {
        let entry = entry?;
        let metadata = entry.metadata()?;

        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        entries.push(FileInfo {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
            modified,
        });
    }

    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}
```

### src-tauri/src/commands/database.rs
```rust
use crate::database::{Item, DB};
use crate::AppResult;
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_items(db: State<'_, Arc<Mutex<DB>>>) -> AppResult<Vec<Item>> {
    let db = db.lock().await;
    db.get_all_items()
}

#[tauri::command]
pub async fn create_item(
    db: State<'_, Arc<Mutex<DB>>>,
    title: String,
    content: Option<String>,
) -> AppResult<Item> {
    let db = db.lock().await;
    db.create_item(&title, content.as_deref())
}

#[tauri::command]
pub async fn update_item(
    db: State<'_, Arc<Mutex<DB>>>,
    id: String,
    title: String,
    content: Option<String>,
) -> AppResult<Item> {
    let db = db.lock().await;
    db.update_item(&id, &title, content.as_deref())
}

#[tauri::command]
pub async fn delete_item(
    db: State<'_, Arc<Mutex<DB>>>,
    id: String,
) -> AppResult<()> {
    let db = db.lock().await;
    db.delete_item(&id)
}
```

### src-tauri/src/commands/system.rs
```rust
use crate::AppResult;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub hostname: String,
    pub cpu_count: usize,
    pub memory_total: u64,
}

#[tauri::command]
pub async fn get_system_info() -> AppResult<SystemInfo> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        os_version: os_info::get().version().to_string(),
        arch: std::env::consts::ARCH.to_string(),
        hostname: hostname::get()
            .map(|h| h.to_string_lossy().to_string())
            .unwrap_or_default(),
        cpu_count: num_cpus::get(),
        memory_total: sys_info::mem_info()
            .map(|m| m.total * 1024)
            .unwrap_or(0),
    })
}

#[tauri::command]
pub async fn open_url(url: String) -> AppResult<()> {
    open::that(&url)?;
    Ok(())
}
```

### src-tauri/src/database/mod.rs
```rust
use crate::{AppError, AppResult};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::AppHandle;
use tokio::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub title: String,
    pub content: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct DB {
    conn: Connection,
}

impl DB {
    pub fn new(path: PathBuf) -> AppResult<Self> {
        let conn = Connection::open(&path)?;

        // Enable WAL mode for better performance
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        conn.execute_batch("PRAGMA foreign_keys=ON;")?;

        Ok(Self { conn })
    }

    pub fn init(&self) -> AppResult<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
            CREATE INDEX IF NOT EXISTS idx_items_title ON items(title);
            "
        )?;
        Ok(())
    }

    pub fn get_all_items(&self) -> AppResult<Vec<Item>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, created_at, updated_at FROM items ORDER BY created_at DESC"
        )?;

        let items = stmt.query_map([], |row| {
            Ok(Item {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get::<_, String>(3)?.parse().unwrap(),
                updated_at: row.get::<_, String>(4)?.parse().unwrap(),
            })
        })?;

        items.collect::<Result<Vec<_>, _>>().map_err(AppError::from)
    }

    pub fn get_item(&self, id: &str) -> AppResult<Option<Item>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, created_at, updated_at FROM items WHERE id = ?"
        )?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(Item {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get::<_, String>(3)?.parse().unwrap(),
                updated_at: row.get::<_, String>(4)?.parse().unwrap(),
            }))
        } else {
            Ok(None)
        }
    }

    pub fn create_item(&self, title: &str, content: Option<&str>) -> AppResult<Item> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let now_str = now.to_rfc3339();

        self.conn.execute(
            "INSERT INTO items (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            params![id, title, content, now_str, now_str],
        )?;

        Ok(Item {
            id,
            title: title.to_string(),
            content: content.map(String::from),
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_item(&self, id: &str, title: &str, content: Option<&str>) -> AppResult<Item> {
        let now = Utc::now();
        let now_str = now.to_rfc3339();

        let rows = self.conn.execute(
            "UPDATE items SET title = ?, content = ?, updated_at = ? WHERE id = ?",
            params![title, content, now_str, id],
        )?;

        if rows == 0 {
            return Err(AppError::Custom(format!("Item not found: {}", id)));
        }

        self.get_item(id)?
            .ok_or_else(|| AppError::Custom("Item not found after update".into()))
    }

    pub fn delete_item(&self, id: &str) -> AppResult<()> {
        let rows = self.conn.execute("DELETE FROM items WHERE id = ?", params![id])?;

        if rows == 0 {
            return Err(AppError::Custom(format!("Item not found: {}", id)));
        }

        Ok(())
    }
}

pub async fn init(app: &AppHandle) -> AppResult<()> {
    let app_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("data.db");
    let db = DB::new(db_path)?;
    db.init()?;

    app.manage(Arc::new(Mutex::new(db)));

    Ok(())
}
```

### src-tauri/src/menu/mod.rs
```rust
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    App, Manager, Wry,
};

pub mod handlers;

pub fn setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    // File menu
    let file_menu = Submenu::with_items(
        handle,
        "File",
        true,
        &[
            &MenuItem::with_id(handle, "new", "New", true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(handle, "open", "Open...", true, Some("CmdOrCtrl+O"))?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(handle, "save_as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::close_window(handle, Some("Close Window"))?,
            &PredefinedMenuItem::quit(handle, Some("Quit"))?,
        ],
    )?;

    // Edit menu
    let edit_menu = Submenu::with_items(
        handle,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(handle, Some("Undo"))?,
            &PredefinedMenuItem::redo(handle, Some("Redo"))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::cut(handle, Some("Cut"))?,
            &PredefinedMenuItem::copy(handle, Some("Copy"))?,
            &PredefinedMenuItem::paste(handle, Some("Paste"))?,
            &PredefinedMenuItem::select_all(handle, Some("Select All"))?,
        ],
    )?;

    // View menu
    let view_menu = Submenu::with_items(
        handle,
        "View",
        true,
        &[
            &MenuItem::with_id(handle, "reload", "Reload", true, Some("CmdOrCtrl+R"))?,
            &MenuItem::with_id(handle, "toggle_devtools", "Toggle Developer Tools", true, Some("F12"))?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "zoom_in", "Zoom In", true, Some("CmdOrCtrl+Plus"))?,
            &MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+Minus"))?,
            &MenuItem::with_id(handle, "reset_zoom", "Reset Zoom", true, Some("CmdOrCtrl+0"))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::fullscreen(handle, Some("Toggle Fullscreen"))?,
        ],
    )?;

    // Window menu
    let window_menu = Submenu::with_items(
        handle,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(handle, Some("Minimize"))?,
            &MenuItem::with_id(handle, "zoom", "Zoom", true, None::<&str>)?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "bring_all_to_front", "Bring All to Front", true, None::<&str>)?,
        ],
    )?;

    // Help menu
    let help_menu = Submenu::with_items(
        handle,
        "Help",
        true,
        &[
            &MenuItem::with_id(handle, "documentation", "Documentation", true, None::<&str>)?,
            &MenuItem::with_id(handle, "about", "About", true, None::<&str>)?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "check_updates", "Check for Updates...", true, None::<&str>)?,
        ],
    )?;

    // Create the main menu
    let menu = Menu::with_items(
        handle,
        &[&file_menu, &edit_menu, &view_menu, &window_menu, &help_menu],
    )?;

    // Set the menu
    app.set_menu(menu)?;

    // Set up menu event handlers
    app.on_menu_event(handlers::handle_menu_event);

    Ok(())
}
```

### src-tauri/src/menu/handlers.rs
```rust
use tauri::{AppHandle, Manager, Wry};

pub fn handle_menu_event(app: &AppHandle<Wry>, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "new" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu:new", ());
            }
        }
        "open" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu:open", ());
            }
        }
        "save" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu:save", ());
            }
        }
        "save_as" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu:save-as", ());
            }
        }
        "reload" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.reload()");
            }
        }
        "toggle_devtools" => {
            if let Some(window) = app.get_webview_window("main") {
                if window.is_devtools_open() {
                    window.close_devtools();
                } else {
                    window.open_devtools();
                }
            }
        }
        "about" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu:about", ());
            }
        }
        "documentation" => {
            let _ = open::that("https://docs.myapp.com");
        }
        "check_updates" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu:check-updates", ());
            }
        }
        _ => {}
    }
}
```

### src-tauri/src/tray/mod.rs
```rust
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Manager,
};

pub mod handlers;

pub fn setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let tray_menu = handlers::create_tray_menu(app.handle())?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&tray_menu)
        .menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            let app = tray.app_handle();

            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    // Show/hide main window on left click
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                _ => {}
            }
        })
        .on_menu_event(handlers::handle_tray_menu_event)
        .build(app)?;

    Ok(())
}
```

### src-tauri/src/tray/handlers.rs
```rust
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIcon,
    AppHandle, Manager, Wry,
};

pub fn create_tray_menu(app: &AppHandle<Wry>) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
    let menu = Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?,
            &MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?,
        ],
    )?;

    Ok(menu)
}

pub fn handle_tray_menu_event(app: &AppHandle<Wry>, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "hide" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }
        }
        "settings" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("navigate", "/settings");
            }
        }
        "quit" => {
            app.exit(0);
        }
        _ => {}
    }
}
```

## React Frontend

### src/main.tsx
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### src/App.tsx
```tsx
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import About from './pages/About';
import { useUpdater } from './hooks/useUpdater';
import { Toaster } from './components/ui/Toast';

export default function App() {
  const navigate = useNavigate();
  const { checkForUpdates } = useUpdater();

  useEffect(() => {
    // Listen for navigation events from the backend
    const unlisten = listen<string>('navigate', (event) => {
      navigate(event.payload);
    });

    // Listen for menu events
    const unlistenMenu = listen('menu:check-updates', () => {
      checkForUpdates();
    });

    // Check for updates on app start
    checkForUpdates();

    return () => {
      unlisten.then((fn) => fn());
      unlistenMenu.then((fn) => fn());
    };
  }, [navigate, checkForUpdates]);

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

### src/components/layout/Layout.tsx
```tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TitleBar from './TitleBar';

export default function Layout() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
```

### src/components/layout/TitleBar.tsx
```tsx
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();

    const unlisten = appWindow.onResized(() => {
      checkMaximized();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [appWindow]);

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  // macOS uses native title bar
  if (navigator.platform.includes('Mac')) {
    return null;
  }

  return (
    <div
      data-tauri-drag-region
      className="flex h-8 items-center justify-between bg-background/80 backdrop-blur-sm border-b"
    >
      <div className="flex items-center gap-2 px-3">
        <img src="/icon.png" alt="Logo" className="h-4 w-4" />
        <span className="text-sm font-medium">My Tauri App</span>
      </div>

      <div className="flex">
        <button
          onClick={handleMinimize}
          className="flex h-8 w-12 items-center justify-center hover:bg-muted transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-8 w-12 items-center justify-center hover:bg-muted transition-colors"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-12 items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

### src/components/layout/Sidebar.tsx
```tsx
import { NavLink } from 'react-router-dom';
import { Home, Settings, Info, Folder, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/files', icon: Folder, label: 'Files' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/about', icon: Info, label: 'About' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30 p-4">
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

### src/stores/appStore.ts
```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface Item {
  id: string;
  title: string;
  content: string | null;
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
  updateItem: (id: string, title: string, content?: string) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await invoke<Item[]>('get_items');
      set({ items, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createItem: async (title: string, content?: string) => {
    const item = await invoke<Item>('create_item', { title, content });
    set((state) => ({ items: [item, ...state.items] }));
    return item;
  },

  updateItem: async (id: string, title: string, content?: string) => {
    const item = await invoke<Item>('update_item', { id, title, content });
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? item : i)),
    }));
    return item;
  },

  deleteItem: async (id: string) => {
    await invoke('delete_item', { id });
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },
}));
```

### src/stores/settingsStore.ts
```typescript
import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  autoStart: boolean;
  minimizeToTray: boolean;
  notifications: boolean;
  fontSize: number;
}

interface SettingsState {
  settings: Settings;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  autoStart: false,
  minimizeToTray: true,
  notifications: true,
  fontSize: 14,
};

let store: Store | null = null;

const getStore = async () => {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoading: true,

  loadSettings: async () => {
    const store = await getStore();
    const settings: Settings = {
      theme: (await store.get('theme')) || defaultSettings.theme,
      autoStart: (await store.get('autoStart')) ?? defaultSettings.autoStart,
      minimizeToTray: (await store.get('minimizeToTray')) ?? defaultSettings.minimizeToTray,
      notifications: (await store.get('notifications')) ?? defaultSettings.notifications,
      fontSize: (await store.get('fontSize')) ?? defaultSettings.fontSize,
    };
    set({ settings, isLoading: false });

    // Apply theme
    applyTheme(settings.theme);
  },

  updateSettings: async (updates: Partial<Settings>) => {
    const store = await getStore();

    for (const [key, value] of Object.entries(updates)) {
      await store.set(key, value);
    }
    await store.save();

    set((state) => {
      const newSettings = { ...state.settings, ...updates };

      // Apply theme if changed
      if (updates.theme) {
        applyTheme(updates.theme);
      }

      return { settings: newSettings };
    });
  },
}));

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}
```

### src/hooks/useUpdater.ts
```typescript
import { useState, useCallback } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useToast } from '../components/ui/Toast';

interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

export function useUpdater() {
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const checkForUpdates = useCallback(async () => {
    setChecking(true);

    try {
      const update = await check();

      if (update) {
        setUpdateInfo({
          version: update.version,
          date: update.date || '',
          body: update.body || '',
        });

        toast({
          title: 'Update Available',
          description: `Version ${update.version} is available`,
          action: {
            label: 'Update Now',
            onClick: () => downloadAndInstall(update),
          },
        });
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setChecking(false);
    }
  }, [toast]);

  const downloadAndInstall = async (update: any) => {
    setDownloading(true);

    try {
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setProgress(100);
            break;
        }
      });

      toast({
        title: 'Update Downloaded',
        description: 'Restarting to apply update...',
      });

      await relaunch();
    } catch (error) {
      console.error('Failed to download update:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to download update. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return {
    checking,
    downloading,
    updateInfo,
    progress,
    checkForUpdates,
  };
}
```

### src/hooks/useShortcuts.ts
```typescript
import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';

interface Shortcut {
  keys: string;
  handler: () => void;
}

export function useShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const registrations: string[] = [];

    const registerShortcuts = async () => {
      for (const shortcut of shortcuts) {
        try {
          await register(shortcut.keys, shortcut.handler);
          registrations.push(shortcut.keys);
        } catch (error) {
          console.error(`Failed to register shortcut ${shortcut.keys}:`, error);
        }
      }
    };

    registerShortcuts();

    return () => {
      registrations.forEach((keys) => {
        unregister(keys).catch(console.error);
      });
    };
  }, [shortcuts]);
}

// Usage example
export function useAppShortcuts() {
  useShortcuts([
    {
      keys: 'CommandOrControl+Shift+P',
      handler: () => {
        // Open command palette
        console.log('Command palette triggered');
      },
    },
    {
      keys: 'CommandOrControl+,',
      handler: () => {
        // Open settings
        window.location.hash = '/settings';
      },
    },
  ]);
}
```

## Testing

### src/pages/Home.test.tsx
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Home from './Home';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve([])),
}));

describe('Home', () => {
  it('renders home page', async () => {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { invoke } = await import('@tauri-apps/api/core');
    (invoke as any).mockResolvedValueOnce(mockItems);

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

## CLAUDE.md Integration

```markdown
# Tauri Desktop Application

## Commands
- `npm run tauri dev` - Start development mode
- `npm run tauri build` - Build production binaries
- `npm run tauri build --debug` - Build with debug symbols
- `cargo test -p tauri-desktop-app` - Run Rust tests

## Architecture
- React + TypeScript frontend in src/
- Rust backend in src-tauri/
- SQLite database with rusqlite
- Zustand for state management
- Tauri plugins for native features

## Key Patterns
- Commands: Rust functions exposed to frontend via invoke()
- Events: Bidirectional communication with listen/emit
- State: Managed state in Rust accessible across commands
- Plugins: Native capabilities via Tauri plugin system

## Native Features
- System tray with menu
- Native menus (File, Edit, etc.)
- Auto-updates with signed releases
- Global keyboard shortcuts
- Multi-window support
- Secure storage

## Build Targets
- macOS: .dmg, .app
- Windows: .msi, .exe (NSIS)
- Linux: .deb, .rpm, .AppImage
```

## AI Suggestions

1. **Add IPC streaming** - Implement streaming commands for large data transfers using Tauri's event system with chunked payloads

2. **Implement secure storage** - Use tauri-plugin-stronghold for encrypted credential storage with hardware-backed security when available

3. **Add crash reporting** - Integrate Sentry or Crashpad for production crash reporting with source maps and minidump processing

4. **Implement deep linking** - Register custom protocol handlers (myapp://) for opening the app from browser links

5. **Add single instance lock** - Prevent multiple app instances and forward arguments to the running instance

6. **Implement window state persistence** - Save and restore window position, size, and maximized state across sessions

7. **Add touch bar support** - Implement macOS Touch Bar controls for MacBook Pro users

8. **Create portable mode** - Support running from USB with config stored in app directory instead of system paths

9. **Add accessibility features** - Implement screen reader support, keyboard navigation, and high contrast themes

10. **Implement file associations** - Register file type associations so double-clicking files opens your app
