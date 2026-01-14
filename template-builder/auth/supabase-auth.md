# Supabase Authentication Template

Complete Supabase Auth integration for Next.js applications.

## Overview

Supabase Auth provides:
- Email/password authentication
- Magic link (passwordless)
- OAuth providers (Google, GitHub, etc.)
- Phone/SMS authentication
- Row Level Security (RLS) integration
- Anonymous authentication
- Multi-factor authentication (MFA)

## Installation

```bash
# Core packages
bun add @supabase/supabase-js @supabase/ssr

# For server-side auth
bun add @supabase/auth-helpers-nextjs  # Alternative helper package
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, never expose

# OAuth (configure in Supabase Dashboard)
# Google: https://supabase.com/docs/guides/auth/social-login/auth-google
# GitHub: https://supabase.com/docs/guides/auth/social-login/auth-github
```

## Supabase Client Setup

### Browser Client

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (Server Components, Route Handlers)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

### Service Role Client (Admin Operations)

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

// WARNING: Only use server-side, never expose to client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

### Middleware Client

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your app
  // vulnerable to security issues.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/api/protected']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Auth routes - redirect if already logged in
  const authRoutes = ['/sign-in', '/sign-up']
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

## Middleware

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Authentication Pages

### Sign In Page

```typescript
// app/sign-in/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignInForm } from '@/components/auth/sign-in-form'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { message?: string; redirectTo?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {searchParams.message && (
          <div className="rounded-md bg-red-50 p-4 text-red-500">
            {searchParams.message}
          </div>
        )}

        <SignInForm redirectTo={searchParams.redirectTo} />

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <a href="/sign-up" className="font-medium text-blue-600 hover:underline">
            Sign up
          </a>
        </div>
      </div>
    </div>
  )
}
```

### Sign In Form

```typescript
// components/auth/sign-in-form.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo ?? '/dashboard')
    router.refresh()
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Please enter your email')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo ?? '/dashboard'}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    alert('Check your email for the magic link!')
  }

  async function handleOAuth(provider: 'google' | 'github' | 'discord') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo ?? '/dashboard'}`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-3 hover:bg-gray-50"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth('github')}
          className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-3 hover:bg-gray-50"
        >
          <GitHubIcon className="h-5 w-5" />
          Continue with GitHub
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="flex items-center justify-between">
          <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full rounded-md border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
      >
        Send Magic Link
      </button>
    </div>
  )
}
```

### Sign Up Page

```typescript
// app/sign-up/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignUpForm } from '@/components/auth/sign-up-form'

export default async function SignUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-600">Get started with your account</p>
        </div>

        <SignUpForm />

        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <a href="/sign-in" className="font-medium text-blue-600 hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}
```

### Sign Up Form

```typescript
// components/auth/sign-up-form.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // Additional user metadata
          full_name: '',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-center">
        <h3 className="font-medium text-green-800">Check your email</h3>
        <p className="mt-2 text-sm text-green-700">
          We've sent you a confirmation link. Please check your email to verify your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
```

### Auth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
```

## Server-Side Authentication

### Get User in Server Components

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/sign-in')
  }

  // Fetch user profile from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h1>Welcome, {profile?.full_name ?? user.email}!</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

### Protected API Routes

```typescript
// app/api/protected/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch data with RLS - automatically scoped to user
  const { data, error: dbError } = await supabase
    .from('projects')
    .select('*')

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Insert with RLS - user_id automatically enforced
  const { data, error: dbError } = await supabase
    .from('projects')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

## Row Level Security (RLS)

### Database Schema & RLS Policies

```sql
-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'user',
  plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.projects enable row level security;

-- Policies for projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Client-Side Auth State

### Auth Context Provider

```typescript
// components/providers/auth-provider.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### Using Auth in Client Components

```typescript
// components/user-menu.tsx
'use client'

import { useAuth } from '@/components/providers/auth-provider'

export function UserMenu() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <a href="/sign-in" className="btn btn-ghost">Sign In</a>
        <a href="/sign-up" className="btn btn-primary">Sign Up</a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span>{user.email}</span>
      <button onClick={signOut} className="btn btn-ghost">
        Sign Out
      </button>
    </div>
  )
}
```

## Password Reset

```typescript
// app/forgot-password/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-md bg-green-50 p-8 text-center">
          <h2 className="text-xl font-bold text-green-800">Check your email</h2>
          <p className="mt-2 text-green-700">
            We've sent you a password reset link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Reset Password</h1>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-red-500">{error}</div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}
```

```typescript
// app/reset-password/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Set New Password</h1>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-red-500">{error}</div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
```

## TypeScript Types

```typescript
// types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: string
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          plan?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          updated_at?: string
        }
      }
    }
  }
}

// Use with Supabase client
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabase = createClient<Database>(url, key)
```

## CLAUDE.md Integration

```markdown
## Authentication

Using Supabase Auth for authentication.

### Key Files
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `lib/supabase/middleware.ts` - Middleware client
- `middleware.ts` - Route protection
- `app/auth/callback/route.ts` - OAuth callback

### Auth Patterns
```typescript
// Server Components
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Client Components
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
await supabase.auth.signInWithPassword({ email, password })

// With RLS - data automatically scoped to user
const { data } = await supabase.from('projects').select('*')
```

### Protected Routes
Routes starting with `/dashboard`, `/settings` require authentication.
Protected via middleware session check.

### RLS Rules
All database queries automatically respect Row Level Security.
Users can only access their own data.
```

## AI Suggestions

### Security Best Practices
1. **Always use getUser()** - Never trust getSession() alone
2. **RLS everywhere** - Enable on all tables
3. **Service role carefully** - Only for admin operations
4. **Email confirmation** - Enable in Supabase settings
5. **Rate limiting** - Enable in Supabase settings

### Performance Optimizations
1. **Connection pooling** - Use Supabase's built-in pooler
2. **Edge functions** - Deploy auth logic close to users
3. **Realtime subscriptions** - Use for live auth state

### Additional Features to Consider
1. **Phone auth** - SMS verification
2. **MFA/2FA** - Enable TOTP
3. **Anonymous auth** - For guest users
4. **Custom claims** - Add to JWT for RBAC
5. **Session management** - List/revoke sessions
