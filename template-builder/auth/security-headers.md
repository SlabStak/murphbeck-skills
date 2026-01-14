# Security Headers

Comprehensive security headers configuration for Next.js applications including CSP, HSTS, and other OWASP-recommended headers.

## Overview

Security headers protect against:
- Cross-Site Scripting (XSS)
- Clickjacking
- MIME type sniffing
- Man-in-the-middle attacks
- Information disclosure
- Cross-site request forgery

## Installation

```bash
# No additional packages needed for basic headers
# For nonce-based CSP:
npm install crypto
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# CSP Configuration
CSP_REPORT_URI=https://yourdomain.report-uri.com/r/d/csp/enforce

# Feature flags
ENABLE_CSP_REPORT_ONLY=false
```

## Next.js Configuration

```typescript
// next.config.js
const securityHeaders = [
  // Prevent browsers from incorrectly detecting non-scripts as scripts
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // XSS Protection (legacy browsers)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Restrict permissions/features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Force HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
```

## Content Security Policy

```typescript
// lib/security/csp.ts
import { headers } from 'next/headers'
import crypto from 'crypto'

// Generate nonce for inline scripts
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')
}

// CSP Directive Types
interface CSPDirectives {
  'default-src': string[]
  'script-src': string[]
  'style-src': string[]
  'img-src': string[]
  'font-src': string[]
  'connect-src': string[]
  'media-src': string[]
  'object-src': string[]
  'frame-src': string[]
  'frame-ancestors': string[]
  'form-action': string[]
  'base-uri': string[]
  'manifest-src': string[]
  'worker-src': string[]
  'child-src': string[]
  'upgrade-insecure-requests'?: boolean
  'block-all-mixed-content'?: boolean
  'report-uri'?: string
  'report-to'?: string
}

// Build CSP string from directives
export function buildCSP(directives: Partial<CSPDirectives>, nonce?: string): string {
  const policy: string[] = []

  for (const [directive, value] of Object.entries(directives)) {
    if (value === true) {
      policy.push(directive)
    } else if (typeof value === 'string') {
      policy.push(`${directive} ${value}`)
    } else if (Array.isArray(value)) {
      let sources = value.join(' ')

      // Add nonce to script-src and style-src
      if (nonce && (directive === 'script-src' || directive === 'style-src')) {
        sources += ` 'nonce-${nonce}'`
      }

      policy.push(`${directive} ${sources}`)
    }
  }

  return policy.join('; ')
}

// Default CSP for Next.js apps
export function getDefaultCSP(nonce?: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  const directives: Partial<CSPDirectives> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Required for Next.js
      isDev ? "'unsafe-eval'" : '',
      // Add trusted script sources
      'https://cdn.jsdelivr.net',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components/emotion
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      // API endpoints
      process.env.NEXT_PUBLIC_API_URL || '',
      // Analytics
      'https://www.google-analytics.com',
      'https://vitals.vercel-insights.com',
      // WebSocket for HMR in development
      isDev ? 'ws://localhost:3000' : '',
      isDev ? 'wss://localhost:3000' : '',
    ].filter(Boolean),
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': [
      "'self'",
      // Trusted iframe sources (e.g., YouTube, Vimeo)
      'https://www.youtube.com',
      'https://player.vimeo.com',
    ],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'upgrade-insecure-requests': !isDev,
  }

  // Add report URI in production
  if (process.env.CSP_REPORT_URI && !isDev) {
    directives['report-uri'] = process.env.CSP_REPORT_URI
  }

  return buildCSP(directives, nonce)
}

// Stricter CSP for sensitive pages
export function getStrictCSP(nonce: string): string {
  return buildCSP({
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", `'nonce-${nonce}'`],
    'img-src': ["'self'"],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true,
  })
}
```

## Middleware with CSP Nonce

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateNonce, getDefaultCSP, getStrictCSP } from '@/lib/security/csp'

// Pages that require strict CSP
const strictCSPRoutes = ['/login', '/signup', '/account', '/checkout']

export function middleware(request: NextRequest) {
  const nonce = generateNonce()
  const requestHeaders = new Headers(request.headers)

  // Pass nonce to components via header
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Determine CSP policy
  const isStrictRoute = strictCSPRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  const csp = isStrictRoute
    ? getStrictCSP(nonce)
    : getDefaultCSP(nonce)

  // Set CSP header
  const cspHeader = process.env.ENABLE_CSP_REPORT_ONLY === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy'

  response.headers.set(cspHeader, csp)

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
```

## Server Component with Nonce

```typescript
// app/layout.tsx
import { headers } from 'next/headers'
import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = headers().get('x-nonce') || ''

  return (
    <html lang="en">
      <head>
        {/* Inline script with nonce */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              window.__NONCE__ = '${nonce}';
            `,
          }}
        />
      </head>
      <body>
        {children}

        {/* External script with nonce */}
        <Script
          src="https://www.googletagmanager.com/gtag/js"
          nonce={nonce}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

## Security Headers Utility

```typescript
// lib/security/headers.ts

// All security headers with explanations
export const SECURITY_HEADERS = {
  // Prevents MIME type sniffing
  'X-Content-Type-Options': {
    value: 'nosniff',
    description: 'Prevents browsers from MIME-sniffing a response away from the declared content-type',
  },

  // Prevents clickjacking
  'X-Frame-Options': {
    value: 'DENY', // or 'SAMEORIGIN'
    description: 'Indicates whether the browser should be allowed to render a page in a frame',
  },

  // XSS Protection (legacy)
  'X-XSS-Protection': {
    value: '1; mode=block',
    description: 'Enables XSS filtering in legacy browsers',
  },

  // Referrer information control
  'Referrer-Policy': {
    value: 'strict-origin-when-cross-origin',
    description: 'Controls how much referrer information should be included with requests',
    options: [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ],
  },

  // HTTPS enforcement
  'Strict-Transport-Security': {
    value: 'max-age=31536000; includeSubDomains; preload',
    description: 'Forces browsers to use HTTPS for the specified duration',
  },

  // Feature/permissions control
  'Permissions-Policy': {
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    description: 'Controls which browser features can be used',
  },

  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': {
    value: 'same-origin',
    description: 'Ensures a top-level document does not share a browsing context group with cross-origin documents',
  },

  'Cross-Origin-Embedder-Policy': {
    value: 'require-corp',
    description: 'Prevents a document from loading cross-origin resources that do not explicitly grant permission',
  },

  'Cross-Origin-Resource-Policy': {
    value: 'same-origin',
    description: 'Protects against certain cross-origin requests',
  },
} as const

// Build headers array for next.config.js
export function buildSecurityHeaders(
  overrides: Partial<Record<keyof typeof SECURITY_HEADERS, string>> = {}
) {
  return Object.entries(SECURITY_HEADERS).map(([key, config]) => ({
    key,
    value: overrides[key as keyof typeof SECURITY_HEADERS] || config.value,
  }))
}

// Permissions Policy builder
export function buildPermissionsPolicy(permissions: {
  camera?: string[]
  microphone?: string[]
  geolocation?: string[]
  fullscreen?: string[]
  payment?: string[]
  usb?: string[]
  accelerometer?: string[]
  gyroscope?: string[]
  magnetometer?: string[]
  autoplay?: string[]
  'picture-in-picture'?: string[]
  'interest-cohort'?: string[]
}) {
  return Object.entries(permissions)
    .map(([feature, allowlist]) => {
      if (!allowlist || allowlist.length === 0) {
        return `${feature}=()`
      }
      const sources = allowlist.map(s => s === 'self' ? 'self' : `"${s}"`).join(' ')
      return `${feature}=(${sources})`
    })
    .join(', ')
}
```

## API Route Security Headers

```typescript
// lib/security/api-headers.ts
import { NextResponse } from 'next/server'

export function withSecurityHeaders(response: NextResponse): NextResponse {
  // CORS headers (configure as needed)
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  response.headers.set('Access-Control-Max-Age', '86400')

  // Security headers for API responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')

  return response
}

// Wrapper for API handlers
export function withSecureResponse<T>(
  data: T,
  options: ResponseInit = {}
): NextResponse {
  const response = NextResponse.json(data, options)
  return withSecurityHeaders(response)
}

// Example usage in API route
// app/api/data/route.ts
import { withSecureResponse } from '@/lib/security/api-headers'

export async function GET() {
  const data = { message: 'Hello' }
  return withSecureResponse(data)
}
```

## CORS Configuration

```typescript
// lib/security/cors.ts
import { NextRequest, NextResponse } from 'next/server'

interface CORSOptions {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  exposedHeaders?: string[]
  maxAge?: number
  credentials?: boolean
}

const defaultOptions: CORSOptions = {
  allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400,
  credentials: true,
}

export function cors(request: NextRequest, options: Partial<CORSOptions> = {}) {
  const config = { ...defaultOptions, ...options }
  const origin = request.headers.get('origin')

  // Check if origin is allowed
  const isAllowedOrigin = config.allowedOrigins.includes('*') ||
    (origin && config.allowedOrigins.includes(origin))

  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
  }

  if (isAllowedOrigin && origin) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  if (config.exposedHeaders?.length) {
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ')
  }

  if (config.maxAge) {
    headers['Access-Control-Max-Age'] = config.maxAge.toString()
  }

  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

// Middleware for CORS preflight
export function handleCORSPreflight(
  request: NextRequest,
  options?: Partial<CORSOptions>
): NextResponse | null {
  if (request.method !== 'OPTIONS') return null

  const corsHeaders = cors(request, options)
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

// Apply CORS to response
export function applyCORS(
  request: NextRequest,
  response: NextResponse,
  options?: Partial<CORSOptions>
): NextResponse {
  const corsHeaders = cors(request, options)

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }

  return response
}
```

## Security Audit Checker

```typescript
// lib/security/audit.ts

interface SecurityAuditResult {
  header: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  recommendation?: string
}

export function auditSecurityHeaders(headers: Headers): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = []

  // Check X-Content-Type-Options
  const contentTypeOptions = headers.get('X-Content-Type-Options')
  results.push({
    header: 'X-Content-Type-Options',
    status: contentTypeOptions === 'nosniff' ? 'pass' : 'fail',
    message: contentTypeOptions
      ? `Set to: ${contentTypeOptions}`
      : 'Not set',
    recommendation: contentTypeOptions !== 'nosniff'
      ? 'Set to "nosniff" to prevent MIME sniffing'
      : undefined,
  })

  // Check X-Frame-Options
  const frameOptions = headers.get('X-Frame-Options')
  results.push({
    header: 'X-Frame-Options',
    status: frameOptions ? 'pass' : 'fail',
    message: frameOptions ? `Set to: ${frameOptions}` : 'Not set',
    recommendation: !frameOptions
      ? 'Set to "DENY" or "SAMEORIGIN" to prevent clickjacking'
      : undefined,
  })

  // Check Strict-Transport-Security
  const hsts = headers.get('Strict-Transport-Security')
  if (hsts) {
    const hasPreload = hsts.includes('preload')
    const hasSubdomains = hsts.includes('includeSubDomains')
    const maxAgeMatch = hsts.match(/max-age=(\d+)/)
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0

    results.push({
      header: 'Strict-Transport-Security',
      status: maxAge >= 31536000 && hasSubdomains ? 'pass' : 'warning',
      message: `max-age=${maxAge}, includeSubDomains=${hasSubdomains}, preload=${hasPreload}`,
      recommendation: maxAge < 31536000
        ? 'Set max-age to at least 31536000 (1 year)'
        : undefined,
    })
  } else {
    results.push({
      header: 'Strict-Transport-Security',
      status: 'fail',
      message: 'Not set',
      recommendation: 'Enable HSTS with "max-age=31536000; includeSubDomains; preload"',
    })
  }

  // Check Content-Security-Policy
  const csp = headers.get('Content-Security-Policy')
  if (csp) {
    const hasUnsafeInline = csp.includes("'unsafe-inline'")
    const hasUnsafeEval = csp.includes("'unsafe-eval'")

    results.push({
      header: 'Content-Security-Policy',
      status: hasUnsafeInline || hasUnsafeEval ? 'warning' : 'pass',
      message: hasUnsafeInline || hasUnsafeEval
        ? `Contains ${hasUnsafeInline ? "'unsafe-inline'" : ''} ${hasUnsafeEval ? "'unsafe-eval'" : ''}`.trim()
        : 'Configured',
      recommendation: hasUnsafeInline
        ? 'Use nonces or hashes instead of unsafe-inline'
        : undefined,
    })
  } else {
    results.push({
      header: 'Content-Security-Policy',
      status: 'fail',
      message: 'Not set',
      recommendation: 'Configure CSP to prevent XSS attacks',
    })
  }

  // Check Referrer-Policy
  const referrerPolicy = headers.get('Referrer-Policy')
  const goodPolicies = ['strict-origin-when-cross-origin', 'strict-origin', 'same-origin', 'no-referrer']
  results.push({
    header: 'Referrer-Policy',
    status: referrerPolicy && goodPolicies.includes(referrerPolicy) ? 'pass' : 'warning',
    message: referrerPolicy ? `Set to: ${referrerPolicy}` : 'Not set',
    recommendation: !referrerPolicy
      ? 'Set to "strict-origin-when-cross-origin" for best balance of privacy and functionality'
      : undefined,
  })

  // Check Permissions-Policy
  const permissionsPolicy = headers.get('Permissions-Policy')
  results.push({
    header: 'Permissions-Policy',
    status: permissionsPolicy ? 'pass' : 'warning',
    message: permissionsPolicy ? 'Configured' : 'Not set',
    recommendation: !permissionsPolicy
      ? 'Configure to restrict access to browser features'
      : undefined,
  })

  return results
}

// API route for security audit
// app/api/security/audit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditSecurityHeaders } from '@/lib/security/audit'

export async function GET(request: NextRequest) {
  // Only allow in development or for admins
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Fetch the homepage to check headers
  const response = await fetch(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  const results = auditSecurityHeaders(response.headers)

  const score = results.filter(r => r.status === 'pass').length / results.length * 100

  return NextResponse.json({
    score: Math.round(score),
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    results,
  })
}
```

## Testing

```typescript
// __tests__/security-headers.test.ts
import { describe, it, expect } from 'vitest'
import { buildCSP, getDefaultCSP, getStrictCSP, generateNonce } from '@/lib/security/csp'
import { auditSecurityHeaders } from '@/lib/security/audit'

describe('Security Headers', () => {
  describe('CSP', () => {
    it('should generate valid nonce', () => {
      const nonce = generateNonce()
      expect(nonce).toHaveLength(24) // base64 of 16 bytes
    })

    it('should build CSP string', () => {
      const csp = buildCSP({
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://cdn.example.com'],
      })

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self' https://cdn.example.com")
    })

    it('should include nonce in script-src', () => {
      const nonce = 'test-nonce'
      const csp = buildCSP({ 'script-src': ["'self'"] }, nonce)

      expect(csp).toContain(`'nonce-${nonce}'`)
    })

    it('should generate default CSP', () => {
      const csp = getDefaultCSP()

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain('object-src')
    })

    it('should generate strict CSP with nonce', () => {
      const nonce = 'strict-nonce'
      const csp = getStrictCSP(nonce)

      expect(csp).toContain(`'nonce-${nonce}'`)
      expect(csp).toContain("frame-src 'none'")
      expect(csp).toContain("frame-ancestors 'none'")
    })
  })

  describe('Security Audit', () => {
    it('should pass for good headers', () => {
      const headers = new Headers({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=()',
      })

      const results = auditSecurityHeaders(headers)
      const passed = results.filter(r => r.status === 'pass').length

      expect(passed).toBeGreaterThanOrEqual(5)
    })

    it('should fail for missing headers', () => {
      const headers = new Headers({})

      const results = auditSecurityHeaders(headers)
      const failed = results.filter(r => r.status === 'fail').length

      expect(failed).toBeGreaterThan(0)
    })

    it('should warn for unsafe-inline CSP', () => {
      const headers = new Headers({
        'Content-Security-Policy': "script-src 'unsafe-inline'",
      })

      const results = auditSecurityHeaders(headers)
      const cspResult = results.find(r => r.header === 'Content-Security-Policy')

      expect(cspResult?.status).toBe('warning')
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## Security Headers

This project implements comprehensive security headers.

### Key Files
- `lib/security/csp.ts` - Content Security Policy generation
- `lib/security/headers.ts` - Security headers configuration
- `lib/security/cors.ts` - CORS configuration
- `middleware.ts` - Security middleware

### Security Headers Applied
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP with nonces)
- `Referrer-Policy`
- `Permissions-Policy`

### CSP Nonces
Inline scripts require a nonce:
```tsx
<script nonce={nonce}>...</script>
```

### Testing
```bash
# Run security audit (dev only)
curl http://localhost:3000/api/security/audit

# Check headers with curl
curl -I https://yourdomain.com
```

### External Tools
- securityheaders.com - Grade your headers
- observatory.mozilla.org - Full security scan
```

## AI Suggestions

1. **Subresource Integrity (SRI)** - Add integrity attributes to external scripts and stylesheets
2. **Feature-Policy deprecation** - Move from Feature-Policy to Permissions-Policy for modern browsers
3. **Report-To header** - Configure reporting API for CSP violations and deprecations
4. **Clear-Site-Data** - Implement logout endpoint that clears all browser data
5. **Cross-Origin-Opener-Policy** - Add COOP for cross-origin isolation
6. **NEL (Network Error Logging)** - Configure network error reporting
7. **Expect-CT** - Certificate Transparency enforcement (being deprecated, use HSTS)
8. **CSP violation reporting** - Set up endpoint to collect and analyze CSP violations
