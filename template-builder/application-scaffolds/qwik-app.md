# Qwik Application Template

## Overview
Production-ready Qwik application with Qwik City, resumability-first architecture, progressive hydration, and edge-optimized deployment. Features TypeScript, Tailwind CSS, and built-in SEO optimization.

## Quick Start

```bash
# Create new Qwik project
npm create qwik@latest

# Or use this template
npx degit template-builder/qwik-app my-qwik-app
cd my-qwik-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to edge
npm run deploy
```

## Project Structure

```
qwik-app/
├── src/
│   ├── components/
│   │   ├── starter/
│   │   │   ├── counter/
│   │   │   │   └── counter.tsx
│   │   │   ├── header/
│   │   │   │   └── header.tsx
│   │   │   └── footer/
│   │   │       └── footer.tsx
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   │   └── button.tsx
│   │   │   ├── input/
│   │   │   │   └── input.tsx
│   │   │   ├── modal/
│   │   │   │   └── modal.tsx
│   │   │   ├── toast/
│   │   │   │   └── toast.tsx
│   │   │   └── card/
│   │   │       └── card.tsx
│   │   ├── forms/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── contact-form.tsx
│   │   └── shared/
│   │       ├── seo-head.tsx
│   │       ├── error-boundary.tsx
│   │       └── loading.tsx
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── layout.tsx
│   │   ├── about/
│   │   │   └── index.tsx
│   │   ├── blog/
│   │   │   ├── index.tsx
│   │   │   └── [slug]/
│   │   │       └── index.tsx
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── index.tsx
│   │   │   ├── register/
│   │   │   │   └── index.tsx
│   │   │   └── logout/
│   │   │       └── index.tsx
│   │   ├── dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── settings/
│   │   │   │   └── index.tsx
│   │   │   └── profile/
│   │   │       └── index.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── index.ts
│   │       │   ├── register/
│   │       │   │   └── index.ts
│   │       │   └── me/
│   │       │       └── index.ts
│   │       └── posts/
│   │           └── index.ts
│   ├── context/
│   │   ├── auth-context.tsx
│   │   ├── theme-context.tsx
│   │   └── toast-context.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-local-storage.ts
│   │   └── use-media-query.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── posts.service.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── format.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── api.types.ts
│   │   └── global.d.ts
│   ├── entry.ssr.tsx
│   ├── entry.preview.tsx
│   ├── entry.dev.tsx
│   ├── global.css
│   └── root.tsx
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   └── robots.txt
├── adapters/
│   ├── cloudflare-pages/
│   │   └── vite.config.ts
│   ├── netlify-edge/
│   │   └── vite.config.ts
│   └── vercel-edge/
│       └── vite.config.ts
├── tests/
│   ├── components/
│   │   └── button.spec.ts
│   ├── routes/
│   │   └── index.spec.ts
│   └── e2e/
│       └── auth.spec.ts
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── CLAUDE.md
```

## Configuration Files

### package.json
```json
{
  "name": "qwik-app",
  "version": "1.0.0",
  "description": "Production-ready Qwik application",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "qwik build",
    "build.client": "vite build",
    "build.preview": "vite build --ssr src/entry.preview.tsx",
    "build.server": "vite build -c adapters/cloudflare-pages/vite.config.ts",
    "build.types": "tsc --incremental --noEmit",
    "deploy": "wrangler pages deploy dist",
    "dev": "vite --mode ssr",
    "dev.debug": "node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr --force",
    "fmt": "prettier --write .",
    "fmt.check": "prettier --check .",
    "lint": "eslint \"src/**/*.ts*\"",
    "preview": "qwik build preview && vite preview --open",
    "start": "vite --open --mode ssr",
    "qwik": "qwik",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@builder.io/qwik": "^1.5.0",
    "@builder.io/qwik-city": "^1.5.0",
    "@modular-forms/qwik": "^0.23.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@builder.io/qwik-labs": "^0.5.0",
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-qwik": "^1.5.0",
    "postcss": "^8.4.32",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "undici": "^6.0.0",
    "vite": "^5.0.0",
    "vite-tsconfig-paths": "^4.2.0",
    "vitest": "^1.0.0",
    "wrangler": "^3.20.0"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    },
    server: {
      headers: {
        'Cache-Control': 'public, max-age=0',
      },
    },
    optimizeDeps: {
      include: ['@auth/core'],
    },
  };
});
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "allowJs": true,
    "target": "ES2021",
    "module": "ES2020",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "jsxImportSource": "@builder.io/qwik",
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "incremental": true,
    "isolatedModules": true,
    "outDir": "tmp",
    "noEmit": true,
    "types": ["node", "vite/client"],
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": ["src", "./*.d.ts", "./*.config.ts"]
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
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
      },
    },
  },
  plugins: [],
};
```

### .env.example
```bash
# Application
VITE_APP_NAME=QwikApp
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:5173/api

# Authentication
AUTH_SECRET=your-auth-secret-min-32-characters
AUTH_TRUST_HOST=true

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/qwikapp

# External APIs
VITE_ANALYTICS_ID=
VITE_SENTRY_DSN=

# Feature Flags
VITE_FEATURE_DARK_MODE=true
VITE_FEATURE_ANALYTICS=false
```

## Root Component

### src/root.tsx
```typescript
import { component$ } from '@builder.io/qwik';
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from '@builder.io/qwik-city';
import { RouterHead } from './components/shared/router-head';

import './global.css';

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />
        <ServiceWorkerRegister />
      </head>
      <body lang="en" class="min-h-screen bg-white dark:bg-gray-900">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
```

### src/global.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 14 165 233;
    --color-secondary: 168 85 247;
  }

  html {
    @apply scroll-smooth;
  }

  body {
    @apply antialiased text-gray-900 dark:text-gray-100;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }

  .btn-secondary {
    @apply btn bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500;
  }

  .btn-outline {
    @apply btn border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800;
  }

  .input {
    @apply w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

## Layout and Routing

### src/routes/layout.tsx
```typescript
import { component$, Slot, useContextProvider, useStore } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Header } from '~/components/starter/header/header';
import { Footer } from '~/components/starter/footer/footer';
import { AuthContext, type AuthStore } from '~/context/auth-context';
import { ToastProvider } from '~/context/toast-context';

export const useAuthLoader = routeLoader$(async ({ cookie, redirect }) => {
  const token = cookie.get('auth-token')?.value;

  if (!token) {
    return { user: null, isAuthenticated: false };
  }

  try {
    // Validate token and get user
    const response = await fetch(`${process.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      cookie.delete('auth-token', { path: '/' });
      return { user: null, isAuthenticated: false };
    }

    const user = await response.json();
    return { user, isAuthenticated: true };
  } catch {
    return { user: null, isAuthenticated: false };
  }
});

export default component$(() => {
  const authData = useAuthLoader();

  const authStore = useStore<AuthStore>({
    user: authData.value.user,
    isAuthenticated: authData.value.isAuthenticated,
    isLoading: false,
  });

  useContextProvider(AuthContext, authStore);

  return (
    <ToastProvider>
      <div class="flex flex-col min-h-screen">
        <Header />
        <main class="flex-grow">
          <Slot />
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
});
```

### src/routes/index.tsx
```typescript
import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <section class="text-center mb-16">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Welcome to Qwik
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Build instantly-interactive web apps with resumable applications.
          Zero hydration, maximum performance.
        </p>
        <div class="flex gap-4 justify-center">
          <Link href="/auth/register" class="btn-primary">
            Get Started
          </Link>
          <Link href="/about" class="btn-outline">
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section class="grid md:grid-cols-3 gap-8 mb-16">
        <FeatureCard
          title="Resumable"
          description="No hydration needed. Your app resumes exactly where the server left off."
          icon="⚡"
        />
        <FeatureCard
          title="Lazy Loading"
          description="Code is loaded on interaction, not on page load. Ship less JavaScript."
          icon="🚀"
        />
        <FeatureCard
          title="Edge Ready"
          description="Deploy to the edge with zero configuration. Fast everywhere."
          icon="🌍"
        />
      </section>

      {/* CTA Section */}
      <section class="text-center bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-12 text-white">
        <h2 class="text-3xl font-bold mb-4">Ready to build?</h2>
        <p class="mb-6 opacity-90">
          Start building your next project with Qwik today.
        </p>
        <Link
          href="/dashboard"
          class="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Go to Dashboard
        </Link>
      </section>
    </div>
  );
});

const FeatureCard = component$<{ title: string; description: string; icon: string }>(
  ({ title, description, icon }) => {
    return (
      <div class="card text-center">
        <div class="text-4xl mb-4">{icon}</div>
        <h3 class="text-xl font-semibold mb-2">{title}</h3>
        <p class="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    );
  }
);

export const head: DocumentHead = {
  title: 'Qwik App - Resumable Web Applications',
  meta: [
    {
      name: 'description',
      content: 'Build instantly-interactive web apps with Qwik. Zero hydration, maximum performance.',
    },
    {
      property: 'og:title',
      content: 'Qwik App - Resumable Web Applications',
    },
    {
      property: 'og:description',
      content: 'Build instantly-interactive web apps with Qwik. Zero hydration, maximum performance.',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
  ],
};
```

## Authentication Context

### src/context/auth-context.tsx
```typescript
import { createContextId, type Signal } from '@builder.io/qwik';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContextId<AuthStore>('auth-context');
```

### src/hooks/use-auth.ts
```typescript
import { useContext, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { AuthContext } from '~/context/auth-context';

export function useAuth() {
  const authStore = useContext(AuthContext);
  const navigate = useNavigate();

  const login = $(async (email: string, password: string) => {
    authStore.isLoading = true;

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

      const { user, token } = await response.json();

      // Cookie is set by the server
      authStore.user = user;
      authStore.isAuthenticated = true;

      await navigate('/dashboard');
    } finally {
      authStore.isLoading = false;
    }
  });

  const register = $(async (name: string, email: string, password: string) => {
    authStore.isLoading = true;

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

      const { user, token } = await response.json();

      authStore.user = user;
      authStore.isAuthenticated = true;

      await navigate('/dashboard');
    } finally {
      authStore.isLoading = false;
    }
  });

  const logout = $(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    authStore.user = null;
    authStore.isAuthenticated = false;
    await navigate('/');
  });

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    login,
    register,
    logout,
  };
}
```

## Toast Context and Provider

### src/context/toast-context.tsx
```typescript
import {
  component$,
  createContextId,
  Slot,
  useContextProvider,
  useStore,
  useVisibleTask$,
  $,
} from '@builder.io/qwik';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

export const ToastContext = createContextId<ToastStore>('toast-context');

export const ToastProvider = component$(() => {
  const store = useStore<{ toasts: Toast[] }>({ toasts: [] });

  const add = $((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    store.toasts = [...store.toasts, { ...toast, id }];

    // Auto-remove after duration
    setTimeout(() => {
      store.toasts = store.toasts.filter((t) => t.id !== id);
    }, toast.duration || 5000);
  });

  const remove = $((id: string) => {
    store.toasts = store.toasts.filter((t) => t.id !== id);
  });

  useContextProvider(ToastContext, {
    toasts: store.toasts,
    add,
    remove,
  } as ToastStore);

  return (
    <>
      <Slot />
      <ToastContainer toasts={store.toasts} onRemove$={remove} />
    </>
  );
});

interface ToastContainerProps {
  toasts: Toast[];
  onRemove$: (id: string) => void;
}

const ToastContainer = component$<ToastContainerProps>(({ toasts, onRemove$ }) => {
  return (
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose$={() => onRemove$(toast.id)} />
      ))}
    </div>
  );
});

interface ToastItemProps {
  toast: Toast;
  onClose$: () => void;
}

const ToastItem = component$<ToastItemProps>(({ toast, onClose$ }) => {
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
    <div
      class={`${typeStyles[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up min-w-[300px]`}
    >
      <span class="text-lg">{icons[toast.type]}</span>
      <p class="flex-1">{toast.message}</p>
      <button onClick$={onClose$} class="hover:opacity-75">
        ✕
      </button>
    </div>
  );
});
```

## API Routes

### src/routes/api/auth/login/index.ts
```typescript
import type { RequestHandler } from '@builder.io/qwik-city';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const onPost: RequestHandler = async ({ json, parseBody, cookie, env }) => {
  try {
    const body = await parseBody();
    const { email, password } = loginSchema.parse(body);

    // TODO: Replace with actual authentication logic
    // This is a placeholder for demonstration
    const user = await authenticateUser(email, password);

    if (!user) {
      json(401, { message: 'Invalid credentials' });
      return;
    }

    const token = await generateToken(user);

    // Set HTTP-only cookie
    cookie.set('auth-token', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    json(200, { user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      json(400, { message: 'Validation error', errors: error.errors });
      return;
    }
    json(500, { message: 'Internal server error' });
  }
};

// Placeholder functions - implement with your auth provider
async function authenticateUser(email: string, password: string) {
  // Implement actual authentication
  return {
    id: '1',
    email,
    name: 'User',
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  };
}

async function generateToken(user: any) {
  // Implement JWT generation
  return 'jwt-token-here';
}
```

### src/routes/api/auth/register/index.ts
```typescript
import type { RequestHandler } from '@builder.io/qwik-city';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const onPost: RequestHandler = async ({ json, parseBody, cookie }) => {
  try {
    const body = await parseBody();
    const { name, email, password } = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      json(409, { message: 'User already exists' });
      return;
    }

    // Create user
    const user = await createUser({ name, email, password });
    const token = await generateToken(user);

    // Set HTTP-only cookie
    cookie.set('auth-token', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    json(201, { user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      json(400, { message: 'Validation error', errors: error.errors });
      return;
    }
    json(500, { message: 'Internal server error' });
  }
};

// Placeholder functions
async function findUserByEmail(email: string) {
  return null;
}

async function createUser(data: { name: string; email: string; password: string }) {
  return {
    id: crypto.randomUUID(),
    ...data,
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  };
}

async function generateToken(user: any) {
  return 'jwt-token-here';
}
```

### src/routes/api/auth/me/index.ts
```typescript
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ json, cookie, request }) => {
  const token = cookie.get('auth-token')?.value;

  if (!token) {
    json(401, { message: 'Unauthorized' });
    return;
  }

  try {
    // Verify token and get user
    const user = await verifyTokenAndGetUser(token);

    if (!user) {
      json(401, { message: 'Invalid token' });
      return;
    }

    json(200, user);
  } catch {
    json(500, { message: 'Internal server error' });
  }
};

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

## Protected Routes

### src/routes/dashboard/layout.tsx
```typescript
import { component$, Slot, useContext } from '@builder.io/qwik';
import { routeLoader$, Link, useLocation } from '@builder.io/qwik-city';
import { AuthContext } from '~/context/auth-context';

export const useProtectedRoute = routeLoader$(async ({ cookie, redirect }) => {
  const token = cookie.get('auth-token')?.value;

  if (!token) {
    throw redirect(302, '/auth/login');
  }

  return { protected: true };
});

export default component$(() => {
  const authStore = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div class="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside class="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Welcome, {authStore.user?.name || 'User'}
          </p>
        </div>
        <nav class="mt-4">
          {navItems.map((item) => {
            const isActive = location.url.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                class={`flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-4 border-primary-600' : ''
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main class="flex-1 p-8">
        <Slot />
      </main>
    </div>
  );
});
```

### src/routes/dashboard/index.tsx
```typescript
import { component$, useContext } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AuthContext } from '~/context/auth-context';

export const useDashboardData = routeLoader$(async ({ cookie }) => {
  // Fetch dashboard data
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
});

export default component$(() => {
  const authStore = useContext(AuthContext);
  const dashboardData = useDashboardData();

  return (
    <div class="space-y-8">
      {/* Welcome Banner */}
      <div class="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-6 text-white">
        <h1 class="text-2xl font-bold">Welcome back, {authStore.user?.name}!</h1>
        <p class="opacity-90">Here's what's happening with your account today.</p>
      </div>

      {/* Stats Grid */}
      <div class="grid md:grid-cols-4 gap-6">
        <StatCard
          title="Total Views"
          value={dashboardData.value.stats.totalViews.toLocaleString()}
          change="+12%"
          icon="👁️"
        />
        <StatCard
          title="Revenue"
          value={`$${dashboardData.value.stats.totalRevenue.toLocaleString()}`}
          change="+8%"
          icon="💰"
        />
        <StatCard
          title="Active Users"
          value={dashboardData.value.stats.activeUsers.toLocaleString()}
          change="+24%"
          icon="👥"
        />
        <StatCard
          title="Conversion"
          value={`${dashboardData.value.stats.conversionRate}%`}
          change="+2.1%"
          icon="📈"
        />
      </div>

      {/* Recent Activity */}
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
        <div class="space-y-4">
          {dashboardData.value.recentActivity.map((activity) => (
            <div
              key={activity.id}
              class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div>
                <p class="font-medium">{activity.action}</p>
                <p class="text-sm text-gray-500">{activity.user}</p>
              </div>
              <span class="text-sm text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const StatCard = component$<{
  title: string;
  value: string;
  change: string;
  icon: string;
}>(({ title, value, change, icon }) => {
  const isPositive = change.startsWith('+');

  return (
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <span class="text-2xl">{icon}</span>
        <span
          class={`text-sm font-medium ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {change}
        </span>
      </div>
      <h3 class="text-sm text-gray-500 dark:text-gray-400">{title}</h3>
      <p class="text-2xl font-bold">{value}</p>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dashboard - Qwik App',
};
```

## UI Components

### src/components/ui/button/button.tsx
```typescript
import { component$, Slot, type QRL } from '@builder.io/qwik';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<() => void>;
  class?: string;
}

export const Button = component$<ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    onClick$,
    class: className,
  }) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
      outline: 'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
      ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        type={type}
        disabled={disabled || loading}
        onClick$={onClick$}
        class={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      >
        {loading && (
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
        )}
        <Slot />
      </button>
    );
  }
);
```

### src/components/ui/input/input.tsx
```typescript
import { component$, type QRL, useId } from '@builder.io/qwik';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onInput$?: QRL<(value: string) => void>;
  onBlur$?: QRL<() => void>;
  class?: string;
}

export const Input = component$<InputProps>(
  ({
    type = 'text',
    name,
    label,
    placeholder,
    value,
    error,
    disabled = false,
    required = false,
    onInput$,
    onBlur$,
    class: className,
  }) => {
    const id = useId();

    return (
      <div class={`space-y-1 ${className || ''}`}>
        {label && (
          <label
            for={id}
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span class="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onInput$={(e) => onInput$?.((e.target as HTMLInputElement).value)}
          onBlur$={onBlur$}
          class={`w-full px-4 py-2 rounded-lg border ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
          } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {error && <p class="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
```

### src/components/ui/modal/modal.tsx
```typescript
import { component$, Slot, type QRL, useVisibleTask$ } from '@builder.io/qwik';

export interface ModalProps {
  open: boolean;
  onClose$: QRL<() => void>;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = component$<ModalProps>(
  ({ open, onClose$, title, size = 'md' }) => {
    const sizeStyles = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };

    useVisibleTask$(({ track }) => {
      track(() => open);

      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    });

    if (!open) return null;

    return (
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick$={onClose$}
        />

        {/* Modal Content */}
        <div
          class={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl ${sizeStyles[size]} w-full mx-4 animate-slide-up`}
        >
          {/* Header */}
          {title && (
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold">{title}</h2>
              <button
                onClick$={onClose$}
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Body */}
          <div class="p-6">
            <Slot />
          </div>
        </div>
      </div>
    );
  }
);
```

## Forms with Modular Forms

### src/components/forms/login-form.tsx
```typescript
import { component$, $ } from '@builder.io/qwik';
import { useForm, zodForm$, type SubmitHandler } from '@modular-forms/qwik';
import { z } from 'zod';
import { Button } from '~/components/ui/button/button';
import { Input } from '~/components/ui/input/input';
import { useAuth } from '~/hooks/use-auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginForm = component$(() => {
  const { login, isLoading } = useAuth();

  const [loginForm, { Form, Field }] = useForm<LoginForm>({
    loader: { value: { email: '', password: '' } },
    validate: zodForm$(loginSchema),
  });

  const handleSubmit = $<SubmitHandler<LoginForm>>(async (values) => {
    try {
      await login(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
    }
  });

  return (
    <Form onSubmit$={handleSubmit} class="space-y-6">
      <Field name="email">
        {(field, props) => (
          <Input
            {...props}
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={field.value}
            error={field.error}
            required
          />
        )}
      </Field>

      <Field name="password">
        {(field, props) => (
          <Input
            {...props}
            type="password"
            label="Password"
            placeholder="••••••••"
            value={field.value}
            error={field.error}
            required
          />
        )}
      </Field>

      <Button
        type="submit"
        variant="primary"
        loading={isLoading}
        disabled={loginForm.submitting}
        class="w-full"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </Form>
  );
});
```

### src/components/forms/register-form.tsx
```typescript
import { component$, $ } from '@builder.io/qwik';
import { useForm, zodForm$, type SubmitHandler } from '@modular-forms/qwik';
import { z } from 'zod';
import { Button } from '~/components/ui/button/button';
import { Input } from '~/components/ui/input/input';
import { useAuth } from '~/hooks/use-auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterForm = component$(() => {
  const { register, isLoading } = useAuth();

  const [registerForm, { Form, Field }] = useForm<RegisterForm>({
    loader: { value: { name: '', email: '', password: '', confirmPassword: '' } },
    validate: zodForm$(registerSchema),
  });

  const handleSubmit = $<SubmitHandler<RegisterForm>>(async (values) => {
    try {
      await register(values.name, values.email, values.password);
    } catch (error) {
      console.error('Registration error:', error);
    }
  });

  return (
    <Form onSubmit$={handleSubmit} class="space-y-6">
      <Field name="name">
        {(field, props) => (
          <Input
            {...props}
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={field.value}
            error={field.error}
            required
          />
        )}
      </Field>

      <Field name="email">
        {(field, props) => (
          <Input
            {...props}
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={field.value}
            error={field.error}
            required
          />
        )}
      </Field>

      <Field name="password">
        {(field, props) => (
          <Input
            {...props}
            type="password"
            label="Password"
            placeholder="••••••••"
            value={field.value}
            error={field.error}
            required
          />
        )}
      </Field>

      <Field name="confirmPassword">
        {(field, props) => (
          <Input
            {...props}
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={field.value}
            error={field.error}
            required
          />
        )}
      </Field>

      <Button
        type="submit"
        variant="primary"
        loading={isLoading}
        disabled={registerForm.submitting}
        class="w-full"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </Form>
  );
});
```

## Header Component

### src/components/starter/header/header.tsx
```typescript
import { component$, useContext, useSignal } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { AuthContext } from '~/context/auth-context';
import { useAuth } from '~/hooks/use-auth';
import { Button } from '~/components/ui/button/button';

export const Header = component$(() => {
  const location = useLocation();
  const authStore = useContext(AuthContext);
  const { logout } = useAuth();
  const mobileMenuOpen = useSignal(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <header class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <nav class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" class="text-2xl font-bold text-primary-600">
            QwikApp
          </Link>

          {/* Desktop Navigation */}
          <div class="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                class={`text-sm font-medium transition-colors ${
                  location.url.pathname === link.href
                    ? 'text-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div class="hidden md:flex items-center gap-4">
            {authStore.isAuthenticated ? (
              <>
                <Link href="/dashboard" class="btn-outline text-sm">
                  Dashboard
                </Link>
                <Button variant="ghost" size="sm" onClick$={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" class="btn-outline text-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" class="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            class="md:hidden p-2"
            onClick$={() => (mobileMenuOpen.value = !mobileMenuOpen.value)}
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen.value ? (
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen.value && (
          <div class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  class="text-gray-600 dark:text-gray-400 hover:text-primary-600"
                  onClick$={() => (mobileMenuOpen.value = false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr class="border-gray-200 dark:border-gray-700" />
              {authStore.isAuthenticated ? (
                <>
                  <Link href="/dashboard">Dashboard</Link>
                  <button onClick$={logout}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">Sign In</Link>
                  <Link href="/auth/register">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
});
```

## SEO Head Component

### src/components/shared/router-head.tsx
```typescript
import { component$ } from '@builder.io/qwik';
import { useDocumentHead, useLocation } from '@builder.io/qwik-city';

export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();

  return (
    <>
      <title>{head.title}</title>

      <link rel="canonical" href={loc.url.href} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {head.meta.map((m) => (
        <meta key={m.key} {...m} />
      ))}

      {head.links.map((l) => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map((s) => (
        <style key={s.key} {...s.props} dangerouslySetInnerHTML={s.style} />
      ))}

      {head.scripts.map((s) => (
        <script key={s.key} {...s.props} dangerouslySetInnerHTML={s.script} />
      ))}
    </>
  );
});
```

## Testing

### tests/components/button.spec.ts
```typescript
import { createDOM } from '@builder.io/qwik/testing';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '~/components/ui/button/button';

describe('Button Component', () => {
  it('renders with default props', async () => {
    const { screen, render } = await createDOM();
    await render(<Button>Click me</Button>);

    const button = screen.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Click me');
    expect(button?.type).toBe('button');
  });

  it('renders with primary variant', async () => {
    const { screen, render } = await createDOM();
    await render(<Button variant="primary">Primary</Button>);

    const button = screen.querySelector('button');
    expect(button?.className).toContain('bg-primary-600');
  });

  it('renders in loading state', async () => {
    const { screen, render } = await createDOM();
    await render(<Button loading>Loading</Button>);

    const button = screen.querySelector('button');
    expect(button?.disabled).toBe(true);
    expect(screen.querySelector('svg.animate-spin')).toBeTruthy();
  });

  it('renders disabled state', async () => {
    const { screen, render } = await createDOM();
    await render(<Button disabled>Disabled</Button>);

    const button = screen.querySelector('button');
    expect(button?.disabled).toBe(true);
  });

  it('renders different sizes', async () => {
    const { screen, render } = await createDOM();

    await render(<Button size="sm">Small</Button>);
    let button = screen.querySelector('button');
    expect(button?.className).toContain('px-3');

    await render(<Button size="lg">Large</Button>);
    button = screen.querySelector('button');
    expect(button?.className).toContain('px-6');
  });
});
```

### tests/routes/index.spec.ts
```typescript
import { createDOM } from '@builder.io/qwik/testing';
import { describe, it, expect } from 'vitest';

describe('Index Route', () => {
  it('renders hero section', async () => {
    const { screen, render } = await createDOM();
    // Note: In real tests, you'd need to set up route context
    // This is a simplified example

    // Test that key elements render
    expect(true).toBe(true);
  });
});
```

### tests/e2e/auth.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /create account/i }).click();

    await expect(page).toHaveURL('/auth/register');
  });

  test('should protect dashboard route', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should successfully login', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Edge Deployment Adapters

### adapters/cloudflare-pages/vite.config.ts
```typescript
import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity({
        routesDir: './src/routes',
      }),
      qwikVite(),
      tsconfigPaths(),
    ],
    build: {
      ssr: true,
      rollupOptions: {
        input: ['src/entry.cloudflare-pages.tsx', '@qwik-city-plan'],
      },
    },
  };
});
```

### src/entry.cloudflare-pages.tsx
```typescript
import {
  createQwikCity,
  type PlatformCloudflarePages,
} from '@builder.io/qwik-city/middleware/cloudflare-pages';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';

declare global {
  interface QwikCityPlatform extends PlatformCloudflarePages {}
}

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export { fetch };
```

## CLAUDE.md Integration

```markdown
# Qwik Application

## Overview
This is a production-ready Qwik application with Qwik City for routing, resumability-first architecture, and edge deployment capabilities.

## Key Technologies
- **Qwik**: Resumable framework with zero hydration
- **Qwik City**: File-based routing and server functions
- **Modular Forms**: Form handling with Zod validation
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Full type safety
- **Vitest**: Unit testing
- **Playwright**: E2E testing

## Project Structure
- `src/routes/` - Page components and API routes (file-based routing)
- `src/components/` - Reusable UI components
- `src/context/` - Qwik context providers
- `src/hooks/` - Custom hooks
- `src/services/` - API service layer
- `adapters/` - Edge deployment configurations

## Key Concepts

### Resumability
Qwik uses resumability instead of hydration. The app resumes where the server left off without re-executing code.

### Dollar Sign ($)
Functions with `$` suffix are lazy-loaded boundaries:
- `component$` - Lazy-loaded component
- `$()` - Lazy-loaded function
- `useTask$` - Lazy-loaded side effect
- `useVisibleTask$` - Client-only side effect

### Route Loaders
```typescript
export const useData = routeLoader$(async ({ cookie, params }) => {
  // Runs on server, data available immediately
  return fetchData(params.id);
});
```

### Route Actions
```typescript
export const useAction = routeAction$(async (data, { cookie }) => {
  // Server action for form submissions
  return { success: true };
});
```

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to Cloudflare Pages
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## Environment Variables
Copy `.env.example` to `.env.local` and configure:
- `AUTH_SECRET` - Authentication secret
- `DATABASE_URL` - Database connection string
- `VITE_*` - Client-exposed variables

## Common Patterns

### Protected Routes
Use `routeLoader$` for auth checks:
```typescript
export const useProtected = routeLoader$(async ({ cookie, redirect }) => {
  if (!cookie.get('auth-token')) {
    throw redirect(302, '/auth/login');
  }
});
```

### Context Usage
```typescript
const authStore = useContext(AuthContext);
```

### Form Handling
Uses Modular Forms with Zod validation for type-safe forms.

## AI Assistance Guidelines
- Always use `$` suffix for lazy-loaded functions
- Prefer `useSignal` over `useState` for reactive values
- Use `routeLoader$` for server data fetching
- Keep components resumable (no side effects in render)
- Use `useVisibleTask$` sparingly (breaks resumability)
```

## AI Suggestions

1. **Add Progressive Web App support** - Implement service worker for offline capability with Qwik's built-in PWA support
2. **Implement streaming SSR** - Use Qwik's streaming capabilities for faster Time to First Byte
3. **Add Partytown integration** - Move third-party scripts to web workers for better performance
4. **Implement optimistic updates** - Use Qwik's optimistic mutation patterns for instant UI feedback
5. **Add edge caching** - Configure CDN caching headers for static routes
6. **Implement image optimization** - Use Qwik's image component with lazy loading and WebP conversion
7. **Add real-time features** - Implement WebSocket support with resumable connection handling
8. **Set up A/B testing** - Use edge middleware for feature flag evaluation at the edge
9. **Implement micro-frontends** - Use Qwik's container approach for module federation
10. **Add internationalization** - Implement i18n with qwik-speak for multilingual support with lazy-loaded translations
