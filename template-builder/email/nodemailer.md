# Nodemailer Email Service

## Overview
Flexible email sending with Nodemailer supporting SMTP, OAuth2, and multiple transport providers with templates, attachments, and queuing.

## Quick Start

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

## Full Implementation

### TypeScript Nodemailer Service

```typescript
// email/nodemailer-service.ts
import * as nodemailer from 'nodemailer';
import { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as fs from 'fs/promises';
import * as path from 'path';

interface EmailConfig {
  transport: 'smtp' | 'sendmail' | 'ses' | 'stream';
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    oauth2?: {
      type: 'OAuth2';
      user: string;
      clientId: string;
      clientSecret: string;
      refreshToken: string;
      accessToken?: string;
    };
    pool?: boolean;
    maxConnections?: number;
    maxMessages?: number;
    rateDelta?: number;
    rateLimit?: number;
  };
  defaults?: {
    from?: string;
    replyTo?: string;
    headers?: Record<string, string>;
  };
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    encoding?: string;
    cid?: string; // For embedded images
  }>;
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  messageId?: string;
  references?: string | string[];
  inReplyTo?: string;
  watchHtml?: string; // For Apple Watch
  amp?: string; // AMP HTML
  icalEvent?: {
    method?: string;
    filename?: string;
    content?: string | Buffer;
  };
  list?: {
    help?: string;
    unsubscribe?: string | { url: string; comment?: string }[];
    subscribe?: string;
    post?: string;
  };
  dkim?: {
    domainName: string;
    keySelector: string;
    privateKey: string;
  };
}

interface TemplateEngine {
  compile(template: string): (data: any) => string;
}

export class NodemailerService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private defaults: EmailConfig['defaults'];
  private templateCache: Map<string, (data: any) => string> = new Map();
  private templateEngine?: TemplateEngine;

  constructor(config: EmailConfig, templateEngine?: TemplateEngine) {
    this.defaults = config.defaults;
    this.templateEngine = templateEngine;

    switch (config.transport) {
      case 'smtp':
        this.transporter = nodemailer.createTransport({
          host: config.smtp!.host,
          port: config.smtp!.port,
          secure: config.smtp!.secure,
          auth: config.smtp!.oauth2 || config.smtp!.auth,
          pool: config.smtp!.pool,
          maxConnections: config.smtp!.maxConnections,
          maxMessages: config.smtp!.maxMessages,
          rateDelta: config.smtp!.rateDelta,
          rateLimit: config.smtp!.rateLimit
        });
        break;

      case 'sendmail':
        this.transporter = nodemailer.createTransport({
          sendmail: true,
          newline: 'unix',
          path: '/usr/sbin/sendmail'
        }) as any;
        break;

      case 'stream':
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix'
        }) as any;
        break;

      default:
        throw new Error(`Unknown transport: ${config.transport}`);
    }
  }

  // Verify connection
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      return false;
    }
  }

  // Send single email
  async sendEmail(options: EmailOptions): Promise<SentMessageInfo> {
    const mailOptions: SendMailOptions = {
      from: options.from || this.defaults?.from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo || this.defaults?.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
      watchHtml: options.watchHtml,
      amp: options.amp,
      attachments: options.attachments,
      headers: { ...this.defaults?.headers, ...options.headers },
      priority: options.priority,
      messageId: options.messageId,
      references: options.references,
      inReplyTo: options.inReplyTo,
      list: options.list,
      dkim: options.dkim
    };

    if (options.icalEvent) {
      mailOptions.icalEvent = options.icalEvent;
    }

    return this.transporter.sendMail(mailOptions);
  }

  // Send with template
  async sendTemplateEmail(
    options: Omit<EmailOptions, 'html' | 'text'>,
    templateName: string,
    data: Record<string, any>
  ): Promise<SentMessageInfo> {
    const html = await this.renderTemplate(templateName, data);
    return this.sendEmail({ ...options, html });
  }

  // Render template
  async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    if (!this.templateEngine) {
      throw new Error('Template engine not configured');
    }

    let compiledTemplate = this.templateCache.get(templateName);

    if (!compiledTemplate) {
      const templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      compiledTemplate = this.templateEngine.compile(templateContent);
      this.templateCache.set(templateName, compiledTemplate);
    }

    return compiledTemplate(data);
  }

  // Clear template cache
  clearTemplateCache(): void {
    this.templateCache.clear();
  }

  // Send with embedded images
  async sendWithEmbeddedImages(
    options: EmailOptions,
    images: Array<{ cid: string; path: string }>
  ): Promise<SentMessageInfo> {
    const attachments = await Promise.all(
      images.map(async (img) => ({
        filename: path.basename(img.path),
        path: img.path,
        cid: img.cid
      }))
    );

    return this.sendEmail({
      ...options,
      attachments: [...(options.attachments || []), ...attachments]
    });
  }

  // Send calendar invite
  async sendCalendarInvite(
    options: EmailOptions,
    event: {
      start: Date;
      end: Date;
      summary: string;
      description?: string;
      location?: string;
      organizer: { name: string; email: string };
      attendees: Array<{ name: string; email: string }>;
      uid?: string;
    }
  ): Promise<SentMessageInfo> {
    const icalContent = this.generateICalEvent(event);

    return this.sendEmail({
      ...options,
      icalEvent: {
        method: 'REQUEST',
        content: icalContent
      }
    });
  }

  private generateICalEvent(event: {
    start: Date;
    end: Date;
    summary: string;
    description?: string;
    location?: string;
    organizer: { name: string; email: string };
    attendees: Array<{ name: string; email: string }>;
    uid?: string;
  }): string {
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = event.uid || `${Date.now()}@example.com`;

    const attendees = event.attendees
      .map(a => `ATTENDEE;CN=${a.name};RSVP=TRUE:mailto:${a.email}`)
      .join('\r\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nodemailer//Calendar//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${event.summary}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      `ORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}`,
      attendees,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
  }

  // Send bulk emails (sequential)
  async sendBulk(
    emails: Array<EmailOptions>,
    options?: { delay?: number; onProgress?: (sent: number, total: number) => void }
  ): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
    const results: Array<{ success: boolean; messageId?: string; error?: string }> = [];

    for (let i = 0; i < emails.length; i++) {
      try {
        const info = await this.sendEmail(emails[i]);
        results.push({ success: true, messageId: info.messageId });

        if (options?.delay && i < emails.length - 1) {
          await this.delay(options.delay);
        }
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }

      options?.onProgress?.(i + 1, emails.length);
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get transport info
  getTransportInfo(): { name: string; version: string } {
    return {
      name: this.transporter.transporter.name,
      version: this.transporter.transporter.version
    };
  }

  // Close connection pool
  close(): void {
    this.transporter.close();
  }
}

// Factory for common providers
export class NodemailerFactory {
  static gmail(config: {
    user: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    from?: string;
  }): NodemailerService {
    return new NodemailerService({
      transport: 'smtp',
      smtp: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        oauth2: {
          type: 'OAuth2',
          user: config.user,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          refreshToken: config.refreshToken
        }
      },
      defaults: {
        from: config.from || config.user
      }
    });
  }

  static outlook(config: {
    user: string;
    pass: string;
    from?: string;
  }): NodemailerService {
    return new NodemailerService({
      transport: 'smtp',
      smtp: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: config.user,
          pass: config.pass
        }
      },
      defaults: {
        from: config.from || config.user
      }
    });
  }

  static mailgun(config: {
    user: string;
    pass: string;
    domain: string;
    from?: string;
  }): NodemailerService {
    return new NodemailerService({
      transport: 'smtp',
      smtp: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: config.user,
          pass: config.pass
        }
      },
      defaults: {
        from: config.from || `noreply@${config.domain}`
      }
    });
  }

  static sendgrid(config: {
    apiKey: string;
    from: string;
  }): NodemailerService {
    return new NodemailerService({
      transport: 'smtp',
      smtp: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: config.apiKey
        }
      },
      defaults: {
        from: config.from
      }
    });
  }

  static ses(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    from: string;
  }): NodemailerService {
    return new NodemailerService({
      transport: 'smtp',
      smtp: {
        host: `email-smtp.${config.region}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: config.accessKeyId,
          pass: config.secretAccessKey
        }
      },
      defaults: {
        from: config.from
      }
    });
  }

  static custom(config: {
    host: string;
    port: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from: string;
    pool?: boolean;
  }): NodemailerService {
    return new NodemailerService({
      transport: 'smtp',
      smtp: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.user ? {
          user: config.user,
          pass: config.pass!
        } : undefined,
        pool: config.pool
      },
      defaults: {
        from: config.from
      }
    });
  }
}
```

### Email Queue Service

```typescript
// email/email-queue.ts
import { EventEmitter } from 'events';
import { NodemailerService, EmailOptions } from './nodemailer-service';

interface QueuedEmail {
  id: string;
  options: EmailOptions;
  priority: number;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  scheduledFor?: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  messageId?: string;
}

interface QueueConfig {
  maxConcurrent: number;
  retryDelay: number;
  maxRetries: number;
  processInterval: number;
}

export class EmailQueue extends EventEmitter {
  private emailService: NodemailerService;
  private queue: QueuedEmail[] = [];
  private processing: Set<string> = new Set();
  private config: QueueConfig;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(emailService: NodemailerService, config?: Partial<QueueConfig>) {
    super();
    this.emailService = emailService;
    this.config = {
      maxConcurrent: config?.maxConcurrent || 5,
      retryDelay: config?.retryDelay || 60000, // 1 minute
      maxRetries: config?.maxRetries || 3,
      processInterval: config?.processInterval || 1000
    };
  }

  // Add email to queue
  add(
    options: EmailOptions,
    queueOptions?: {
      priority?: number;
      maxRetries?: number;
      scheduledFor?: Date;
    }
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const queuedEmail: QueuedEmail = {
      id,
      options,
      priority: queueOptions?.priority || 0,
      retries: 0,
      maxRetries: queueOptions?.maxRetries || this.config.maxRetries,
      createdAt: new Date(),
      scheduledFor: queueOptions?.scheduledFor,
      status: 'pending'
    };

    this.queue.push(queuedEmail);
    this.sortQueue();
    this.emit('added', queuedEmail);

    return id;
  }

  // Add multiple emails
  addBulk(
    emails: Array<{ options: EmailOptions; priority?: number }>
  ): string[] {
    return emails.map(email => this.add(email.options, { priority: email.priority }));
  }

  // Start processing
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this.processQueue();
    }, this.config.processInterval);

    this.emit('started');
  }

  // Stop processing
  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.emit('stopped');
  }

  // Process queue
  private async processQueue(): Promise<void> {
    const now = new Date();
    const available = this.config.maxConcurrent - this.processing.size;

    if (available <= 0) return;

    const toProcess = this.queue
      .filter(email =>
        email.status === 'pending' &&
        !this.processing.has(email.id) &&
        (!email.scheduledFor || email.scheduledFor <= now)
      )
      .slice(0, available);

    for (const email of toProcess) {
      this.processEmail(email);
    }
  }

  // Process single email
  private async processEmail(email: QueuedEmail): Promise<void> {
    this.processing.add(email.id);
    email.status = 'processing';
    this.emit('processing', email);

    try {
      const info = await this.emailService.sendEmail(email.options);
      email.status = 'sent';
      email.messageId = info.messageId;
      this.emit('sent', email);

      // Remove from queue
      this.queue = this.queue.filter(e => e.id !== email.id);
    } catch (error: any) {
      email.retries++;
      email.error = error.message;

      if (email.retries >= email.maxRetries) {
        email.status = 'failed';
        this.emit('failed', email);
        this.queue = this.queue.filter(e => e.id !== email.id);
      } else {
        email.status = 'pending';
        email.scheduledFor = new Date(Date.now() + this.config.retryDelay * email.retries);
        this.emit('retry', email);
      }
    } finally {
      this.processing.delete(email.id);
    }
  }

  // Get queue status
  getStatus(): {
    pending: number;
    processing: number;
    total: number;
    isRunning: boolean;
  } {
    return {
      pending: this.queue.filter(e => e.status === 'pending').length,
      processing: this.processing.size,
      total: this.queue.length,
      isRunning: this.isRunning
    };
  }

  // Get email by ID
  getEmail(id: string): QueuedEmail | undefined {
    return this.queue.find(e => e.id === id);
  }

  // Remove email from queue
  remove(id: string): boolean {
    const index = this.queue.findIndex(e => e.id === id);
    if (index === -1) return false;

    const email = this.queue[index];
    if (email.status === 'processing') return false;

    this.queue.splice(index, 1);
    this.emit('removed', email);
    return true;
  }

  // Clear queue
  clear(includeProcessing: boolean = false): number {
    const toRemove = this.queue.filter(e =>
      includeProcessing || e.status !== 'processing'
    );

    this.queue = this.queue.filter(e =>
      !includeProcessing && e.status === 'processing'
    );

    return toRemove.length;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Earlier scheduled first
      if (a.scheduledFor && b.scheduledFor) {
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      }
      if (a.scheduledFor) return 1;
      if (b.scheduledFor) return -1;
      // Earlier created first
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
}
```

### Express API Routes

```typescript
// routes/email.ts
import { Router, Request, Response } from 'express';
import { NodemailerFactory } from '../email/nodemailer-service';
import { EmailQueue } from '../email/email-queue';

const router = Router();

// Initialize email service based on provider
const emailService = process.env.EMAIL_PROVIDER === 'gmail'
  ? NodemailerFactory.gmail({
      user: process.env.GMAIL_USER!,
      clientId: process.env.GMAIL_CLIENT_ID!,
      clientSecret: process.env.GMAIL_CLIENT_SECRET!,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN!
    })
  : NodemailerFactory.custom({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM!,
      pool: true
    });

// Initialize queue
const emailQueue = new EmailQueue(emailService, {
  maxConcurrent: 10,
  maxRetries: 3
});

// Start queue processing
emailQueue.start();

// Event handlers
emailQueue.on('sent', (email) => {
  console.log(`Email sent: ${email.id} -> ${email.messageId}`);
});

emailQueue.on('failed', (email) => {
  console.error(`Email failed: ${email.id} -> ${email.error}`);
});

// Verify connection
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const verified = await emailService.verify();
    res.json({ verified });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send email immediately
router.post('/send', async (req: Request, res: Response) => {
  try {
    const info = await emailService.sendEmail(req.body);
    res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send with template
router.post('/send-template', async (req: Request, res: Response) => {
  try {
    const { template, data, ...emailOptions } = req.body;
    const info = await emailService.sendTemplateEmail(emailOptions, template, data);
    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Queue email
router.post('/queue', (req: Request, res: Response) => {
  try {
    const { options, priority, scheduledFor } = req.body;
    const id = emailQueue.add(options, {
      priority,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
    });
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Queue bulk emails
router.post('/queue/bulk', (req: Request, res: Response) => {
  try {
    const { emails } = req.body;
    const ids = emailQueue.addBulk(emails);
    res.json({ success: true, ids });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queue status
router.get('/queue/status', (req: Request, res: Response) => {
  const status = emailQueue.getStatus();
  res.json(status);
});

// Get queued email
router.get('/queue/:id', (req: Request, res: Response) => {
  const email = emailQueue.getEmail(req.params.id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }
  res.json(email);
});

// Remove from queue
router.delete('/queue/:id', (req: Request, res: Response) => {
  const removed = emailQueue.remove(req.params.id);
  res.json({ success: removed });
});

// Clear queue
router.delete('/queue', (req: Request, res: Response) => {
  const count = emailQueue.clear();
  res.json({ success: true, removed: count });
});

// Send calendar invite
router.post('/calendar-invite', async (req: Request, res: Response) => {
  try {
    const { emailOptions, event } = req.body;
    event.start = new Date(event.start);
    event.end = new Date(event.end);

    const info = await emailService.sendCalendarInvite(emailOptions, event);
    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### React Email Hook

```tsx
// hooks/useNodemailer.ts
import { useState, useCallback } from 'react';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function useNodemailer() {
  const [sending, setSending] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{
    pending: number;
    processing: number;
    total: number;
    isRunning: boolean;
  } | null>(null);

  const sendEmail = useCallback(async (options: EmailOptions): Promise<SendResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      return response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  const sendTemplateEmail = useCallback(async (
    to: string | string[],
    subject: string,
    template: string,
    data: Record<string, any>
  ): Promise<SendResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/email/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, template, data })
      });
      return response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  const queueEmail = useCallback(async (
    options: EmailOptions,
    queueOptions?: { priority?: number; scheduledFor?: Date }
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const response = await fetch('/api/email/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options,
          priority: queueOptions?.priority,
          scheduledFor: queueOptions?.scheduledFor?.toISOString()
        })
      });
      return response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const fetchQueueStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/email/queue/status');
      const status = await response.json();
      setQueueStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
      return null;
    }
  }, []);

  const sendCalendarInvite = useCallback(async (
    to: string,
    subject: string,
    event: {
      start: Date;
      end: Date;
      summary: string;
      description?: string;
      location?: string;
      organizer: { name: string; email: string };
      attendees: Array<{ name: string; email: string }>;
    }
  ): Promise<SendResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/email/calendar-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOptions: { to, subject },
          event: {
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString()
          }
        })
      });
      return response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  return {
    sendEmail,
    sendTemplateEmail,
    queueEmail,
    fetchQueueStatus,
    sendCalendarInvite,
    sending,
    queueStatus
  };
}
```

## Python Implementation

```python
# email_service/nodemailer_service.py
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass
import base64
from pathlib import Path


@dataclass
class Attachment:
    filename: str
    content: Optional[bytes] = None
    path: Optional[str] = None
    content_type: str = 'application/octet-stream'


class SMTPEmailService:
    def __init__(
        self,
        host: str,
        port: int,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True,
        use_ssl: bool = False,
        default_from: Optional[str] = None
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.use_ssl = use_ssl
        self.default_from = default_from
        self._connection: Optional[smtplib.SMTP] = None

    def connect(self) -> None:
        if self.use_ssl:
            context = ssl.create_default_context()
            self._connection = smtplib.SMTP_SSL(self.host, self.port, context=context)
        else:
            self._connection = smtplib.SMTP(self.host, self.port)

            if self.use_tls:
                context = ssl.create_default_context()
                self._connection.starttls(context=context)

        if self.username and self.password:
            self._connection.login(self.username, self.password)

    def disconnect(self) -> None:
        if self._connection:
            self._connection.quit()
            self._connection = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def send_email(
        self,
        to: Union[str, List[str]],
        subject: str,
        text: Optional[str] = None,
        html: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[Attachment]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        if not self._connection:
            self.connect()

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email or self.default_from
        msg['To'] = to if isinstance(to, str) else ', '.join(to)

        if cc:
            msg['Cc'] = ', '.join(cc)
        if reply_to:
            msg['Reply-To'] = reply_to
        if headers:
            for key, value in headers.items():
                msg[key] = value

        if text:
            msg.attach(MIMEText(text, 'plain'))
        if html:
            msg.attach(MIMEText(html, 'html'))

        if attachments:
            for attachment in attachments:
                part = MIMEBase('application', 'octet-stream')

                if attachment.content:
                    content = attachment.content
                elif attachment.path:
                    content = Path(attachment.path).read_bytes()
                else:
                    continue

                part.set_payload(content)
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename="{attachment.filename}"'
                )
                msg.attach(part)

        recipients = [to] if isinstance(to, str) else to
        if cc:
            recipients.extend(cc)
        if bcc:
            recipients.extend(bcc)

        result = self._connection.sendmail(
            from_email or self.default_from,
            recipients,
            msg.as_string()
        )

        return {
            'success': True,
            'rejected': list(result.keys()) if result else []
        }

    def send_bulk(
        self,
        emails: List[Dict],
        delay: float = 0
    ) -> List[Dict]:
        import time

        results = []
        for i, email in enumerate(emails):
            try:
                result = self.send_email(**email)
                results.append({'success': True, **result})
            except Exception as e:
                results.append({'success': False, 'error': str(e)})

            if delay and i < len(emails) - 1:
                time.sleep(delay)

        return results

    def verify(self) -> bool:
        try:
            self.connect()
            self.disconnect()
            return True
        except Exception:
            return False


# Provider-specific factories
class EmailProviderFactory:
    @staticmethod
    def gmail(
        user: str,
        app_password: str,
        from_email: Optional[str] = None
    ) -> SMTPEmailService:
        return SMTPEmailService(
            host='smtp.gmail.com',
            port=465,
            username=user,
            password=app_password,
            use_ssl=True,
            default_from=from_email or user
        )

    @staticmethod
    def outlook(
        user: str,
        password: str,
        from_email: Optional[str] = None
    ) -> SMTPEmailService:
        return SMTPEmailService(
            host='smtp-mail.outlook.com',
            port=587,
            username=user,
            password=password,
            use_tls=True,
            default_from=from_email or user
        )

    @staticmethod
    def sendgrid(
        api_key: str,
        from_email: str
    ) -> SMTPEmailService:
        return SMTPEmailService(
            host='smtp.sendgrid.net',
            port=587,
            username='apikey',
            password=api_key,
            use_tls=True,
            default_from=from_email
        )

    @staticmethod
    def ses(
        access_key: str,
        secret_key: str,
        region: str,
        from_email: str
    ) -> SMTPEmailService:
        return SMTPEmailService(
            host=f'email-smtp.{region}.amazonaws.com',
            port=587,
            username=access_key,
            password=secret_key,
            use_tls=True,
            default_from=from_email
        )

    @staticmethod
    def custom(
        host: str,
        port: int,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True,
        use_ssl: bool = False,
        from_email: Optional[str] = None
    ) -> SMTPEmailService:
        return SMTPEmailService(
            host=host,
            port=port,
            username=username,
            password=password,
            use_tls=use_tls,
            use_ssl=use_ssl,
            default_from=from_email
        )
```

### FastAPI Routes

```python
# routes/email_routes.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import os

from email_service.nodemailer_service import SMTPEmailService, EmailProviderFactory

router = APIRouter(prefix="/api/email", tags=["Email"])

# Initialize based on environment
provider = os.environ.get('EMAIL_PROVIDER', 'custom')

if provider == 'gmail':
    email_service = EmailProviderFactory.gmail(
        user=os.environ['GMAIL_USER'],
        app_password=os.environ['GMAIL_APP_PASSWORD']
    )
elif provider == 'sendgrid':
    email_service = EmailProviderFactory.sendgrid(
        api_key=os.environ['SENDGRID_API_KEY'],
        from_email=os.environ['FROM_EMAIL']
    )
else:
    email_service = EmailProviderFactory.custom(
        host=os.environ['SMTP_HOST'],
        port=int(os.environ.get('SMTP_PORT', '587')),
        username=os.environ.get('SMTP_USER'),
        password=os.environ.get('SMTP_PASS'),
        from_email=os.environ.get('FROM_EMAIL')
    )


class EmailRequest(BaseModel):
    to: str | List[str]
    subject: str
    text: Optional[str] = None
    html: Optional[str] = None
    reply_to: Optional[str] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None


class BulkEmailRequest(BaseModel):
    emails: List[Dict[str, Any]]
    delay: float = 0


@router.get("/verify")
async def verify_connection():
    try:
        verified = email_service.verify()
        return {"verified": verified}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send")
async def send_email(request: EmailRequest):
    try:
        with email_service:
            result = email_service.send_email(
                to=request.to,
                subject=request.subject,
                text=request.text,
                html=request.html,
                reply_to=request.reply_to,
                cc=request.cc,
                bcc=request.bcc
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-bulk")
async def send_bulk_email(request: BulkEmailRequest, background_tasks: BackgroundTasks):
    def process_bulk():
        with email_service:
            return email_service.send_bulk(request.emails, request.delay)

    background_tasks.add_task(process_bulk)
    return {"status": "processing", "count": len(request.emails)}
```

## CLAUDE.md Integration

```markdown
## Nodemailer Email

### Provider Configuration
Set `EMAIL_PROVIDER` env var: gmail, outlook, sendgrid, ses, custom

Gmail requires:
- `GMAIL_USER`: Gmail address
- `GMAIL_APP_PASSWORD`: App-specific password (not regular password)

Custom SMTP:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`

### Send Emails
- Immediate: `POST /api/email/send`
- Template: `POST /api/email/send-template` with template name and data
- Queue: `POST /api/email/queue` with scheduledFor for delayed sending

### Email Queue
Queue supports:
- Priority levels (higher = processed first)
- Scheduled sending (scheduledFor date)
- Automatic retries with exponential backoff
- Progress events (sent, failed, retry)

### Calendar Invites
`POST /api/email/calendar-invite` with:
- emailOptions: to, subject
- event: start, end, summary, organizer, attendees

### Attachments
Include attachments array with:
- filename (required)
- content (base64 string) OR path (file path)
- contentType (MIME type)
```

## AI Suggestions

1. **Add template precompilation** - Precompile templates at startup for faster rendering
2. **Implement delivery tracking** - Track email opens and clicks with pixel/redirect
3. **Build retry with backoff** - Exponential backoff for transient failures
4. **Add connection pooling** - Reuse SMTP connections for high-volume sending
5. **Create email preview** - Preview emails before sending
6. **Implement rate limiting** - Respect provider rate limits automatically
7. **Add attachment streaming** - Stream large attachments instead of buffering
8. **Build email logging** - Log all sent emails with metadata
9. **Create fallback providers** - Switch providers on failure
10. **Add email validation** - Validate addresses before sending
