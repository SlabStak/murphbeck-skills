# Mailgun Email Service

## Overview
Complete Mailgun integration for transactional and marketing emails with templates, mailing lists, webhooks, email validation, and detailed analytics.

## Quick Start
```bash
npm install mailgun.js form-data
```

## Implementation

### TypeScript Mailgun Service
```typescript
// mailgun.service.ts
import Mailgun from 'mailgun.js';
import formData from 'form-data';

interface MailgunConfig {
  apiKey: string;
  domain: string;
  region?: 'us' | 'eu';
  testMode?: boolean;
}

interface EmailMessage {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateVariables?: Record<string, unknown>;
  attachments?: Attachment[];
  inline?: Attachment[];
  tags?: string[];
  deliveryTime?: Date;
  testMode?: boolean;
  tracking?: boolean;
  trackingClicks?: boolean | 'htmlonly';
  trackingOpens?: boolean;
  requireTls?: boolean;
  skipVerification?: boolean;
  headers?: Record<string, string>;
  variables?: Record<string, string>;
  recipientVariables?: Record<string, Record<string, unknown>>;
}

interface Attachment {
  filename: string;
  data: Buffer | string;
  contentType?: string;
}

interface SendResult {
  id: string;
  message: string;
}

interface Template {
  name: string;
  description: string;
  template: string;
  tag?: string;
  engine?: 'handlebars' | 'go';
  comment?: string;
  createdAt: Date;
}

interface MailingList {
  address: string;
  name: string;
  description: string;
  accessLevel: 'readonly' | 'members' | 'everyone';
  replyPreference: 'list' | 'sender';
  membersCount: number;
  createdAt: Date;
}

interface ListMember {
  address: string;
  name: string;
  subscribed: boolean;
  vars: Record<string, unknown>;
}

interface EmailValidationResult {
  address: string;
  isValid: boolean;
  isDisposable: boolean;
  isRoleAddress: boolean;
  reason: string[];
  risk: 'high' | 'medium' | 'low' | 'unknown';
  rootAddress?: string;
  didYouMean?: string;
}

interface DomainStats {
  delivered: StatsEntry[];
  accepted: StatsEntry[];
  failed: StatsEntry[];
  opened: StatsEntry[];
  clicked: StatsEntry[];
  unsubscribed: StatsEntry[];
  complained: StatsEntry[];
  stored: StatsEntry[];
}

interface StatsEntry {
  time: string;
  total: number;
}

interface StoredMessage {
  recipients: string;
  sender: string;
  subject: string;
  bodyPlain: string;
  bodyHtml?: string;
  attachments: string[];
  messageHeaders: Record<string, string>;
}

interface WebhookEvent {
  signature: {
    timestamp: string;
    token: string;
    signature: string;
  };
  eventData: {
    event: string;
    timestamp: number;
    id: string;
    recipient: string;
    message: {
      headers: Record<string, string>;
    };
    deliveryStatus?: {
      code: number;
      message: string;
      description: string;
    };
    userVariables?: Record<string, unknown>;
    tags?: string[];
    clientInfo?: {
      deviceType: string;
      clientName: string;
      clientOs: string;
      userAgent: string;
    };
    geolocation?: {
      city: string;
      region: string;
      country: string;
    };
    url?: string; // For click events
  };
}

class MailgunService {
  private client: any;
  private domain: string;
  private defaultFrom: string;

  constructor(config: MailgunConfig) {
    const mailgun = new Mailgun(formData);

    this.client = mailgun.client({
      username: 'api',
      key: config.apiKey,
      url: config.region === 'eu'
        ? 'https://api.eu.mailgun.net'
        : 'https://api.mailgun.net',
    });

    this.domain = config.domain;
    this.defaultFrom = `noreply@${config.domain}`;
  }

  // Send email
  async send(message: EmailMessage): Promise<SendResult> {
    const messageData: Record<string, any> = {
      from: message.from || this.defaultFrom,
      to: Array.isArray(message.to) ? message.to.join(',') : message.to,
      subject: message.subject,
    };

    if (message.cc) {
      messageData.cc = Array.isArray(message.cc) ? message.cc.join(',') : message.cc;
    }

    if (message.bcc) {
      messageData.bcc = Array.isArray(message.bcc) ? message.bcc.join(',') : message.bcc;
    }

    // Content
    if (message.template) {
      messageData.template = message.template;
      if (message.templateVariables) {
        messageData['h:X-Mailgun-Variables'] = JSON.stringify(message.templateVariables);
      }
    } else {
      if (message.html) messageData.html = message.html;
      if (message.text) messageData.text = message.text;
    }

    // Attachments
    if (message.attachments?.length) {
      messageData.attachment = message.attachments.map(a => ({
        filename: a.filename,
        data: a.data,
      }));
    }

    if (message.inline?.length) {
      messageData.inline = message.inline.map(a => ({
        filename: a.filename,
        data: a.data,
      }));
    }

    // Tags
    if (message.tags?.length) {
      messageData['o:tag'] = message.tags;
    }

    // Delivery time
    if (message.deliveryTime) {
      messageData['o:deliverytime'] = message.deliveryTime.toUTCString();
    }

    // Tracking
    if (message.tracking !== undefined) {
      messageData['o:tracking'] = message.tracking ? 'yes' : 'no';
    }
    if (message.trackingClicks !== undefined) {
      messageData['o:tracking-clicks'] = message.trackingClicks === true
        ? 'yes'
        : message.trackingClicks === false
        ? 'no'
        : message.trackingClicks;
    }
    if (message.trackingOpens !== undefined) {
      messageData['o:tracking-opens'] = message.trackingOpens ? 'yes' : 'no';
    }

    // Test mode
    if (message.testMode) {
      messageData['o:testmode'] = 'yes';
    }

    // TLS
    if (message.requireTls) {
      messageData['o:require-tls'] = 'yes';
    }
    if (message.skipVerification) {
      messageData['o:skip-verification'] = 'yes';
    }

    // Custom headers
    if (message.headers) {
      for (const [key, value] of Object.entries(message.headers)) {
        messageData[`h:${key}`] = value;
      }
    }

    // Custom variables
    if (message.variables) {
      for (const [key, value] of Object.entries(message.variables)) {
        messageData[`v:${key}`] = value;
      }
    }

    // Recipient variables (for batch sending)
    if (message.recipientVariables) {
      messageData['recipient-variables'] = JSON.stringify(message.recipientVariables);
    }

    const result = await this.client.messages.create(this.domain, messageData);
    return { id: result.id, message: result.message };
  }

  // Send batch emails with personalization
  async sendBatch(
    recipients: Array<{
      email: string;
      variables: Record<string, unknown>;
    }>,
    message: Omit<EmailMessage, 'to' | 'recipientVariables'>
  ): Promise<SendResult> {
    const recipientVariables: Record<string, Record<string, unknown>> = {};

    for (const recipient of recipients) {
      recipientVariables[recipient.email] = recipient.variables;
    }

    return this.send({
      ...message,
      to: recipients.map(r => r.email),
      recipientVariables,
    });
  }

  // Template Management
  async createTemplate(template: Omit<Template, 'createdAt'>): Promise<Template> {
    const result = await this.client.domains.domainTemplates.create(this.domain, {
      name: template.name,
      description: template.description,
      template: template.template,
      tag: template.tag,
      engine: template.engine || 'handlebars',
      comment: template.comment,
    });

    return {
      ...result,
      createdAt: new Date(result.createdAt),
    };
  }

  async getTemplate(name: string): Promise<Template | null> {
    try {
      const result = await this.client.domains.domainTemplates.get(this.domain, name);
      return {
        ...result.template,
        createdAt: new Date(result.template.createdAt),
      };
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async updateTemplate(name: string, updates: Partial<Template>): Promise<Template> {
    const result = await this.client.domains.domainTemplates.update(this.domain, name, updates);
    return {
      ...result.template,
      createdAt: new Date(result.template.createdAt),
    };
  }

  async deleteTemplate(name: string): Promise<boolean> {
    try {
      await this.client.domains.domainTemplates.destroy(this.domain, name);
      return true;
    } catch {
      return false;
    }
  }

  async listTemplates(): Promise<Template[]> {
    const result = await this.client.domains.domainTemplates.list(this.domain);
    return result.items.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  }

  // Template Versions
  async createTemplateVersion(
    templateName: string,
    tag: string,
    template: string,
    active?: boolean
  ): Promise<void> {
    await this.client.domains.domainTemplates.createVersion(this.domain, templateName, {
      tag,
      template,
      active: active ? 'yes' : 'no',
    });
  }

  // Mailing Lists
  async createMailingList(data: Omit<MailingList, 'membersCount' | 'createdAt'>): Promise<MailingList> {
    const result = await this.client.lists.create({
      address: data.address,
      name: data.name,
      description: data.description,
      access_level: data.accessLevel,
      reply_preference: data.replyPreference,
    });

    return {
      address: result.address,
      name: result.name,
      description: result.description,
      accessLevel: result.access_level,
      replyPreference: result.reply_preference,
      membersCount: result.members_count,
      createdAt: new Date(result.created_at),
    };
  }

  async getMailingList(address: string): Promise<MailingList | null> {
    try {
      const result = await this.client.lists.get(address);
      return {
        address: result.address,
        name: result.name,
        description: result.description,
        accessLevel: result.access_level,
        replyPreference: result.reply_preference,
        membersCount: result.members_count,
        createdAt: new Date(result.created_at),
      };
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async listMailingLists(): Promise<MailingList[]> {
    const result = await this.client.lists.list();
    return result.items.map((item: any) => ({
      address: item.address,
      name: item.name,
      description: item.description,
      accessLevel: item.access_level,
      replyPreference: item.reply_preference,
      membersCount: item.members_count,
      createdAt: new Date(item.created_at),
    }));
  }

  async addListMember(listAddress: string, member: ListMember): Promise<ListMember> {
    const result = await this.client.lists.members.createMember(listAddress, {
      address: member.address,
      name: member.name,
      subscribed: member.subscribed ? 'yes' : 'no',
      vars: JSON.stringify(member.vars),
    });

    return {
      address: result.address,
      name: result.name,
      subscribed: result.subscribed,
      vars: result.vars,
    };
  }

  async addListMembers(listAddress: string, members: ListMember[], upsert = true): Promise<void> {
    await this.client.lists.members.createMembers(listAddress, {
      members: JSON.stringify(members.map(m => ({
        address: m.address,
        name: m.name,
        subscribed: m.subscribed,
        vars: m.vars,
      }))),
      upsert: upsert ? 'yes' : 'no',
    });
  }

  async getListMembers(listAddress: string, subscribed?: boolean): Promise<ListMember[]> {
    const result = await this.client.lists.members.listMembers(listAddress, {
      subscribed: subscribed === undefined ? undefined : subscribed ? 'yes' : 'no',
    });

    return result.items.map((item: any) => ({
      address: item.address,
      name: item.name,
      subscribed: item.subscribed,
      vars: item.vars,
    }));
  }

  async removeListMember(listAddress: string, memberAddress: string): Promise<boolean> {
    try {
      await this.client.lists.members.destroyMember(listAddress, memberAddress);
      return true;
    } catch {
      return false;
    }
  }

  // Email Validation
  async validateEmail(email: string): Promise<EmailValidationResult> {
    const result = await this.client.validate.get(email);

    return {
      address: result.address,
      isValid: result.is_valid,
      isDisposable: result.is_disposable_address,
      isRoleAddress: result.is_role_address,
      reason: result.reason || [],
      risk: result.risk,
      rootAddress: result.root_address,
      didYouMean: result.did_you_mean,
    };
  }

  async validateEmailBulk(emails: string[]): Promise<{ jobId: string }> {
    const result = await this.client.validate.multipleValidation.create(emails);
    return { jobId: result.id };
  }

  async getBulkValidationResults(jobId: string): Promise<{
    status: string;
    results?: EmailValidationResult[];
  }> {
    const result = await this.client.validate.multipleValidation.get(jobId);
    return {
      status: result.status,
      results: result.results?.map((r: any) => ({
        address: r.address,
        isValid: r.is_valid,
        isDisposable: r.is_disposable_address,
        isRoleAddress: r.is_role_address,
        reason: r.reason || [],
        risk: r.risk,
      })),
    };
  }

  // Stats and Analytics
  async getStats(
    event: string | string[],
    start?: Date,
    end?: Date,
    resolution?: 'hour' | 'day' | 'month'
  ): Promise<StatsEntry[]> {
    const params: Record<string, any> = {
      event: Array.isArray(event) ? event : [event],
    };

    if (start) params.start = start.toISOString();
    if (end) params.end = end.toISOString();
    if (resolution) params.resolution = resolution;

    const result = await this.client.stats.getDomain(this.domain, params);
    return result.items.map((item: any) => ({
      time: item.time,
      total: Object.values(item).reduce((sum: number, val: any) =>
        typeof val === 'number' ? sum + val : sum, 0
      ),
    }));
  }

  async getDomainStats(): Promise<DomainStats> {
    const events = ['delivered', 'accepted', 'failed', 'opened', 'clicked', 'unsubscribed', 'complained', 'stored'];

    const results = await Promise.all(
      events.map(event => this.getStats(event))
    );

    return {
      delivered: results[0],
      accepted: results[1],
      failed: results[2],
      opened: results[3],
      clicked: results[4],
      unsubscribed: results[5],
      complained: results[6],
      stored: results[7],
    };
  }

  // Events and Logs
  async getEvents(options: {
    event?: string;
    recipient?: string;
    from?: string;
    subject?: string;
    tags?: string[];
    begin?: Date;
    end?: Date;
    ascending?: boolean;
    limit?: number;
  } = {}): Promise<any[]> {
    const params: Record<string, any> = {};

    if (options.event) params.event = options.event;
    if (options.recipient) params.recipient = options.recipient;
    if (options.from) params.from = options.from;
    if (options.subject) params.subject = options.subject;
    if (options.tags) params.tags = options.tags.join(' AND ');
    if (options.begin) params.begin = Math.floor(options.begin.getTime() / 1000);
    if (options.end) params.end = Math.floor(options.end.getTime() / 1000);
    if (options.ascending !== undefined) params.ascending = options.ascending ? 'yes' : 'no';
    if (options.limit) params.limit = options.limit;

    const result = await this.client.events.get(this.domain, params);
    return result.items;
  }

  // Stored Messages
  async getStoredMessage(storageKey: string): Promise<StoredMessage> {
    const result = await this.client.messages.get(this.domain, storageKey);

    return {
      recipients: result.recipients,
      sender: result.sender,
      subject: result.subject,
      bodyPlain: result['body-plain'],
      bodyHtml: result['body-html'],
      attachments: result.attachments || [],
      messageHeaders: result['message-headers'] || {},
    };
  }

  // Suppressions
  async getBounces(): Promise<Array<{ address: string; code: number; error: string; createdAt: Date }>> {
    const result = await this.client.suppressions.list(this.domain, 'bounces');
    return result.items.map((item: any) => ({
      address: item.address,
      code: item.code,
      error: item.error,
      createdAt: new Date(item.created_at),
    }));
  }

  async addBounce(address: string, code: number, error: string): Promise<void> {
    await this.client.suppressions.create(this.domain, 'bounces', {
      address,
      code: String(code),
      error,
    });
  }

  async removeBounce(address: string): Promise<boolean> {
    try {
      await this.client.suppressions.destroy(this.domain, 'bounces', address);
      return true;
    } catch {
      return false;
    }
  }

  async getUnsubscribes(): Promise<Array<{ address: string; tag: string; createdAt: Date }>> {
    const result = await this.client.suppressions.list(this.domain, 'unsubscribes');
    return result.items.map((item: any) => ({
      address: item.address,
      tag: item.tag,
      createdAt: new Date(item.created_at),
    }));
  }

  async addUnsubscribe(address: string, tag?: string): Promise<void> {
    await this.client.suppressions.create(this.domain, 'unsubscribes', {
      address,
      tag,
    });
  }

  async getComplaints(): Promise<Array<{ address: string; createdAt: Date }>> {
    const result = await this.client.suppressions.list(this.domain, 'complaints');
    return result.items.map((item: any) => ({
      address: item.address,
      createdAt: new Date(item.created_at),
    }));
  }

  // Webhook Verification
  verifyWebhook(
    timestamp: string,
    token: string,
    signature: string,
    signingKey: string
  ): boolean {
    const crypto = require('crypto');
    const encodedToken = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp + token)
      .digest('hex');

    return encodedToken === signature;
  }

  // Parse webhook event
  parseWebhookEvent(body: any): WebhookEvent {
    return {
      signature: {
        timestamp: body.signature.timestamp,
        token: body.signature.token,
        signature: body.signature.signature,
      },
      eventData: {
        event: body['event-data'].event,
        timestamp: body['event-data'].timestamp,
        id: body['event-data'].id,
        recipient: body['event-data'].recipient,
        message: {
          headers: body['event-data'].message?.headers || {},
        },
        deliveryStatus: body['event-data']['delivery-status'],
        userVariables: body['event-data']['user-variables'],
        tags: body['event-data'].tags,
        clientInfo: body['event-data']['client-info'],
        geolocation: body['event-data'].geolocation,
        url: body['event-data'].url,
      },
    };
  }
}

export const mailgunService = new MailgunService({
  apiKey: process.env.MAILGUN_API_KEY!,
  domain: process.env.MAILGUN_DOMAIN!,
  region: (process.env.MAILGUN_REGION as 'us' | 'eu') || 'us',
});
```

### Express.js API Routes
```typescript
// routes/mailgun.routes.ts
import { Router, Request, Response } from 'express';
import { mailgunService } from '../services/mailgun.service';

const router = Router();

// Send email
router.post('/send', async (req: Request, res: Response) => {
  try {
    const result = await mailgunService.send(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Send batch emails
router.post('/send/batch', async (req: Request, res: Response) => {
  try {
    const { recipients, message } = req.body;
    const result = await mailgunService.sendBatch(recipients, message);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Template management
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const template = await mailgunService.createTemplate(req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await mailgunService.listTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/templates/:name', async (req: Request, res: Response) => {
  try {
    const template = await mailgunService.getTemplate(req.params.name);
    if (template) {
      res.json({ success: true, data: template });
    } else {
      res.status(404).json({ success: false, error: 'Template not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/templates/:name', async (req: Request, res: Response) => {
  try {
    const template = await mailgunService.updateTemplate(req.params.name, req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/templates/:name', async (req: Request, res: Response) => {
  try {
    const success = await mailgunService.deleteTemplate(req.params.name);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Mailing lists
router.post('/lists', async (req: Request, res: Response) => {
  try {
    const list = await mailgunService.createMailingList(req.body);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/lists', async (req: Request, res: Response) => {
  try {
    const lists = await mailgunService.listMailingLists();
    res.json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/lists/:address/members', async (req: Request, res: Response) => {
  try {
    const member = await mailgunService.addListMember(req.params.address, req.body);
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/lists/:address/members', async (req: Request, res: Response) => {
  try {
    const subscribed = req.query.subscribed === 'true' ? true :
                       req.query.subscribed === 'false' ? false : undefined;
    const members = await mailgunService.getListMembers(req.params.address, subscribed);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Email validation
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await mailgunService.validateEmail(email);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/validate/bulk', async (req: Request, res: Response) => {
  try {
    const { emails } = req.body;
    const result = await mailgunService.validateEmailBulk(emails);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await mailgunService.getDomainStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const events = await mailgunService.getEvents({
      event: req.query.event as string,
      recipient: req.query.recipient as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Suppressions
router.get('/bounces', async (req: Request, res: Response) => {
  try {
    const bounces = await mailgunService.getBounces();
    res.json({ success: true, data: bounces });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/unsubscribes', async (req: Request, res: Response) => {
  try {
    const unsubscribes = await mailgunService.getUnsubscribes();
    res.json({ success: true, data: unsubscribes });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Webhook handler
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY!;
    const { signature } = req.body;

    const isValid = mailgunService.verifyWebhook(
      signature.timestamp,
      signature.token,
      signature.signature,
      signingKey
    );

    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const event = mailgunService.parseWebhookEvent(req.body);

    // Handle different event types
    switch (event.eventData.event) {
      case 'delivered':
        console.log('Email delivered to:', event.eventData.recipient);
        break;
      case 'opened':
        console.log('Email opened by:', event.eventData.recipient);
        break;
      case 'clicked':
        console.log('Link clicked:', event.eventData.url);
        break;
      case 'failed':
        console.log('Delivery failed:', event.eventData.deliveryStatus);
        break;
      case 'unsubscribed':
        console.log('User unsubscribed:', event.eventData.recipient);
        break;
      case 'complained':
        console.log('Spam complaint:', event.eventData.recipient);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React Email Management Component
```tsx
// components/MailgunDashboard.tsx
import React, { useState, useEffect } from 'react';

interface DomainStats {
  delivered: { time: string; total: number }[];
  opened: { time: string; total: number }[];
  clicked: { time: string; total: number }[];
  bounced: { time: string; total: number }[];
}

export const MailgunDashboard: React.FC = () => {
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'lists' | 'suppressions'>('overview');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/mailgun/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTotalFromStats = (entries: { total: number }[]): number => {
    return entries.reduce((sum, e) => sum + e.total, 0);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="mailgun-dashboard">
      <h1>Email Dashboard</h1>

      <div className="tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={activeTab === 'lists' ? 'active' : ''}
          onClick={() => setActiveTab('lists')}
        >
          Mailing Lists
        </button>
        <button
          className={activeTab === 'suppressions' ? 'active' : ''}
          onClick={() => setActiveTab('suppressions')}
        >
          Suppressions
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="stats-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{getTotalFromStats(stats.delivered)}</div>
              <div className="stat-label">Delivered</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{getTotalFromStats(stats.opened)}</div>
              <div className="stat-label">Opened</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{getTotalFromStats(stats.clicked)}</div>
              <div className="stat-label">Clicked</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">{getTotalFromStats(stats.bounced)}</div>
              <div className="stat-label">Bounced</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && <TemplateManager />}
      {activeTab === 'lists' && <MailingListManager />}
      {activeTab === 'suppressions' && <SuppressionManager />}
    </div>
  );
};

// Template Manager Component
const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const response = await fetch('/api/mailgun/templates');
    const data = await response.json();
    if (data.success) {
      setTemplates(data.data);
    }
  };

  return (
    <div className="template-manager">
      <h2>Email Templates</h2>
      <div className="template-list">
        {templates.map(template => (
          <div key={template.name} className="template-item">
            <h3>{template.name}</h3>
            <p>{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mailing List Manager
const MailingListManager: React.FC = () => {
  const [lists, setLists] = useState<any[]>([]);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const response = await fetch('/api/mailgun/lists');
    const data = await response.json();
    if (data.success) {
      setLists(data.data);
    }
  };

  return (
    <div className="list-manager">
      <h2>Mailing Lists</h2>
      <div className="lists">
        {lists.map(list => (
          <div key={list.address} className="list-item">
            <h3>{list.name}</h3>
            <p>{list.address}</p>
            <span className="member-count">{list.membersCount} members</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Suppression Manager
const SuppressionManager: React.FC = () => {
  const [bounces, setBounces] = useState<any[]>([]);
  const [unsubscribes, setUnsubscribes] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'bounces' | 'unsubscribes'>('bounces');

  useEffect(() => {
    loadSuppressions();
  }, []);

  const loadSuppressions = async () => {
    const [bouncesRes, unsubRes] = await Promise.all([
      fetch('/api/mailgun/bounces'),
      fetch('/api/mailgun/unsubscribes'),
    ]);

    const bouncesData = await bouncesRes.json();
    const unsubData = await unsubRes.json();

    if (bouncesData.success) setBounces(bouncesData.data);
    if (unsubData.success) setUnsubscribes(unsubData.data);
  };

  return (
    <div className="suppression-manager">
      <h2>Suppressions</h2>

      <div className="suppression-tabs">
        <button
          className={activeView === 'bounces' ? 'active' : ''}
          onClick={() => setActiveView('bounces')}
        >
          Bounces ({bounces.length})
        </button>
        <button
          className={activeView === 'unsubscribes' ? 'active' : ''}
          onClick={() => setActiveView('unsubscribes')}
        >
          Unsubscribes ({unsubscribes.length})
        </button>
      </div>

      {activeView === 'bounces' && (
        <table className="suppression-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Code</th>
              <th>Error</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {bounces.map(bounce => (
              <tr key={bounce.address}>
                <td>{bounce.address}</td>
                <td>{bounce.code}</td>
                <td>{bounce.error}</td>
                <td>{new Date(bounce.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeView === 'unsubscribes' && (
        <table className="suppression-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Tag</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {unsubscribes.map(unsub => (
              <tr key={unsub.address}>
                <td>{unsub.address}</td>
                <td>{unsub.tag || '-'}</td>
                <td>{new Date(unsub.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

### Python FastAPI Implementation
```python
# mailgun_service.py
import hashlib
import hmac
import time
from datetime import datetime
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, Request
import httpx

router = APIRouter(prefix="/mailgun", tags=["mailgun"])

MAILGUN_API_KEY = "your-api-key"
MAILGUN_DOMAIN = "your-domain.com"
MAILGUN_BASE_URL = "https://api.mailgun.net/v3"


class EmailMessage(BaseModel):
    to: List[EmailStr]
    subject: str
    text: Optional[str] = None
    html: Optional[str] = None
    template: Optional[str] = None
    template_variables: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    tracking: bool = True


class SendResult(BaseModel):
    id: str
    message: str


class MailgunClient:
    def __init__(self, api_key: str, domain: str):
        self.api_key = api_key
        self.domain = domain
        self.base_url = MAILGUN_BASE_URL

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        files: Optional[Dict] = None
    ) -> Dict:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                f"{self.base_url}/{endpoint}",
                auth=("api", self.api_key),
                data=data,
                files=files
            )
            response.raise_for_status()
            return response.json()

    async def send(self, message: EmailMessage) -> SendResult:
        data = {
            "from": f"noreply@{self.domain}",
            "to": ",".join(message.to),
            "subject": message.subject,
        }

        if message.template:
            data["template"] = message.template
            if message.template_variables:
                data["h:X-Mailgun-Variables"] = str(message.template_variables)
        else:
            if message.html:
                data["html"] = message.html
            if message.text:
                data["text"] = message.text

        if message.tags:
            data["o:tag"] = message.tags

        data["o:tracking"] = "yes" if message.tracking else "no"

        result = await self._request("POST", f"{self.domain}/messages", data=data)
        return SendResult(id=result["id"], message=result["message"])

    async def get_stats(
        self,
        event: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None
    ) -> List[Dict]:
        params = {"event": event}
        if start:
            params["start"] = start.isoformat()
        if end:
            params["end"] = end.isoformat()

        result = await self._request("GET", f"{self.domain}/stats/total", data=params)
        return result.get("stats", [])

    async def validate_email(self, email: str) -> Dict:
        result = await self._request("GET", f"address/validate?address={email}")
        return {
            "address": result.get("address"),
            "is_valid": result.get("is_valid"),
            "is_disposable": result.get("is_disposable_address"),
            "risk": result.get("risk"),
            "did_you_mean": result.get("did_you_mean")
        }

    async def get_bounces(self) -> List[Dict]:
        result = await self._request("GET", f"{self.domain}/bounces")
        return result.get("items", [])

    async def get_unsubscribes(self) -> List[Dict]:
        result = await self._request("GET", f"{self.domain}/unsubscribes")
        return result.get("items", [])

    def verify_webhook(
        self,
        timestamp: str,
        token: str,
        signature: str,
        signing_key: str
    ) -> bool:
        # Check timestamp is recent (within 5 minutes)
        if abs(time.time() - int(timestamp)) > 300:
            return False

        expected = hmac.new(
            signing_key.encode(),
            f"{timestamp}{token}".encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected, signature)


# Initialize client
mailgun = MailgunClient(MAILGUN_API_KEY, MAILGUN_DOMAIN)


@router.post("/send")
async def send_email(message: EmailMessage):
    try:
        result = await mailgun.send(message)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_email(email: EmailStr):
    try:
        result = await mailgun.validate_email(email)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats():
    try:
        delivered = await mailgun.get_stats("delivered")
        opened = await mailgun.get_stats("opened")
        clicked = await mailgun.get_stats("clicked")

        return {
            "success": True,
            "data": {
                "delivered": delivered,
                "opened": opened,
                "clicked": clicked
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bounces")
async def get_bounces():
    bounces = await mailgun.get_bounces()
    return {"success": True, "data": bounces}


@router.get("/unsubscribes")
async def get_unsubscribes():
    unsubscribes = await mailgun.get_unsubscribes()
    return {"success": True, "data": unsubscribes}


@router.post("/webhooks")
async def handle_webhook(request: Request):
    body = await request.json()
    signature = body.get("signature", {})

    signing_key = "your-webhook-signing-key"

    if not mailgun.verify_webhook(
        signature.get("timestamp", ""),
        signature.get("token", ""),
        signature.get("signature", ""),
        signing_key
    ):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event_data = body.get("event-data", {})
    event_type = event_data.get("event")
    recipient = event_data.get("recipient")

    print(f"Mailgun event: {event_type} for {recipient}")

    return {"success": True}
```

## CLAUDE.md Integration
```markdown
## Mailgun Commands

### Send emails
"Send email to user@example.com with subject 'Welcome'"
"Send batch email to marketing list"
"Send email using 'welcome' template"

### Template management
"Create new email template named 'order-confirmation'"
"List all email templates"
"Update template content"

### Mailing lists
"Create mailing list newsletter@domain.com"
"Add member to mailing list"
"Get all list members"

### Validation and analytics
"Validate email address user@example.com"
"Get email delivery stats for last 7 days"
"List bounced emails"
```

## AI Suggestions
1. Add automatic bounce handling and list cleanup
2. Implement email warm-up for new domains
3. Add engagement-based send time optimization
4. Create email content testing with spam score
5. Build domain reputation monitoring
6. Add automatic suppression list sync
7. Implement email template version control
8. Create A/B testing framework for emails
9. Add delivery rate alerting
10. Build email performance analytics dashboard
