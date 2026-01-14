# Vue.js Application Template

## Overview
Modern Vue 3 application with TypeScript, Composition API, Pinia for state management, Vue Router, form validation with VeeValidate, and comprehensive testing setup with Vitest and Cypress.

## Quick Start
```bash
# Create new project
npm create vue@latest my-vue-app
# Select: TypeScript, Vue Router, Pinia, Vitest, Cypress, ESLint, Prettier

# Install additional dependencies
cd my-vue-app
npm install
npm install @vueuse/core vee-validate @vee-validate/zod zod
npm install axios dayjs
npm install -D tailwindcss postcss autoprefixer
npm install -D @tailwindcss/forms @tailwindcss/typography

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
my-vue-app/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── env.d.ts
├── public/
│   └── favicon.ico
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── users.ts
│   ├── assets/
│   │   └── main.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseInput.vue
│   │   │   ├── BaseModal.vue
│   │   │   ├── BaseCard.vue
│   │   │   ├── BaseSpinner.vue
│   │   │   └── index.ts
│   │   ├── forms/
│   │   │   ├── LoginForm.vue
│   │   │   ├── RegisterForm.vue
│   │   │   └── ProfileForm.vue
│   │   └── layout/
│   │       ├── AppHeader.vue
│   │       ├── AppSidebar.vue
│   │       ├── AppFooter.vue
│   │       └── AppLayout.vue
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useToast.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   ├── router/
│   │   ├── index.ts
│   │   └── guards.ts
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── ui.ts
│   │   └── theme.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── validators.ts
│   └── views/
│       ├── HomeView.vue
│       ├── LoginView.vue
│       ├── RegisterView.vue
│       ├── DashboardView.vue
│       ├── ProfileView.vue
│       ├── SettingsView.vue
│       └── NotFoundView.vue
├── cypress/
│   ├── e2e/
│   │   └── auth.cy.ts
│   └── support/
│       └── commands.ts
└── package.json
```

## Vite Configuration
```typescript
// vite.config.ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
          },
        },
      },
    },
  };
});
```

## API Client
```typescript
// src/api/client.ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (authStore.refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: authStore.refreshToken,
          });
          authStore.setTokens(data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          authStore.logout();
          router.push('/login');
        }
      } else {
        authStore.logout();
        router.push('/login');
      }
    }

    return Promise.reject(error);
  }
);

// src/api/auth.ts
import { apiClient } from './client';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch('/auth/profile', userData);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
```

## Pinia Stores
```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types/auth';
import { authApi } from '@/api/auth';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));
  const isLoading = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role);

  // Actions
  function setTokens(accessToken: string, refresh: string) {
    token.value = accessToken;
    refreshToken.value = refresh;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refresh);
  }

  function clearTokens() {
    token.value = null;
    refreshToken.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  async function login(email: string, password: string) {
    isLoading.value = true;
    try {
      const response = await authApi.login({ email, password });
      setTokens(response.accessToken, response.refreshToken);
      user.value = response.user;
      return response;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(name: string, email: string, password: string) {
    isLoading.value = true;
    try {
      const response = await authApi.register({ name, email, password });
      setTokens(response.accessToken, response.refreshToken);
      user.value = response.user;
      return response;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors
    } finally {
      user.value = null;
      clearTokens();
      router.push('/login');
    }
  }

  async function fetchUser() {
    if (!token.value) return;

    isLoading.value = true;
    try {
      user.value = await authApi.me();
    } catch {
      logout();
    } finally {
      isLoading.value = false;
    }
  }

  async function initialize() {
    if (token.value) {
      await fetchUser();
    }
  }

  return {
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated,
    userRole,
    setTokens,
    login,
    register,
    logout,
    fetchUser,
    initialize,
  };
});

// src/stores/ui.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export const useUIStore = defineStore('ui', () => {
  const isSidebarOpen = ref(false);
  const isModalOpen = ref(false);
  const toasts = ref<Toast[]>([]);

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value;
  }

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    toasts.value.push({ ...toast, id });

    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 5000);
    }
    return id;
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    isSidebarOpen,
    isModalOpen,
    toasts,
    toggleSidebar,
    addToast,
    removeToast,
  };
});

// src/stores/theme.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

type Theme = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(
    (localStorage.getItem('theme') as Theme) || 'system'
  );

  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme();
  }

  function applyTheme() {
    const root = document.documentElement;
    const isDark =
      theme.value === 'dark' ||
      (theme.value === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
  }

  // Watch for system theme changes
  if (typeof window !== 'undefined') {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (theme.value === 'system') applyTheme();
      });
  }

  // Initialize
  applyTheme();

  return { theme, setTheme };
});
```

## Vue Router
```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth state on first load
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser();
  }

  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.guest && isAuthenticated) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
```

## UI Components
```vue
<!-- src/components/ui/BaseButton.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import BaseSpinner from './BaseSpinner.vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
});

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border-2 border-gray-300 hover:bg-gray-100 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };

  return `${base} ${variants[props.variant]} ${sizes[props.size]}`;
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
  >
    <BaseSpinner v-if="loading" size="sm" class="mr-2" />
    <slot />
  </button>
</template>

<!-- src/components/ui/BaseInput.vue -->
<script setup lang="ts">
import { computed, useAttrs } from 'vue';

interface Props {
  modelValue?: string | number;
  label?: string;
  error?: string;
  type?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const attrs = useAttrs();

const inputClasses = computed(() => {
  const base =
    'w-full h-10 px-4 rounded-lg border transition-colors bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

  return props.error
    ? `${base} border-red-500 focus:ring-red-500`
    : `${base} border-gray-300 dark:border-gray-600 focus:ring-blue-500`;
});
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
    </label>
    <input
      :type="type"
      :value="modelValue"
      :class="inputClasses"
      v-bind="attrs"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-1 text-sm text-red-500">{{ error }}</p>
  </div>
</template>

<!-- src/components/ui/BaseModal.vue -->
<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

interface Props {
  modelValue: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

function close() {
  emit('update:modelValue', false);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

watch(
  () => props.modelValue,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }
);

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="close"
        />
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            :class="[
              'relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6',
              sizeClasses[size],
            ]"
          >
            <div v-if="title" class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">{{ title }}</h2>
              <button
                @click="close"
                class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
```

## Composables
```typescript
// src/composables/useAuth.ts
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

export function useAuth() {
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();
  const uiStore = useUIStore();

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);
  const isLoading = computed(() => authStore.isLoading);

  async function login(email: string, password: string) {
    try {
      await authStore.login(email, password);
      uiStore.addToast({ type: 'success', message: 'Welcome back!' });

      const redirect = route.query.redirect as string;
      router.push(redirect || '/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials';
      uiStore.addToast({ type: 'error', message });
      throw error;
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      await authStore.register(name, email, password);
      uiStore.addToast({ type: 'success', message: 'Account created successfully!' });
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      uiStore.addToast({ type: 'error', message });
      throw error;
    }
  }

  async function logout() {
    await authStore.logout();
    uiStore.addToast({ type: 'success', message: 'Logged out successfully' });
  }

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    register,
    logout,
  };
}

// src/composables/useApi.ts
import { ref, type Ref } from 'vue';

interface UseApiOptions<T> {
  immediate?: boolean;
  initialData?: T;
}

export function useApi<T, P extends unknown[] = []>(
  fn: (...args: P) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const data = ref<T | undefined>(options.initialData) as Ref<T | undefined>;
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  async function execute(...args: P): Promise<T> {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await fn(...args);
      data.value = result;
      return result;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  if (options.immediate) {
    execute(...([] as unknown as P));
  }

  return {
    data,
    error,
    isLoading,
    execute,
  };
}

// src/composables/useDebounce.ts
import { ref, watch, type Ref } from 'vue';

export function useDebounce<T>(value: Ref<T>, delay = 500): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>;

  let timeout: ReturnType<typeof setTimeout>;

  watch(value, (newValue) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}

// src/composables/useLocalStorage.ts
import { ref, watch, type Ref } from 'vue';

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const stored = localStorage.getItem(key);
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue) as Ref<T>;

  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    { deep: true }
  );

  return data;
}
```

## Form Validation with VeeValidate
```vue
<!-- src/components/forms/LoginForm.vue -->
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useAuth } from '@/composables/useAuth';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';

const { login, isLoading } = useAuth();

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
);

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: schema,
});

const [email, emailAttrs] = defineField('email');
const [password, passwordAttrs] = defineField('password');

const onSubmit = handleSubmit(async (values) => {
  await login(values.email, values.password);
});
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <BaseInput
      v-model="email"
      v-bind="emailAttrs"
      type="email"
      label="Email"
      placeholder="you@example.com"
      :error="errors.email"
    />

    <BaseInput
      v-model="password"
      v-bind="passwordAttrs"
      type="password"
      label="Password"
      placeholder="••••••••"
      :error="errors.password"
    />

    <div class="flex items-center justify-between">
      <label class="flex items-center gap-2">
        <input type="checkbox" class="rounded border-gray-300" />
        <span class="text-sm">Remember me</span>
      </label>
      <RouterLink to="/forgot-password" class="text-sm text-blue-600 hover:underline">
        Forgot password?
      </RouterLink>
    </div>

    <BaseButton type="submit" class="w-full" :loading="isLoading">
      Sign in
    </BaseButton>
  </form>
</template>
```

## Views
```vue
<!-- src/views/LoginView.vue -->
<script setup lang="ts">
import LoginForm from '@/components/forms/LoginForm.vue';
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your account
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <LoginForm />
      </div>

      <p class="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?
        <RouterLink to="/register" class="text-blue-600 hover:underline">
          Sign up
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<!-- src/views/DashboardView.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseCard from '@/components/ui/BaseCard.vue';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const stats = [
  { label: 'Total Projects', value: '12' },
  { label: 'Active Tasks', value: '24' },
  { label: 'Completed', value: '89' },
  { label: 'Team Members', value: '6' },
];
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {{ user?.name }}!
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Here's what's happening with your projects.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BaseCard v-for="stat in stats" :key="stat.label" class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
        </BaseCard>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BaseCard class="p-6">
          <h2 class="text-lg font-semibold mb-4">Recent Activity</h2>
          <div class="space-y-4">
            <p class="text-gray-500">No recent activity</p>
          </div>
        </BaseCard>

        <BaseCard class="p-6">
          <h2 class="text-lg font-semibold mb-4">Upcoming Tasks</h2>
          <div class="space-y-4">
            <p class="text-gray-500">No upcoming tasks</p>
          </div>
        </BaseCard>
      </div>
    </div>
  </AppLayout>
</template>
```

## App Entry
```typescript
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize auth before mounting
const authStore = useAuthStore();
authStore.initialize().then(() => {
  app.mount('#app');
});
```

## Testing
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('displays login form', () => {
    cy.contains('Welcome back');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('shows validation errors', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email address');
  });

  it('logs in successfully', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh',
      },
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
  });

  it('redirects authenticated users', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'test-token');
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: { id: '1', name: 'Test User', email: 'test@example.com' },
    });

    cy.visit('/login');
    cy.url().should('include', '/dashboard');
  });
});

// src/components/__tests__/BaseButton.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '../ui/BaseButton.vue';

describe('BaseButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click me' },
    });
    expect(wrapper.text()).toContain('Click me');
  });

  it('applies variant classes', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'danger' },
    });
    expect(wrapper.classes()).toContain('bg-red-600');
  });

  it('shows loading state', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
    });
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('emits click event', async () => {
    const wrapper = mount(BaseButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

## CLAUDE.md Integration
```markdown
# Vue.js Application

## Project Type
Vue 3 SPA with TypeScript, Pinia, Vue Router, and VeeValidate.

## Key Directories
- `src/components/` - Vue components (ui, forms, layout)
- `src/composables/` - Reusable composition functions
- `src/stores/` - Pinia stores
- `src/views/` - Route view components
- `src/api/` - API client and services

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test:unit` - Run Vitest unit tests
- `npm run test:e2e` - Run Cypress E2E tests
- `npm run lint` - Run ESLint

## Component Patterns
- Use Composition API with `<script setup>`
- Props with TypeScript interfaces
- Emit events with typed `defineEmits`
- Use composables for shared logic

## State Management
- Pinia for global state
- Composables for feature-specific state
- Local refs for component state

## Form Validation
- VeeValidate with Zod schemas
- Use `defineField` for v-model binding
- Display errors from `errors` object
```

## AI Suggestions

1. **i18n support** - Add vue-i18n for internationalization with lazy-loaded locales
2. **PWA capabilities** - Add vite-plugin-pwa for offline support and installability
3. **Component library** - Integrate Radix Vue or Headless UI for accessible components
4. **State persistence** - Add pinia-plugin-persistedstate for automatic state persistence
5. **API caching** - Integrate TanStack Query (Vue Query) for server state management
6. **Error tracking** - Add Sentry for error monitoring and performance tracking
7. **Feature flags** - Integrate LaunchDarkly or custom feature flag system
8. **Storybook** - Add Storybook for component documentation and testing
9. **E2E visual testing** - Add Percy or Chromatic for visual regression testing
10. **Auto-imports** - Configure unplugin-auto-import for automatic component/composable imports
