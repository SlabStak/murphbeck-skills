# SvelteKit Application Template

## Overview
Full-stack SvelteKit application with TypeScript, form handling, authentication, database integration with Prisma, server-side rendering, API routes, and comprehensive testing setup.

## Quick Start
```bash
# Create new project
npm create svelte@latest my-app
# Select: Skeleton project, TypeScript, ESLint, Prettier, Playwright, Vitest

# Install dependencies
cd my-app
npm install
npm install -D prisma @prisma/client
npm install lucia @lucia-auth/adapter-prisma
npm install zod superforms sveltekit-superforms
npm install tailwindcss postcss autoprefixer
npm install -D @tailwindcss/forms @tailwindcss/typography
npm install bits-ui clsx tailwind-merge tailwind-variants
npm install lucide-svelte

# Initialize Prisma
npx prisma init

# Initialize Tailwind
npx tailwindcss init -p

# Development
npm run dev

# Build
npm run build
npm run preview
```

## Project Structure
```
my-app/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.d.ts
│   ├── app.html
│   ├── app.css
│   ├── hooks.server.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Toast.svelte
│   │   │   │   └── index.ts
│   │   │   ├── forms/
│   │   │   │   ├── LoginForm.svelte
│   │   │   │   ├── RegisterForm.svelte
│   │   │   │   └── ProfileForm.svelte
│   │   │   └── layout/
│   │   │       ├── Header.svelte
│   │   │       ├── Footer.svelte
│   │   │       ├── Sidebar.svelte
│   │   │       └── Navigation.svelte
│   │   ├── server/
│   │   │   ├── db.ts
│   │   │   ├── auth.ts
│   │   │   └── email.ts
│   │   ├── stores/
│   │   │   ├── theme.ts
│   │   │   ├── toast.ts
│   │   │   └── ui.ts
│   │   ├── utils/
│   │   │   ├── helpers.ts
│   │   │   └── validators.ts
│   │   └── types/
│   │       └── index.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.server.ts
│   │   ├── +page.svelte
│   │   ├── +error.svelte
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── register/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── logout/
│   │   │       └── +page.server.ts
│   │   ├── (app)/
│   │   │   ├── +layout.svelte
│   │   │   ├── +layout.server.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── settings/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── profile/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   └── api/
│   │       ├── health/
│   │       │   └── +server.ts
│   │       └── users/
│   │           ├── +server.ts
│   │           └── [id]/
│   │               └── +server.ts
│   └── params/
│       └── id.ts
├── static/
│   ├── favicon.png
│   └── robots.txt
├── tests/
│   ├── unit/
│   │   └── example.test.ts
│   └── e2e/
│       └── auth.test.ts
├── svelte.config.js
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## SvelteKit Configuration
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $components: 'src/lib/components',
      $stores: 'src/lib/stores',
      $server: 'src/lib/server',
      $utils: 'src/lib/utils',
    },
    csrf: {
      checkOrigin: true,
    },
  },
};

export default config;

// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
  },
  server: {
    port: 3000,
  },
});
```

## Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  avatar        String?
  passwordHash  String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  keys          Key[]
  posts         Post[]
  comments      Comment[]

  @@index([email])
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  user      User     @relation(references: [id], fields: [userId], onDelete: Cascade)

  @@index([userId])
}

model Key {
  id              String  @id
  hashedPassword  String?
  userId          String
  user            User    @relation(references: [id], fields: [userId], onDelete: Cascade)

  @@index([userId])
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String
  excerpt     String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  authorId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments    Comment[]
  categories  Category[]

  @@index([slug])
  @@index([authorId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([authorId])
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

## Database Client
```typescript
// src/lib/server/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: import.meta.env.DEV ? ['query', 'error', 'warn'] : ['error'],
});

if (import.meta.env.DEV) globalForPrisma.prisma = db;
```

## Authentication with Lucia
```typescript
// src/lib/server/auth.ts
import { Lucia } from 'lucia';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { dev } from '$app/environment';
import { db } from './db';
import type { Role } from '@prisma/client';

const adapter = new PrismaAdapter(db.session, db.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev,
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    name: attributes.name,
    avatar: attributes.avatar,
    role: attributes.role,
    emailVerified: attributes.emailVerified,
  }),
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string | null;
      avatar: string | null;
      role: Role;
      emailVerified: Date | null;
    };
  }
}

// Password hashing
import { hash, verify } from '@node-rs/argon2';

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await verify(hash, password);
}

// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);

  if (!sessionId) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    });
  }

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    });
  }

  event.locals.user = user;
  event.locals.session = session;

  return resolve(event);
};

// src/app.d.ts
import type { Session, User } from 'lucia';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    interface PageData {
      user: User | null;
    }
  }
}

export {};
```

## Form Handling with Superforms
```typescript
// src/lib/utils/validators.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const postSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  excerpt: z.string().max(300).optional(),
  published: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PostInput = z.infer<typeof postSchema>;
```

## Login Page
```svelte
<!-- src/routes/(auth)/login/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Button, Input } from '$components/ui';
  import { loginSchema } from '$lib/utils/validators';

  export let data;

  const { form, errors, enhance, submitting, message } = superForm(data.form, {
    validators: loginSchema,
    taintedMessage: null,
  });
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold">Welcome back</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Sign in to your account
      </p>
    </div>

    {#if $message}
      <div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        {$message}
      </div>
    {/if}

    <form method="POST" use:enhance class="space-y-6">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        bind:value={$form.email}
        error={$errors.email?.[0]}
      />

      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="********"
        bind:value={$form.password}
        error={$errors.password?.[0]}
      />

      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            bind:checked={$form.remember}
            class="rounded border-gray-300"
          />
          <span class="text-sm">Remember me</span>
        </label>

        <a href="/forgot-password" class="text-sm text-primary-600 hover:underline">
          Forgot password?
        </a>
      </div>

      <Button type="submit" class="w-full" loading={$submitting}>
        Sign in
      </Button>
    </form>

    <p class="text-center text-sm text-gray-600 dark:text-gray-400">
      Don't have an account?
      <a href="/register" class="text-primary-600 hover:underline">Sign up</a>
    </p>
  </div>
</div>
```

```typescript
// src/routes/(auth)/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/utils/validators';
import { lucia, verifyPassword } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/dashboard');
  }

  return {
    form: await superValidate(zod(loginSchema)),
  };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await superValidate(request, zod(loginSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const { email, password, remember } = form.data;

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return message(form, 'Invalid email or password', { status: 400 });
    }

    // Verify password
    const validPassword = await verifyPassword(user.passwordHash, password);
    if (!validPassword) {
      return message(form, 'Invalid email or password', { status: 400 });
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
      maxAge: remember ? 60 * 60 * 24 * 30 : undefined, // 30 days if remember
    });

    throw redirect(302, '/dashboard');
  },
};
```

## UI Components
```svelte
<!-- src/lib/components/ui/Button.svelte -->
<script lang="ts">
  import { tv, type VariantProps } from 'tailwind-variants';
  import { cn } from '$lib/utils/helpers';
  import Spinner from './Spinner.svelte';

  const button = tv({
    base: 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 hover:bg-gray-100 focus:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  });

  type ButtonVariants = VariantProps<typeof button>;

  export let variant: ButtonVariants['variant'] = 'primary';
  export let size: ButtonVariants['size'] = 'md';
  export let loading = false;
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  let className = '';
  export { className as class };
</script>

<button
  {type}
  disabled={disabled || loading}
  class={cn(button({ variant, size }), className)}
  on:click
  {...$$restProps}
>
  {#if loading}
    <Spinner size="sm" class="mr-2" />
  {/if}
  <slot />
</button>

<!-- src/lib/components/ui/Input.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils/helpers';

  export let name: string;
  export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
  export let label = '';
  export let placeholder = '';
  export let value = '';
  export let error = '';
  export let disabled = false;
  export let required = false;
  let className = '';
  export { className as class };

  const inputId = `input-${name}`;
</script>

<div class={cn('w-full', className)}>
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  <input
    id={inputId}
    {name}
    {type}
    {placeholder}
    {disabled}
    {required}
    bind:value
    class={cn(
      'w-full h-10 px-4 rounded-lg border transition-colors',
      'bg-white dark:bg-gray-800',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600'
    )}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? `${inputId}-error` : undefined}
    {...$$restProps}
  />

  {#if error}
    <p id="{inputId}-error" class="mt-1 text-sm text-red-500">{error}</p>
  {/if}
</div>

<!-- src/lib/components/ui/Modal.svelte -->
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { X } from 'lucide-svelte';
  import { cn } from '$lib/utils/helpers';
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let title = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{ close: void }>();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  function close() {
    open = false;
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm"
      transition:fade={{ duration: 200 }}
      on:click={close}
      on:keypress={(e) => e.key === 'Enter' && close()}
      role="button"
      tabindex="0"
    />

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class={cn(
          'relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6',
          sizeClasses[size],
          className
        )}
        transition:scale={{ duration: 200, start: 0.95 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {#if title}
          <div class="flex items-center justify-between mb-4">
            <h2 id="modal-title" class="text-lg font-semibold">{title}</h2>
            <button
              on:click={close}
              class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        {/if}

        <slot />
      </div>
    </div>
  </div>
{/if}
```

## Stores
```typescript
// src/lib/stores/theme.ts
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
  const defaultTheme: Theme = browser
    ? (localStorage.getItem('theme') as Theme) || 'system'
    : 'system';

  const { subscribe, set } = writable<Theme>(defaultTheme);

  function updateTheme(theme: Theme) {
    if (!browser) return;

    const root = document.documentElement;
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
    set(theme);
  }

  // Initialize on load
  if (browser) {
    updateTheme(defaultTheme);

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const current = localStorage.getItem('theme') as Theme;
      if (current === 'system') updateTheme('system');
    });
  }

  return {
    subscribe,
    set: updateTheme,
    toggle: () => {
      const current = localStorage.getItem('theme') as Theme;
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      updateTheme(next);
    },
  };
}

export const theme = createThemeStore();

// src/lib/stores/toast.ts
import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };

    update((toasts) => [...toasts, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => remove(id), toast.duration || 5000);
    }

    return id;
  }

  function remove(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    success: (message: string, duration?: number) => add({ type: 'success', message, duration }),
    error: (message: string, duration?: number) => add({ type: 'error', message, duration }),
    warning: (message: string, duration?: number) => add({ type: 'warning', message, duration }),
    info: (message: string, duration?: number) => add({ type: 'info', message, duration }),
    remove,
    clear: () => update(() => []),
  };
}

export const toast = createToastStore();
```

## Protected Layout
```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import Header from '$components/layout/Header.svelte';
  import Sidebar from '$components/layout/Sidebar.svelte';
  import { page } from '$app/stores';

  export let data;

  let sidebarOpen = false;
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <Header user={data.user} on:toggle={() => sidebarOpen = !sidebarOpen} />

  <div class="flex">
    <Sidebar open={sidebarOpen} on:close={() => sidebarOpen = false} />

    <main class="flex-1 p-6 md:ml-64">
      <slot />
    </main>
  </div>
</div>
```

```typescript
// src/routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, `/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  return {
    user: locals.user,
  };
};
```

## API Routes
```typescript
// src/routes/api/users/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.user.count({ where }),
  ]);

  return json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await request.json();

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role || 'USER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return json(user, { status: 201 });
};

// src/routes/api/users/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
      _count: {
        select: { posts: true, comments: true },
      },
    },
  });

  if (!user) {
    throw error(404, 'User not found');
  }

  return json(user);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  // Only allow users to update their own profile (or admins)
  if (locals.user.id !== params.id && locals.user.role !== 'ADMIN') {
    throw error(403, 'Forbidden');
  }

  const data = await request.json();

  const user = await db.user.update({
    where: { id: params.id },
    data: {
      name: data.name,
      avatar: data.avatar,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
    },
  });

  return json(user);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    throw error(403, 'Forbidden');
  }

  await db.user.delete({
    where: { id: params.id },
  });

  return new Response(null, { status: 204 });
};
```

## Utilities
```typescript
// src/lib/utils/helpers.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    ...options,
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

## Testing
```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn, slugify, truncate } from '$lib/utils/helpers';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('This is a Test!')).toBe('this-is-a-test');
  });
});

describe('truncate', () => {
  it('truncates long text', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('returns full text if short enough', () => {
    expect(truncate('Hi', 5)).toBe('Hi');
  });
});

// tests/e2e/auth.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('displays login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows validation errors', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('redirects authenticated users to dashboard', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

## CLAUDE.md Integration
```markdown
# SvelteKit Application

## Project Type
Full-stack SvelteKit application with TypeScript, Prisma, and Lucia Auth.

## Key Directories
- `src/lib/components/` - Svelte components (ui, forms, layout)
- `src/lib/server/` - Server-only code (db, auth)
- `src/lib/stores/` - Svelte stores for state
- `src/routes/` - File-based routing
- `prisma/` - Database schema and migrations

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run Playwright tests
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate dev` - Run migrations

## Routing Patterns
- `(auth)` - Public auth routes (login, register)
- `(app)` - Protected routes requiring authentication
- `api/` - API endpoints

## Form Handling
- Use sveltekit-superforms for form validation
- Define schemas in `src/lib/utils/validators.ts`
- Server actions handle form submissions

## Authentication
- Lucia handles sessions
- Protected routes check `locals.user` in `+layout.server.ts`
- Session cookie is HttpOnly and Secure
```

## AI Suggestions

1. **OAuth providers** - Add GitHub, Google, Discord login with Lucia OAuth adapters
2. **Email verification** - Implement email verification flow with magic links
3. **Rate limiting** - Add rate limiting middleware for API routes and auth endpoints
4. **File uploads** - Integrate with S3 or Cloudflare R2 for file uploads with presigned URLs
5. **Real-time updates** - Add WebSocket support using SvelteKit's built-in SSE or Socket.IO
6. **Search functionality** - Implement full-text search with PostgreSQL or Meilisearch
7. **Admin dashboard** - Create admin panel for user management and content moderation
8. **Audit logging** - Track user actions and system events for compliance
9. **API documentation** - Generate OpenAPI spec from route handlers with type inference
10. **Progressive enhancement** - Ensure all forms work without JavaScript for accessibility
