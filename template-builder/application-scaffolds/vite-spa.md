# Vite React SPA Template

## Overview
Modern single-page application built with Vite and React, featuring React Router for navigation, React Query for data fetching, Zustand for state management, and comprehensive authentication, testing, and deployment configurations.

## Quick Start
```bash
# Create new project
npm create vite@latest my-spa -- --template react-ts

# Install dependencies
cd my-spa
npm install react-router-dom @tanstack/react-query zustand
npm install axios dayjs clsx tailwind-merge
npm install @hookform/resolvers react-hook-form zod
npm install framer-motion react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom
npm install -D msw playwright

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
my-spa/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   └── manifest.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProfileForm.tsx
│   │   └── common/
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingScreen.tsx
│   │       ├── ProtectedRoute.tsx
│   │       └── SEO.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── components/
│   │   │   │   └── AuthProvider.tsx
│   │   │   └── store.ts
│   │   ├── users/
│   │   │   ├── hooks/
│   │   │   │   ├── useUsers.ts
│   │   │   │   └── useUser.ts
│   │   │   └── components/
│   │   │       ├── UserList.tsx
│   │   │       └── UserCard.tsx
│   │   └── settings/
│   │       ├── hooks/
│   │       │   └── useSettings.ts
│   │       └── components/
│   │           └── SettingsPanel.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useOnClickOutside.ts
│   │   └── useScrollLock.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   ├── NotFound.tsx
│   │   └── ErrorPage.tsx
│   ├── router/
│   │   ├── index.tsx
│   │   └── routes.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── themeStore.ts
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       ├── api.ts
│       ├── auth.ts
│       └── common.ts
├── tests/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   └── e2e/
│       └── auth.spec.ts
└── package.json
```

## Vite Configuration
```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@api': path.resolve(__dirname, './src/api'),
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
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      css: true,
    },
  };
});
```

## API Client
```typescript
// src/api/client.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken && originalRequest) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          return apiClient(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// src/api/auth.ts
import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },
};
```

## Auth Store (Zustand)
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      login: (user, token, refreshToken) => set({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      }),

      logout: () => set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// src/stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isModalOpen: false,
  modalContent: null,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),
}));

// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        const root = document.documentElement;

        if (theme === 'system') {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', systemDark);
        } else {
          root.classList.toggle('dark', theme === 'dark');
        }

        set({ theme });
      },
    }),
    { name: 'theme-storage' }
  )
);
```

## React Router Setup
```typescript
// src/router/index.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from '@/components/layout/Layout';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorPage from '@/pages/ErrorPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}

// src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

## React Query Setup
```typescript
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import Router from './router';
import { AuthProvider } from '@/features/auth/components/AuthProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster position="top-right" />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// src/features/auth/components/AuthProvider.tsx
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import LoadingScreen from '@/components/common/LoadingScreen';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { token, setUser, setLoading, logout, isLoading } = useAuthStore();

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await authApi.me();
        setUser(user);
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token, setUser, setLoading, logout]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
```

## Auth Hook with React Query
```typescript
// src/features/auth/hooks/useAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi, LoginCredentials, RegisterData } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin, logout: storeLogout } = useAuthStore();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      storeLogin(data.user, data.accessToken, data.refreshToken);
      queryClient.clear();
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Invalid credentials';
      toast.error(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (data) => {
      storeLogin(data.user, data.accessToken, data.refreshToken);
      queryClient.clear();
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      storeLogout();
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    },
    onError: () => {
      // Force logout even if API call fails
      storeLogout();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
```

## UI Components
```typescript
// src/components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
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
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className="mr-2" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

// src/components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:ring-red-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

// src/components/ui/Modal.tsx
import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${sizeClasses[size]} transform rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all`}
              >
                {title && (
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-semibold">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {description && (
                  <Dialog.Description className="text-sm text-gray-500 mb-4">
                    {description}
                  </Dialog.Description>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

## Custom Hooks
```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}

// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// src/hooks/useOnClickOutside.ts
import { useEffect, type RefObject } from 'react';

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
```

## Layout Components
```typescript
// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

export default function Layout() {
  const { isAuthenticated } = useAuthStore();
  const { isSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        {isAuthenticated && <Sidebar isOpen={isSidebarOpen} />}
        <main
          className={`flex-1 p-6 ${isAuthenticated ? 'ml-0 md:ml-64' : ''}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// src/components/layout/Header.tsx
import { Link } from 'react-router-dom';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/Button';

export default function Header() {
  const { isAuthenticated, user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { logout, isLoggingOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          )}
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
            MySPA
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium hidden sm:block">
                  {user?.name}
                </span>
                <UserCircleIcon className="w-8 h-8 text-gray-400" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                loading={isLoggingOut}
              >
                Logout
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

## Error Boundary
```typescript
// src/components/common/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to error tracking service
    // Sentry.captureException(error);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Setup
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    });
  }),

  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' },
    ]);
  }),
];

// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

## E2E Tests
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('displays login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation errors', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL('/login');
  });

  test('logout clears session', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();

    await expect(page).toHaveURL('/login');

    // Verify can't access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
```

## CLAUDE.md Integration
```markdown
# Vite React SPA

## Project Type
Single-page application with Vite, React, TypeScript, React Router, React Query, and Zustand.

## Key Directories
- `src/api/` - API client and service functions
- `src/components/` - Reusable UI components
- `src/features/` - Feature modules with hooks and components
- `src/pages/` - Route pages
- `src/stores/` - Zustand stores
- `src/hooks/` - Custom React hooks

## Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests with Vitest
- `npm run test:e2e` - Run Playwright E2E tests

## State Management Pattern
- Use Zustand for global state (auth, UI, theme)
- Use React Query for server state
- Use local state for component-specific state

## API Pattern
- All API calls go through `src/api/client.ts`
- Token refresh is handled automatically
- Use React Query hooks for data fetching

## File Naming
- Components: PascalCase.tsx
- Hooks: use{Name}.ts
- Stores: {name}Store.ts
- Utils: camelCase.ts
```

## AI Suggestions

1. **Service worker for offline support** - Add PWA capabilities with Workbox for offline caching and background sync
2. **Feature flags integration** - Add LaunchDarkly or Unleash for controlled feature rollouts
3. **Internationalization** - Add i18next for multi-language support with lazy-loaded translations
4. **Form builder system** - Create dynamic form generator from JSON schema for rapid development
5. **Analytics tracking** - Integrate Mixpanel or Amplitude with custom event tracking hooks
6. **Real-time notifications** - Add WebSocket-based notification system with toast integration
7. **Accessibility testing** - Add axe-core for automated accessibility testing in CI
8. **Performance monitoring** - Integrate web-vitals with custom performance dashboard
9. **API mocking for development** - Enhanced MSW setup with switchable scenarios for different states
10. **Component documentation** - Add Storybook for component development and documentation
