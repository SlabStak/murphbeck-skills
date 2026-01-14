# Postmark Email Service

## Overview
Complete Postmark integration for reliable transactional email delivery with templates, message streams, webhooks, inbound processing, and comprehensive delivery analytics.

## Quick Start
```bash
npm install postmark
```

## Implementation

### TypeScript Postmark Service
```typescript
// postmark.service.ts
import * as postmark from 'postmark';

interface PostmarkConfig {
  serverToken: string;
  accountToken?: string;
}

interface EmailMessage {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  replyTo?: string;
  tag?: string;
  trackOpens?: boolean;
  trackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  headers?: Record<string, string>;
  attachments?: Attachment[];
  metadata?: Record<string, string>;
  messageStream?: string;
}

interface TemplateEmail {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  templateId?: number;
  templateAlias?: string;
  templateModel: Record<string, unknown>;
  tag?: string;
  trackOpens?: boolean;
  trackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  headers?: Record<string, string>;
  attachments?: Attachment[];
  metadata?: Record<string, string>;
  messageStream?: string;
}

interface Attachment {
  name: string;
  content: string; // Base64 encoded
  contentType: string;
  contentId?: string; // For inline attachments
}

interface SendResult {
  messageId: string;
  to: string;
  submittedAt: string;
  errorCode: number;
  message: string;
}

interface Template {
  templateId: number;
  name: string;
  alias: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  associatedServerId: number;
  active: boolean;
  templateType: 'Standard' | 'Layout';
  layoutTemplate?: string;
}

interface MessageStream {
  id: string;
  serverID: number;
  name: string;
  description: string;
  messageStreamType: 'Transactional' | 'Broadcasts' | 'Inbound';
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string;
}

interface DeliveryStats {
  inactiveMails: number;
  bounces: BounceStats;
}

interface BounceStats {
  total: number;
  hardBounce: number;
  softBounce: number;
  smtpApiError: number;
  transient: number;
}

interface OutboundMessage {
  messageID: string;
  tag: string;
  to: Array<{ email: string; name?: string }>;
  cc: Array<{ email: string; name?: string }>;
  bcc: Array<{ email: string; name?: string }>;
  recipients: string[];
  receivedAt: string;
  from: string;
  subject: string;
  attachments: string[];
  status: string;
  trackOpens: boolean;
  trackLinks: string;
  metadata?: Record<string, string>;
  messageStream: string;
}

interface InboundMessage {
  from: string;
  fromName?: string;
  fromFull: { email: string; name?: string };
  to: string;
  toFull: Array<{ email: string; name?: string }>;
  cc: string;
  ccFull: Array<{ email: string; name?: string }>;
  replyTo: string;
  subject: string;
  messageID: string;
  date: string;
  mailboxHash: string;
  textBody: string;
  htmlBody?: string;
  tag: string;
  strippedTextReply?: string;
  headers: Array<{ name: string; value: string }>;
  attachments: Array<{
    name: string;
    content: string;
    contentType: string;
    contentLength: number;
    contentID?: string;
  }>;
}

interface Bounce {
  id: number;
  type: string;
  typeCode: number;
  name: string;
  tag?: string;
  messageID: string;
  serverID: number;
  description: string;
  details: string;
  email: string;
  from: string;
  bouncedAt: string;
  dumpAvailable: boolean;
  inactive: boolean;
  canActivate: boolean;
  subject: string;
  content?: string;
  messageStream: string;
}

interface WebhookEvent {
  RecordType: string;
  MessageID: string;
  Recipient: string;
  Tag: string;
  DeliveredAt?: string;
  Details?: string;
  ReceivedAt?: string;
  Geo?: {
    CountryISOCode: string;
    Country: string;
    RegionISOCode: string;
    Region: string;
    City: string;
    Zip: string;
    Coords: string;
    IP: string;
  };
  UserAgent?: string;
  OriginalLink?: string;
  ClickLocation?: string;
  Metadata?: Record<string, string>;
  MessageStream: string;
}

class PostmarkService {
  private client: postmark.ServerClient;
  private accountClient?: postmark.AccountClient;

  constructor(config: PostmarkConfig) {
    this.client = new postmark.ServerClient(config.serverToken);
    if (config.accountToken) {
      this.accountClient = new postmark.AccountClient(config.accountToken);
    }
  }

  // Send single email
  async send(message: EmailMessage): Promise<SendResult> {
    const result = await this.client.sendEmail({
      From: message.from,
      To: Array.isArray(message.to) ? message.to.join(',') : message.to,
      Cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(',') : message.cc) : undefined,
      Bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(',') : message.bcc) : undefined,
      Subject: message.subject,
      HtmlBody: message.htmlBody,
      TextBody: message.textBody,
      ReplyTo: message.replyTo,
      Tag: message.tag,
      TrackOpens: message.trackOpens,
      TrackLinks: message.trackLinks,
      Headers: message.headers ? Object.entries(message.headers).map(([Name, Value]) => ({ Name, Value })) : undefined,
      Attachments: message.attachments?.map(a => ({
        Name: a.name,
        Content: a.content,
        ContentType: a.contentType,
        ContentID: a.contentId,
      })),
      Metadata: message.metadata,
      MessageStream: message.messageStream,
    });

    return {
      messageId: result.MessageID,
      to: result.To,
      submittedAt: result.SubmittedAt,
      errorCode: result.ErrorCode,
      message: result.Message,
    };
  }

  // Send batch emails (up to 500)
  async sendBatch(messages: EmailMessage[]): Promise<SendResult[]> {
    const results = await this.client.sendEmailBatch(
      messages.map(message => ({
        From: message.from,
        To: Array.isArray(message.to) ? message.to.join(',') : message.to,
        Subject: message.subject,
        HtmlBody: message.htmlBody,
        TextBody: message.textBody,
        Tag: message.tag,
        TrackOpens: message.trackOpens,
        TrackLinks: message.trackLinks,
        Metadata: message.metadata,
        MessageStream: message.messageStream,
      }))
    );

    return results.map(result => ({
      messageId: result.MessageID,
      to: result.To,
      submittedAt: result.SubmittedAt,
      errorCode: result.ErrorCode,
      message: result.Message,
    }));
  }

  // Send with template
  async sendWithTemplate(email: TemplateEmail): Promise<SendResult> {
    const result = await this.client.sendEmailWithTemplate({
      From: email.from,
      To: Array.isArray(email.to) ? email.to.join(',') : email.to,
      Cc: email.cc ? (Array.isArray(email.cc) ? email.cc.join(',') : email.cc) : undefined,
      Bcc: email.bcc ? (Array.isArray(email.bcc) ? email.bcc.join(',') : email.bcc) : undefined,
      TemplateId: email.templateId,
      TemplateAlias: email.templateAlias,
      TemplateModel: email.templateModel,
      Tag: email.tag,
      TrackOpens: email.trackOpens,
      TrackLinks: email.trackLinks,
      Headers: email.headers ? Object.entries(email.headers).map(([Name, Value]) => ({ Name, Value })) : undefined,
      Attachments: email.attachments?.map(a => ({
        Name: a.name,
        Content: a.content,
        ContentType: a.contentType,
        ContentID: a.contentId,
      })),
      Metadata: email.metadata,
      MessageStream: email.messageStream,
    });

    return {
      messageId: result.MessageID,
      to: result.To,
      submittedAt: result.SubmittedAt,
      errorCode: result.ErrorCode,
      message: result.Message,
    };
  }

  // Send batch with template
  async sendBatchWithTemplate(emails: TemplateEmail[]): Promise<SendResult[]> {
    const results = await this.client.sendEmailBatchWithTemplates(
      emails.map(email => ({
        From: email.from,
        To: Array.isArray(email.to) ? email.to.join(',') : email.to,
        TemplateId: email.templateId,
        TemplateAlias: email.templateAlias,
        TemplateModel: email.templateModel,
        Tag: email.tag,
        TrackOpens: email.trackOpens,
        TrackLinks: email.trackLinks,
        Metadata: email.metadata,
        MessageStream: email.messageStream,
      }))
    );

    return results.map(result => ({
      messageId: result.MessageID,
      to: result.To,
      submittedAt: result.SubmittedAt,
      errorCode: result.ErrorCode,
      message: result.Message,
    }));
  }

  // Template Management
  async createTemplate(template: Partial<Template>): Promise<Template> {
    const result = await this.client.createTemplate({
      Name: template.name!,
      Alias: template.alias,
      Subject: template.subject!,
      HtmlBody: template.htmlBody,
      TextBody: template.textBody,
      TemplateType: template.templateType,
      LayoutTemplate: template.layoutTemplate,
    });

    return {
      templateId: result.TemplateId,
      name: result.Name,
      alias: result.Alias || '',
      subject: result.Subject,
      htmlBody: result.HtmlBody,
      textBody: result.TextBody,
      associatedServerId: result.AssociatedServerId,
      active: result.Active,
      templateType: result.TemplateType as 'Standard' | 'Layout',
      layoutTemplate: result.LayoutTemplate,
    };
  }

  async getTemplate(idOrAlias: number | string): Promise<Template | null> {
    try {
      const result = await this.client.getTemplate(idOrAlias);
      return {
        templateId: result.TemplateId,
        name: result.Name,
        alias: result.Alias || '',
        subject: result.Subject,
        htmlBody: result.HtmlBody,
        textBody: result.TextBody,
        associatedServerId: result.AssociatedServerId,
        active: result.Active,
        templateType: result.TemplateType as 'Standard' | 'Layout',
        layoutTemplate: result.LayoutTemplate,
      };
    } catch (error: any) {
      if (error.code === 1101) return null; // Template not found
      throw error;
    }
  }

  async updateTemplate(idOrAlias: number | string, updates: Partial<Template>): Promise<Template> {
    const result = await this.client.editTemplate(idOrAlias, {
      Name: updates.name,
      Subject: updates.subject,
      HtmlBody: updates.htmlBody,
      TextBody: updates.textBody,
      Alias: updates.alias,
      LayoutTemplate: updates.layoutTemplate,
    });

    return {
      templateId: result.TemplateId,
      name: result.Name,
      alias: result.Alias || '',
      subject: result.Subject,
      htmlBody: result.HtmlBody,
      textBody: result.TextBody,
      associatedServerId: result.AssociatedServerId,
      active: result.Active,
      templateType: result.TemplateType as 'Standard' | 'Layout',
      layoutTemplate: result.LayoutTemplate,
    };
  }

  async deleteTemplate(idOrAlias: number | string): Promise<boolean> {
    try {
      await this.client.deleteTemplate(idOrAlias);
      return true;
    } catch {
      return false;
    }
  }

  async listTemplates(options: {
    count?: number;
    offset?: number;
    templateType?: 'Standard' | 'Layout' | 'All';
  } = {}): Promise<{ templates: Template[]; total: number }> {
    const result = await this.client.getTemplates({
      Count: options.count || 100,
      Offset: options.offset || 0,
      TemplateType: options.templateType,
    });

    return {
      templates: result.Templates.map(t => ({
        templateId: t.TemplateId,
        name: t.Name,
        alias: t.Alias || '',
        subject: t.Subject,
        htmlBody: t.HtmlBody,
        textBody: t.TextBody,
        associatedServerId: t.AssociatedServerId,
        active: t.Active,
        templateType: t.TemplateType as 'Standard' | 'Layout',
        layoutTemplate: t.LayoutTemplate,
      })),
      total: result.TotalCount,
    };
  }

  // Validate template
  async validateTemplate(
    subject: string,
    htmlBody?: string,
    textBody?: string,
    testModel?: Record<string, unknown>
  ): Promise<{
    allContentIsValid: boolean;
    htmlBody?: { contentIsValid: boolean; validationErrors: string[] };
    textBody?: { contentIsValid: boolean; validationErrors: string[] };
    subject: { contentIsValid: boolean; validationErrors: string[] };
    suggestedModel?: Record<string, unknown>;
  }> {
    const result = await this.client.validateTemplate({
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      TestRenderModel: testModel,
    });

    return {
      allContentIsValid: result.AllContentIsValid,
      htmlBody: result.HtmlBody ? {
        contentIsValid: result.HtmlBody.ContentIsValid,
        validationErrors: result.HtmlBody.ValidationErrors.map(e => e.Message),
      } : undefined,
      textBody: result.TextBody ? {
        contentIsValid: result.TextBody.ContentIsValid,
        validationErrors: result.TextBody.ValidationErrors.map(e => e.Message),
      } : undefined,
      subject: {
        contentIsValid: result.Subject.ContentIsValid,
        validationErrors: result.Subject.ValidationErrors.map(e => e.Message),
      },
      suggestedModel: result.SuggestedTemplateModel,
    };
  }

  // Message Streams
  async listMessageStreams(): Promise<MessageStream[]> {
    const result = await this.client.getMessageStreams();
    return result.MessageStreams.map(s => ({
      id: s.ID,
      serverID: s.ServerID,
      name: s.Name,
      description: s.Description || '',
      messageStreamType: s.MessageStreamType as MessageStream['messageStreamType'],
      createdAt: s.CreatedAt,
      updatedAt: s.UpdatedAt,
      archivedAt: s.ArchivedAt,
    }));
  }

  async getMessageStream(id: string): Promise<MessageStream | null> {
    try {
      const result = await this.client.getMessageStream(id);
      return {
        id: result.ID,
        serverID: result.ServerID,
        name: result.Name,
        description: result.Description || '',
        messageStreamType: result.MessageStreamType as MessageStream['messageStreamType'],
        createdAt: result.CreatedAt,
        updatedAt: result.UpdatedAt,
        archivedAt: result.ArchivedAt,
      };
    } catch {
      return null;
    }
  }

  async createMessageStream(data: {
    id: string;
    name: string;
    description?: string;
    messageStreamType: 'Transactional' | 'Broadcasts';
  }): Promise<MessageStream> {
    const result = await this.client.createMessageStream({
      ID: data.id,
      Name: data.name,
      Description: data.description,
      MessageStreamType: data.messageStreamType,
    });

    return {
      id: result.ID,
      serverID: result.ServerID,
      name: result.Name,
      description: result.Description || '',
      messageStreamType: result.MessageStreamType as MessageStream['messageStreamType'],
      createdAt: result.CreatedAt,
      updatedAt: result.UpdatedAt,
      archivedAt: result.ArchivedAt,
    };
  }

  // Outbound Messages
  async getOutboundMessages(options: {
    count?: number;
    offset?: number;
    recipient?: string;
    fromEmail?: string;
    tag?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    messageStream?: string;
  } = {}): Promise<{ messages: OutboundMessage[]; total: number }> {
    const result = await this.client.getOutboundMessages({
      count: options.count || 50,
      offset: options.offset || 0,
      recipient: options.recipient,
      fromemail: options.fromEmail,
      tag: options.tag,
      status: options.status,
      fromdate: options.fromDate?.toISOString(),
      todate: options.toDate?.toISOString(),
      messagestream: options.messageStream,
    });

    return {
      messages: result.Messages.map(m => ({
        messageID: m.MessageID,
        tag: m.Tag || '',
        to: m.To || [],
        cc: m.Cc || [],
        bcc: m.Bcc || [],
        recipients: m.Recipients,
        receivedAt: m.ReceivedAt,
        from: m.From,
        subject: m.Subject,
        attachments: m.Attachments || [],
        status: m.Status,
        trackOpens: m.TrackOpens,
        trackLinks: m.TrackLinks,
        metadata: m.Metadata,
        messageStream: m.MessageStream,
      })),
      total: result.TotalCount,
    };
  }

  async getOutboundMessageDetails(messageId: string): Promise<OutboundMessage> {
    const result = await this.client.getOutboundMessageDetails(messageId);

    return {
      messageID: result.MessageID,
      tag: result.Tag || '',
      to: result.To || [],
      cc: result.Cc || [],
      bcc: result.Bcc || [],
      recipients: result.Recipients,
      receivedAt: result.ReceivedAt,
      from: result.From,
      subject: result.Subject,
      attachments: result.Attachments || [],
      status: result.Status,
      trackOpens: result.TrackOpens,
      trackLinks: result.TrackLinks,
      metadata: result.Metadata,
      messageStream: result.MessageStream,
    };
  }

  // Bounces
  async getBounces(options: {
    count?: number;
    offset?: number;
    type?: string;
    inactive?: boolean;
    emailFilter?: string;
    tag?: string;
    messageID?: string;
    fromDate?: Date;
    toDate?: Date;
    messageStream?: string;
  } = {}): Promise<{ bounces: Bounce[]; total: number }> {
    const result = await this.client.getBounces({
      count: options.count || 50,
      offset: options.offset || 0,
      type: options.type,
      inactive: options.inactive,
      emailFilter: options.emailFilter,
      tag: options.tag,
      messageID: options.messageID,
      fromdate: options.fromDate?.toISOString(),
      todate: options.toDate?.toISOString(),
      messagestream: options.messageStream,
    });

    return {
      bounces: result.Bounces.map(b => ({
        id: b.ID,
        type: b.Type,
        typeCode: b.TypeCode,
        name: b.Name,
        tag: b.Tag,
        messageID: b.MessageID,
        serverID: b.ServerID,
        description: b.Description,
        details: b.Details,
        email: b.Email,
        from: b.From,
        bouncedAt: b.BouncedAt,
        dumpAvailable: b.DumpAvailable,
        inactive: b.Inactive,
        canActivate: b.CanActivate,
        subject: b.Subject,
        content: b.Content,
        messageStream: b.MessageStream,
      })),
      total: result.TotalCount,
    };
  }

  async activateBounce(bounceId: number): Promise<boolean> {
    try {
      await this.client.activateBounce(bounceId);
      return true;
    } catch {
      return false;
    }
  }

  // Stats
  async getDeliveryStats(): Promise<DeliveryStats> {
    const result = await this.client.getDeliveryStatistics();

    return {
      inactiveMails: result.InactiveMails,
      bounces: {
        total: result.Bounces.reduce((sum, b) => sum + b.Count, 0),
        hardBounce: result.Bounces.find(b => b.Name === 'HardBounce')?.Count || 0,
        softBounce: result.Bounces.find(b => b.Name === 'SoftBounce')?.Count || 0,
        smtpApiError: result.Bounces.find(b => b.Name === 'SMTPApiError')?.Count || 0,
        transient: result.Bounces.find(b => b.Name === 'Transient')?.Count || 0,
      },
    };
  }

  async getOutboundStats(options: {
    tag?: string;
    fromDate?: Date;
    toDate?: Date;
    messageStream?: string;
  } = {}): Promise<{
    sent: number;
    bounced: number;
    smtpApiErrors: number;
    bounceRate: number;
    spamComplaints: number;
    spamComplaintsRate: number;
    opens: number;
    uniqueOpens: number;
    clicks: number;
    uniqueClicks: number;
    withClientRecorded: number;
    withPlatformRecorded: number;
  }> {
    const result = await this.client.getOutboundOverview({
      tag: options.tag,
      fromdate: options.fromDate?.toISOString(),
      todate: options.toDate?.toISOString(),
      messagestream: options.messageStream,
    });

    return {
      sent: result.Sent,
      bounced: result.Bounced,
      smtpApiErrors: result.SMTPApiErrors,
      bounceRate: result.BounceRate,
      spamComplaints: result.SpamComplaints,
      spamComplaintsRate: result.SpamComplaintsRate,
      opens: result.Opens,
      uniqueOpens: result.UniqueOpens,
      clicks: result.Clicks,
      uniqueClicks: result.UniqueClicks,
      withClientRecorded: result.WithClientRecorded,
      withPlatformRecorded: result.WithPlatformRecorded,
    };
  }

  // Servers (requires account token)
  async listServers(): Promise<Array<{ id: number; name: string; color: string }>> {
    if (!this.accountClient) {
      throw new Error('Account token required for server management');
    }

    const result = await this.accountClient.getServers();
    return result.Servers.map(s => ({
      id: s.ID,
      name: s.Name,
      color: s.Color,
    }));
  }

  // Suppressions
  async getSuppressions(options: {
    count?: number;
    offset?: number;
    suppressionReason?: 'HardBounce' | 'SpamComplaint' | 'ManualSuppression';
    origin?: string;
    fromDate?: Date;
    toDate?: Date;
    emailFilter?: string;
    messageStream?: string;
  } = {}): Promise<Array<{
    emailAddress: string;
    suppressionReason: string;
    origin: string;
    createdAt: string;
  }>> {
    const result = await this.client.getSuppressions(
      options.messageStream || 'outbound',
      {
        count: options.count || 50,
        offset: options.offset || 0,
        SuppressionReason: options.suppressionReason,
        Origin: options.origin,
        fromdate: options.fromDate?.toISOString(),
        todate: options.toDate?.toISOString(),
        emailFilter: options.emailFilter,
      }
    );

    return result.Suppressions.map(s => ({
      emailAddress: s.EmailAddress,
      suppressionReason: s.SuppressionReason,
      origin: s.Origin,
      createdAt: s.CreatedAt,
    }));
  }

  async addSuppression(emailAddress: string, messageStream = 'outbound'): Promise<void> {
    await this.client.createSuppressions(messageStream, {
      Suppressions: [{ EmailAddress: emailAddress }],
    });
  }

  async deleteSuppression(emailAddress: string, messageStream = 'outbound'): Promise<void> {
    await this.client.deleteSuppressions(messageStream, {
      Suppressions: [{ EmailAddress: emailAddress }],
    });
  }
}

export const postmarkService = new PostmarkService({
  serverToken: process.env.POSTMARK_SERVER_TOKEN!,
  accountToken: process.env.POSTMARK_ACCOUNT_TOKEN,
});
```

### Express.js API Routes
```typescript
// routes/postmark.routes.ts
import { Router, Request, Response } from 'express';
import { postmarkService } from '../services/postmark.service';

const router = Router();

// Send email
router.post('/send', async (req: Request, res: Response) => {
  try {
    const result = await postmarkService.send(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Send batch
router.post('/send/batch', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    const results = await postmarkService.sendBatch(messages);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Send with template
router.post('/send/template', async (req: Request, res: Response) => {
  try {
    const result = await postmarkService.sendWithTemplate(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Templates
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const template = await postmarkService.createTemplate(req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { count, offset, templateType } = req.query;
    const result = await postmarkService.listTemplates({
      count: count ? Number(count) : undefined,
      offset: offset ? Number(offset) : undefined,
      templateType: templateType as any,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/templates/:idOrAlias', async (req: Request, res: Response) => {
  try {
    const idOrAlias = isNaN(Number(req.params.idOrAlias))
      ? req.params.idOrAlias
      : Number(req.params.idOrAlias);
    const template = await postmarkService.getTemplate(idOrAlias);

    if (template) {
      res.json({ success: true, data: template });
    } else {
      res.status(404).json({ success: false, error: 'Template not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/templates/:idOrAlias', async (req: Request, res: Response) => {
  try {
    const idOrAlias = isNaN(Number(req.params.idOrAlias))
      ? req.params.idOrAlias
      : Number(req.params.idOrAlias);
    const template = await postmarkService.updateTemplate(idOrAlias, req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/templates/:idOrAlias', async (req: Request, res: Response) => {
  try {
    const idOrAlias = isNaN(Number(req.params.idOrAlias))
      ? req.params.idOrAlias
      : Number(req.params.idOrAlias);
    const success = await postmarkService.deleteTemplate(idOrAlias);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Validate template
router.post('/templates/validate', async (req: Request, res: Response) => {
  try {
    const { subject, htmlBody, textBody, testModel } = req.body;
    const result = await postmarkService.validateTemplate(
      subject,
      htmlBody,
      textBody,
      testModel
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Message Streams
router.get('/streams', async (req: Request, res: Response) => {
  try {
    const streams = await postmarkService.listMessageStreams();
    res.json({ success: true, data: streams });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/streams', async (req: Request, res: Response) => {
  try {
    const stream = await postmarkService.createMessageStream(req.body);
    res.json({ success: true, data: stream });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Messages
router.get('/messages/outbound', async (req: Request, res: Response) => {
  try {
    const { count, offset, recipient, tag, status, messageStream } = req.query;
    const result = await postmarkService.getOutboundMessages({
      count: count ? Number(count) : undefined,
      offset: offset ? Number(offset) : undefined,
      recipient: recipient as string,
      tag: tag as string,
      status: status as string,
      messageStream: messageStream as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/messages/:messageId', async (req: Request, res: Response) => {
  try {
    const message = await postmarkService.getOutboundMessageDetails(req.params.messageId);
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Bounces
router.get('/bounces', async (req: Request, res: Response) => {
  try {
    const { count, offset, type, inactive, emailFilter, tag, messageStream } = req.query;
    const result = await postmarkService.getBounces({
      count: count ? Number(count) : undefined,
      offset: offset ? Number(offset) : undefined,
      type: type as string,
      inactive: inactive === 'true',
      emailFilter: emailFilter as string,
      tag: tag as string,
      messageStream: messageStream as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/bounces/:bounceId/activate', async (req: Request, res: Response) => {
  try {
    const success = await postmarkService.activateBounce(Number(req.params.bounceId));
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Stats
router.get('/stats/delivery', async (req: Request, res: Response) => {
  try {
    const stats = await postmarkService.getDeliveryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/stats/outbound', async (req: Request, res: Response) => {
  try {
    const { tag, fromDate, toDate, messageStream } = req.query;
    const stats = await postmarkService.getOutboundStats({
      tag: tag as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      messageStream: messageStream as string,
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Suppressions
router.get('/suppressions', async (req: Request, res: Response) => {
  try {
    const { count, offset, suppressionReason, emailFilter, messageStream } = req.query;
    const suppressions = await postmarkService.getSuppressions({
      count: count ? Number(count) : undefined,
      offset: offset ? Number(offset) : undefined,
      suppressionReason: suppressionReason as any,
      emailFilter: emailFilter as string,
      messageStream: messageStream as string,
    });
    res.json({ success: true, data: suppressions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/suppressions', async (req: Request, res: Response) => {
  try {
    const { emailAddress, messageStream } = req.body;
    await postmarkService.addSuppression(emailAddress, messageStream);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/suppressions/:email', async (req: Request, res: Response) => {
  try {
    const { messageStream } = req.query;
    await postmarkService.deleteSuppression(req.params.email, messageStream as string);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Webhooks
router.post('/webhooks/delivery', async (req: Request, res: Response) => {
  try {
    const event = req.body;

    switch (event.RecordType) {
      case 'Delivery':
        console.log('Email delivered:', event.MessageID, 'to', event.Recipient);
        break;
      case 'Bounce':
        console.log('Email bounced:', event.MessageID, event.Type);
        break;
      case 'SpamComplaint':
        console.log('Spam complaint:', event.MessageID, event.Recipient);
        break;
      case 'Open':
        console.log('Email opened:', event.MessageID);
        break;
      case 'Click':
        console.log('Link clicked:', event.OriginalLink);
        break;
      case 'SubscriptionChange':
        console.log('Subscription changed:', event.Recipient);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Inbound webhook
router.post('/webhooks/inbound', async (req: Request, res: Response) => {
  try {
    const message = req.body;

    console.log('Inbound email received:');
    console.log('From:', message.From);
    console.log('To:', message.To);
    console.log('Subject:', message.Subject);
    console.log('Body:', message.TextBody?.substring(0, 200));

    // Process inbound email
    // await processInboundEmail(message);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React Postmark Dashboard Component
```tsx
// components/PostmarkDashboard.tsx
import React, { useState, useEffect } from 'react';

interface OutboundStats {
  sent: number;
  bounced: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  spamComplaints: number;
  bounceRate: number;
}

export const PostmarkDashboard: React.FC = () => {
  const [stats, setStats] = useState<OutboundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 1));

      const response = await fetch(
        `/api/postmark/stats/outbound?fromDate=${fromDate.toISOString()}`
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading stats...</div>;

  return (
    <div className="postmark-dashboard">
      <header className="dashboard-header">
        <h1>Email Performance</h1>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
          <option value="1d">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </header>

      {stats && (
        <div className="stats-grid">
          <StatCard title="Sent" value={stats.sent} />
          <StatCard
            title="Open Rate"
            value={`${((stats.uniqueOpens / stats.sent) * 100).toFixed(1)}%`}
            subtitle={`${stats.uniqueOpens} unique opens`}
          />
          <StatCard
            title="Click Rate"
            value={`${((stats.uniqueClicks / stats.sent) * 100).toFixed(1)}%`}
            subtitle={`${stats.uniqueClicks} unique clicks`}
          />
          <StatCard
            title="Bounce Rate"
            value={`${stats.bounceRate.toFixed(2)}%`}
            subtitle={`${stats.bounced} bounces`}
            warning={stats.bounceRate > 2}
          />
          <StatCard
            title="Spam Complaints"
            value={stats.spamComplaints}
            warning={stats.spamComplaints > 0}
          />
        </div>
      )}

      <div className="dashboard-sections">
        <RecentMessages />
        <RecentBounces />
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  warning?: boolean;
}> = ({ title, value, subtitle, warning }) => (
  <div className={`stat-card ${warning ? 'warning' : ''}`}>
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
  </div>
);

const RecentMessages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const response = await fetch('/api/postmark/messages/outbound?count=10');
    const data = await response.json();
    if (data.success) {
      setMessages(data.data.messages);
    }
  };

  return (
    <div className="recent-messages">
      <h3>Recent Messages</h3>
      <table>
        <thead>
          <tr>
            <th>To</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {messages.map(msg => (
            <tr key={msg.messageID}>
              <td>{msg.recipients[0]}</td>
              <td>{msg.subject}</td>
              <td>
                <span className={`status ${msg.status.toLowerCase()}`}>
                  {msg.status}
                </span>
              </td>
              <td>{new Date(msg.receivedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RecentBounces: React.FC = () => {
  const [bounces, setBounces] = useState<any[]>([]);

  useEffect(() => {
    loadBounces();
  }, []);

  const loadBounces = async () => {
    const response = await fetch('/api/postmark/bounces?count=10');
    const data = await response.json();
    if (data.success) {
      setBounces(data.data.bounces);
    }
  };

  const activateBounce = async (bounceId: number) => {
    await fetch(`/api/postmark/bounces/${bounceId}/activate`, { method: 'POST' });
    loadBounces();
  };

  return (
    <div className="recent-bounces">
      <h3>Recent Bounces</h3>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Type</th>
            <th>Description</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bounces.map(bounce => (
            <tr key={bounce.id}>
              <td>{bounce.email}</td>
              <td>
                <span className={`bounce-type ${bounce.type.toLowerCase()}`}>
                  {bounce.type}
                </span>
              </td>
              <td>{bounce.description}</td>
              <td>{new Date(bounce.bouncedAt).toLocaleString()}</td>
              <td>
                {bounce.canActivate && (
                  <button
                    onClick={() => activateBounce(bounce.id)}
                    className="btn-small"
                  >
                    Reactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Template Editor Component
export const TemplateEditor: React.FC<{
  templateId?: number | string;
  onSave?: () => void;
}> = ({ templateId, onSave }) => {
  const [template, setTemplate] = useState({
    name: '',
    alias: '',
    subject: '',
    htmlBody: '',
    textBody: '',
  });
  const [validation, setValidation] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    const response = await fetch(`/api/postmark/templates/${templateId}`);
    const data = await response.json();
    if (data.success) {
      setTemplate(data.data);
    }
  };

  const validateTemplate = async () => {
    const response = await fetch('/api/postmark/templates/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
      }),
    });
    const data = await response.json();
    setValidation(data.data);
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      const method = templateId ? 'PUT' : 'POST';
      const url = templateId
        ? `/api/postmark/templates/${templateId}`
        : '/api/postmark/templates';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      onSave?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="template-editor">
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          value={template.name}
          onChange={e => setTemplate({ ...template, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Alias</label>
        <input
          type="text"
          value={template.alias}
          onChange={e => setTemplate({ ...template, alias: e.target.value })}
          placeholder="my-template-alias"
        />
      </div>

      <div className="form-group">
        <label>Subject</label>
        <input
          type="text"
          value={template.subject}
          onChange={e => setTemplate({ ...template, subject: e.target.value })}
          placeholder="Hello {{name}}"
        />
      </div>

      <div className="form-group">
        <label>HTML Body</label>
        <textarea
          value={template.htmlBody}
          onChange={e => setTemplate({ ...template, htmlBody: e.target.value })}
          rows={15}
        />
      </div>

      <div className="form-group">
        <label>Text Body</label>
        <textarea
          value={template.textBody}
          onChange={e => setTemplate({ ...template, textBody: e.target.value })}
          rows={8}
        />
      </div>

      {validation && (
        <div className={`validation-result ${validation.allContentIsValid ? 'valid' : 'invalid'}`}>
          <h4>Validation Result</h4>
          {validation.allContentIsValid ? (
            <p>Template is valid!</p>
          ) : (
            <ul>
              {validation.subject?.validationErrors.map((e: string, i: number) => (
                <li key={i}>Subject: {e}</li>
              ))}
              {validation.htmlBody?.validationErrors.map((e: string, i: number) => (
                <li key={i}>HTML: {e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="form-actions">
        <button onClick={validateTemplate} className="btn-secondary">
          Validate
        </button>
        <button onClick={saveTemplate} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  );
};
```

### Python FastAPI Implementation
```python
# postmark_service.py
from datetime import datetime
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter(prefix="/postmark", tags=["postmark"])

POSTMARK_SERVER_TOKEN = "your-server-token"
POSTMARK_API_URL = "https://api.postmarkapp.com"


class EmailMessage(BaseModel):
    from_email: str
    to: List[EmailStr]
    subject: str
    html_body: Optional[str] = None
    text_body: Optional[str] = None
    tag: Optional[str] = None
    track_opens: bool = True
    track_links: str = "HtmlAndText"
    message_stream: str = "outbound"


class TemplateEmail(BaseModel):
    from_email: str
    to: List[EmailStr]
    template_alias: str
    template_model: Dict[str, Any]
    tag: Optional[str] = None
    message_stream: str = "outbound"


class PostmarkClient:
    def __init__(self, server_token: str):
        self.server_token = server_token
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": server_token
        }

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None
    ) -> Dict:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                f"{POSTMARK_API_URL}/{endpoint}",
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            return response.json()

    async def send(self, message: EmailMessage) -> Dict:
        data = {
            "From": message.from_email,
            "To": ",".join(message.to),
            "Subject": message.subject,
            "HtmlBody": message.html_body,
            "TextBody": message.text_body,
            "Tag": message.tag,
            "TrackOpens": message.track_opens,
            "TrackLinks": message.track_links,
            "MessageStream": message.message_stream
        }

        result = await self._request("POST", "email", data)
        return {
            "message_id": result["MessageID"],
            "to": result["To"],
            "submitted_at": result["SubmittedAt"],
            "error_code": result["ErrorCode"],
            "message": result["Message"]
        }

    async def send_with_template(self, email: TemplateEmail) -> Dict:
        data = {
            "From": email.from_email,
            "To": ",".join(email.to),
            "TemplateAlias": email.template_alias,
            "TemplateModel": email.template_model,
            "Tag": email.tag,
            "MessageStream": email.message_stream
        }

        result = await self._request("POST", "email/withTemplate", data)
        return {
            "message_id": result["MessageID"],
            "to": result["To"],
            "submitted_at": result["SubmittedAt"]
        }

    async def get_templates(self, count: int = 100, offset: int = 0) -> Dict:
        result = await self._request(
            "GET",
            f"templates?Count={count}&Offset={offset}"
        )
        return {
            "templates": [
                {
                    "template_id": t["TemplateId"],
                    "name": t["Name"],
                    "alias": t.get("Alias"),
                    "subject": t["Subject"],
                    "active": t["Active"]
                }
                for t in result["Templates"]
            ],
            "total": result["TotalCount"]
        }

    async def get_outbound_stats(
        self,
        tag: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        message_stream: str = "outbound"
    ) -> Dict:
        params = [f"messagestream={message_stream}"]
        if tag:
            params.append(f"tag={tag}")
        if from_date:
            params.append(f"fromdate={from_date.isoformat()}")
        if to_date:
            params.append(f"todate={to_date.isoformat()}")

        result = await self._request(
            "GET",
            f"stats/outbound?{'&'.join(params)}"
        )

        return {
            "sent": result["Sent"],
            "bounced": result["Bounced"],
            "bounce_rate": result["BounceRate"],
            "spam_complaints": result["SpamComplaints"],
            "opens": result["Opens"],
            "unique_opens": result["UniqueOpens"],
            "clicks": result["Clicks"],
            "unique_clicks": result["UniqueClicks"]
        }

    async def get_bounces(
        self,
        count: int = 50,
        offset: int = 0,
        bounce_type: Optional[str] = None,
        message_stream: str = "outbound"
    ) -> Dict:
        params = [
            f"count={count}",
            f"offset={offset}",
            f"messagestream={message_stream}"
        ]
        if bounce_type:
            params.append(f"type={bounce_type}")

        result = await self._request(
            "GET",
            f"bounces?{'&'.join(params)}"
        )

        return {
            "bounces": [
                {
                    "id": b["ID"],
                    "type": b["Type"],
                    "email": b["Email"],
                    "description": b["Description"],
                    "bounced_at": b["BouncedAt"],
                    "can_activate": b["CanActivate"]
                }
                for b in result["Bounces"]
            ],
            "total": result["TotalCount"]
        }

    async def get_suppressions(
        self,
        count: int = 50,
        offset: int = 0,
        message_stream: str = "outbound"
    ) -> List[Dict]:
        result = await self._request(
            "GET",
            f"message-streams/{message_stream}/suppressions/dump"
            f"?Count={count}&Offset={offset}"
        )

        return [
            {
                "email_address": s["EmailAddress"],
                "suppression_reason": s["SuppressionReason"],
                "origin": s["Origin"],
                "created_at": s["CreatedAt"]
            }
            for s in result["Suppressions"]
        ]


# Initialize client
postmark = PostmarkClient(POSTMARK_SERVER_TOKEN)


@router.post("/send")
async def send_email(message: EmailMessage):
    try:
        result = await postmark.send(message)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send/template")
async def send_with_template(email: TemplateEmail):
    try:
        result = await postmark.send_with_template(email)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def get_templates(count: int = 100, offset: int = 0):
    result = await postmark.get_templates(count, offset)
    return {"success": True, "data": result}


@router.get("/stats/outbound")
async def get_outbound_stats(
    tag: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    message_stream: str = "outbound"
):
    stats = await postmark.get_outbound_stats(tag, from_date, to_date, message_stream)
    return {"success": True, "data": stats}


@router.get("/bounces")
async def get_bounces(
    count: int = 50,
    offset: int = 0,
    bounce_type: Optional[str] = None,
    message_stream: str = "outbound"
):
    result = await postmark.get_bounces(count, offset, bounce_type, message_stream)
    return {"success": True, "data": result}


@router.get("/suppressions")
async def get_suppressions(
    count: int = 50,
    offset: int = 0,
    message_stream: str = "outbound"
):
    suppressions = await postmark.get_suppressions(count, offset, message_stream)
    return {"success": True, "data": suppressions}


@router.post("/webhooks/delivery")
async def handle_delivery_webhook(event: Dict[str, Any]):
    record_type = event.get("RecordType")
    message_id = event.get("MessageID")
    recipient = event.get("Recipient")

    if record_type == "Delivery":
        print(f"Email delivered: {message_id} to {recipient}")
    elif record_type == "Bounce":
        print(f"Email bounced: {message_id}, type: {event.get('Type')}")
    elif record_type == "SpamComplaint":
        print(f"Spam complaint: {message_id} from {recipient}")
    elif record_type == "Open":
        print(f"Email opened: {message_id}")
    elif record_type == "Click":
        print(f"Link clicked: {event.get('OriginalLink')}")

    return {"success": True}


@router.post("/webhooks/inbound")
async def handle_inbound_webhook(message: Dict[str, Any]):
    print(f"Inbound email from {message.get('From')}")
    print(f"Subject: {message.get('Subject')}")
    print(f"To: {message.get('To')}")

    # Process inbound email here

    return {"success": True}
```

## CLAUDE.md Integration
```markdown
## Postmark Commands

### Send emails
"Send email to user@example.com with subject 'Welcome'"
"Send using template 'welcome-email' with user data"
"Send batch of 100 transactional emails"

### Templates
"List all email templates"
"Create new template for password reset"
"Validate template before saving"

### Message streams
"List message streams"
"Create broadcast stream for marketing emails"
"Get stats for transactional stream"

### Analytics and bounces
"Get outbound stats for last 30 days"
"List recent bounces"
"Reactivate bounced email address"
"Get suppression list"
```

## AI Suggestions
1. Add automatic template versioning and rollback
2. Implement smart retry logic for failed deliveries
3. Add email preview rendering with test data
4. Create deliverability monitoring dashboard
5. Build automatic bounce classification
6. Add email content optimization suggestions
7. Implement A/B testing for subject lines
8. Create engagement scoring for recipients
9. Add automatic suppression list management
10. Build custom reporting and export functionality
