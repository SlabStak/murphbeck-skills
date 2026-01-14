# Firebase Authentication Template

Complete Firebase Auth integration for Next.js applications.

## Overview

Firebase Auth provides:
- Email/password authentication
- Social providers (Google, GitHub, Apple, Facebook, Twitter)
- Phone authentication with SMS
- Anonymous authentication
- Custom token authentication
- Multi-factor authentication
- Email link (passwordless) sign-in

## Installation

```bash
bun add firebase firebase-admin
```

## Environment Variables

```env
# .env.local

# Client-side Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Server-side Firebase Admin
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Firebase Client Setup

```typescript
// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Uncomment to use emulators
  // connectAuthEmulator(auth, 'http://localhost:9099')
  // connectFirestoreEmulator(db, 'localhost', 8080)
  // connectStorageEmulator(storage, 'localhost', 9199)
}

export default app
```

## Firebase Admin Setup

```typescript
// lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const adminApp = getFirebaseAdmin()
export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
```

## Auth Context Provider

```typescript
// components/providers/auth-provider.tsx
'use client'

import { auth } from '@/lib/firebase/client'
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        // Sync session with server
        const idToken = await user.getIdToken()
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })
      }
    })

    return () => unsubscribe()
  }, [])

  async function signOut() {
    await firebaseSignOut(auth)
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  async function getIdToken() {
    if (!user) return null
    return user.getIdToken()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, getIdToken }}>
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

## Authentication Methods

### Email/Password Sign In

```typescript
// components/auth/email-auth.tsx
'use client'

import { auth } from '@/lib/firebase/client'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function EmailSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      // Check if email is verified
      if (!user.emailVerified) {
        setError('Please verify your email before signing in')
        await sendEmailVerification(user)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
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
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

export function EmailSignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with name
      await updateProfile(user, { displayName: name })

      // Send verification email
      await sendEmailVerification(user)

      setSuccess(true)
    } catch (err: any) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-center">
        <h3 className="font-medium text-green-800">Check your email</h3>
        <p className="mt-2 text-sm text-green-700">
          We've sent a verification link to {email}
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
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
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
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email already registered'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later'
    default:
      return 'An error occurred. Please try again'
  }
}
```

### OAuth Providers

```typescript
// components/auth/oauth-buttons.tsx
'use client'

import { auth } from '@/lib/firebase/client'
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

const githubProvider = new GithubAuthProvider()
githubProvider.addScope('read:user')
githubProvider.addScope('user:email')

const appleProvider = new OAuthProvider('apple.com')
appleProvider.addScope('email')
appleProvider.addScope('name')

export function OAuthButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  // Handle redirect result on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          router.push('/dashboard')
          router.refresh()
        }
      })
      .catch((err) => {
        setError(err.message)
      })
  }, [router])

  async function handleOAuth(provider: GoogleAuthProvider | GithubAuthProvider | OAuthProvider, name: string) {
    setLoading(name)
    setError('')

    try {
      // Use popup for desktop, redirect for mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      if (isMobile) {
        await signInWithRedirect(auth, provider)
      } else {
        const result = await signInWithPopup(auth, provider)

        if (result.user) {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup, not an error
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using a different sign-in method')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <button
        onClick={() => handleOAuth(googleProvider, 'google')}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-3 hover:bg-gray-50 disabled:opacity-50"
      >
        <GoogleIcon className="h-5 w-5" />
        {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
      </button>

      <button
        onClick={() => handleOAuth(githubProvider, 'github')}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-3 hover:bg-gray-50 disabled:opacity-50"
      >
        <GithubIcon className="h-5 w-5" />
        {loading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
      </button>

      <button
        onClick={() => handleOAuth(appleProvider, 'apple')}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-md border bg-black px-4 py-3 text-white hover:bg-gray-900 disabled:opacity-50"
      >
        <AppleIcon className="h-5 w-5" />
        {loading === 'apple' ? 'Signing in...' : 'Continue with Apple'}
      </button>
    </div>
  )
}
```

### Phone Authentication

```typescript
// components/auth/phone-auth.tsx
'use client'

import { auth } from '@/lib/firebase/client'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function PhoneAuth() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Initialize reCAPTCHA
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    })

    return () => {
      recaptchaRef.current?.clear()
    }
  }, [])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!recaptchaRef.current) {
        throw new Error('reCAPTCHA not initialized')
      }

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaRef.current
      )

      setConfirmationResult(result)
      setStep('code')
    } catch (err: any) {
      setError(err.message)
      // Reset reCAPTCHA on error
      recaptchaRef.current?.render()
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result')
      }

      await confirmationResult.confirm(code)
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError('Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div id="recaptcha-container" />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              required
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              maxLength={6}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-center text-2xl tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full text-sm text-blue-600 hover:underline"
          >
            Use a different phone number
          </button>
        </form>
      )}
    </div>
  )
}
```

### Anonymous Authentication

```typescript
// lib/firebase/anonymous.ts
import { auth } from '@/lib/firebase/client'
import {
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
} from 'firebase/auth'

export async function signInAsGuest() {
  const { user } = await signInAnonymously(auth)
  return user
}

export async function convertAnonymousToEmail(email: string, password: string) {
  const user = auth.currentUser

  if (!user || !user.isAnonymous) {
    throw new Error('User is not anonymous')
  }

  const credential = EmailAuthProvider.credential(email, password)
  const result = await linkWithCredential(user, credential)

  return result.user
}

export async function convertAnonymousToGoogle() {
  const user = auth.currentUser

  if (!user || !user.isAnonymous) {
    throw new Error('User is not anonymous')
  }

  const provider = new GoogleAuthProvider()
  const result = await linkWithPopup(user, provider)

  return result.user
}
```

## Server-Side Authentication

### Session Cookie API

```typescript
// app/api/auth/session/route.ts
import { adminAuth } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = '__session'
const SESSION_EXPIRY_DAYS = 14

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)

    // Only create session if email is verified (for email/password users)
    // OAuth users are automatically verified
    if (decodedToken.email && !decodedToken.email_verified && decodedToken.firebase.sign_in_provider === 'password') {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 401 }
      )
    }

    // Create session cookie
    const expiresIn = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  return NextResponse.json({ success: true })
}
```

### Verify Session in Server Components

```typescript
// lib/firebase/session.ts
import { adminAuth } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'
import { DecodedIdToken } from 'firebase-admin/auth'

const SESSION_COOKIE_NAME = '__session'

export async function getSession(): Promise<DecodedIdToken | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionCookie) {
      return null
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true // Check if revoked
    )

    return decodedClaims
  } catch (error) {
    return null
  }
}

export async function requireSession() {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}
```

### Protected Server Components

```typescript
// app/dashboard/page.tsx
import { getSession } from '@/lib/firebase/session'
import { redirect } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/sign-in')
  }

  // Fetch user data from Firestore
  const userDoc = await adminDb.collection('users').doc(session.uid).get()
  const userData = userDoc.data()

  return (
    <div>
      <h1>Welcome, {session.name ?? session.email}!</h1>
      <p>UID: {session.uid}</p>
      {userData && (
        <div>
          <p>Plan: {userData.plan}</p>
          <p>Role: {userData.role}</p>
        </div>
      )}
    </div>
  )
}
```

### Protected API Routes

```typescript
// app/api/protected/route.ts
import { getSession } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user's data
  const projectsSnapshot = await adminDb
    .collection('projects')
    .where('userId', '==', session.uid)
    .get()

  const projects = projectsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))

  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const docRef = await adminDb.collection('projects').add({
    ...body,
    userId: session.uid,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ id: docRef.id }, { status: 201 })
}
```

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/settings', '/api/protected']
const authRoutes = ['/sign-in', '/sign-up']

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')
  const { pathname } = request.nextUrl

  // Check if trying to access protected route without session
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Check if trying to access auth route with session
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute && sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function hasRole(role) {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) &&
        // Prevent users from changing their own role
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
      allow delete: if false; // Only admin can delete users
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    // Admin-only collection
    match /admin/{document=**} {
      allow read, write: if hasRole('admin');
    }
  }
}
```

## Custom Claims (RBAC)

```typescript
// lib/firebase/admin-functions.ts
import { adminAuth, adminDb } from '@/lib/firebase/admin'

// Set custom claims for a user
export async function setUserRole(uid: string, role: 'admin' | 'user' | 'moderator') {
  await adminAuth.setCustomUserClaims(uid, { role })

  // Also update in Firestore for queries
  await adminDb.collection('users').doc(uid).update({ role })
}

// Get user with claims
export async function getUserWithClaims(uid: string) {
  const user = await adminAuth.getUser(uid)
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.customClaims?.role ?? 'user',
  }
}
```

### Check Claims on Client

```typescript
// components/admin-guard.tsx
'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useEffect, useState } from 'react'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkClaims() {
      if (!user) {
        setLoading(false)
        return
      }

      const tokenResult = await user.getIdTokenResult()
      setIsAdmin(tokenResult.claims.role === 'admin')
      setLoading(false)
    }

    checkClaims()
  }, [user])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return <div>Access denied. Admin only.</div>
  }

  return <>{children}</>
}
```

## CLAUDE.md Integration

```markdown
## Authentication

Using Firebase Auth for authentication.

### Key Files
- `lib/firebase/client.ts` - Client-side Firebase
- `lib/firebase/admin.ts` - Server-side Firebase Admin
- `lib/firebase/session.ts` - Session management
- `components/providers/auth-provider.tsx` - Auth context

### Auth Patterns
```typescript
// Client Components
import { useAuth } from '@/components/providers/auth-provider'
const { user, signOut, getIdToken } = useAuth()

// Server Components
import { getSession } from '@/lib/firebase/session'
const session = await getSession()

// API Routes
import { getSession } from '@/lib/firebase/session'
const session = await getSession()
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/settings/*` - Requires authentication
- `/admin/*` - Requires admin role

### Security Rules
Firestore rules in `firestore.rules` - users can only access their own data.
```

## AI Suggestions

### Security Best Practices
1. **Email verification** - Require for email/password users
2. **Session cookies** - Use httpOnly secure cookies
3. **Custom claims** - For role-based access
4. **Security rules** - Always test in Firestore emulator
5. **Rate limiting** - Enable in Firebase Console

### Performance
1. **Persistence** - Enable offline persistence
2. **Token caching** - Cache ID tokens
3. **Lazy loading** - Load Firebase only when needed
4. **Bundle size** - Use modular imports

### Additional Features
1. **Multi-factor auth** - Enable TOTP
2. **Account linking** - Link multiple providers
3. **App Check** - Protect against abuse
4. **Anonymous upgrade** - Convert guests to users
