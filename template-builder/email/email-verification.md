# Email Verification System

## Overview
Complete email verification system with secure token generation, rate limiting, multi-purpose verification (signup, email change, password reset), and domain validation.

## Quick Start
```bash
npm install nodemailer crypto-js jsonwebtoken rate-limiter-flexible disposable-email-domains
```

## Implementation

### TypeScript Email Verification Service
```typescript
// email-verification.service.ts
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import disposableDomains from 'disposable-email-domains';

interface VerificationToken {
  id: string;
  userId: string;
  email: string;
  type: 'signup' | 'email_change' | 'password_reset' | 'magic_link';
  token: string;
  hashedToken: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface VerificationResult {
  success: boolean;
  userId?: string;
  email?: string;
  type?: string;
  error?: string;
}

interface EmailValidationResult {
  valid: boolean;
  email: string;
  normalizedEmail: string;
  domain: string;
  isDisposable: boolean;
  isFreeProvider: boolean;
  hasMxRecords: boolean;
  errors: string[];
}

interface VerificationConfig {
  tokenLength: number;
  tokenExpiry: {
    signup: number;       // minutes
    email_change: number;
    password_reset: number;
    magic_link: number;
  };
  maxAttempts: number;
  rateLimitWindow: number;  // seconds
  rateLimitMax: number;
  baseUrl: string;
  jwtSecret: string;
}

const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
  'zoho.com', 'yandex.com', 'gmx.com', 'live.com'
];

class EmailVerificationService {
  private tokens: Map<string, VerificationToken> = new Map();
  private rateLimiter: RateLimiterMemory;
  private transporter: nodemailer.Transporter;
  private config: VerificationConfig;

  constructor(config: Partial<VerificationConfig> = {}) {
    this.config = {
      tokenLength: 32,
      tokenExpiry: {
        signup: 60 * 24,        // 24 hours
        email_change: 60,        // 1 hour
        password_reset: 30,      // 30 minutes
        magic_link: 15,          // 15 minutes
      },
      maxAttempts: 5,
      rateLimitWindow: 3600,     // 1 hour
      rateLimitMax: 5,
      baseUrl: process.env.APP_URL || 'http://localhost:3000',
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      ...config,
    };

    this.rateLimiter = new RateLimiterMemory({
      points: this.config.rateLimitMax,
      duration: this.config.rateLimitWindow,
    });

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Validate email format and domain
  async validateEmail(email: string): Promise<EmailValidationResult> {
    const errors: string[] = [];
    const normalizedEmail = this.normalizeEmail(email);
    const domain = email.split('@')[1]?.toLowerCase();

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    // Check disposable domain
    const isDisposable = disposableDomains.includes(domain);
    if (isDisposable) {
      errors.push('Disposable email addresses are not allowed');
    }

    // Check free provider
    const isFreeProvider = FREE_EMAIL_PROVIDERS.includes(domain);

    // Check MX records
    let hasMxRecords = false;
    try {
      const dns = await import('dns').then(m => m.promises);
      const mxRecords = await dns.resolveMx(domain);
      hasMxRecords = mxRecords.length > 0;
    } catch {
      errors.push('Domain does not have valid MX records');
    }

    return {
      valid: errors.length === 0,
      email,
      normalizedEmail,
      domain,
      isDisposable,
      isFreeProvider,
      hasMxRecords,
      errors,
    };
  }

  // Normalize email (handle Gmail + aliases, case, etc.)
  private normalizeEmail(email: string): string {
    const [localPart, domain] = email.toLowerCase().split('@');

    // Handle Gmail aliases
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      const normalized = localPart.split('+')[0].replace(/\./g, '');
      return `${normalized}@gmail.com`;
    }

    // Handle other providers with + aliases
    const normalizedLocal = localPart.split('+')[0];
    return `${normalizedLocal}@${domain}`;
  }

  // Generate secure verification token
  private generateToken(): { token: string; hashedToken: string } {
    const token = crypto.randomBytes(this.config.tokenLength).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hashedToken };
  }

  // Create verification request
  async createVerification(
    userId: string,
    email: string,
    type: VerificationToken['type'],
    metadata?: Record<string, unknown>
  ): Promise<{ token: string; expiresAt: Date; verificationUrl: string }> {
    // Rate limiting
    try {
      await this.rateLimiter.consume(email);
    } catch {
      throw new Error('Too many verification requests. Please try again later.');
    }

    // Validate email
    const validation = await this.validateEmail(email);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Invalidate existing tokens of same type
    await this.invalidateExistingTokens(userId, type);

    // Generate new token
    const { token, hashedToken } = this.generateToken();
    const expiryMinutes = this.config.tokenExpiry[type];
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const verificationToken: VerificationToken = {
      id: crypto.randomUUID(),
      userId,
      email: validation.normalizedEmail,
      type,
      token,
      hashedToken,
      expiresAt,
      attempts: 0,
      verified: false,
      metadata,
      createdAt: new Date(),
    };

    this.tokens.set(hashedToken, verificationToken);

    // Build verification URL
    const verificationUrl = this.buildVerificationUrl(token, type);

    return { token, expiresAt, verificationUrl };
  }

  // Build verification URL
  private buildVerificationUrl(token: string, type: string): string {
    const paths: Record<string, string> = {
      signup: '/verify-email',
      email_change: '/verify-email-change',
      password_reset: '/reset-password',
      magic_link: '/auth/magic-link',
    };

    return `${this.config.baseUrl}${paths[type] || '/verify'}?token=${token}`;
  }

  // Verify token
  async verifyToken(token: string): Promise<VerificationResult> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verificationToken = this.tokens.get(hashedToken);

    if (!verificationToken) {
      return { success: false, error: 'Invalid verification token' };
    }

    // Check expiration
    if (new Date() > verificationToken.expiresAt) {
      this.tokens.delete(hashedToken);
      return { success: false, error: 'Verification token has expired' };
    }

    // Check attempts
    if (verificationToken.attempts >= this.config.maxAttempts) {
      this.tokens.delete(hashedToken);
      return { success: false, error: 'Too many verification attempts' };
    }

    // Check if already verified
    if (verificationToken.verified) {
      return { success: false, error: 'Token has already been used' };
    }

    // Mark as verified
    verificationToken.verified = true;
    verificationToken.attempts++;
    this.tokens.set(hashedToken, verificationToken);

    return {
      success: true,
      userId: verificationToken.userId,
      email: verificationToken.email,
      type: verificationToken.type,
    };
  }

  // Invalidate existing tokens
  private async invalidateExistingTokens(userId: string, type: string): Promise<void> {
    for (const [hash, token] of this.tokens.entries()) {
      if (token.userId === userId && token.type === type && !token.verified) {
        this.tokens.delete(hash);
      }
    }
  }

  // Send verification email
  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    type: VerificationToken['type'],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const templates = this.getEmailTemplates(type, verificationUrl, metadata);

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@example.com',
      to: email,
      subject: templates.subject,
      html: templates.html,
      text: templates.text,
    });
  }

  // Get email templates
  private getEmailTemplates(
    type: string,
    verificationUrl: string,
    metadata?: Record<string, unknown>
  ): { subject: string; html: string; text: string } {
    const templates: Record<string, { subject: string; html: string; text: string }> = {
      signup: {
        subject: 'Verify your email address',
        html: `
          <h1>Welcome!</h1>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        `,
        text: `Welcome! Please verify your email by visiting: ${verificationUrl}\nThis link expires in 24 hours.`,
      },
      email_change: {
        subject: 'Confirm your new email address',
        html: `
          <h1>Email Change Request</h1>
          <p>You requested to change your email address. Click below to confirm:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Confirm Email Change</a>
          <p>If you didn't request this change, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
        text: `Email Change Request\nConfirm by visiting: ${verificationUrl}\nThis link expires in 1 hour.`,
      },
      password_reset: {
        subject: 'Reset your password',
        html: `
          <h1>Password Reset</h1>
          <p>You requested to reset your password. Click below to continue:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p>If you didn't request this, please ignore this email. Your password will not change.</p>
          <p>This link will expire in 30 minutes.</p>
        `,
        text: `Password Reset\nReset your password: ${verificationUrl}\nThis link expires in 30 minutes.`,
      },
      magic_link: {
        subject: 'Your login link',
        html: `
          <h1>Login Link</h1>
          <p>Click below to log in:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px;">Log In</a>
          <p>This link will expire in 15 minutes.</p>
        `,
        text: `Login Link\nLog in: ${verificationUrl}\nThis link expires in 15 minutes.`,
      },
    };

    return templates[type] || templates.signup;
  }

  // Create JWT verification token (alternative approach)
  createJWTToken(
    userId: string,
    email: string,
    type: string,
    expiresIn: string = '1h'
  ): string {
    return jwt.sign(
      { userId, email, type },
      this.config.jwtSecret,
      { expiresIn }
    );
  }

  // Verify JWT token
  verifyJWTToken(token: string): { userId: string; email: string; type: string } | null {
    try {
      return jwt.verify(token, this.config.jwtSecret) as {
        userId: string;
        email: string;
        type: string;
      };
    } catch {
      return null;
    }
  }

  // Cleanup expired tokens
  async cleanupExpiredTokens(): Promise<number> {
    let cleaned = 0;
    const now = new Date();

    for (const [hash, token] of this.tokens.entries()) {
      if (token.expiresAt < now || token.verified) {
        this.tokens.delete(hash);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Get pending verification for user
  async getPendingVerification(
    userId: string,
    type: string
  ): Promise<{ email: string; expiresAt: Date } | null> {
    for (const token of this.tokens.values()) {
      if (
        token.userId === userId &&
        token.type === type &&
        !token.verified &&
        token.expiresAt > new Date()
      ) {
        return {
          email: token.email,
          expiresAt: token.expiresAt,
        };
      }
    }
    return null;
  }
}

export const emailVerificationService = new EmailVerificationService();
```

### Express.js API Routes
```typescript
// routes/email-verification.routes.ts
import { Router, Request, Response } from 'express';
import { emailVerificationService } from '../services/email-verification.service';

const router = Router();

// Request email verification (signup)
router.post('/verify-email/request', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { email } = req.body;

    const { verificationUrl, expiresAt } = await emailVerificationService.createVerification(
      userId,
      email,
      'signup'
    );

    await emailVerificationService.sendVerificationEmail(
      email,
      verificationUrl,
      'signup'
    );

    res.json({
      success: true,
      message: 'Verification email sent',
      expiresAt,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Verify email token
router.post('/verify-email/confirm', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await emailVerificationService.verifyToken(token);

    if (result.success) {
      // Update user's email verification status in database
      // await userService.markEmailVerified(result.userId, result.email);

      res.json({
        success: true,
        message: 'Email verified successfully',
        userId: result.userId,
        email: result.email,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Request password reset
router.post('/password-reset/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user by email (implement your user lookup)
    const userId = 'user_from_db'; // await userService.findByEmail(email);

    if (!userId) {
      // Don't reveal if email exists
      res.json({
        success: true,
        message: 'If an account exists, a reset email will be sent',
      });
      return;
    }

    const { verificationUrl, expiresAt } = await emailVerificationService.createVerification(
      userId,
      email,
      'password_reset'
    );

    await emailVerificationService.sendVerificationEmail(
      email,
      verificationUrl,
      'password_reset'
    );

    res.json({
      success: true,
      message: 'If an account exists, a reset email will be sent',
      expiresAt,
    });
  } catch (error) {
    // Don't reveal errors for security
    res.json({
      success: true,
      message: 'If an account exists, a reset email will be sent',
    });
  }
});

// Verify password reset token
router.post('/password-reset/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await emailVerificationService.verifyToken(token);

    if (result.success && result.type === 'password_reset') {
      // Generate a short-lived session token for password change
      const sessionToken = emailVerificationService.createJWTToken(
        result.userId!,
        result.email!,
        'password_reset_session',
        '10m'
      );

      res.json({
        success: true,
        sessionToken,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Invalid token',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Request email change
router.post('/email-change/request', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { newEmail } = req.body;

    const { verificationUrl, expiresAt } = await emailVerificationService.createVerification(
      userId,
      newEmail,
      'email_change',
      { oldEmail: req.user!.email }
    );

    await emailVerificationService.sendVerificationEmail(
      newEmail,
      verificationUrl,
      'email_change'
    );

    res.json({
      success: true,
      message: 'Verification email sent to new address',
      expiresAt,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Confirm email change
router.post('/email-change/confirm', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await emailVerificationService.verifyToken(token);

    if (result.success && result.type === 'email_change') {
      // Update user's email in database
      // await userService.updateEmail(result.userId, result.email);

      res.json({
        success: true,
        message: 'Email changed successfully',
        newEmail: result.email,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Invalid token',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Request magic link login
router.post('/magic-link/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find or create user by email
    const userId = 'user_from_db'; // await userService.findOrCreateByEmail(email);

    const { verificationUrl, expiresAt } = await emailVerificationService.createVerification(
      userId,
      email,
      'magic_link'
    );

    await emailVerificationService.sendVerificationEmail(
      email,
      verificationUrl,
      'magic_link'
    );

    res.json({
      success: true,
      message: 'Magic link sent to your email',
      expiresAt,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Verify magic link
router.get('/magic-link/verify', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const result = await emailVerificationService.verifyToken(token);

    if (result.success && result.type === 'magic_link') {
      // Create user session
      const authToken = emailVerificationService.createJWTToken(
        result.userId!,
        result.email!,
        'auth',
        '7d'
      );

      res.json({
        success: true,
        authToken,
        userId: result.userId,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Invalid magic link',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Validate email (public endpoint)
router.post('/validate-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await emailVerificationService.validateEmail(email);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get pending verification status
router.get('/verification-status', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type } = req.query;

    const pending = await emailVerificationService.getPendingVerification(
      userId,
      type as string || 'signup'
    );

    res.json({
      success: true,
      data: pending,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React Email Verification Components
```tsx
// components/EmailVerification.tsx
import React, { useState, useEffect } from 'react';

interface VerificationState {
  status: 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';
  message: string;
  expiresAt?: Date;
}

// Email Verification Request Component
export const EmailVerificationRequest: React.FC<{
  email: string;
  onVerified?: () => void;
}> = ({ email, onVerified }) => {
  const [state, setState] = useState<VerificationState>({
    status: 'idle',
    message: '',
  });
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const requestVerification = async () => {
    setState({ status: 'sending', message: 'Sending verification email...' });

    try {
      const response = await fetch('/api/verify-email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setState({
          status: 'sent',
          message: 'Verification email sent! Check your inbox.',
          expiresAt: new Date(data.expiresAt),
        });
        setCountdown(60); // 60 second cooldown
      } else {
        setState({ status: 'error', message: data.error });
      }
    } catch (error) {
      setState({ status: 'error', message: 'Failed to send verification email' });
    }
  };

  return (
    <div className="email-verification-request">
      <h3>Verify Your Email</h3>
      <p>We need to verify your email address: <strong>{email}</strong></p>

      {state.status === 'sent' && (
        <div className="verification-sent">
          <div className="success-icon">✉️</div>
          <p>{state.message}</p>
          {state.expiresAt && (
            <p className="expires-note">
              Link expires: {state.expiresAt.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {state.status === 'error' && (
        <div className="verification-error">
          <p>{state.message}</p>
        </div>
      )}

      <button
        onClick={requestVerification}
        disabled={state.status === 'sending' || countdown > 0}
      >
        {state.status === 'sending'
          ? 'Sending...'
          : countdown > 0
          ? `Resend in ${countdown}s`
          : state.status === 'sent'
          ? 'Resend Email'
          : 'Send Verification Email'}
      </button>
    </div>
  );
};

// Email Verification Confirm Component
export const EmailVerificationConfirm: React.FC<{
  token: string;
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
}> = ({ token, onSuccess, onError }) => {
  const [state, setState] = useState<VerificationState>({
    status: 'verifying',
    message: 'Verifying your email...',
  });

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch('/api/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setState({
          status: 'verified',
          message: 'Your email has been verified successfully!',
        });
        onSuccess?.(data.email);
      } else {
        setState({ status: 'error', message: data.error });
        onError?.(data.error);
      }
    } catch (error) {
      const message = 'Failed to verify email';
      setState({ status: 'error', message });
      onError?.(message);
    }
  };

  return (
    <div className={`email-verification-confirm ${state.status}`}>
      {state.status === 'verifying' && (
        <div className="verifying">
          <div className="spinner" />
          <p>{state.message}</p>
        </div>
      )}

      {state.status === 'verified' && (
        <div className="verified">
          <div className="success-icon">✓</div>
          <h3>Email Verified!</h3>
          <p>{state.message}</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="error">
          <div className="error-icon">✕</div>
          <h3>Verification Failed</h3>
          <p>{state.message}</p>
          <a href="/resend-verification">Request a new verification link</a>
        </div>
      )}
    </div>
  );
};

// Password Reset Request Component
export const PasswordResetRequest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<VerificationState>({
    status: 'idle',
    message: '',
  });

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending', message: '' });

    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setState({
        status: 'sent',
        message: 'If an account exists with this email, you will receive a reset link.',
      });
    } catch (error) {
      setState({
        status: 'sent',
        message: 'If an account exists with this email, you will receive a reset link.',
      });
    }
  };

  return (
    <div className="password-reset-request">
      <h3>Reset Your Password</h3>

      {state.status === 'sent' ? (
        <div className="reset-sent">
          <div className="success-icon">✉️</div>
          <p>{state.message}</p>
          <p>Check your email for the reset link.</p>
        </div>
      ) : (
        <form onSubmit={requestReset}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <button type="submit" disabled={state.status === 'sending'}>
            {state.status === 'sending' ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
};

// Magic Link Login Component
export const MagicLinkLogin: React.FC<{
  onSuccess?: (token: string) => void;
}> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<VerificationState>({
    status: 'idle',
    message: '',
  });

  const requestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending', message: '' });

    try {
      const response = await fetch('/api/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setState({
          status: 'sent',
          message: 'Magic link sent! Check your email to log in.',
          expiresAt: new Date(data.expiresAt),
        });
      } else {
        setState({ status: 'error', message: data.error });
      }
    } catch (error) {
      setState({ status: 'error', message: 'Failed to send magic link' });
    }
  };

  return (
    <div className="magic-link-login">
      <h3>Login with Email</h3>
      <p>No password needed. We'll send you a magic link.</p>

      {state.status === 'sent' ? (
        <div className="magic-link-sent">
          <div className="success-icon">✨</div>
          <p>{state.message}</p>
          <p className="expires-note">Link expires in 15 minutes</p>
        </div>
      ) : (
        <form onSubmit={requestMagicLink}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {state.status === 'error' && (
            <div className="error-message">{state.message}</div>
          )}

          <button type="submit" disabled={state.status === 'sending'}>
            {state.status === 'sending' ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
      )}
    </div>
  );
};

// Email Validation Hook
export const useEmailValidation = () => {
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    errors: string[];
    isDisposable: boolean;
  } | null>(null);

  const validate = async (email: string) => {
    setValidating(true);
    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResult(data.data);
      return data.data;
    } catch {
      return null;
    } finally {
      setValidating(false);
    }
  };

  return { validate, validating, result };
};
```

### Python FastAPI Implementation
```python
# email_verification.py
import hashlib
import secrets
import dns.resolver
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, EmailStr, validator
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from jose import jwt, JWTError
import aiosmtplib
from email.message import EmailMessage

router = APIRouter(prefix="/auth", tags=["email-verification"])

# Configuration
JWT_SECRET = "your-secret-key"
JWT_ALGORITHM = "HS256"
BASE_URL = "http://localhost:3000"

# Disposable email domains (partial list)
DISPOSABLE_DOMAINS = {
    "tempmail.com", "throwaway.email", "guerrillamail.com",
    "10minutemail.com", "mailinator.com", "yopmail.com"
}

FREE_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "aol.com", "icloud.com", "protonmail.com"
}


class VerificationType(str, Enum):
    SIGNUP = "signup"
    EMAIL_CHANGE = "email_change"
    PASSWORD_RESET = "password_reset"
    MAGIC_LINK = "magic_link"


class VerificationToken(BaseModel):
    id: str
    user_id: str
    email: str
    type: VerificationType
    hashed_token: str
    expires_at: datetime
    attempts: int = 0
    verified: bool = False
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class EmailValidationResult(BaseModel):
    valid: bool
    email: str
    normalized_email: str
    domain: str
    is_disposable: bool
    is_free_provider: bool
    has_mx_records: bool
    errors: List[str]


class VerificationResult(BaseModel):
    success: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    type: Optional[str] = None
    error: Optional[str] = None


# In-memory storage (use Redis/DB in production)
tokens_db: Dict[str, VerificationToken] = {}

# Rate limiting (simple in-memory, use Redis in production)
rate_limits: Dict[str, List[datetime]] = {}


def check_rate_limit(email: str, max_requests: int = 5, window_seconds: int = 3600) -> bool:
    """Check if email has exceeded rate limit."""
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=window_seconds)

    if email not in rate_limits:
        rate_limits[email] = []

    # Clean old entries
    rate_limits[email] = [t for t in rate_limits[email] if t > cutoff]

    if len(rate_limits[email]) >= max_requests:
        return False

    rate_limits[email].append(now)
    return True


def normalize_email(email: str) -> str:
    """Normalize email address."""
    local, domain = email.lower().split("@")

    # Handle Gmail aliases
    if domain in ("gmail.com", "googlemail.com"):
        local = local.split("+")[0].replace(".", "")
        return f"{local}@gmail.com"

    # Handle other + aliases
    local = local.split("+")[0]
    return f"{local}@{domain}"


async def validate_email(email: str) -> EmailValidationResult:
    """Validate email format and domain."""
    errors = []
    normalized = normalize_email(email)
    domain = email.split("@")[1].lower() if "@" in email else ""

    # Basic format check
    import re
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        errors.append("Invalid email format")

    # Check disposable
    is_disposable = domain in DISPOSABLE_DOMAINS
    if is_disposable:
        errors.append("Disposable email addresses are not allowed")

    # Check free provider
    is_free_provider = domain in FREE_PROVIDERS

    # Check MX records
    has_mx_records = False
    try:
        mx_records = dns.resolver.resolve(domain, "MX")
        has_mx_records = len(mx_records) > 0
    except Exception:
        errors.append("Domain does not have valid MX records")

    return EmailValidationResult(
        valid=len(errors) == 0,
        email=email,
        normalized_email=normalized,
        domain=domain,
        is_disposable=is_disposable,
        is_free_provider=is_free_provider,
        has_mx_records=has_mx_records,
        errors=errors
    )


def generate_token() -> tuple[str, str]:
    """Generate a secure token and its hash."""
    token = secrets.token_hex(32)
    hashed = hashlib.sha256(token.encode()).hexdigest()
    return token, hashed


def get_token_expiry(verification_type: VerificationType) -> datetime:
    """Get expiry time based on verification type."""
    expiry_minutes = {
        VerificationType.SIGNUP: 60 * 24,  # 24 hours
        VerificationType.EMAIL_CHANGE: 60,  # 1 hour
        VerificationType.PASSWORD_RESET: 30,  # 30 minutes
        VerificationType.MAGIC_LINK: 15,  # 15 minutes
    }
    return datetime.utcnow() + timedelta(minutes=expiry_minutes[verification_type])


async def create_verification(
    user_id: str,
    email: str,
    verification_type: VerificationType,
    metadata: Optional[Dict[str, Any]] = None
) -> tuple[str, datetime, str]:
    """Create a verification token."""
    # Rate limit check
    if not check_rate_limit(email):
        raise ValueError("Too many verification requests. Please try again later.")

    # Validate email
    validation = await validate_email(email)
    if not validation.valid:
        raise ValueError(", ".join(validation.errors))

    # Invalidate existing tokens
    invalidate_existing_tokens(user_id, verification_type)

    # Generate token
    token, hashed = generate_token()
    expires_at = get_token_expiry(verification_type)

    verification = VerificationToken(
        id=secrets.token_hex(16),
        user_id=user_id,
        email=validation.normalized_email,
        type=verification_type,
        hashed_token=hashed,
        expires_at=expires_at,
        metadata=metadata,
        created_at=datetime.utcnow()
    )

    tokens_db[hashed] = verification

    # Build URL
    paths = {
        VerificationType.SIGNUP: "/verify-email",
        VerificationType.EMAIL_CHANGE: "/verify-email-change",
        VerificationType.PASSWORD_RESET: "/reset-password",
        VerificationType.MAGIC_LINK: "/auth/magic-link",
    }
    url = f"{BASE_URL}{paths[verification_type]}?token={token}"

    return token, expires_at, url


def invalidate_existing_tokens(user_id: str, verification_type: VerificationType):
    """Invalidate existing tokens of same type for user."""
    to_delete = []
    for hashed, token in tokens_db.items():
        if token.user_id == user_id and token.type == verification_type and not token.verified:
            to_delete.append(hashed)

    for hashed in to_delete:
        del tokens_db[hashed]


async def verify_token(token: str) -> VerificationResult:
    """Verify a token."""
    hashed = hashlib.sha256(token.encode()).hexdigest()
    verification = tokens_db.get(hashed)

    if not verification:
        return VerificationResult(success=False, error="Invalid verification token")

    if datetime.utcnow() > verification.expires_at:
        del tokens_db[hashed]
        return VerificationResult(success=False, error="Verification token has expired")

    if verification.attempts >= 5:
        del tokens_db[hashed]
        return VerificationResult(success=False, error="Too many verification attempts")

    if verification.verified:
        return VerificationResult(success=False, error="Token has already been used")

    # Mark as verified
    verification.verified = True
    verification.attempts += 1
    tokens_db[hashed] = verification

    return VerificationResult(
        success=True,
        user_id=verification.user_id,
        email=verification.email,
        type=verification.type.value
    )


async def send_verification_email(
    email: str,
    verification_url: str,
    verification_type: VerificationType
):
    """Send verification email."""
    templates = {
        VerificationType.SIGNUP: {
            "subject": "Verify your email address",
            "body": f"Please verify your email by clicking: {verification_url}"
        },
        VerificationType.PASSWORD_RESET: {
            "subject": "Reset your password",
            "body": f"Reset your password: {verification_url}"
        },
        VerificationType.EMAIL_CHANGE: {
            "subject": "Confirm your new email",
            "body": f"Confirm email change: {verification_url}"
        },
        VerificationType.MAGIC_LINK: {
            "subject": "Your login link",
            "body": f"Click to log in: {verification_url}"
        },
    }

    template = templates[verification_type]

    message = EmailMessage()
    message["From"] = "noreply@example.com"
    message["To"] = email
    message["Subject"] = template["subject"]
    message.set_content(template["body"])

    # Send email (configure SMTP in production)
    # await aiosmtplib.send(message, hostname="smtp.example.com", port=587)


def create_jwt_token(user_id: str, email: str, token_type: str, expires_in: int = 3600) -> str:
    """Create a JWT token."""
    payload = {
        "user_id": user_id,
        "email": email,
        "type": token_type,
        "exp": datetime.utcnow() + timedelta(seconds=expires_in)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


# API Routes
class VerificationRequest(BaseModel):
    email: EmailStr


class TokenVerifyRequest(BaseModel):
    token: str


@router.post("/verify-email/request")
async def request_verification(
    request: VerificationRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    try:
        token, expires_at, url = await create_verification(
            user_id,
            request.email,
            VerificationType.SIGNUP
        )

        background_tasks.add_task(
            send_verification_email,
            request.email,
            url,
            VerificationType.SIGNUP
        )

        return {
            "success": True,
            "message": "Verification email sent",
            "expires_at": expires_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-email/confirm")
async def confirm_verification(request: TokenVerifyRequest):
    result = await verify_token(request.token)

    if result.success:
        return {
            "success": True,
            "message": "Email verified successfully",
            "user_id": result.user_id,
            "email": result.email
        }
    else:
        raise HTTPException(status_code=400, detail=result.error)


@router.post("/password-reset/request")
async def request_password_reset(
    request: VerificationRequest,
    background_tasks: BackgroundTasks
):
    # Always return success to prevent email enumeration
    try:
        user_id = "user_from_db"  # Look up user
        token, expires_at, url = await create_verification(
            user_id,
            request.email,
            VerificationType.PASSWORD_RESET
        )

        background_tasks.add_task(
            send_verification_email,
            request.email,
            url,
            VerificationType.PASSWORD_RESET
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": "If an account exists, a reset email will be sent"
    }


@router.post("/magic-link/request")
async def request_magic_link(
    request: VerificationRequest,
    background_tasks: BackgroundTasks
):
    try:
        user_id = "user_from_db"  # Find or create user
        token, expires_at, url = await create_verification(
            user_id,
            request.email,
            VerificationType.MAGIC_LINK
        )

        background_tasks.add_task(
            send_verification_email,
            request.email,
            url,
            VerificationType.MAGIC_LINK
        )

        return {
            "success": True,
            "message": "Magic link sent",
            "expires_at": expires_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate-email")
async def validate_email_endpoint(request: VerificationRequest):
    result = await validate_email(request.email)
    return {"success": True, "data": result}


def get_current_user_id() -> str:
    # Placeholder - implement actual auth
    return "user_123"
```

## CLAUDE.md Integration
```markdown
## Email Verification Commands

### Verification operations
"Send verification email to user@example.com"
"Verify token abc123"
"Check if email is valid: test@tempmail.com"

### Password reset flow
"Request password reset for user@example.com"
"Verify password reset token"
"Check if token is expired"

### Magic link authentication
"Send magic link to user@example.com"
"Verify magic link and create session"

### Common checks
- Rate limit status for email
- Token expiration status
- Email domain validation (MX records)
- Disposable email detection
```

## AI Suggestions
1. Add email deliverability scoring integration
2. Implement CAPTCHA for high-risk verification requests
3. Add geolocation-based verification (flag unusual locations)
4. Create email verification analytics dashboard
5. Implement backup verification methods (SMS, authenticator)
6. Add email reputation checking via third-party APIs
7. Build fraud detection for suspicious verification patterns
8. Implement progressive profiling during verification
9. Add webhook notifications for verification events
10. Create A/B testing for verification email templates
