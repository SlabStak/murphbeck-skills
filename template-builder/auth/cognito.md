# AWS Cognito Authentication

Production-ready AWS Cognito authentication for Next.js applications with user pools, identity pools, and social federation.

## Overview

AWS Cognito provides:
- User Pools for authentication
- Identity Pools for AWS resource access
- Built-in hosted UI
- Social identity federation
- MFA support
- Custom authentication flows

## Installation

```bash
npm install @aws-sdk/client-cognito-identity-provider amazon-cognito-identity-js aws-amplify @aws-amplify/adapter-nextjs
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=your-client-secret

# Optional: Identity Pool for AWS resource access
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Hosted UI (optional)
NEXT_PUBLIC_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Amplify Configuration

```typescript
// lib/cognito/amplify-config.ts
import { Amplify, type ResourcesConfig } from 'aws-amplify'

export const authConfig: ResourcesConfig['Auth'] = {
  Cognito: {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
    loginWith: {
      oauth: {
        domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
        scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
        redirectSignIn: [`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`],
        redirectSignOut: [`${process.env.NEXT_PUBLIC_APP_URL}`],
        responseType: 'code',
      },
      email: true,
      username: false,
    },
    signUpVerificationMethod: 'code',
    userAttributes: {
      email: { required: true },
    },
    allowGuestAccess: false,
    passwordFormat: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialCharacters: true,
    },
  },
}

export function configureAmplify() {
  Amplify.configure(
    { Auth: authConfig },
    { ssr: true }
  )
}
```

## Server-Side Configuration

```typescript
// lib/cognito/server.ts
import { createServerRunner } from '@aws-amplify/adapter-nextjs'
import { authConfig } from './amplify-config'

export const { runWithAmplifyServerContext } = createServerRunner({
  config: { Auth: authConfig },
})
```

## Authentication Utilities

```typescript
// lib/cognito/auth.ts
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  updateUserAttributes,
  deleteUser,
  resendSignUpCode,
  signInWithRedirect,
  confirmSignIn,
} from 'aws-amplify/auth'

// Types
export interface CognitoUser {
  userId: string
  username: string
  email: string
  emailVerified: boolean
  attributes: Record<string, string>
}

export interface AuthResult {
  success: boolean
  error?: string
  nextStep?: string
  user?: CognitoUser
}

// Sign Up
export async function cognitoSignUp(
  email: string,
  password: string,
  attributes?: Record<string, string>
): Promise<AuthResult> {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          ...attributes,
        },
        autoSignIn: true,
      },
    })

    return {
      success: true,
      nextStep: nextStep.signUpStep,
      user: isSignUpComplete ? { userId: userId!, username: email, email, emailVerified: false, attributes: {} } : undefined,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Confirm Sign Up
export async function cognitoConfirmSignUp(
  email: string,
  code: string
): Promise<AuthResult> {
  try {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: code,
    })

    return {
      success: isSignUpComplete,
      nextStep: nextStep?.signUpStep,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Sign In
export async function cognitoSignIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    })

    if (isSignedIn) {
      const user = await getCognitoUser()
      return { success: true, user: user || undefined }
    }

    return {
      success: false,
      nextStep: nextStep.signInStep,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// MFA Challenge
export async function cognitoConfirmMFA(
  code: string,
  mfaType: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA' = 'SOFTWARE_TOKEN_MFA'
): Promise<AuthResult> {
  try {
    const { isSignedIn, nextStep } = await confirmSignIn({
      challengeResponse: code,
    })

    if (isSignedIn) {
      const user = await getCognitoUser()
      return { success: true, user: user || undefined }
    }

    return { success: false, nextStep: nextStep.signInStep }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Social Sign In
export async function cognitoSocialSignIn(
  provider: 'Google' | 'Facebook' | 'Amazon' | 'Apple'
) {
  await signInWithRedirect({ provider })
}

// Sign Out
export async function cognitoSignOut(global = false): Promise<AuthResult> {
  try {
    await signOut({ global })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get Current User
export async function getCognitoUser(): Promise<CognitoUser | null> {
  try {
    const { userId, username } = await getCurrentUser()
    const attributes = await fetchUserAttributes()

    return {
      userId,
      username,
      email: attributes.email!,
      emailVerified: attributes.email_verified === 'true',
      attributes: attributes as Record<string, string>,
    }
  } catch {
    return null
  }
}

// Get Session Tokens
export async function getCognitoTokens() {
  try {
    const session = await fetchAuthSession()
    return {
      accessToken: session.tokens?.accessToken?.toString(),
      idToken: session.tokens?.idToken?.toString(),
      refreshToken: session.tokens?.refreshToken,
      credentials: session.credentials,
    }
  } catch {
    return null
  }
}

// Password Reset
export async function cognitoForgotPassword(email: string): Promise<AuthResult> {
  try {
    const { nextStep } = await resetPassword({ username: email })
    return { success: true, nextStep: nextStep.resetPasswordStep }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function cognitoConfirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<AuthResult> {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update Password
export async function cognitoUpdatePassword(
  oldPassword: string,
  newPassword: string
): Promise<AuthResult> {
  try {
    await updatePassword({ oldPassword, newPassword })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update Attributes
export async function cognitoUpdateAttributes(
  attributes: Record<string, string>
): Promise<AuthResult> {
  try {
    await updateUserAttributes({
      userAttributes: attributes,
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete Account
export async function cognitoDeleteAccount(): Promise<AuthResult> {
  try {
    await deleteUser()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Resend Confirmation Code
export async function cognitoResendCode(email: string): Promise<AuthResult> {
  try {
    await resendSignUpCode({ username: email })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
```

## Server Actions

```typescript
// app/actions/auth.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { runWithAmplifyServerContext } from '@/lib/cognito/server'
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth/server'

export async function getServerSession() {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return session.tokens ? session : null
      } catch {
        return null
      }
    },
  })
}

export async function getServerUser() {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        return await getCurrentUser(contextSpec)
      } catch {
        return null
      }
    },
  })
}

export async function requireAuth() {
  const user = await getServerUser()
  if (!user) {
    redirect('/login')
  }
  return user
}
```

## Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { runWithAmplifyServerContext } from '@/lib/cognito/server'
import { fetchAuthSession } from 'aws-amplify/auth/server'

const protectedRoutes = ['/dashboard', '/profile', '/settings']
const authRoutes = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const isAuthenticated = await runWithAmplifyServerContext({
    nextServerContext: { cookies: () => request.cookies },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return session.tokens !== undefined
      } catch {
        return false
      }
    },
  })

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Auth Provider

```typescript
// components/providers/cognito-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Hub } from 'aws-amplify/utils'
import { configureAmplify } from '@/lib/cognito/amplify-config'
import {
  getCognitoUser,
  cognitoSignIn,
  cognitoSignOut,
  cognitoSignUp,
  type CognitoUser,
} from '@/lib/cognito/auth'

// Configure Amplify on client
configureAmplify()

interface AuthContextType {
  user: CognitoUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; nextStep?: string }>
  signUp: (email: string, password: string, attributes?: Record<string, string>) => Promise<{ success: boolean; error?: string; nextStep?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function CognitoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const currentUser = await getCognitoUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))

    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          refreshUser()
          break
        case 'signedOut':
          setUser(null)
          break
        case 'tokenRefresh':
          refreshUser()
          break
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await cognitoSignIn(email, password)
    if (result.success) {
      await refreshUser()
    }
    return result
  }

  const signUp = async (email: string, password: string, attributes?: Record<string, string>) => {
    return cognitoSignUp(email, password, attributes)
  }

  const signOut = async () => {
    await cognitoSignOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useCognitoAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useCognitoAuth must be used within CognitoProvider')
  }
  return context
}
```

## React Components

```typescript
// components/auth/login-form.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCognitoAuth } from '@/components/providers/cognito-provider'
import { cognitoSocialSignIn, cognitoConfirmMFA } from '@/lib/cognito/auth'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useCognitoAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn(email, password)

    if (result.success) {
      router.push(callbackUrl)
    } else if (result.nextStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE' ||
               result.nextStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
      setStep('mfa')
    } else {
      setError(result.error || 'Sign in failed')
    }

    setLoading(false)
  }

  const handleMFA = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await cognitoConfirmMFA(mfaCode)

    if (result.success) {
      router.push(callbackUrl)
    } else {
      setError(result.error || 'Invalid MFA code')
    }

    setLoading(false)
  }

  const handleSocialSignIn = (provider: 'Google' | 'Facebook' | 'Amazon' | 'Apple') => {
    cognitoSocialSignIn(provider)
  }

  if (step === 'mfa') {
    return (
      <form onSubmit={handleMFA} className="space-y-4">
        <div>
          <label htmlFor="mfaCode" className="block text-sm font-medium">
            MFA Code
          </label>
          <input
            id="mfaCode"
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="Enter your MFA code"
            className="mt-1 block w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2"
            required
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
            className="mt-1 block w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSocialSignIn('Google')}
          className="flex items-center justify-center rounded-md border py-2 hover:bg-gray-50"
        >
          Google
        </button>
        <button
          onClick={() => handleSocialSignIn('Amazon')}
          className="flex items-center justify-center rounded-md border py-2 hover:bg-gray-50"
        >
          Amazon
        </button>
      </div>
    </div>
  )
}
```

```typescript
// components/auth/signup-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCognitoAuth } from '@/components/providers/cognito-provider'
import { cognitoConfirmSignUp, cognitoResendCode } from '@/lib/cognito/auth'

export function SignUpForm() {
  const router = useRouter()
  const { signUp, signIn } = useCognitoAuth()

  const [step, setStep] = useState<'signup' | 'confirm'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    const result = await signUp(email, password)

    if (result.success || result.nextStep === 'CONFIRM_SIGN_UP') {
      setStep('confirm')
    } else {
      setError(result.error || 'Sign up failed')
    }

    setLoading(false)
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await cognitoConfirmSignUp(email, code)

    if (result.success) {
      // Auto sign in after confirmation
      const signInResult = await signIn(email, password)
      if (signInResult.success) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } else {
      setError(result.error || 'Confirmation failed')
    }

    setLoading(false)
  }

  const handleResendCode = async () => {
    setLoading(true)
    const result = await cognitoResendCode(email)
    if (!result.success) {
      setError(result.error || 'Failed to resend code')
    }
    setLoading(false)
  }

  if (step === 'confirm') {
    return (
      <form onSubmit={handleConfirm} className="space-y-4">
        <p className="text-sm text-gray-600">
          We sent a confirmation code to {email}
        </p>

        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Confirmation Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Confirming...' : 'Confirm Account'}
        </button>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={loading}
          className="w-full text-sm text-blue-600 hover:underline"
        >
          Resend code
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          required
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
          className="mt-1 block w-full rounded-md border px-3 py-2"
          required
          minLength={8}
        />
        <p className="mt-1 text-xs text-gray-500">
          Min 8 characters with uppercase, lowercase, number, and special character
        </p>
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
          className="mt-1 block w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

## Admin SDK Operations

```typescript
// lib/cognito/admin.ts
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  ListUsersCommand,
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
})

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!

// Admin Create User
export async function adminCreateUser(
  email: string,
  temporaryPassword?: string,
  attributes?: Record<string, string>
) {
  const userAttributes = [
    { Name: 'email', Value: email },
    { Name: 'email_verified', Value: 'true' },
    ...Object.entries(attributes || {}).map(([key, value]) => ({
      Name: key,
      Value: value,
    })),
  ]

  const command = new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    TemporaryPassword: temporaryPassword,
    UserAttributes: userAttributes,
    MessageAction: temporaryPassword ? 'SUPPRESS' : undefined,
  })

  return client.send(command)
}

// Admin Get User
export async function adminGetUser(username: string) {
  const command = new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  })

  return client.send(command)
}

// Admin Update User Attributes
export async function adminUpdateUserAttributes(
  username: string,
  attributes: Record<string, string>
) {
  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    UserAttributes: Object.entries(attributes).map(([key, value]) => ({
      Name: key,
      Value: value,
    })),
  })

  return client.send(command)
}

// Admin Set Password
export async function adminSetPassword(
  username: string,
  password: string,
  permanent = true
) {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    Password: password,
    Permanent: permanent,
  })

  return client.send(command)
}

// Admin Disable User
export async function adminDisableUser(username: string) {
  const command = new AdminDisableUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  })

  return client.send(command)
}

// Admin Enable User
export async function adminEnableUser(username: string) {
  const command = new AdminEnableUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  })

  return client.send(command)
}

// Admin Delete User
export async function adminDeleteUser(username: string) {
  const command = new AdminDeleteUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  })

  return client.send(command)
}

// List Users
export async function listUsers(limit = 60, paginationToken?: string) {
  const command = new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Limit: limit,
    PaginationToken: paginationToken,
  })

  return client.send(command)
}

// Group Management
export async function addUserToGroup(username: string, groupName: string) {
  const command = new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    GroupName: groupName,
  })

  return client.send(command)
}

export async function removeUserFromGroup(username: string, groupName: string) {
  const command = new AdminRemoveUserFromGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    GroupName: groupName,
  })

  return client.send(command)
}

export async function getUserGroups(username: string) {
  const command = new AdminListGroupsForUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  })

  return client.send(command)
}

export async function createGroup(groupName: string, description?: string) {
  const command = new CreateGroupCommand({
    UserPoolId: USER_POOL_ID,
    GroupName: groupName,
    Description: description,
  })

  return client.send(command)
}

export async function deleteGroup(groupName: string) {
  const command = new DeleteGroupCommand({
    UserPoolId: USER_POOL_ID,
    GroupName: groupName,
  })

  return client.send(command)
}

export async function listGroups(limit = 60, paginationToken?: string) {
  const command = new ListGroupsCommand({
    UserPoolId: USER_POOL_ID,
    Limit: limit,
    NextToken: paginationToken,
  })

  return client.send(command)
}
```

## API Route Protection

```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { runWithAmplifyServerContext } from '@/lib/cognito/server'
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth/server'

export async function GET(request: NextRequest) {
  const user = await runWithAmplifyServerContext({
    nextServerContext: { cookies: () => request.cookies },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec)
        if (!session.tokens) return null

        const currentUser = await getCurrentUser(contextSpec)
        return currentUser
      } catch {
        return null
      }
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'Protected data',
    userId: user.userId,
    username: user.username,
  })
}
```

## Testing

```typescript
// __tests__/cognito.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Amplify
vi.mock('aws-amplify/auth', () => ({
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
  fetchUserAttributes: vi.fn(),
}))

import { signUp, signIn, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth'
import { cognitoSignUp, cognitoSignIn, getCognitoUser } from '@/lib/cognito/auth'

describe('Cognito Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cognitoSignUp', () => {
    it('should sign up a new user', async () => {
      vi.mocked(signUp).mockResolvedValue({
        isSignUpComplete: false,
        userId: 'user-123',
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' },
      } as any)

      const result = await cognitoSignUp('test@example.com', 'Password123!')

      expect(result.success).toBe(true)
      expect(result.nextStep).toBe('CONFIRM_SIGN_UP')
    })

    it('should handle sign up errors', async () => {
      vi.mocked(signUp).mockRejectedValue(new Error('User already exists'))

      const result = await cognitoSignUp('test@example.com', 'Password123!')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already exists')
    })
  })

  describe('cognitoSignIn', () => {
    it('should sign in an existing user', async () => {
      vi.mocked(signIn).mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      } as any)

      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: 'user-123',
        username: 'test@example.com',
      } as any)

      vi.mocked(fetchUserAttributes).mockResolvedValue({
        email: 'test@example.com',
        email_verified: 'true',
      } as any)

      const result = await cognitoSignIn('test@example.com', 'Password123!')

      expect(result.success).toBe(true)
      expect(result.user?.email).toBe('test@example.com')
    })

    it('should handle MFA challenge', async () => {
      vi.mocked(signIn).mockResolvedValue({
        isSignedIn: false,
        nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' },
      } as any)

      const result = await cognitoSignIn('test@example.com', 'Password123!')

      expect(result.success).toBe(false)
      expect(result.nextStep).toBe('CONFIRM_SIGN_IN_WITH_TOTP_CODE')
    })
  })

  describe('getCognitoUser', () => {
    it('should return current user', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: 'user-123',
        username: 'test@example.com',
      } as any)

      vi.mocked(fetchUserAttributes).mockResolvedValue({
        email: 'test@example.com',
        email_verified: 'true',
      } as any)

      const user = await getCognitoUser()

      expect(user?.userId).toBe('user-123')
      expect(user?.email).toBe('test@example.com')
      expect(user?.emailVerified).toBe(true)
    })

    it('should return null when not authenticated', async () => {
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Not authenticated'))

      const user = await getCognitoUser()

      expect(user).toBeNull()
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## AWS Cognito Authentication

This project uses AWS Cognito for authentication.

### Key Files
- `lib/cognito/amplify-config.ts` - Amplify configuration
- `lib/cognito/auth.ts` - Client-side auth utilities
- `lib/cognito/server.ts` - Server-side auth context
- `lib/cognito/admin.ts` - Admin SDK operations
- `components/providers/cognito-provider.tsx` - Auth provider

### Authentication Flow
1. Users sign up with email/password
2. Confirmation code sent via email
3. Users confirm their account
4. Sign in with credentials or social providers
5. Optional MFA challenge

### Commands
```bash
# Run auth tests
npm test -- __tests__/cognito.test.ts

# Check auth status
aws cognito-idp admin-get-user --user-pool-id $USER_POOL_ID --username user@example.com
```

### Environment Variables Required
- `NEXT_PUBLIC_AWS_REGION`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET` (server only)
```

## AI Suggestions

1. **Custom authentication challenges** - Implement custom Lambda triggers for CAPTCHA, custom MFA, or risk-based authentication
2. **User migration Lambda** - Migrate users from legacy systems during sign-in
3. **Pre/post authentication hooks** - Add custom logic before/after authentication
4. **Advanced security features** - Enable compromised credentials checking and adaptive authentication
5. **Custom email templates** - Customize verification and password reset emails
6. **Fine-grained access control** - Use identity pools with IAM policies for AWS resource access
7. **Device tracking** - Remember trusted devices and require MFA only for new devices
8. **User import** - Bulk import users via CSV with password hashes
