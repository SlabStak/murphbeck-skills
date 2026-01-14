# SolidJS Application Template

## Overview
Production-ready SolidJS application with SolidStart, fine-grained reactivity, and minimal bundle size. Features TypeScript, Tailwind CSS, and server-side rendering with islands architecture.

## Quick Start

```bash
# Create new SolidStart project
npm create solid@latest

# Or use this template
npx degit template-builder/solid-app my-solid-app
cd my-solid-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Project Structure

```
solid-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ContactForm.tsx
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx
│   │       ├── Loading.tsx
│   │       └── SEO.tsx
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── about.tsx
│   │   ├── [...404].tsx
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── logout.tsx
│   │   ├── dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── settings.tsx
│   │   │   └── profile.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login.ts
│   │       │   ├── register.ts
│   │       │   └── me.ts
│   │       └── posts/
│   │           └── index.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   └── toastStore.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── useClickOutside.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   └── global.d.ts
│   ├── styles/
│   │   └── global.css
│   ├── entry-client.tsx
│   ├── entry-server.tsx
│   ├── root.tsx
│   └── app.tsx
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── tests/
│   ├── components/
│   │   └── Button.test.tsx
│   ├── stores/
│   │   └── authStore.test.ts
│   └── e2e/
│       └── auth.spec.ts
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── app.config.ts
└── CLAUDE.md
```

## Configuration Files

### package.json
```json
{
  "name": "solid-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@solidjs/meta": "^0.29.0",
    "@solidjs/router": "^0.13.0",
    "@solidjs/start": "^1.0.0",
    "solid-js": "^1.8.0",
    "vinxi": "^0.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-solid": "^0.13.0",
    "postcss": "^8.4.32",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite-plugin-solid": "^2.8.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### app.config.ts
```typescript
import { defineConfig } from '@solidjs/start/config';

export default defineConfig({
  server: {
    preset: 'node-server', // or 'cloudflare-pages', 'vercel', 'netlify'
  },
  vite: {
    plugins: [],
    build: {
      target: 'esnext',
    },
  },
});
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '~': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    deps: {
      optimizer: {
        web: {
          include: ['solid-js'],
        },
      },
    },
  },
});
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "types": ["vinxi/types/client", "vite/client"],
    "isolatedModules": true,
    "paths": {
      "~/*": ["./src/*"]
    },
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
```

### .env.example
```bash
# Application
VITE_APP_NAME=SolidApp
VITE_APP_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000/api

# Authentication
SESSION_SECRET=your-session-secret-at-least-32-characters

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/solidapp

# External Services
VITE_ANALYTICS_ID=
VITE_SENTRY_DSN=

# Feature Flags
VITE_ENABLE_DARK_MODE=true
```

## Root Component

### src/root.tsx
```tsx
// @refresh reload
import { Suspense } from 'solid-js';
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from 'solid-start';
import { AuthProvider } from '~/context/AuthContext';
import { ThemeProvider } from '~/context/ThemeContext';
import { ToastProvider } from '~/context/ToastContext';
import './styles/global.css';

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidApp</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="description" content="Production-ready SolidJS application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Body class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <FileRoutes />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <Scripts />
      </Body>
    </Html>
  );
}

function Loading() {
  return (
    <div class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );
}
```

### src/styles/global.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 59 130 246;
    --color-secondary: 139 92 246;
  }

  html {
    @apply scroll-smooth antialiased;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800;
  }

  .btn-secondary {
    @apply btn bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 active:bg-secondary-800;
  }

  .btn-outline {
    @apply btn border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400;
  }

  .btn-ghost {
    @apply btn hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400;
  }

  .input {
    @apply w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
  }

  .link {
    @apply text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline-offset-2 hover:underline;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

## Authentication Context

### src/context/AuthContext.tsx
```tsx
import {
  createContext,
  useContext,
  ParentComponent,
  createSignal,
  createEffect,
  onMount,
} from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { createStore } from 'solid-js/store';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider: ParentComponent = (props) => {
  const navigate = useNavigate();
  const [state, setState] = createStore<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check authentication status on mount
  onMount(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        setState({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setState('isLoading', false);
    }
  });

  const login = async (email: string, password: string) => {
    setState('isLoading', true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { user } = await response.json();
      setState({ user, isAuthenticated: true });
      navigate('/dashboard');
    } finally {
      setState('isLoading', false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setState('isLoading', true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const { user } = await response.json();
      setState({ user, isAuthenticated: true });
      navigate('/dashboard');
    } finally {
      setState('isLoading', false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setState({ user: null, isAuthenticated: false });
    navigate('/');
  };

  const updateUser = (updates: Partial<User>) => {
    setState('user', (prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, updateUser }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## Toast Context

### src/context/ToastContext.tsx
```tsx
import {
  createContext,
  useContext,
  ParentComponent,
  For,
  Show,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>();

export const ToastProvider: ParentComponent = (props) => {
  const [toasts, setToasts] = createStore<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(produce((t) => t.push({ ...toast, id })));

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  };

  const success = (message: string) => addToast({ type: 'success', message });
  const error = (message: string) => addToast({ type: 'error', message });
  const warning = (message: string) => addToast({ type: 'warning', message });
  const info = (message: string) => addToast({ type: 'info', message });

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {props.children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

function ToastContainer(props: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <For each={props.toasts}>
        {(toast) => (
          <div
            class={`${typeStyles[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up min-w-[300px]`}
          >
            <span class="text-lg">{icons[toast.type]}</span>
            <p class="flex-1">{toast.message}</p>
            <button
              onClick={() => props.onRemove(toast.id)}
              class="hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
```

## Theme Context

### src/context/ThemeContext.tsx
```tsx
import {
  createContext,
  useContext,
  ParentComponent,
  createSignal,
  createEffect,
  onMount,
} from 'solid-js';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  isDark: () => boolean;
}

const ThemeContext = createContext<ThemeContextValue>();

export const ThemeProvider: ParentComponent = (props) => {
  const [theme, setThemeSignal] = createSignal<Theme>('system');
  const [isDark, setIsDark] = createSignal(false);

  const getSystemTheme = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const updateTheme = (newTheme: Theme) => {
    const effectiveDark =
      newTheme === 'system' ? getSystemTheme() : newTheme === 'dark';

    setIsDark(effectiveDark);

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', effectiveDark);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeSignal(newTheme);
    localStorage.setItem('theme', newTheme);
    updateTheme(newTheme);
  };

  onMount(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const initialTheme = stored || 'system';
    setThemeSignal(initialTheme);
    updateTheme(initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme() === 'system') {
        updateTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

## Stores (Fine-Grained Reactivity)

### src/stores/authStore.ts
```typescript
import { createSignal, createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const [store, setStore] = createStore<AuthStore>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const setUser = (user: User | null) => {
    setStore({ user, isAuthenticated: !!user });
  };

  const setToken = (token: string | null) => {
    setStore('token', token);
    if (token) {
      localStorage.setItem('auth-token', token);
    } else {
      localStorage.removeItem('auth-token');
    }
  };

  const setLoading = (loading: boolean) => {
    setStore('isLoading', loading);
  };

  const reset = () => {
    setStore({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.removeItem('auth-token');
  };

  return {
    store,
    setUser,
    setToken,
    setLoading,
    reset,
  };
}

// Create singleton store
export const authStore = createRoot(createAuthStore);
```

### src/stores/userStore.ts
```typescript
import { createStore, produce } from 'solid-js/store';
import { createRoot } from 'solid-js';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

function createUserStore() {
  const [profile, setProfile] = createStore<UserProfile | null>(null);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const updatePreferences = (prefs: Partial<UserProfile['preferences']>) => {
    setProfile(
      produce((profile) => {
        if (profile) {
          Object.assign(profile.preferences, prefs);
        }
      })
    );
  };

  const reset = () => {
    setProfile(null);
  };

  return {
    profile,
    setProfile,
    updateProfile,
    updatePreferences,
    reset,
  };
}

export const userStore = createRoot(createUserStore);
```

## Routes

### src/routes/index.tsx
```tsx
import { A } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { useAuth } from '~/context/AuthContext';

export default function Home() {
  const { state } = useAuth();

  const features = [
    {
      icon: '⚡',
      title: 'Fine-Grained Reactivity',
      description: 'Updates only what changes. No virtual DOM overhead.',
    },
    {
      icon: '📦',
      title: 'Tiny Bundle Size',
      description: 'Ship less JavaScript. Faster load times.',
    },
    {
      icon: '🚀',
      title: 'Server-Side Rendering',
      description: 'SEO-friendly with streaming SSR support.',
    },
  ];

  return (
    <main class="min-h-screen">
      {/* Hero Section */}
      <section class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Build with SolidJS
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Simple and performant reactivity for building user interfaces.
          Fine-grained updates without the virtual DOM.
        </p>
        <div class="flex gap-4 justify-center">
          <Show
            when={state.isAuthenticated}
            fallback={
              <>
                <A href="/auth/register" class="btn-primary">
                  Get Started
                </A>
                <A href="/about" class="btn-outline">
                  Learn More
                </A>
              </>
            }
          >
            <A href="/dashboard" class="btn-primary">
              Go to Dashboard
            </A>
          </Show>
        </div>
      </section>

      {/* Features Section */}
      <section class="container mx-auto px-4 py-16">
        <h2 class="text-3xl font-bold text-center mb-12">Why SolidJS?</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <For each={features}>
            {(feature) => (
              <div class="card text-center hover:shadow-xl transition-shadow">
                <div class="text-4xl mb-4">{feature.icon}</div>
                <h3 class="text-xl font-semibold mb-2">{feature.title}</h3>
                <p class="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            )}
          </For>
        </div>
      </section>

      {/* CTA Section */}
      <section class="container mx-auto px-4 py-16">
        <div class="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-12 text-center text-white">
          <h2 class="text-3xl font-bold mb-4">Ready to build?</h2>
          <p class="text-lg opacity-90 mb-6">
            Start building your next project with SolidJS today.
          </p>
          <A
            href="/dashboard"
            class="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Now
          </A>
        </div>
      </section>
    </main>
  );
}
```

### src/routes/auth/login.tsx
```tsx
import { A } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { useAuth } from '~/context/AuthContext';
import { useToast } from '~/context/ToastContext';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';

export default function Login() {
  const { state, login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password()) {
      newErrors.password = 'Password is required';
    } else if (password().length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await login(email(), password());
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card max-w-md w-full">
        <h1 class="text-2xl font-bold text-center mb-6">Sign In</h1>

        <form onSubmit={handleSubmit} class="space-y-4">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            value={email()}
            onInput={(v) => setEmail(v)}
            error={errors().email}
            required
          />

          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="••••••••"
            value={password()}
            onInput={(v) => setPassword(v)}
            error={errors().password}
            required
          />

          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2">
              <input type="checkbox" class="rounded" />
              <span>Remember me</span>
            </label>
            <A href="/auth/forgot-password" class="link">
              Forgot password?
            </A>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={state.isLoading}
            class="w-full"
          >
            Sign In
          </Button>
        </form>

        <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <A href="/auth/register" class="link">
            Create one
          </A>
        </p>
      </div>
    </div>
  );
}
```

### src/routes/dashboard/index.tsx
```tsx
import { createResource, For, Show, Suspense } from 'solid-js';
import { useAuth } from '~/context/AuthContext';

async function fetchDashboardData() {
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    stats: {
      totalViews: 12453,
      totalRevenue: 45600,
      activeUsers: 892,
      conversionRate: 3.24,
    },
    recentActivity: [
      { id: 1, action: 'New signup', user: 'john@example.com', time: '5 min ago' },
      { id: 2, action: 'Purchase', user: 'jane@example.com', time: '12 min ago' },
      { id: 3, action: 'Review', user: 'bob@example.com', time: '1 hour ago' },
    ],
  };
}

export default function Dashboard() {
  const { state } = useAuth();
  const [data] = createResource(fetchDashboardData);

  return (
    <div class="space-y-8">
      {/* Welcome Banner */}
      <div class="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-6 text-white">
        <h1 class="text-2xl font-bold">
          Welcome back, {state.user?.name || 'User'}!
        </h1>
        <p class="opacity-90">Here's what's happening with your account today.</p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<StatsLoading />}>
        <Show when={data()}>
          {(dashboardData) => (
            <>
              <div class="grid md:grid-cols-4 gap-6">
                <StatCard
                  title="Total Views"
                  value={dashboardData().stats.totalViews.toLocaleString()}
                  change="+12%"
                  icon="👁️"
                />
                <StatCard
                  title="Revenue"
                  value={`$${dashboardData().stats.totalRevenue.toLocaleString()}`}
                  change="+8%"
                  icon="💰"
                />
                <StatCard
                  title="Active Users"
                  value={dashboardData().stats.activeUsers.toLocaleString()}
                  change="+24%"
                  icon="👥"
                />
                <StatCard
                  title="Conversion"
                  value={`${dashboardData().stats.conversionRate}%`}
                  change="+2.1%"
                  icon="📈"
                />
              </div>

              {/* Recent Activity */}
              <div class="card">
                <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
                <div class="space-y-4">
                  <For each={dashboardData().recentActivity}>
                    {(activity) => (
                      <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <div>
                          <p class="font-medium">{activity.action}</p>
                          <p class="text-sm text-gray-500">{activity.user}</p>
                        </div>
                        <span class="text-sm text-gray-400">{activity.time}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </>
          )}
        </Show>
      </Suspense>
    </div>
  );
}

function StatCard(props: {
  title: string;
  value: string;
  change: string;
  icon: string;
}) {
  const isPositive = props.change.startsWith('+');

  return (
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <span class="text-2xl">{props.icon}</span>
        <span
          class={`text-sm font-medium ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {props.change}
        </span>
      </div>
      <h3 class="text-sm text-gray-500 dark:text-gray-400">{props.title}</h3>
      <p class="text-2xl font-bold">{props.value}</p>
    </div>
  );
}

function StatsLoading() {
  return (
    <div class="grid md:grid-cols-4 gap-6">
      <For each={[1, 2, 3, 4]}>
        {() => (
          <div class="card animate-pulse">
            <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        )}
      </For>
    </div>
  );
}
```

## UI Components

### src/components/ui/Button.tsx
```tsx
import { ParentComponent, Show, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: ParentComponent<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, [
    'variant',
    'size',
    'loading',
    'disabled',
    'children',
    'class',
  ]);

  const variant = () => local.variant || 'primary';
  const size = () => local.size || 'md';

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary:
      'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline:
      'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...others}
      disabled={local.disabled || local.loading}
      class={`${baseStyles} ${variantStyles[variant()]} ${sizeStyles[size()]} ${local.class || ''}`}
    >
      <Show when={local.loading}>
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </Show>
      {local.children}
    </button>
  );
};
```

### src/components/ui/Input.tsx
```tsx
import { Component, splitProps, Show, createUniqueId } from 'solid-js';
import type { JSX } from 'solid-js';

export interface InputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'onInput'> {
  label?: string;
  error?: string;
  onInput?: (value: string) => void;
}

export const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, [
    'label',
    'error',
    'onInput',
    'class',
    'id',
  ]);

  const id = local.id || createUniqueId();

  return (
    <div class={`space-y-1 ${local.class || ''}`}>
      <Show when={local.label}>
        <label
          for={id}
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {local.label}
          <Show when={others.required}>
            <span class="text-red-500 ml-1">*</span>
          </Show>
        </label>
      </Show>
      <input
        {...others}
        id={id}
        onInput={(e) => local.onInput?.(e.currentTarget.value)}
        class={`w-full px-4 py-2 rounded-lg border ${
          local.error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
        } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      <Show when={local.error}>
        <p class="text-sm text-red-500">{local.error}</p>
      </Show>
    </div>
  );
};
```

### src/components/ui/Modal.tsx
```tsx
import {
  ParentComponent,
  Show,
  createEffect,
  onCleanup,
  createSignal,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: ParentComponent<ModalProps> = (props) => {
  const [mounted, setMounted] = createSignal(false);

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  createEffect(() => {
    if (props.open) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  onCleanup(() => {
    document.body.style.overflow = '';
  });

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };

  createEffect(() => {
    if (props.open) {
      document.addEventListener('keydown', handleKeyDown);
      onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
    }
  });

  return (
    <Show when={mounted()}>
      <Portal>
        <div
          class={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
            props.open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            class={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl ${
              sizeStyles[props.size || 'md']
            } w-full mx-4 animate-scale-in`}
          >
            {/* Header */}
            <Show when={props.title}>
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-semibold">{props.title}</h2>
                <button
                  onClick={props.onClose}
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </Show>

            {/* Body */}
            <div class="p-6">{props.children}</div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
```

### src/components/ui/Card.tsx
```tsx
import { ParentComponent, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: ParentComponent<CardProps> = (props) => {
  const [local, others] = splitProps(props, [
    'variant',
    'padding',
    'children',
    'class',
  ]);

  const variant = () => local.variant || 'default';
  const padding = () => local.padding || 'md';

  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 shadow-lg',
    outlined: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-xl',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      {...others}
      class={`rounded-xl ${variantStyles[variant()]} ${paddingStyles[padding()]} ${local.class || ''}`}
    >
      {local.children}
    </div>
  );
};
```

## Layout Components

### src/components/layout/Header.tsx
```tsx
import { A, useLocation } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import { useAuth } from '~/context/AuthContext';
import { useTheme } from '~/context/ThemeContext';
import { Button } from '~/components/ui/Button';

export function Header() {
  const location = useLocation();
  const { state, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <nav class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <A href="/" class="text-2xl font-bold text-primary-600">
            SolidApp
          </A>

          {/* Desktop Navigation */}
          <div class="hidden md:flex items-center gap-8">
            <For each={navLinks}>
              {(link) => (
                <A
                  href={link.href}
                  class={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-primary-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
                  }`}
                >
                  {link.label}
                </A>
              )}
            </For>
          </div>

          {/* Actions */}
          <div class="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark() ? 'light' : 'dark')}
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              <Show when={isDark()} fallback="🌙">
                ☀️
              </Show>
            </button>

            {/* Auth */}
            <Show
              when={state.isAuthenticated}
              fallback={
                <>
                  <A href="/auth/login" class="btn-outline text-sm">
                    Sign In
                  </A>
                  <A href="/auth/register" class="btn-primary text-sm">
                    Get Started
                  </A>
                </>
              }
            >
              <A href="/dashboard" class="btn-outline text-sm">
                Dashboard
              </A>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </Show>
          </div>

          {/* Mobile Menu Button */}
          <button
            class="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <Show
                when={mobileMenuOpen()}
                fallback={
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                }
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </Show>
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <Show when={mobileMenuOpen()}>
          <div class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex flex-col gap-4">
              <For each={navLinks}>
                {(link) => (
                  <A
                    href={link.href}
                    class="text-gray-600 dark:text-gray-400 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </A>
                )}
              </For>
              <hr class="border-gray-200 dark:border-gray-700" />
              <Show
                when={state.isAuthenticated}
                fallback={
                  <>
                    <A href="/auth/login">Sign In</A>
                    <A href="/auth/register">Get Started</A>
                  </>
                }
              >
                <A href="/dashboard">Dashboard</A>
                <button onClick={logout}>Sign Out</button>
              </Show>
            </div>
          </div>
        </Show>
      </nav>
    </header>
  );
}
```

## API Routes

### src/routes/api/auth/login.ts
```typescript
import type { APIEvent } from '@solidjs/start/server';
import { json } from '@solidjs/router';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST({ request }: APIEvent) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // TODO: Replace with actual authentication
    const user = await authenticateUser(email, password);

    if (!user) {
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = await generateToken(user);

    // Set cookie in response
    return json(
      { user, token },
      {
        headers: {
          'Set-Cookie': `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Placeholder - implement with your auth provider
async function authenticateUser(email: string, password: string) {
  return {
    id: '1',
    email,
    name: 'User',
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  };
}

async function generateToken(user: any) {
  return 'jwt-token-here';
}
```

### src/routes/api/auth/me.ts
```typescript
import type { APIEvent } from '@solidjs/start/server';
import { json } from '@solidjs/router';

export async function GET({ request }: APIEvent) {
  const cookies = request.headers.get('cookie') || '';
  const tokenMatch = cookies.match(/auth-token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await verifyTokenAndGetUser(token);

    if (!user) {
      return json({ message: 'Invalid token' }, { status: 401 });
    }

    return json(user);
  } catch {
    return json({ message: 'Internal server error' }, { status: 500 });
  }
}

async function verifyTokenAndGetUser(token: string) {
  // Implement JWT verification
  return {
    id: '1',
    email: 'user@example.com',
    name: 'User',
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  };
}
```

## Custom Hooks

### src/hooks/useLocalStorage.ts
```typescript
import { createSignal, createEffect, onMount } from 'solid-js';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = createSignal<T>(initialValue);
  const [isLoaded, setIsLoaded] = createSignal(false);

  onMount(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  });

  createEffect(() => {
    if (isLoaded()) {
      try {
        localStorage.setItem(key, JSON.stringify(value()));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  });

  return [value, setValue] as const;
}
```

### src/hooks/useMediaQuery.ts
```typescript
import { createSignal, onMount, onCleanup } from 'solid-js';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = createSignal(false);

  onMount(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    onCleanup(() => mediaQuery.removeEventListener('change', handler));
  });

  return matches;
}

// Preset hooks
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');
export const useIsDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
export const useReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');
```

### src/hooks/useClickOutside.ts
```typescript
import { onMount, onCleanup, Accessor } from 'solid-js';

export function useClickOutside(
  ref: Accessor<HTMLElement | undefined>,
  callback: () => void
) {
  const handleClick = (e: MouseEvent) => {
    const element = ref();
    if (element && !element.contains(e.target as Node)) {
      callback();
    }
  };

  onMount(() => {
    document.addEventListener('mousedown', handleClick);
    onCleanup(() => document.removeEventListener('mousedown', handleClick));
  });
}
```

## Testing

### tests/setup.ts
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### tests/components/Button.test.tsx
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { Button } from '~/components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(() => <Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant styles', () => {
    render(() => <Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-600');
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(() => <Button onClick={onClick}>Click</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(() => <Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('respects disabled state', () => {
    render(() => <Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### tests/e2e/auth.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('should navigate to register', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /create one/i }).click();

    await expect(page).toHaveURL('/auth/register');
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');
  });
});
```

## CLAUDE.md Integration

```markdown
# SolidJS Application

## Overview
This is a production-ready SolidJS application using SolidStart for routing, SSR, and API routes. Features fine-grained reactivity for optimal performance.

## Key Technologies
- **SolidJS**: Fine-grained reactive UI library
- **SolidStart**: Full-stack meta-framework
- **Vinxi**: Build tool and dev server
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Zod**: Schema validation
- **Vitest**: Unit testing
- **Playwright**: E2E testing

## Project Structure
- `src/routes/` - File-based routing (pages and API)
- `src/components/` - Reusable UI components
- `src/context/` - Context providers
- `src/stores/` - Global state stores
- `src/hooks/` - Custom hooks
- `src/lib/` - Utilities and helpers

## Key Concepts

### Fine-Grained Reactivity
SolidJS tracks dependencies at the signal level:
```tsx
const [count, setCount] = createSignal(0);
// Only this specific DOM node updates:
<span>{count()}</span>
```

### Signals vs Stores
- `createSignal` - For primitive values
- `createStore` - For objects/arrays with fine-grained updates

### Control Flow Components
- `<Show>` - Conditional rendering
- `<For>` - List rendering (keyed by reference)
- `<Switch>`/`<Match>` - Pattern matching
- `<Index>` - List by index (for primitives)

### Resources
```tsx
const [data] = createResource(fetchData);
// data() - the value
// data.loading - loading state
// data.error - error state
```

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## Environment Variables
- Server-only: Regular env vars
- Client-exposed: Must prefix with `VITE_`

## Common Patterns

### Context + Store
```tsx
const AuthContext = createContext();
const [store, setStore] = createStore({ user: null });
// ...
<AuthContext.Provider value={{ store, setStore }}>
```

### Derived Values
Use functions instead of computed:
```tsx
const doubled = () => count() * 2;
```

### Effects
```tsx
createEffect(() => {
  // Runs when dependencies change
  console.log(count());
});
```

## AI Assistance Guidelines
- Always call signals as functions: `count()` not `count`
- Use `<Show>` for conditional rendering, not `&&`
- Use `<For>` for lists, not `.map()`
- Keep components pure - side effects in effects
- Prefer stores over nested signals for complex state
```

## AI Suggestions

1. **Add islands architecture** - Use `clientOnly` and `serverOnly` for optimal hydration strategies
2. **Implement streaming SSR** - Use Solid's streaming capabilities for faster TTFB
3. **Add optimistic updates** - Implement optimistic mutations for instant UI feedback
4. **Set up service worker** - Add offline support with workbox integration
5. **Implement error boundaries** - Add granular error handling with recovery options
6. **Add analytics integration** - Track user interactions with minimal bundle impact
7. **Implement virtual scrolling** - Use solid-virtual for large list performance
8. **Add internationalization** - Use solid-primitives/i18n for multilingual support
9. **Set up E2E testing** - Configure Playwright with component testing
10. **Implement micro-frontends** - Use module federation for scalable architecture
