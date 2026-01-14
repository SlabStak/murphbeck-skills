# OAuth 2.0 Flows

Complete OAuth 2.0 implementation guide covering all grant types for Next.js applications.

## Overview

OAuth 2.0 grant types covered:
- Authorization Code (with PKCE)
- Client Credentials
- Refresh Token
- Device Authorization
- Implicit (legacy, not recommended)

## Installation

```bash
npm install jose nanoid
```

## Environment Variables

```env
# .env.local

# OAuth Server Configuration (if building your own)
OAUTH_ISSUER=https://auth.example.com
OAUTH_SIGNING_KEY=your-256-bit-secret

# Client Configuration
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/callback

# Token Settings
ACCESS_TOKEN_TTL=900       # 15 minutes
REFRESH_TOKEN_TTL=604800   # 7 days
AUTH_CODE_TTL=600          # 10 minutes
```

## Types

```typescript
// lib/oauth/types.ts
export interface OAuthClient {
  id: string
  secret: string
  name: string
  redirectUris: string[]
  allowedGrants: GrantType[]
  allowedScopes: string[]
  accessTokenTTL?: number
  refreshTokenTTL?: number
}

export type GrantType =
  | 'authorization_code'
  | 'client_credentials'
  | 'refresh_token'
  | 'device_code'

export interface TokenPayload {
  sub: string           // Subject (user ID)
  client_id: string     // Client ID
  scope: string         // Space-separated scopes
  iat: number           // Issued at
  exp: number           // Expiration
  iss: string           // Issuer
  aud: string           // Audience
  jti?: string          // JWT ID (for revocation)
}

export interface AuthorizationCode {
  code: string
  clientId: string
  userId: string
  redirectUri: string
  scope: string
  codeChallenge?: string
  codeChallengeMethod?: 'S256' | 'plain'
  expiresAt: Date
}

export interface RefreshTokenData {
  token: string
  clientId: string
  userId: string
  scope: string
  expiresAt: Date
}

export interface TokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token?: string
  scope?: string
}

export interface ErrorResponse {
  error: string
  error_description?: string
  error_uri?: string
}
```

## Token Generation

```typescript
// lib/oauth/tokens.ts
import * as jose from 'jose'
import { nanoid } from 'nanoid'
import { TokenPayload, TokenResponse } from './types'

const JWT_SECRET = new TextEncoder().encode(process.env.OAUTH_SIGNING_KEY)
const ISSUER = process.env.OAUTH_ISSUER || 'https://auth.example.com'

// Generate access token
export async function generateAccessToken(payload: {
  sub: string
  client_id: string
  scope: string
  aud?: string
}): Promise<string> {
  const ttl = parseInt(process.env.ACCESS_TOKEN_TTL || '900')

  return new jose.SignJWT({
    sub: payload.sub,
    client_id: payload.client_id,
    scope: payload.scope,
    jti: nanoid(),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'at+jwt' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(payload.aud || payload.client_id)
    .setExpirationTime(`${ttl}s`)
    .sign(JWT_SECRET)
}

// Generate refresh token
export async function generateRefreshToken(): Promise<string> {
  return nanoid(64)
}

// Generate authorization code
export function generateAuthorizationCode(): string {
  return nanoid(32)
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: ISSUER,
    })

    return payload as unknown as TokenPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Create token response
export function createTokenResponse(
  accessToken: string,
  refreshToken?: string,
  scope?: string
): TokenResponse {
  const ttl = parseInt(process.env.ACCESS_TOKEN_TTL || '900')

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ttl,
    ...(refreshToken && { refresh_token: refreshToken }),
    ...(scope && { scope }),
  }
}
```

## PKCE Support

```typescript
// lib/oauth/pkce.ts
import crypto from 'crypto'

// Generate code verifier (43-128 characters)
export function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString('base64url')
}

// Generate code challenge from verifier
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

// Verify code challenge
export function verifyCodeChallenge(
  verifier: string,
  challenge: string,
  method: 'S256' | 'plain' = 'S256'
): boolean {
  if (method === 'plain') {
    return verifier === challenge
  }

  const calculatedChallenge = generateCodeChallenge(verifier)
  return calculatedChallenge === challenge
}
```

## Storage Layer

```typescript
// lib/oauth/storage.ts
import { Redis } from '@upstash/redis'
import { AuthorizationCode, RefreshTokenData, OAuthClient } from './types'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Authorization Code Storage
export async function storeAuthCode(code: AuthorizationCode): Promise<void> {
  const ttl = parseInt(process.env.AUTH_CODE_TTL || '600')
  await redis.setex(`auth_code:${code.code}`, ttl, JSON.stringify(code))
}

export async function getAuthCode(code: string): Promise<AuthorizationCode | null> {
  const data = await redis.get<string>(`auth_code:${code}`)
  if (!data) return null
  return typeof data === 'string' ? JSON.parse(data) : data
}

export async function deleteAuthCode(code: string): Promise<void> {
  await redis.del(`auth_code:${code}`)
}

// Refresh Token Storage
export async function storeRefreshToken(data: RefreshTokenData): Promise<void> {
  const ttl = parseInt(process.env.REFRESH_TOKEN_TTL || '604800')
  await redis.setex(`refresh_token:${data.token}`, ttl, JSON.stringify(data))

  // Also index by user for revocation
  await redis.sadd(`user_tokens:${data.userId}`, data.token)
}

export async function getRefreshToken(token: string): Promise<RefreshTokenData | null> {
  const data = await redis.get<string>(`refresh_token:${token}`)
  if (!data) return null
  return typeof data === 'string' ? JSON.parse(data) : data
}

export async function deleteRefreshToken(token: string): Promise<void> {
  const data = await getRefreshToken(token)
  if (data) {
    await redis.del(`refresh_token:${token}`)
    await redis.srem(`user_tokens:${data.userId}`, token)
  }
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  const tokens = await redis.smembers(`user_tokens:${userId}`)
  if (tokens.length > 0) {
    await redis.del(...tokens.map(t => `refresh_token:${t}`))
    await redis.del(`user_tokens:${userId}`)
  }
}

// Client Storage (could also be in database)
const clients: Map<string, OAuthClient> = new Map([
  ['demo-client', {
    id: 'demo-client',
    secret: 'demo-secret',
    name: 'Demo Application',
    redirectUris: ['http://localhost:3000/callback'],
    allowedGrants: ['authorization_code', 'refresh_token'],
    allowedScopes: ['openid', 'profile', 'email', 'read', 'write'],
  }],
])

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  return clients.get(clientId) || null
}

export async function validateClient(
  clientId: string,
  clientSecret?: string
): Promise<OAuthClient | null> {
  const client = await getClient(clientId)
  if (!client) return null

  // For public clients (SPAs, mobile), secret is optional
  if (clientSecret && client.secret !== clientSecret) return null

  return client
}
```

## Authorization Code Flow

```typescript
// app/api/oauth/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getClient, storeAuthCode } from '@/lib/oauth/storage'
import { generateAuthorizationCode } from '@/lib/oauth/tokens'
import { AuthorizationCode } from '@/lib/oauth/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const response_type = searchParams.get('response_type')
  const client_id = searchParams.get('client_id')
  const redirect_uri = searchParams.get('redirect_uri')
  const scope = searchParams.get('scope') || ''
  const state = searchParams.get('state')
  const code_challenge = searchParams.get('code_challenge')
  const code_challenge_method = searchParams.get('code_challenge_method') as 'S256' | 'plain' | null

  // Validate required parameters
  if (response_type !== 'code') {
    return errorResponse(redirect_uri, 'unsupported_response_type', state)
  }

  if (!client_id) {
    return errorResponse(redirect_uri, 'invalid_request', state, 'client_id required')
  }

  // Validate client
  const client = await getClient(client_id)
  if (!client) {
    return errorResponse(redirect_uri, 'invalid_client', state)
  }

  // Validate redirect URI
  if (!redirect_uri || !client.redirectUris.includes(redirect_uri)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid redirect_uri' },
      { status: 400 }
    )
  }

  // Validate grant type
  if (!client.allowedGrants.includes('authorization_code')) {
    return errorResponse(redirect_uri, 'unauthorized_client', state)
  }

  // Validate scopes
  const requestedScopes = scope.split(' ').filter(Boolean)
  const invalidScopes = requestedScopes.filter(s => !client.allowedScopes.includes(s))
  if (invalidScopes.length > 0) {
    return errorResponse(redirect_uri, 'invalid_scope', state)
  }

  // Check if user is authenticated
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Generate authorization code
  const code = generateAuthorizationCode()
  const authCode: AuthorizationCode = {
    code,
    clientId: client_id,
    userId: session.user.id,
    redirectUri: redirect_uri,
    scope,
    codeChallenge: code_challenge || undefined,
    codeChallengeMethod: code_challenge_method || undefined,
    expiresAt: new Date(Date.now() + 600000), // 10 minutes
  }

  await storeAuthCode(authCode)

  // Redirect with authorization code
  const callbackUrl = new URL(redirect_uri)
  callbackUrl.searchParams.set('code', code)
  if (state) callbackUrl.searchParams.set('state', state)

  return NextResponse.redirect(callbackUrl)
}

function errorResponse(
  redirectUri: string | null,
  error: string,
  state: string | null,
  description?: string
): NextResponse {
  if (!redirectUri) {
    return NextResponse.json({ error, error_description: description }, { status: 400 })
  }

  const url = new URL(redirectUri)
  url.searchParams.set('error', error)
  if (description) url.searchParams.set('error_description', description)
  if (state) url.searchParams.set('state', state)

  return NextResponse.redirect(url)
}
```

## Token Endpoint

```typescript
// app/api/oauth/token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  validateClient,
  getAuthCode,
  deleteAuthCode,
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
} from '@/lib/oauth/storage'
import {
  generateAccessToken,
  generateRefreshToken,
  createTokenResponse,
} from '@/lib/oauth/tokens'
import { verifyCodeChallenge } from '@/lib/oauth/pkce'
import { TokenResponse, ErrorResponse } from '@/lib/oauth/types'

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type')

  let body: Record<string, string>
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  } else {
    body = await request.json()
  }

  const { grant_type } = body

  // Get client credentials from header or body
  let clientId: string | undefined
  let clientSecret: string | undefined

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
    const [id, secret] = credentials.split(':')
    clientId = decodeURIComponent(id)
    clientSecret = decodeURIComponent(secret)
  } else {
    clientId = body.client_id
    clientSecret = body.client_secret
  }

  if (!clientId) {
    return errorResponse('invalid_client', 'client_id required')
  }

  switch (grant_type) {
    case 'authorization_code':
      return handleAuthorizationCode(clientId, clientSecret, body)

    case 'refresh_token':
      return handleRefreshToken(clientId, clientSecret, body)

    case 'client_credentials':
      return handleClientCredentials(clientId, clientSecret, body)

    default:
      return errorResponse('unsupported_grant_type')
  }
}

async function handleAuthorizationCode(
  clientId: string,
  clientSecret: string | undefined,
  body: Record<string, string>
): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  const { code, redirect_uri, code_verifier } = body

  if (!code) {
    return errorResponse('invalid_request', 'code required')
  }

  // Validate client
  const client = await validateClient(clientId, clientSecret)
  if (!client) {
    return errorResponse('invalid_client')
  }

  if (!client.allowedGrants.includes('authorization_code')) {
    return errorResponse('unauthorized_client')
  }

  // Get and validate authorization code
  const authCode = await getAuthCode(code)
  if (!authCode) {
    return errorResponse('invalid_grant', 'Invalid or expired code')
  }

  // Verify code belongs to this client
  if (authCode.clientId !== clientId) {
    return errorResponse('invalid_grant')
  }

  // Verify redirect URI matches
  if (authCode.redirectUri !== redirect_uri) {
    return errorResponse('invalid_grant', 'redirect_uri mismatch')
  }

  // Verify PKCE if code challenge was provided
  if (authCode.codeChallenge) {
    if (!code_verifier) {
      return errorResponse('invalid_request', 'code_verifier required')
    }

    const validChallenge = verifyCodeChallenge(
      code_verifier,
      authCode.codeChallenge,
      authCode.codeChallengeMethod
    )

    if (!validChallenge) {
      return errorResponse('invalid_grant', 'Invalid code_verifier')
    }
  }

  // Delete the authorization code (one-time use)
  await deleteAuthCode(code)

  // Generate tokens
  const accessToken = await generateAccessToken({
    sub: authCode.userId,
    client_id: clientId,
    scope: authCode.scope,
  })

  const refreshToken = await generateRefreshToken()
  await storeRefreshToken({
    token: refreshToken,
    clientId,
    userId: authCode.userId,
    scope: authCode.scope,
    expiresAt: new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_TTL || '604800') * 1000),
  })

  return NextResponse.json(createTokenResponse(accessToken, refreshToken, authCode.scope))
}

async function handleRefreshToken(
  clientId: string,
  clientSecret: string | undefined,
  body: Record<string, string>
): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  const { refresh_token, scope } = body

  if (!refresh_token) {
    return errorResponse('invalid_request', 'refresh_token required')
  }

  // Validate client
  const client = await validateClient(clientId, clientSecret)
  if (!client || !client.allowedGrants.includes('refresh_token')) {
    return errorResponse('invalid_client')
  }

  // Get refresh token data
  const tokenData = await getRefreshToken(refresh_token)
  if (!tokenData || tokenData.clientId !== clientId) {
    return errorResponse('invalid_grant', 'Invalid refresh token')
  }

  // Check if token is expired
  if (new Date() > tokenData.expiresAt) {
    await deleteRefreshToken(refresh_token)
    return errorResponse('invalid_grant', 'Refresh token expired')
  }

  // Validate scope (can only request same or subset of original scope)
  const requestedScope = scope || tokenData.scope
  const originalScopes = tokenData.scope.split(' ')
  const requestedScopes = requestedScope.split(' ')
  const invalidScopes = requestedScopes.filter(s => !originalScopes.includes(s))

  if (invalidScopes.length > 0) {
    return errorResponse('invalid_scope')
  }

  // Generate new access token
  const accessToken = await generateAccessToken({
    sub: tokenData.userId,
    client_id: clientId,
    scope: requestedScope,
  })

  // Optionally rotate refresh token
  const newRefreshToken = await generateRefreshToken()
  await deleteRefreshToken(refresh_token)
  await storeRefreshToken({
    token: newRefreshToken,
    clientId,
    userId: tokenData.userId,
    scope: requestedScope,
    expiresAt: new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_TTL || '604800') * 1000),
  })

  return NextResponse.json(createTokenResponse(accessToken, newRefreshToken, requestedScope))
}

async function handleClientCredentials(
  clientId: string,
  clientSecret: string | undefined,
  body: Record<string, string>
): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  const { scope } = body

  // Client credentials requires client secret
  if (!clientSecret) {
    return errorResponse('invalid_client', 'client_secret required')
  }

  // Validate client
  const client = await validateClient(clientId, clientSecret)
  if (!client || !client.allowedGrants.includes('client_credentials')) {
    return errorResponse('invalid_client')
  }

  // Validate scopes
  const requestedScopes = (scope || '').split(' ').filter(Boolean)
  const invalidScopes = requestedScopes.filter(s => !client.allowedScopes.includes(s))
  if (invalidScopes.length > 0) {
    return errorResponse('invalid_scope')
  }

  // Generate access token (no refresh token for client credentials)
  const accessToken = await generateAccessToken({
    sub: clientId, // For client credentials, subject is the client
    client_id: clientId,
    scope: scope || client.allowedScopes.join(' '),
  })

  return NextResponse.json(createTokenResponse(accessToken, undefined, scope))
}

function errorResponse(
  error: string,
  description?: string
): NextResponse<ErrorResponse> {
  const status = error === 'invalid_client' ? 401 : 400

  return NextResponse.json(
    { error, ...(description && { error_description: description }) },
    { status }
  )
}
```

## Token Introspection

```typescript
// app/api/oauth/introspect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateClient } from '@/lib/oauth/storage'
import { verifyAccessToken } from '@/lib/oauth/tokens'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get('token') as string

  // Authenticate client
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Basic ')) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
  const [clientId, clientSecret] = credentials.split(':')

  const client = await validateClient(clientId, clientSecret)
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }

  if (!token) {
    return NextResponse.json({ active: false })
  }

  const payload = await verifyAccessToken(token)

  if (!payload) {
    return NextResponse.json({ active: false })
  }

  return NextResponse.json({
    active: true,
    sub: payload.sub,
    client_id: payload.client_id,
    scope: payload.scope,
    exp: payload.exp,
    iat: payload.iat,
    iss: payload.iss,
    aud: payload.aud,
    token_type: 'Bearer',
  })
}
```

## Token Revocation

```typescript
// app/api/oauth/revoke/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateClient, deleteRefreshToken } from '@/lib/oauth/storage'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get('token') as string
  const token_type_hint = formData.get('token_type_hint') as string

  // Authenticate client
  const authHeader = request.headers.get('authorization')
  let clientId: string | undefined
  let clientSecret: string | undefined

  if (authHeader?.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
    ;[clientId, clientSecret] = credentials.split(':')
  } else {
    clientId = formData.get('client_id') as string
    clientSecret = formData.get('client_secret') as string
  }

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }

  const client = await validateClient(clientId, clientSecret)
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }

  if (!token) {
    // RFC 7009: respond with 200 even if token is invalid
    return new NextResponse(null, { status: 200 })
  }

  // Try to revoke as refresh token
  if (token_type_hint !== 'access_token') {
    await deleteRefreshToken(token)
  }

  // Access tokens are stateless - can't be revoked without blocklist
  // If needed, implement a token blocklist in Redis

  return new NextResponse(null, { status: 200 })
}
```

## OAuth Client Hook

```typescript
// hooks/use-oauth.ts
'use client'

import { useState, useCallback } from 'react'
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/oauth/pkce'

interface OAuthConfig {
  authorizationEndpoint: string
  tokenEndpoint: string
  clientId: string
  redirectUri: string
  scope: string
}

interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  scope: string
}

export function useOAuth(config: OAuthConfig) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start authorization flow
  const authorize = useCallback(async () => {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)
    const state = crypto.randomUUID()

    // Store verifier and state
    sessionStorage.setItem('oauth_code_verifier', codeVerifier)
    sessionStorage.setItem('oauth_state', state)

    const url = new URL(config.authorizationEndpoint)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('redirect_uri', config.redirectUri)
    url.searchParams.set('scope', config.scope)
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')

    window.location.href = url.toString()
  }, [config])

  // Handle callback
  const handleCallback = useCallback(async (code: string, state: string) => {
    setLoading(true)
    setError(null)

    // Verify state
    const savedState = sessionStorage.getItem('oauth_state')
    if (state !== savedState) {
      setError('Invalid state parameter')
      setLoading(false)
      return
    }

    // Get code verifier
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
    if (!codeVerifier) {
      setError('Missing code verifier')
      setLoading(false)
      return
    }

    // Clean up
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem('oauth_code_verifier')

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          code_verifier: codeVerifier,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_description || data.error)
      }

      const tokenData: TokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope || config.scope,
      }

      setTokenData(tokenData)
      localStorage.setItem('oauth_token', JSON.stringify(tokenData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token exchange failed')
    } finally {
      setLoading(false)
    }
  }, [config])

  // Refresh token
  const refresh = useCallback(async () => {
    if (!tokenData?.refreshToken) {
      setError('No refresh token available')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refreshToken,
          client_id: config.clientId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_description || data.error)
      }

      const newTokenData: TokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || tokenData.refreshToken,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope || tokenData.scope,
      }

      setTokenData(newTokenData)
      localStorage.setItem('oauth_token', JSON.stringify(newTokenData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token refresh failed')
      setTokenData(null)
      localStorage.removeItem('oauth_token')
    } finally {
      setLoading(false)
    }
  }, [config, tokenData])

  // Logout
  const logout = useCallback(() => {
    setTokenData(null)
    localStorage.removeItem('oauth_token')
  }, [])

  return {
    tokenData,
    loading,
    error,
    authorize,
    handleCallback,
    refresh,
    logout,
    isAuthenticated: !!tokenData && new Date() < tokenData.expiresAt,
  }
}
```

## Testing

```typescript
// __tests__/oauth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
} from '@/lib/oauth/tokens'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  verifyCodeChallenge,
} from '@/lib/oauth/pkce'

describe('OAuth 2.0', () => {
  describe('Token Generation', () => {
    it('should generate valid access token', async () => {
      const token = await generateAccessToken({
        sub: 'user-123',
        client_id: 'test-client',
        scope: 'read write',
      })

      expect(token).toBeTruthy()
      expect(token.split('.').length).toBe(3) // JWT format
    })

    it('should verify valid access token', async () => {
      const token = await generateAccessToken({
        sub: 'user-123',
        client_id: 'test-client',
        scope: 'read',
      })

      const payload = await verifyAccessToken(token)

      expect(payload?.sub).toBe('user-123')
      expect(payload?.client_id).toBe('test-client')
      expect(payload?.scope).toBe('read')
    })

    it('should reject invalid token', async () => {
      const payload = await verifyAccessToken('invalid.token.here')
      expect(payload).toBeNull()
    })

    it('should generate unique refresh tokens', async () => {
      const token1 = await generateRefreshToken()
      const token2 = await generateRefreshToken()

      expect(token1).not.toBe(token2)
      expect(token1.length).toBe(64)
    })
  })

  describe('PKCE', () => {
    it('should generate valid code verifier', () => {
      const verifier = generateCodeVerifier()
      expect(verifier.length).toBeGreaterThanOrEqual(43)
      expect(verifier.length).toBeLessThanOrEqual(128)
    })

    it('should generate valid code challenge', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)

      expect(challenge).toBeTruthy()
      expect(challenge).not.toBe(verifier)
    })

    it('should verify S256 code challenge', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)

      expect(verifyCodeChallenge(verifier, challenge, 'S256')).toBe(true)
      expect(verifyCodeChallenge('wrong-verifier', challenge, 'S256')).toBe(false)
    })

    it('should verify plain code challenge', () => {
      const verifier = 'test-verifier'
      expect(verifyCodeChallenge(verifier, verifier, 'plain')).toBe(true)
      expect(verifyCodeChallenge('wrong', verifier, 'plain')).toBe(false)
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## OAuth 2.0 Implementation

This project implements OAuth 2.0 authorization server functionality.

### Endpoints
- `GET /api/oauth/authorize` - Authorization endpoint
- `POST /api/oauth/token` - Token endpoint
- `POST /api/oauth/introspect` - Token introspection
- `POST /api/oauth/revoke` - Token revocation

### Supported Grant Types
- Authorization Code (with PKCE)
- Client Credentials
- Refresh Token

### PKCE Support
All authorization code flows support PKCE with S256 method.

### Testing
```bash
# Authorization Code Flow
curl "http://localhost:3000/api/oauth/authorize?response_type=code&client_id=demo-client&redirect_uri=http://localhost:3000/callback&scope=read&state=xyz"

# Token Exchange
curl -X POST http://localhost:3000/api/oauth/token \
  -d "grant_type=authorization_code&code=CODE&redirect_uri=http://localhost:3000/callback&client_id=demo-client"
```
```

## AI Suggestions

1. **OpenID Connect** - Add OIDC layer with ID tokens and userinfo endpoint
2. **Dynamic client registration** - Allow clients to register programmatically
3. **Pushed Authorization Requests (PAR)** - Support PAR for enhanced security
4. **DPoP tokens** - Implement Demonstrating Proof of Possession
5. **Token binding** - Bind tokens to client certificates
6. **Rich Authorization Requests (RAR)** - Support complex authorization scenarios
7. **JWT Secured Authorization Response Mode (JARM)** - Signed authorization responses
8. **Token exchange** - Implement RFC 8693 for token exchange scenarios
