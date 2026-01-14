# Ionic App Template

## Overview
Production-ready Ionic application with Angular, Capacitor for native functionality, SQLite for offline storage, comprehensive theming, and cross-platform deployment to iOS, Android, and web.

## Quick Start
```bash
# Create new Ionic Angular project
npm install -g @ionic/cli
ionic start my-app blank --type=angular --capacitor

# Or use this template
npx degit template/ionic-app my-app
cd my-app
npm install

# Run in browser
ionic serve

# Run on iOS
ionic cap add ios
ionic cap run ios

# Run on Android
ionic cap add android
ionic cap run android
```

## Project Structure
```
my-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── no-auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── loading.interceptor.ts
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   ├── database.service.ts
│   │   │   │   ├── push-notification.service.ts
│   │   │   │   └── sync.service.ts
│   │   │   └── core.module.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── loading/
│   │   │   │   ├── empty-state/
│   │   │   │   └── error-state/
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   └── shared.module.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   └── forgot-password/
│   │   │   │   ├── services/
│   │   │   │   └── auth.module.ts
│   │   │   ├── home/
│   │   │   │   ├── home.page.ts
│   │   │   │   ├── home.page.html
│   │   │   │   ├── home.page.scss
│   │   │   │   └── home.module.ts
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   ├── assets/
│   │   ├── icon/
│   │   └── shapes.svg
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── theme/
│   │   ├── variables.scss
│   │   └── global.scss
│   ├── global.scss
│   ├── index.html
│   ├── main.ts
│   └── polyfills.ts
├── android/
│   ├── app/
│   └── capacitor.settings.gradle
├── ios/
│   └── App/
├── capacitor.config.ts
├── ionic.config.json
├── angular.json
├── package.json
└── tsconfig.json
```

## Configuration Files

### package.json
```json
{
  "name": "ionic-app",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration=production",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "test:ci": "ng test --no-watch --no-progress --browsers=ChromeHeadless",
    "lint": "ng lint",
    "e2e": "ng e2e",
    "cap:sync": "ionic cap sync",
    "cap:ios": "ionic cap run ios",
    "cap:android": "ionic cap run android",
    "cap:build:ios": "ionic cap build ios --prod",
    "cap:build:android": "ionic cap build android --prod"
  },
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "@angular/router": "^17.0.0",
    "@capacitor/android": "^5.0.0",
    "@capacitor/app": "^5.0.0",
    "@capacitor/camera": "^5.0.0",
    "@capacitor/core": "^5.0.0",
    "@capacitor/filesystem": "^5.0.0",
    "@capacitor/haptics": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@capacitor/keyboard": "^5.0.0",
    "@capacitor/network": "^5.0.0",
    "@capacitor/preferences": "^5.0.0",
    "@capacitor/push-notifications": "^5.0.0",
    "@capacitor/share": "^5.0.0",
    "@capacitor/splash-screen": "^5.0.0",
    "@capacitor/status-bar": "^5.0.0",
    "@ionic/angular": "^7.0.0",
    "@ionic/storage-angular": "^4.0.0",
    "ionicons": "^7.0.0",
    "jeep-sqlite": "^2.0.0",
    "rxjs": "~7.8.0",
    "sql.js": "^1.8.0",
    "tslib": "^2.6.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular-eslint/builder": "^17.0.0",
    "@angular-eslint/eslint-plugin": "^17.0.0",
    "@angular-eslint/eslint-plugin-template": "^17.0.0",
    "@angular-eslint/schematics": "^17.0.0",
    "@angular-eslint/template-parser": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "@capacitor/cli": "^5.0.0",
    "@types/jasmine": "~5.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "jasmine-core": "~5.1.0",
    "jasmine-spec-reporter": "~7.0.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.2.0"
  }
}
```

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.myapp',
  appName: 'My App',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#3880ff',
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
```

### angular.json
```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "app": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "www",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": [
              {
                "glob": "**/*",
                "input": "src/assets",
                "output": "assets"
              }
            ],
            "styles": [
              "src/theme/variables.scss",
              "src/global.scss"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                }
              ],
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "browserTarget": "app:build:production"
            },
            "development": {
              "browserTarget": "app:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "inlineStyleLanguage": "scss",
            "assets": [
              {
                "glob": "**/*",
                "input": "src/assets",
                "output": "assets"
              }
            ],
            "styles": [
              "src/theme/variables.scss",
              "src/global.scss"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}
```

## Theme Configuration

### src/theme/variables.scss
```scss
// Ionic Variables and Theming
:root {
  // Primary brand colors
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;

  // Secondary
  --ion-color-secondary: #3dc2ff;
  --ion-color-secondary-rgb: 61, 194, 255;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-secondary-contrast-rgb: 255, 255, 255;
  --ion-color-secondary-shade: #36abe0;
  --ion-color-secondary-tint: #50c8ff;

  // Tertiary
  --ion-color-tertiary: #5260ff;
  --ion-color-tertiary-rgb: 82, 96, 255;
  --ion-color-tertiary-contrast: #ffffff;
  --ion-color-tertiary-contrast-rgb: 255, 255, 255;
  --ion-color-tertiary-shade: #4854e0;
  --ion-color-tertiary-tint: #6370ff;

  // Success
  --ion-color-success: #2dd36f;
  --ion-color-success-rgb: 45, 211, 111;
  --ion-color-success-contrast: #ffffff;
  --ion-color-success-contrast-rgb: 255, 255, 255;
  --ion-color-success-shade: #28ba62;
  --ion-color-success-tint: #42d77d;

  // Warning
  --ion-color-warning: #ffc409;
  --ion-color-warning-rgb: 255, 196, 9;
  --ion-color-warning-contrast: #000000;
  --ion-color-warning-contrast-rgb: 0, 0, 0;
  --ion-color-warning-shade: #e0ac08;
  --ion-color-warning-tint: #ffca22;

  // Danger
  --ion-color-danger: #eb445a;
  --ion-color-danger-rgb: 235, 68, 90;
  --ion-color-danger-contrast: #ffffff;
  --ion-color-danger-contrast-rgb: 255, 255, 255;
  --ion-color-danger-shade: #cf3c4f;
  --ion-color-danger-tint: #ed576b;

  // Medium
  --ion-color-medium: #92949c;
  --ion-color-medium-rgb: 146, 148, 156;
  --ion-color-medium-contrast: #ffffff;
  --ion-color-medium-contrast-rgb: 255, 255, 255;
  --ion-color-medium-shade: #808289;
  --ion-color-medium-tint: #9d9fa6;

  // Light
  --ion-color-light: #f4f5f8;
  --ion-color-light-rgb: 244, 245, 248;
  --ion-color-light-contrast: #000000;
  --ion-color-light-contrast-rgb: 0, 0, 0;
  --ion-color-light-shade: #d7d8da;
  --ion-color-light-tint: #f5f6f9;
}

// Dark Mode
@media (prefers-color-scheme: dark) {
  :root {
    --ion-color-primary: #428cff;
    --ion-color-primary-rgb: 66, 140, 255;
    --ion-color-primary-contrast: #ffffff;
    --ion-color-primary-contrast-rgb: 255, 255, 255;
    --ion-color-primary-shade: #3a7be0;
    --ion-color-primary-tint: #5598ff;

    --ion-color-secondary: #50c8ff;
    --ion-color-secondary-rgb: 80, 200, 255;
    --ion-color-secondary-contrast: #ffffff;
    --ion-color-secondary-contrast-rgb: 255, 255, 255;
    --ion-color-secondary-shade: #46b0e0;
    --ion-color-secondary-tint: #62ceff;
  }

  .ios body {
    --ion-background-color: #000000;
    --ion-background-color-rgb: 0, 0, 0;
    --ion-text-color: #ffffff;
    --ion-text-color-rgb: 255, 255, 255;
    --ion-color-step-50: #0d0d0d;
    --ion-color-step-100: #1a1a1a;
    --ion-color-step-150: #262626;
    --ion-color-step-200: #333333;
    --ion-color-step-250: #404040;
    --ion-color-step-300: #4d4d4d;
    --ion-color-step-350: #595959;
    --ion-color-step-400: #666666;
    --ion-color-step-450: #737373;
    --ion-color-step-500: #808080;
    --ion-color-step-550: #8c8c8c;
    --ion-color-step-600: #999999;
    --ion-color-step-650: #a6a6a6;
    --ion-color-step-700: #b3b3b3;
    --ion-color-step-750: #bfbfbf;
    --ion-color-step-800: #cccccc;
    --ion-color-step-850: #d9d9d9;
    --ion-color-step-900: #e6e6e6;
    --ion-color-step-950: #f2f2f2;
    --ion-item-background: #000000;
    --ion-card-background: #1c1c1d;
  }

  .md body {
    --ion-background-color: #121212;
    --ion-background-color-rgb: 18, 18, 18;
    --ion-text-color: #ffffff;
    --ion-text-color-rgb: 255, 255, 255;
    --ion-border-color: #222222;
    --ion-color-step-50: #1e1e1e;
    --ion-color-step-100: #2a2a2a;
    --ion-color-step-150: #363636;
    --ion-color-step-200: #414141;
    --ion-color-step-250: #4d4d4d;
    --ion-color-step-300: #595959;
    --ion-color-step-350: #656565;
    --ion-color-step-400: #717171;
    --ion-color-step-450: #7d7d7d;
    --ion-color-step-500: #898989;
    --ion-color-step-550: #949494;
    --ion-color-step-600: #a0a0a0;
    --ion-color-step-650: #acacac;
    --ion-color-step-700: #b8b8b8;
    --ion-color-step-750: #c4c4c4;
    --ion-color-step-800: #d0d0d0;
    --ion-color-step-850: #dbdbdb;
    --ion-color-step-900: #e7e7e7;
    --ion-color-step-950: #f3f3f3;
    --ion-item-background: #1e1e1e;
    --ion-card-background: #1e1e1e;
  }

  ion-title.title-large {
    --color: white;
  }
}

// Custom Colors
.ion-color-brand {
  --ion-color-base: #6366f1;
  --ion-color-base-rgb: 99, 102, 241;
  --ion-color-contrast: #ffffff;
  --ion-color-contrast-rgb: 255, 255, 255;
  --ion-color-shade: #5758d5;
  --ion-color-tint: #7375f2;
}

// Typography
:root {
  --ion-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

// Border Radius
:root {
  --ion-border-radius: 8px;
  --ion-border-radius-sm: 4px;
  --ion-border-radius-lg: 12px;
  --ion-border-radius-xl: 16px;
}
```

## Core Module

### src/app/core/core.module.ts
```typescript
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    IonicStorageModule.forRoot({
      name: '__myapp_db',
      driverOrder: ['indexeddb', 'sqlite', 'websql'],
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only.'
      );
    }
  }
}
```

## Services

### src/app/core/services/storage.service.ts
```typescript
import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Storage } from '@ionic/storage-angular';

export interface StorageKeys {
  AUTH_TOKEN: string;
  REFRESH_TOKEN: string;
  USER: string;
  SETTINGS: string;
  CACHE_PREFIX: string;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private _storage: Storage | null = null;

  readonly keys: StorageKeys = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
    SETTINGS: 'settings',
    CACHE_PREFIX: 'cache_',
  };

  constructor(private storage: Storage) {
    this.init();
  }

  async init(): Promise<void> {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Ionic Storage (larger data, complex objects)
  async set<T>(key: string, value: T): Promise<void> {
    await this._storage?.set(key, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this._storage?.get(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    }
    return null;
  }

  async remove(key: string): Promise<void> {
    await this._storage?.remove(key);
  }

  async clear(): Promise<void> {
    await this._storage?.clear();
  }

  async keys(): Promise<string[]> {
    return (await this._storage?.keys()) || [];
  }

  // Capacitor Preferences (simple key-value, faster)
  async setSecure(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async getSecure(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  async removeSecure(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  // Cache with expiration
  async setWithExpiry<T>(
    key: string,
    value: T,
    ttlMinutes: number
  ): Promise<void> {
    const item = {
      value,
      expiry: Date.now() + ttlMinutes * 60 * 1000,
    };
    await this.set(`${this.keys.CACHE_PREFIX}${key}`, item);
  }

  async getWithExpiry<T>(key: string): Promise<T | null> {
    const item = await this.get<{ value: T; expiry: number }>(
      `${this.keys.CACHE_PREFIX}${key}`
    );

    if (!item) return null;

    if (Date.now() > item.expiry) {
      await this.remove(`${this.keys.CACHE_PREFIX}${key}`);
      return null;
    }

    return item.value;
  }
}
```

### src/app/core/services/auth.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;

  private authState = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  authState$ = this.authState.asObservable();
  currentUser$ = this.authState.pipe(map((state) => state.user));
  isAuthenticated$ = this.authState.pipe(map((state) => state.isAuthenticated));

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router
  ) {
    this.initAuth();
  }

  private async initAuth(): Promise<void> {
    const token = await this.storage.getSecure(this.storage.keys.AUTH_TOKEN);
    const user = await this.storage.get<User>(this.storage.keys.USER);

    if (token && user) {
      this.authState.next({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      this.authState.next({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<{ user: User; tokens: AuthTokens }>(`${this.API_URL}/auth/login`, {
        email,
        password,
      })
      .pipe(
        switchMap(({ user, tokens }) =>
          from(this.handleAuthSuccess(user, tokens)).pipe(map(() => user))
        ),
        catchError(this.handleError)
      );
  }

  register(
    name: string,
    email: string,
    password: string
  ): Observable<User> {
    return this.http
      .post<{ user: User; tokens: AuthTokens }>(`${this.API_URL}/auth/register`, {
        name,
        email,
        password,
      })
      .pipe(
        switchMap(({ user, tokens }) =>
          from(this.handleAuthSuccess(user, tokens)).pipe(map(() => user))
        ),
        catchError(this.handleError)
      );
  }

  private async handleAuthSuccess(
    user: User,
    tokens: AuthTokens
  ): Promise<void> {
    await Promise.all([
      this.storage.setSecure(this.storage.keys.AUTH_TOKEN, tokens.accessToken),
      this.storage.setSecure(
        this.storage.keys.REFRESH_TOKEN,
        tokens.refreshToken
      ),
      this.storage.set(this.storage.keys.USER, user),
    ]);

    this.authState.next({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  logout(): Observable<void> {
    return from(this.performLogout());
  }

  private async performLogout(): Promise<void> {
    await Promise.all([
      this.storage.removeSecure(this.storage.keys.AUTH_TOKEN),
      this.storage.removeSecure(this.storage.keys.REFRESH_TOKEN),
      this.storage.remove(this.storage.keys.USER),
    ]);

    this.authState.next({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthTokens> {
    return from(
      this.storage.getSecure(this.storage.keys.REFRESH_TOKEN)
    ).pipe(
      switchMap((refreshToken) => {
        if (!refreshToken) {
          return throwError(() => new Error('No refresh token'));
        }
        return this.http.post<AuthTokens>(`${this.API_URL}/auth/refresh`, {
          refreshToken,
        });
      }),
      tap(async (tokens) => {
        await this.storage.setSecure(
          this.storage.keys.AUTH_TOKEN,
          tokens.accessToken
        );
        await this.storage.setSecure(
          this.storage.keys.REFRESH_TOKEN,
          tokens.refreshToken
        );
      }),
      catchError((error) => {
        this.performLogout();
        return throwError(() => error);
      })
    );
  }

  getToken(): Observable<string | null> {
    return from(this.storage.getSecure(this.storage.keys.AUTH_TOKEN));
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/auth/profile`, data).pipe(
      tap(async (user) => {
        await this.storage.set(this.storage.keys.USER, user);
        this.authState.next({
          ...this.authState.value,
          user,
        });
      }),
      catchError(this.handleError)
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http
      .post<void>(`${this.API_URL}/auth/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http
      .post<void>(`${this.API_URL}/auth/reset-password`, { token, password })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let message = 'An unexpected error occurred';
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }
    return throwError(() => new Error(message));
  }
}
```

### src/app/core/services/database.service.ts
```typescript
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

export interface DatabaseItem {
  id: string;
  data: any;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'app_database';
  private readonly DB_VERSION = 1;

  private ready = new BehaviorSubject<boolean>(false);
  ready$ = this.ready.asObservable();

  constructor(private platform: Platform) {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    await this.platform.ready();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.ready.next(true);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Generic items store
    if (!db.objectStoreNames.contains('items')) {
      const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
      itemsStore.createIndex('type', 'type', { unique: false });
      itemsStore.createIndex('synced', 'synced', { unique: false });
      itemsStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Sync queue store
    if (!db.objectStoreNames.contains('sync_queue')) {
      const syncStore = db.createObjectStore('sync_queue', {
        keyPath: 'id',
        autoIncrement: true,
      });
      syncStore.createIndex('operation', 'operation', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Cache store
    if (!db.objectStoreNames.contains('cache')) {
      const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
      cacheStore.createIndex('expiry', 'expiry', { unique: false });
    }
  }

  async insert<T extends { id: string }>(
    storeName: string,
    item: T
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const dbItem = {
        ...item,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        synced: false,
      };

      const request = store.add(dbItem);

      request.onsuccess = () => resolve(dbItem as T);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T extends { id: string }>(
    storeName: string,
    item: T
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const dbItem = {
        ...item,
        updatedAt: Date.now(),
        synced: false,
      };

      const request = store.put(dbItem);

      request.onsuccess = () => resolve(dbItem as T);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T | null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async query<T>(
    storeName: string,
    filter: (item: T) => boolean
  ): Promise<T[]> {
    const all = await this.getAll<T>(storeName);
    return all.filter(filter);
  }

  async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    storeName: string,
    data: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');

      const request = store.add({
        operation,
        storeName,
        data,
        timestamp: Date.now(),
        attempts: 0,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncItems(): Promise<any[]> {
    return this.getAll('sync_queue');
  }

  async removeSyncItem(id: number): Promise<void> {
    return this.delete('sync_queue', id.toString());
  }
}
```

### src/app/core/services/api.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return httpParams;
  }

  get<T>(endpoint: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      params: this.buildParams(params),
    });
  }

  getOne<T>(endpoint: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}/${id}`);
  }

  getPaginated<T>(
    endpoint: string,
    params?: QueryParams
  ): Observable<PaginatedResponse<T>> {
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, {
      params: this.buildParams(params),
    });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data);
  }

  put<T>(endpoint: string, id: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}/${id}`, data);
  }

  patch<T>(endpoint: string, id: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}/${id}`, data);
  }

  delete<T>(endpoint: string, id: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}/${id}`);
  }

  upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData);
  }
}
```

### src/app/core/services/push-notification.service.ts
```typescript
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationData {
  type: string;
  id?: string;
  route?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private fcmToken = new BehaviorSubject<string | null>(null);
  private notifications = new BehaviorSubject<PushNotificationSchema[]>([]);

  fcmToken$ = this.fcmToken.asObservable();
  notifications$ = this.notifications.asObservable();

  constructor(
    private platform: Platform,
    private router: Router,
    private ngZone: NgZone
  ) {}

  async initialize(): Promise<void> {
    if (!this.platform.is('capacitor')) {
      console.log('Push notifications not supported on web');
      return;
    }

    // Request permission
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      const result = await PushNotifications.requestPermissions();
      if (result.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('FCM Token:', token.value);
      this.fcmToken.next(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Registration error:', error.error);
    });

    // Listen for received notifications (app in foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Notification received:', notification);
        this.ngZone.run(() => {
          const current = this.notifications.value;
          this.notifications.next([notification, ...current]);
        });
      }
    );

    // Listen for notification taps
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Notification action performed:', action);
        this.ngZone.run(() => {
          this.handleNotificationTap(action.notification.data as NotificationData);
        });
      }
    );
  }

  private handleNotificationTap(data: NotificationData): void {
    if (data.route) {
      this.router.navigate([data.route]);
    } else if (data.type && data.id) {
      // Handle specific notification types
      switch (data.type) {
        case 'message':
          this.router.navigate(['/messages', data.id]);
          break;
        case 'order':
          this.router.navigate(['/orders', data.id]);
          break;
        default:
          this.router.navigate(['/notifications']);
      }
    }
  }

  async getToken(): Promise<string | null> {
    return this.fcmToken.value;
  }

  async removeAllDeliveredNotifications(): Promise<void> {
    if (this.platform.is('capacitor')) {
      await PushNotifications.removeAllDeliveredNotifications();
    }
  }

  clearNotifications(): void {
    this.notifications.next([]);
  }
}
```

## Interceptors

### src/app/core/interceptors/auth.interceptor.ts
```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Skip auth for certain endpoints
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    return this.authService.getToken().pipe(
      take(1),
      switchMap((token) => {
        if (token) {
          request = this.addToken(request, token);
        }
        return next.handle(request).pipe(
          catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              return this.handle401Error(request, next);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    return authEndpoints.some((endpoint) => url.includes(endpoint));
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokens) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokens.accessToken);
          return next.handle(this.addToken(request, tokens.accessToken));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          return throwError(() => error);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addToken(request, token!)))
    );
  }
}
```

### src/app/core/interceptors/error.interceptor.ts
```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { Network } from '@capacitor/network';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toastController: ToastController) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private async handleError(error: HttpErrorResponse): Promise<void> {
    let message = 'An unexpected error occurred';

    if (error.status === 0) {
      // Network error
      const status = await Network.getStatus();
      message = status.connected
        ? 'Unable to connect to server'
        : 'No internet connection';
    } else if (error.status === 400) {
      message = error.error?.message || 'Bad request';
    } else if (error.status === 401) {
      // Handled by auth interceptor
      return;
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action';
    } else if (error.status === 404) {
      message = 'Resource not found';
    } else if (error.status === 422) {
      message = error.error?.message || 'Validation error';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again later';
    }

    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }
}
```

### src/app/core/interceptors/loading.interceptor.ts
```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private loading: HTMLIonLoadingElement | null = null;
  private readonly excludedUrls: string[] = [
    '/api/health',
    '/api/ping',
  ];

  constructor(private loadingController: LoadingController) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Check if request should show loading
    if (this.shouldShowLoading(request)) {
      this.activeRequests++;

      if (this.activeRequests === 1) {
        this.showLoading();
      }

      return next.handle(request).pipe(
        finalize(() => {
          this.activeRequests--;
          if (this.activeRequests === 0) {
            this.hideLoading();
          }
        })
      );
    }

    return next.handle(request);
  }

  private shouldShowLoading(request: HttpRequest<any>): boolean {
    // Don't show for GET requests by default
    if (request.method === 'GET') {
      return false;
    }

    // Don't show for excluded URLs
    return !this.excludedUrls.some((url) => request.url.includes(url));
  }

  private async showLoading(): Promise<void> {
    this.loading = await this.loadingController.create({
      message: 'Please wait...',
      spinner: 'crescent',
      translucent: true,
    });
    await this.loading.present();
  }

  private async hideLoading(): Promise<void> {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}
```

## Guards

### src/app/core/guards/auth.guard.ts
```typescript
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map((authState) => {
        if (authState.isLoading) {
          return true; // Allow while loading
        }

        if (!authState.isAuthenticated) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }

        // Check for required role
        const requiredRole = route.data['role'];
        if (requiredRole && authState.user?.role !== requiredRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}
```

## App Module

### src/app/app.module.ts
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot({
      mode: 'ios', // or 'md' for Material Design
      animated: true,
      rippleEffect: true,
      hardwareBackButton: true,
      statusTap: true,
      swipeBackEnabled: true,
    }),
    AppRoutingModule,
    CoreModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### src/app/app-routing.module.ts
```typescript
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./features/home/home.module').then((m) => m.HomeModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./features/profile/profile.module').then((m) => m.ProfileModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.module').then(
        (m) => m.SettingsModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

### src/app/app.component.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotificationService } from './core/services/push-notification.service';
import { StorageService } from './core/services/storage.service';
import { DatabaseService } from './core/services/database.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private pushService: PushNotificationService,
    private storageService: StorageService,
    private databaseService: DatabaseService
  ) {
    this.initializeApp();
  }

  async ngOnInit(): Promise<void> {
    // Initialize services
    await this.storageService.init();
    await this.databaseService.ready$.toPromise();
  }

  private async initializeApp(): Promise<void> {
    await this.platform.ready();

    if (this.platform.is('capacitor')) {
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Light });

      if (this.platform.is('android')) {
        await StatusBar.setBackgroundColor({ color: '#3880ff' });
      }

      // Hide splash screen
      await SplashScreen.hide();

      // Initialize push notifications
      await this.pushService.initialize();
    }
  }
}
```

## Home Feature

### src/app/features/home/home.page.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { RefresherEventDetail } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService, User } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface DashboardItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  value?: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user$: Observable<User | null>;
  items: DashboardItem[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;

    // Simulate API call
    this.items = [
      {
        id: '1',
        title: 'Messages',
        description: 'View your messages',
        icon: 'mail-outline',
        color: 'primary',
        value: 12,
      },
      {
        id: '2',
        title: 'Tasks',
        description: 'Manage your tasks',
        icon: 'checkbox-outline',
        color: 'success',
        value: 5,
      },
      {
        id: '3',
        title: 'Calendar',
        description: 'View your schedule',
        icon: 'calendar-outline',
        color: 'warning',
        value: 3,
      },
      {
        id: '4',
        title: 'Settings',
        description: 'App settings',
        icon: 'settings-outline',
        color: 'medium',
      },
    ];

    this.isLoading = false;
  }

  async handleRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.loadData();
    (event.target as HTMLIonRefresherElement).complete();
  }

  onItemClick(item: DashboardItem): void {
    console.log('Item clicked:', item);
    // Navigate to appropriate page
  }

  trackByFn(index: number, item: DashboardItem): string {
    return item.id;
  }
}
```

### src/app/features/home/home.page.html
```html
<ion-header [translucent]="true">
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-menu-button></ion-menu-button>
    </ion-buttons>
    <ion-title>Home</ion-title>
    <ion-buttons slot="end">
      <ion-button routerLink="/notifications">
        <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">Home</ion-title>
    </ion-toolbar>
  </ion-header>

  <!-- Welcome Section -->
  <div class="welcome-section" *ngIf="user$ | async as user">
    <ion-avatar>
      <img [src]="user.avatar || 'assets/avatar-placeholder.png'" alt="Avatar" />
    </ion-avatar>
    <div class="welcome-text">
      <h2>Welcome back,</h2>
      <h1>{{ user.name }}</h1>
    </div>
  </div>

  <!-- Loading State -->
  <div *ngIf="isLoading" class="loading-container">
    <ion-spinner name="crescent"></ion-spinner>
  </div>

  <!-- Dashboard Grid -->
  <div class="dashboard-grid" *ngIf="!isLoading">
    <ion-card
      *ngFor="let item of items; trackBy: trackByFn"
      [button]="true"
      (click)="onItemClick(item)"
    >
      <ion-card-content>
        <div class="card-icon" [ngClass]="'color-' + item.color">
          <ion-icon [name]="item.icon"></ion-icon>
        </div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <ion-badge *ngIf="item.value" [color]="item.color">
          {{ item.value }}
        </ion-badge>
      </ion-card-content>
    </ion-card>
  </div>

  <!-- Recent Activity -->
  <ion-list-header>
    <ion-label>Recent Activity</ion-label>
    <ion-button fill="clear" size="small">View All</ion-button>
  </ion-list-header>

  <ion-list>
    <ion-item *ngFor="let i of [1, 2, 3]">
      <ion-avatar slot="start">
        <ion-icon name="person-circle-outline" size="large"></ion-icon>
      </ion-avatar>
      <ion-label>
        <h2>Activity Item {{ i }}</h2>
        <p>Description of the activity</p>
      </ion-label>
      <ion-note slot="end">{{ i }}h ago</ion-note>
    </ion-item>
  </ion-list>
</ion-content>
```

### src/app/features/home/home.page.scss
```scss
.welcome-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 16px;
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);

  ion-avatar {
    width: 64px;
    height: 64px;
  }

  .welcome-text {
    h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 400;
      opacity: 0.8;
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;

  ion-card {
    margin: 0;
    border-radius: var(--ion-border-radius-lg);

    ion-card-content {
      position: relative;
      text-align: center;
      padding: 20px 16px;
    }

    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;

      ion-icon {
        font-size: 28px;
        color: white;
      }

      &.color-primary {
        background: var(--ion-color-primary);
      }
      &.color-success {
        background: var(--ion-color-success);
      }
      &.color-warning {
        background: var(--ion-color-warning);
      }
      &.color-medium {
        background: var(--ion-color-medium);
      }
    }

    h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    ion-badge {
      position: absolute;
      top: 12px;
      right: 12px;
    }
  }
}

ion-list-header {
  padding-top: 16px;
}
```

## Auth Feature

### src/app/features/auth/pages/login/login.page.ts
```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  returnUrl = '/home';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Signing in...',
    });
    await loading.present();

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        loading.dismiss();
        this.router.navigate([this.returnUrl]);
      },
      error: async (error) => {
        loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Login Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      },
    });
  }
}
```

### src/app/features/auth/pages/login/login.page.html
```html
<ion-content class="ion-padding">
  <div class="login-container">
    <!-- Logo -->
    <div class="logo-section">
      <ion-icon name="logo-ionic" color="primary"></ion-icon>
      <h1>Welcome Back</h1>
      <p>Sign in to continue</p>
    </div>

    <!-- Login Form -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <ion-item
        [class.ion-invalid]="f['email'].invalid && f['email'].touched"
        [class.ion-valid]="f['email'].valid"
      >
        <ion-icon name="mail-outline" slot="start"></ion-icon>
        <ion-input
          type="email"
          formControlName="email"
          placeholder="Email"
          autocomplete="email"
        ></ion-input>
      </ion-item>
      <ion-note color="danger" *ngIf="f['email'].touched && f['email'].errors?.['required']">
        Email is required
      </ion-note>
      <ion-note color="danger" *ngIf="f['email'].touched && f['email'].errors?.['email']">
        Please enter a valid email
      </ion-note>

      <ion-item
        [class.ion-invalid]="f['password'].invalid && f['password'].touched"
        [class.ion-valid]="f['password'].valid"
      >
        <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
        <ion-input
          [type]="showPassword ? 'text' : 'password'"
          formControlName="password"
          placeholder="Password"
          autocomplete="current-password"
        ></ion-input>
        <ion-button fill="clear" slot="end" (click)="togglePassword()">
          <ion-icon
            slot="icon-only"
            [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"
          ></ion-icon>
        </ion-button>
      </ion-item>
      <ion-note color="danger" *ngIf="f['password'].touched && f['password'].errors?.['required']">
        Password is required
      </ion-note>
      <ion-note color="danger" *ngIf="f['password'].touched && f['password'].errors?.['minlength']">
        Password must be at least 6 characters
      </ion-note>

      <div class="form-options">
        <ion-item lines="none">
          <ion-checkbox formControlName="rememberMe" slot="start"></ion-checkbox>
          <ion-label>Remember me</ion-label>
        </ion-item>
        <ion-button fill="clear" routerLink="/auth/forgot-password">
          Forgot Password?
        </ion-button>
      </div>

      <ion-button
        type="submit"
        expand="block"
        [disabled]="loginForm.invalid"
        class="submit-button"
      >
        Sign In
      </ion-button>
    </form>

    <!-- Social Login -->
    <div class="social-section">
      <div class="divider">
        <span>or continue with</span>
      </div>

      <div class="social-buttons">
        <ion-button fill="outline" color="dark">
          <ion-icon slot="icon-only" name="logo-google"></ion-icon>
        </ion-button>
        <ion-button fill="outline" color="dark">
          <ion-icon slot="icon-only" name="logo-apple"></ion-icon>
        </ion-button>
        <ion-button fill="outline" color="dark">
          <ion-icon slot="icon-only" name="logo-facebook"></ion-icon>
        </ion-button>
      </div>
    </div>

    <!-- Register Link -->
    <div class="register-link">
      <span>Don't have an account?</span>
      <ion-button fill="clear" routerLink="/auth/register">Sign Up</ion-button>
    </div>
  </div>
</ion-content>
```

### src/app/features/auth/pages/login/login.page.scss
```scss
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 24px 0;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;

  ion-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: var(--ion-color-medium);
  }
}

form {
  ion-item {
    --background: var(--ion-color-light);
    --border-radius: var(--ion-border-radius);
    margin-bottom: 4px;

    ion-icon[slot="start"] {
      color: var(--ion-color-medium);
    }
  }

  ion-note {
    display: block;
    padding: 4px 16px;
    font-size: 12px;
    margin-bottom: 8px;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;

  ion-item {
    --padding-start: 0;
    --inner-padding-end: 0;
    --background: transparent;
  }

  ion-button {
    --padding-start: 0;
    --padding-end: 0;
  }
}

.submit-button {
  margin-top: 24px;
  --border-radius: var(--ion-border-radius);
  height: 48px;
  font-weight: 600;
}

.social-section {
  margin-top: 32px;

  .divider {
    display: flex;
    align-items: center;
    margin-bottom: 24px;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--ion-color-light-shade);
    }

    span {
      padding: 0 16px;
      color: var(--ion-color-medium);
      font-size: 14px;
    }
  }

  .social-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;

    ion-button {
      --border-radius: 50%;
      width: 48px;
      height: 48px;
    }
  }
}

.register-link {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 32px;

  span {
    color: var(--ion-color-medium);
  }

  ion-button {
    font-weight: 600;
  }
}
```

## Shared Components

### src/app/shared/components/empty-state/empty-state.component.ts
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <ion-icon [name]="icon" [color]="iconColor"></ion-icon>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <ion-button
        *ngIf="actionLabel"
        [fill]="actionFill"
        [color]="actionColor"
        (click)="action.emit()"
      >
        {{ actionLabel }}
      </ion-button>
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;

        ion-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        h2 {
          margin: 0 0 8px;
          font-size: 20px;
          font-weight: 600;
        }

        p {
          margin: 0 0 24px;
          color: var(--ion-color-medium);
          max-width: 280px;
        }
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'file-tray-outline';
  @Input() iconColor = 'medium';
  @Input() title = 'No items';
  @Input() message = 'There are no items to display.';
  @Input() actionLabel?: string;
  @Input() actionFill: 'clear' | 'outline' | 'solid' = 'solid';
  @Input() actionColor = 'primary';

  @Output() action = new EventEmitter<void>();
}
```

### src/app/shared/shared.module.ts
```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { EmptyStateComponent } from './components/empty-state/empty-state.component';

const COMPONENTS = [EmptyStateComponent];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ...COMPONENTS,
  ],
})
export class SharedModule {}
```

## Testing

### src/app/features/home/home.page.spec.ts
```typescript
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { HomePage } from './home.page';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  };

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of(mockUser),
    });
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      declarations: [HomePage],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard items on init', () => {
    expect(component.items.length).toBeGreaterThan(0);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle refresh', async () => {
    const refresher = {
      target: { complete: jasmine.createSpy('complete') },
    } as any;

    await component.handleRefresh(refresher);

    expect(refresher.target.complete).toHaveBeenCalled();
  });

  it('should display user name', () => {
    const compiled = fixture.nativeElement;
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Test User');
  });
});
```

### src/app/core/services/auth.service.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'get',
      'set',
      'getSecure',
      'setSecure',
      'remove',
      'removeSecure',
    ]);
    storageServiceSpy.keys = {
      AUTH_TOKEN: 'auth_token',
      REFRESH_TOKEN: 'refresh_token',
      USER: 'user',
      SETTINGS: 'settings',
      CACHE_PREFIX: 'cache_',
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storageServiceSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      },
    };

    storageServiceSpy.setSecure.and.returnValue(Promise.resolve());
    storageServiceSpy.set.and.returnValue(Promise.resolve());

    service.login('test@example.com', 'password').subscribe((user) => {
      expect(user.email).toBe('test@example.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

## CLAUDE.md Integration

```markdown
# Ionic App

## Commands
- `ionic serve` - Start development server
- `ionic build` - Build for production
- `ionic cap sync` - Sync web assets to native projects
- `ionic cap run ios` - Run on iOS simulator
- `ionic cap run android` - Run on Android emulator
- `npm test` - Run unit tests

## Architecture
- Feature modules with lazy loading
- Core module for singleton services
- Shared module for reusable components
- Guards for route protection
- Interceptors for HTTP handling

## Key Services
- `AuthService` - Authentication state and API
- `StorageService` - Secure storage wrapper (Preferences + Ionic Storage)
- `DatabaseService` - IndexedDB for offline data
- `ApiService` - HTTP client wrapper
- `PushNotificationService` - FCM push notifications

## Native Features
- Camera: @capacitor/camera
- Filesystem: @capacitor/filesystem
- Push Notifications: @capacitor/push-notifications
- Network status: @capacitor/network
- Secure storage: @capacitor/preferences

## Patterns
- Reactive state with RxJS
- Form validation with Reactive Forms
- Component communication via services
- Offline-first with sync queue
```

## AI Suggestions

1. **Add biometric authentication** - Integrate fingerprint/Face ID using @capacitor/biometrics for secure, passwordless login on mobile devices

2. **Implement offline sync** - Create a background sync service using @capacitor/background-task that queues operations when offline and syncs when connectivity returns

3. **Add deep linking** - Configure App Links (Android) and Universal Links (iOS) for seamless navigation from external URLs to specific app screens

4. **Implement app rating prompt** - Use @capacitor/app to prompt users for app store ratings after positive interactions

5. **Add crash reporting** - Integrate Firebase Crashlytics or Sentry for production error monitoring and crash reporting

6. **Implement in-app updates** - Use @capawesome/capacitor-app-update for flexible or immediate update prompts on Android

7. **Add image caching** - Create an image caching service using @capacitor/filesystem to cache remote images locally

8. **Implement app shortcuts** - Add iOS Quick Actions and Android App Shortcuts for common actions from the home screen

9. **Add accessibility features** - Implement VoiceOver/TalkBack support, dynamic font sizing, and high contrast mode

10. **Create widget support** - Build iOS widgets using WidgetKit and Android widgets for glanceable app information
