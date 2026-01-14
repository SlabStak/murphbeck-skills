# SendGrid Email Integration

## Overview
Complete SendGrid integration for transactional and marketing emails with templates, tracking, and dynamic content.

## Quick Start

```bash
npm install @sendgrid/mail @sendgrid/client
```

## Full Implementation

### TypeScript SendGrid Service

```typescript
// email/sendgrid-service.ts
import sgMail, { MailDataRequired } from '@sendgrid/mail';
import sgClient from '@sendgrid/client';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  from?: { email: string; name?: string };
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
    contentId?: string;
  }>;
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number; // Unix timestamp
  batchId?: string;
  asm?: {
    groupId: number;
    groupsToDisplay?: number[];
  };
  trackingSettings?: {
    clickTracking?: { enable: boolean };
    openTracking?: { enable: boolean };
    subscriptionTracking?: { enable: boolean };
  };
}

interface BulkEmailOptions extends Omit<EmailOptions, 'to'> {
  personalizations: Array<{
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    dynamicTemplateData?: Record<string, any>;
    customArgs?: Record<string, string>;
    sendAt?: number;
  }>;
}

interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  customFields?: Record<string, string | number>;
}

interface EmailStats {
  date: string;
  requests: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  spamReports: number;
  unsubscribes: number;
}

export class SendGridService {
  private defaultFrom: { email: string; name?: string };

  constructor(config: {
    apiKey: string;
    defaultFrom: { email: string; name?: string };
  }) {
    sgMail.setApiKey(config.apiKey);
    sgClient.setApiKey(config.apiKey);
    this.defaultFrom = config.defaultFrom;
  }

  // Single email
  async sendEmail(options: EmailOptions): Promise<string> {
    const msg: MailDataRequired = {
      to: options.to,
      from: options.from || this.defaultFrom,
      subject: options.subject,
      text: options.text,
      html: options.html,
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      categories: options.categories,
      customArgs: options.customArgs,
      sendAt: options.sendAt,
      batchId: options.batchId,
      asm: options.asm,
      trackingSettings: options.trackingSettings
    };

    const [response] = await sgMail.send(msg);
    return response.headers['x-message-id'] as string;
  }

  // Bulk email with personalizations
  async sendBulkEmail(options: BulkEmailOptions): Promise<string> {
    const msg: MailDataRequired = {
      personalizations: options.personalizations.map(p => ({
        to: Array.isArray(p.to) ? p.to.map(e => ({ email: e })) : [{ email: p.to }],
        cc: p.cc ? (Array.isArray(p.cc) ? p.cc.map(e => ({ email: e })) : [{ email: p.cc }]) : undefined,
        bcc: p.bcc ? (Array.isArray(p.bcc) ? p.bcc.map(e => ({ email: e })) : [{ email: p.bcc }]) : undefined,
        subject: p.subject,
        dynamicTemplateData: p.dynamicTemplateData,
        customArgs: p.customArgs,
        sendAt: p.sendAt
      })),
      from: options.from || this.defaultFrom,
      subject: options.subject || '',
      templateId: options.templateId,
      text: options.text,
      html: options.html,
      categories: options.categories,
      asm: options.asm,
      trackingSettings: options.trackingSettings
    };

    const [response] = await sgMail.send(msg);
    return response.headers['x-message-id'] as string;
  }

  // Schedule email
  async scheduleEmail(options: EmailOptions, sendAt: Date): Promise<string> {
    return this.sendEmail({
      ...options,
      sendAt: Math.floor(sendAt.getTime() / 1000)
    });
  }

  // Cancel scheduled email
  async cancelScheduledEmail(batchId: string): Promise<void> {
    await sgClient.request({
      method: 'POST',
      url: `/v3/user/scheduled_sends`,
      body: { batch_id: batchId, status: 'cancel' }
    });
  }

  // Template management
  async createTemplate(name: string, generation: 'legacy' | 'dynamic' = 'dynamic'): Promise<string> {
    const [, body] = await sgClient.request({
      method: 'POST',
      url: '/v3/templates',
      body: { name, generation }
    });
    return (body as any).id;
  }

  async createTemplateVersion(
    templateId: string,
    version: {
      name: string;
      subject: string;
      htmlContent?: string;
      plainContent?: string;
      active?: number;
    }
  ): Promise<string> {
    const [, body] = await sgClient.request({
      method: 'POST',
      url: `/v3/templates/${templateId}/versions`,
      body: {
        name: version.name,
        subject: version.subject,
        html_content: version.htmlContent,
        plain_content: version.plainContent,
        active: version.active ?? 1
      }
    });
    return (body as any).id;
  }

  async getTemplates(generations?: string): Promise<any[]> {
    const [, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/templates',
      qs: { generations: generations || 'dynamic' }
    });
    return (body as any).templates;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await sgClient.request({
      method: 'DELETE',
      url: `/v3/templates/${templateId}`
    });
  }

  // Contact management
  async addContact(contact: ContactData, listIds?: string[]): Promise<string> {
    const [, body] = await sgClient.request({
      method: 'PUT',
      url: '/v3/marketing/contacts',
      body: {
        list_ids: listIds,
        contacts: [{
          email: contact.email,
          first_name: contact.firstName,
          last_name: contact.lastName,
          custom_fields: contact.customFields
        }]
      }
    });
    return (body as any).job_id;
  }

  async addContacts(contacts: ContactData[], listIds?: string[]): Promise<string> {
    const [, body] = await sgClient.request({
      method: 'PUT',
      url: '/v3/marketing/contacts',
      body: {
        list_ids: listIds,
        contacts: contacts.map(c => ({
          email: c.email,
          first_name: c.firstName,
          last_name: c.lastName,
          custom_fields: c.customFields
        }))
      }
    });
    return (body as any).job_id;
  }

  async searchContacts(query: string): Promise<any[]> {
    const [, body] = await sgClient.request({
      method: 'POST',
      url: '/v3/marketing/contacts/search',
      body: { query }
    });
    return (body as any).result;
  }

  async deleteContacts(emails: string[]): Promise<void> {
    // First search for contact IDs
    const query = `email IN (${emails.map(e => `'${e}'`).join(',')})`;
    const contacts = await this.searchContacts(query);
    const ids = contacts.map((c: any) => c.id);

    if (ids.length > 0) {
      await sgClient.request({
        method: 'DELETE',
        url: '/v3/marketing/contacts',
        qs: { ids: ids.join(',') }
      });
    }
  }

  // List management
  async createList(name: string): Promise<string> {
    const [, body] = await sgClient.request({
      method: 'POST',
      url: '/v3/marketing/lists',
      body: { name }
    });
    return (body as any).id;
  }

  async getLists(): Promise<any[]> {
    const [, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/marketing/lists'
    });
    return (body as any).result;
  }

  async addContactsToList(listId: string, contactIds: string[]): Promise<void> {
    await sgClient.request({
      method: 'PATCH',
      url: `/v3/marketing/lists/${listId}`,
      body: { contact_ids: contactIds }
    });
  }

  async removeContactFromList(listId: string, contactId: string): Promise<void> {
    await sgClient.request({
      method: 'DELETE',
      url: `/v3/marketing/lists/${listId}/contacts`,
      qs: { contact_ids: contactId }
    });
  }

  // Suppression management
  async addToSuppressionGroup(groupId: number, emails: string[]): Promise<void> {
    await sgClient.request({
      method: 'POST',
      url: `/v3/asm/groups/${groupId}/suppressions`,
      body: { recipient_emails: emails }
    });
  }

  async removeFromSuppressionGroup(groupId: number, email: string): Promise<void> {
    await sgClient.request({
      method: 'DELETE',
      url: `/v3/asm/groups/${groupId}/suppressions/${email}`
    });
  }

  async getGlobalUnsubscribes(
    startTime?: number,
    endTime?: number
  ): Promise<string[]> {
    const [, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/suppression/unsubscribes',
      qs: { start_time: startTime, end_time: endTime }
    });
    return (body as any[]).map(u => u.email);
  }

  async addToGlobalUnsubscribe(emails: string[]): Promise<void> {
    await sgClient.request({
      method: 'POST',
      url: '/v3/asm/suppressions/global',
      body: { recipient_emails: emails }
    });
  }

  // Bounce management
  async getBouncedEmails(startTime?: number, endTime?: number): Promise<any[]> {
    const [, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/suppression/bounces',
      qs: { start_time: startTime, end_time: endTime }
    });
    return body as any[];
  }

  async deleteBounce(email: string): Promise<void> {
    await sgClient.request({
      method: 'DELETE',
      url: `/v3/suppression/bounces/${email}`
    });
  }

  // Statistics
  async getGlobalStats(
    startDate: string,
    endDate?: string,
    aggregatedBy?: 'day' | 'week' | 'month'
  ): Promise<EmailStats[]> {
    const [, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/stats',
      qs: {
        start_date: startDate,
        end_date: endDate,
        aggregated_by: aggregatedBy
      }
    });

    return (body as any[]).map(stat => ({
      date: stat.date,
      requests: stat.stats[0]?.metrics?.requests || 0,
      delivered: stat.stats[0]?.metrics?.delivered || 0,
      opens: stat.stats[0]?.metrics?.opens || 0,
      clicks: stat.stats[0]?.metrics?.clicks || 0,
      bounces: stat.stats[0]?.metrics?.bounces || 0,
      spamReports: stat.stats[0]?.metrics?.spam_reports || 0,
      unsubscribes: stat.stats[0]?.metrics?.unsubscribes || 0
    }));
  }

  async getCategoryStats(
    categories: string[],
    startDate: string,
    endDate?: string
  ): Promise<Record<string, EmailStats[]>> {
    const [, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/categories/stats',
      qs: {
        categories: categories.join(','),
        start_date: startDate,
        end_date: endDate
      }
    });

    const result: Record<string, EmailStats[]> = {};
    for (const stat of body as any[]) {
      const category = stat.name;
      if (!result[category]) result[category] = [];
      result[category].push({
        date: stat.date,
        requests: stat.stats[0]?.metrics?.requests || 0,
        delivered: stat.stats[0]?.metrics?.delivered || 0,
        opens: stat.stats[0]?.metrics?.opens || 0,
        clicks: stat.stats[0]?.metrics?.clicks || 0,
        bounces: stat.stats[0]?.metrics?.bounces || 0,
        spamReports: stat.stats[0]?.metrics?.spam_reports || 0,
        unsubscribes: stat.stats[0]?.metrics?.unsubscribes || 0
      });
    }
    return result;
  }

  // Email validation
  async validateEmail(email: string): Promise<{
    valid: boolean;
    verdict: string;
    score: number;
    local: string;
    host: string;
    suggestion?: string;
  }> {
    const [, body] = await sgClient.request({
      method: 'POST',
      url: '/v3/validations/email',
      body: { email }
    });

    const result = (body as any).result;
    return {
      valid: result.verdict === 'Valid',
      verdict: result.verdict,
      score: result.score,
      local: result.local,
      host: result.host,
      suggestion: result.suggestion
    };
  }

  // Domain authentication
  async getDomainAuthentications(): Promise<any[]> {
    const [, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/whitelabel/domains'
    });
    return body as any[];
  }

  async authenticateDomain(domain: string): Promise<any> {
    const [, body] = await sgClient.request({
      method: 'POST',
      url: '/v3/whitelabel/domains',
      body: {
        domain,
        automatic_security: true
      }
    });
    return body;
  }

  // Inbound parse
  async setupInboundParse(
    hostname: string,
    url: string,
    spamCheck: boolean = true
  ): Promise<void> {
    await sgClient.request({
      method: 'POST',
      url: '/v3/user/webhooks/parse/settings',
      body: {
        hostname,
        url,
        spam_check: spamCheck,
        send_raw: false
      }
    });
  }

  // Event webhooks
  async configureEventWebhook(url: string, events: string[]): Promise<void> {
    await sgClient.request({
      method: 'PATCH',
      url: '/v3/user/webhooks/event/settings',
      body: {
        enabled: true,
        url,
        ...events.reduce((acc, event) => ({ ...acc, [event]: true }), {})
      }
    });
  }
}
```

### Express API Routes

```typescript
// routes/email.ts
import { Router, Request, Response } from 'express';
import { SendGridService } from '../email/sendgrid-service';

const router = Router();
const emailService = new SendGridService({
  apiKey: process.env.SENDGRID_API_KEY!,
  defaultFrom: {
    email: process.env.DEFAULT_FROM_EMAIL!,
    name: process.env.DEFAULT_FROM_NAME
  }
});

// Send single email
router.post('/send', async (req: Request, res: Response) => {
  try {
    const messageId = await emailService.sendEmail(req.body);
    res.json({ success: true, messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send with template
router.post('/send-template', async (req: Request, res: Response) => {
  try {
    const { to, templateId, data, ...options } = req.body;
    const messageId = await emailService.sendEmail({
      to,
      subject: '', // Subject comes from template
      templateId,
      dynamicTemplateData: data,
      ...options
    });
    res.json({ success: true, messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send bulk email
router.post('/send-bulk', async (req: Request, res: Response) => {
  try {
    const messageId = await emailService.sendBulkEmail(req.body);
    res.json({ success: true, messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule email
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { sendAt, ...emailOptions } = req.body;
    const messageId = await emailService.scheduleEmail(
      emailOptions,
      new Date(sendAt)
    );
    res.json({ success: true, messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel scheduled email
router.delete('/schedule/:batchId', async (req: Request, res: Response) => {
  try {
    await emailService.cancelScheduledEmail(req.params.batchId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Contact management
router.post('/contacts', async (req: Request, res: Response) => {
  try {
    const { contacts, listIds } = req.body;
    const jobId = Array.isArray(contacts)
      ? await emailService.addContacts(contacts, listIds)
      : await emailService.addContact(contacts, listIds);
    res.json({ success: true, jobId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/contacts/search', async (req: Request, res: Response) => {
  try {
    const contacts = await emailService.searchContacts(req.body.query);
    res.json({ contacts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List management
router.get('/lists', async (req: Request, res: Response) => {
  try {
    const lists = await emailService.getLists();
    res.json({ lists });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lists', async (req: Request, res: Response) => {
  try {
    const listId = await emailService.createList(req.body.name);
    res.json({ success: true, listId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, aggregatedBy } = req.query;
    const stats = await emailService.getGlobalStats(
      startDate as string,
      endDate as string,
      aggregatedBy as any
    );
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Email validation
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const result = await emailService.validateEmail(req.body.email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for events
router.post('/webhook/events', (req: Request, res: Response) => {
  const events = req.body;

  for (const event of events) {
    switch (event.event) {
      case 'delivered':
        console.log(`Email delivered to ${event.email}`);
        break;
      case 'open':
        console.log(`Email opened by ${event.email}`);
        break;
      case 'click':
        console.log(`Link clicked by ${event.email}: ${event.url}`);
        break;
      case 'bounce':
        console.log(`Bounce from ${event.email}: ${event.reason}`);
        break;
      case 'dropped':
        console.log(`Email dropped for ${event.email}: ${event.reason}`);
        break;
      case 'spamreport':
        console.log(`Spam report from ${event.email}`);
        break;
      case 'unsubscribe':
        console.log(`Unsubscribe from ${event.email}`);
        break;
    }
  }

  res.status(200).send();
});

export default router;
```

### React Email Hook

```tsx
// hooks/useEmail.ts
import { useState, useCallback } from 'react';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  data?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function useEmail() {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<EmailResult | null>(null);

  const sendEmail = useCallback(async (options: EmailOptions): Promise<EmailResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      const result = await response.json();
      setLastResult(result);
      return result;
    } catch (error: any) {
      const result = { success: false, error: error.message };
      setLastResult(result);
      return result;
    } finally {
      setSending(false);
    }
  }, []);

  const sendTemplateEmail = useCallback(async (
    to: string | string[],
    templateId: string,
    data: Record<string, any>
  ): Promise<EmailResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/email/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, templateId, data })
      });

      const result = await response.json();
      setLastResult(result);
      return result;
    } catch (error: any) {
      const result = { success: false, error: error.message };
      setLastResult(result);
      return result;
    } finally {
      setSending(false);
    }
  }, []);

  const validateEmail = useCallback(async (email: string) => {
    const response = await fetch('/api/email/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return response.json();
  }, []);

  return {
    sendEmail,
    sendTemplateEmail,
    validateEmail,
    sending,
    lastResult
  };
}
```

## Python Implementation

```python
# email_service/sendgrid_service.py
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail, Email, To, Content, Attachment,
    FileContent, FileName, FileType, Disposition,
    Category, CustomArg, SendAt, BatchId,
    Asm, GroupId, GroupsToDisplay, TrackingSettings,
    ClickTracking, OpenTracking, SubscriptionTracking,
    Personalization, DynamicTemplateData
)


class SendGridService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        default_from_email: str = None,
        default_from_name: Optional[str] = None
    ):
        self.client = SendGridAPIClient(api_key or os.environ.get('SENDGRID_API_KEY'))
        self.default_from = Email(default_from_email, default_from_name)

    def send_email(
        self,
        to: str | List[str],
        subject: str,
        text: Optional[str] = None,
        html: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[Dict]] = None,
        categories: Optional[List[str]] = None,
        custom_args: Optional[Dict[str, str]] = None,
        send_at: Optional[datetime] = None,
        template_id: Optional[str] = None,
        template_data: Optional[Dict[str, Any]] = None,
        asm_group_id: Optional[int] = None
    ) -> str:
        message = Mail()

        # From
        if from_email:
            message.from_email = Email(from_email, from_name)
        else:
            message.from_email = self.default_from

        # To
        to_list = [to] if isinstance(to, str) else to
        for recipient in to_list:
            message.add_to(To(recipient))

        # Subject
        message.subject = subject

        # Content
        if text:
            message.add_content(Content('text/plain', text))
        if html:
            message.add_content(Content('text/html', html))

        # Template
        if template_id:
            message.template_id = template_id
            if template_data:
                message.dynamic_template_data = template_data

        # Reply-To
        if reply_to:
            message.reply_to = Email(reply_to)

        # CC/BCC
        if cc:
            for email in cc:
                message.add_cc(Email(email))
        if bcc:
            for email in bcc:
                message.add_bcc(Email(email))

        # Attachments
        if attachments:
            for att in attachments:
                attachment = Attachment()
                attachment.file_content = FileContent(att['content'])
                attachment.file_name = FileName(att['filename'])
                if 'type' in att:
                    attachment.file_type = FileType(att['type'])
                if 'disposition' in att:
                    attachment.disposition = Disposition(att['disposition'])
                message.add_attachment(attachment)

        # Categories
        if categories:
            for cat in categories:
                message.add_category(Category(cat))

        # Custom Args
        if custom_args:
            for key, value in custom_args.items():
                message.add_custom_arg(CustomArg(key, value))

        # Scheduled send
        if send_at:
            message.send_at = SendAt(int(send_at.timestamp()))

        # Unsubscribe group
        if asm_group_id:
            message.asm = Asm(GroupId(asm_group_id))

        response = self.client.send(message)
        return response.headers.get('X-Message-Id', '')

    def send_bulk_email(
        self,
        personalizations: List[Dict],
        subject: str,
        template_id: Optional[str] = None,
        html: Optional[str] = None,
        text: Optional[str] = None,
        categories: Optional[List[str]] = None
    ) -> str:
        message = Mail()
        message.from_email = self.default_from
        message.subject = subject

        if template_id:
            message.template_id = template_id

        if html:
            message.add_content(Content('text/html', html))
        if text:
            message.add_content(Content('text/plain', text))

        for p in personalizations:
            personalization = Personalization()

            # To
            to_list = p['to'] if isinstance(p['to'], list) else [p['to']]
            for email in to_list:
                personalization.add_to(To(email))

            # Subject override
            if 'subject' in p:
                personalization.subject = p['subject']

            # Dynamic template data
            if 'data' in p:
                personalization.dynamic_template_data = p['data']

            # Custom args
            if 'custom_args' in p:
                for key, value in p['custom_args'].items():
                    personalization.add_custom_arg(CustomArg(key, value))

            # Send at
            if 'send_at' in p:
                personalization.send_at = SendAt(int(p['send_at'].timestamp()))

            message.add_personalization(personalization)

        if categories:
            for cat in categories:
                message.add_category(Category(cat))

        response = self.client.send(message)
        return response.headers.get('X-Message-Id', '')

    def add_contact(
        self,
        email: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        custom_fields: Optional[Dict] = None,
        list_ids: Optional[List[str]] = None
    ) -> str:
        data = {
            'contacts': [{
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                **(custom_fields or {})
            }]
        }

        if list_ids:
            data['list_ids'] = list_ids

        response = self.client.client.marketing.contacts.put(
            request_body=data
        )
        return response.body.get('job_id', '')

    def add_contacts_bulk(
        self,
        contacts: List[Dict],
        list_ids: Optional[List[str]] = None
    ) -> str:
        data = {
            'contacts': contacts
        }

        if list_ids:
            data['list_ids'] = list_ids

        response = self.client.client.marketing.contacts.put(
            request_body=data
        )
        return response.body.get('job_id', '')

    def search_contacts(self, query: str) -> List[Dict]:
        response = self.client.client.marketing.contacts.search.post(
            request_body={'query': query}
        )
        return response.body.get('result', [])

    def create_list(self, name: str) -> str:
        response = self.client.client.marketing.lists.post(
            request_body={'name': name}
        )
        return response.body.get('id', '')

    def get_lists(self) -> List[Dict]:
        response = self.client.client.marketing.lists.get()
        return response.body.get('result', [])

    def get_stats(
        self,
        start_date: str,
        end_date: Optional[str] = None,
        aggregated_by: Optional[str] = None
    ) -> List[Dict]:
        params = {'start_date': start_date}
        if end_date:
            params['end_date'] = end_date
        if aggregated_by:
            params['aggregated_by'] = aggregated_by

        response = self.client.client.stats.get(query_params=params)
        return response.body

    def validate_email(self, email: str) -> Dict:
        response = self.client.client.validations.email.post(
            request_body={'email': email}
        )
        result = response.body.get('result', {})
        return {
            'valid': result.get('verdict') == 'Valid',
            'verdict': result.get('verdict'),
            'score': result.get('score'),
            'local': result.get('local'),
            'host': result.get('host'),
            'suggestion': result.get('suggestion')
        }
```

### FastAPI Routes

```python
# routes/email_routes.py
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

from email_service.sendgrid_service import SendGridService

router = APIRouter(prefix="/api/email", tags=["Email"])
email_service = SendGridService()


class EmailRequest(BaseModel):
    to: str | List[str]
    subject: str
    text: Optional[str] = None
    html: Optional[str] = None
    template_id: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    categories: Optional[List[str]] = None


class TemplateEmailRequest(BaseModel):
    to: str | List[str]
    template_id: str
    data: Dict[str, Any]


class BulkEmailRequest(BaseModel):
    personalizations: List[Dict]
    subject: str
    template_id: Optional[str] = None
    html: Optional[str] = None
    categories: Optional[List[str]] = None


class ContactRequest(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    custom_fields: Optional[Dict] = None
    list_ids: Optional[List[str]] = None


@router.post("/send")
async def send_email(request: EmailRequest):
    try:
        message_id = email_service.send_email(
            to=request.to,
            subject=request.subject,
            text=request.text,
            html=request.html,
            template_id=request.template_id,
            template_data=request.template_data,
            categories=request.categories
        )
        return {"success": True, "message_id": message_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-template")
async def send_template_email(request: TemplateEmailRequest):
    try:
        message_id = email_service.send_email(
            to=request.to,
            subject="",
            template_id=request.template_id,
            template_data=request.data
        )
        return {"success": True, "message_id": message_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-bulk")
async def send_bulk_email(request: BulkEmailRequest):
    try:
        message_id = email_service.send_bulk_email(
            personalizations=request.personalizations,
            subject=request.subject,
            template_id=request.template_id,
            html=request.html,
            categories=request.categories
        )
        return {"success": True, "message_id": message_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contacts")
async def add_contact(request: ContactRequest):
    try:
        job_id = email_service.add_contact(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            custom_fields=request.custom_fields,
            list_ids=request.list_ids
        )
        return {"success": True, "job_id": job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lists")
async def get_lists():
    try:
        lists = email_service.get_lists()
        return {"lists": lists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats(
    start_date: str,
    end_date: Optional[str] = None,
    aggregated_by: Optional[str] = None
):
    try:
        stats = email_service.get_stats(start_date, end_date, aggregated_by)
        return {"stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_email(email: str):
    try:
        result = email_service.validate_email(email)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/events")
async def handle_webhook(request: Request):
    events = await request.json()

    for event in events:
        event_type = event.get('event')
        email = event.get('email')

        if event_type == 'delivered':
            print(f"Delivered to {email}")
        elif event_type == 'open':
            print(f"Opened by {email}")
        elif event_type == 'click':
            print(f"Click by {email}: {event.get('url')}")
        elif event_type == 'bounce':
            print(f"Bounce from {email}: {event.get('reason')}")
        elif event_type == 'spamreport':
            print(f"Spam report from {email}")
        elif event_type == 'unsubscribe':
            print(f"Unsubscribe from {email}")

    return {"status": "ok"}
```

## CLAUDE.md Integration

```markdown
## SendGrid Email

### Send Emails
- Single: `POST /api/email/send` with to, subject, html/text
- Template: `POST /api/email/send-template` with templateId, data
- Bulk: `POST /api/email/send-bulk` with personalizations array

### Templates
Dynamic templates use Handlebars syntax: `{{variable}}`
Common patterns:
- Welcome: `d-abc123` with `{name, verifyUrl}`
- Reset: `d-def456` with `{name, resetUrl, expiresIn}`
- Receipt: `d-ghi789` with `{items[], total, orderNumber}`

### Contact Management
- Add: `POST /api/email/contacts` with email, firstName, listIds
- Search: `POST /api/email/contacts/search` with SGQL query
- Lists: `GET /api/email/lists`, `POST /api/email/lists`

### Webhooks
Configure event webhook at `/api/email/webhook/events`
Events: delivered, open, click, bounce, dropped, spamreport, unsubscribe

### Best Practices
- Always use dynamic templates for consistent branding
- Set categories for analytics segmentation
- Configure suppression groups for unsubscribe management
- Validate emails before adding to lists
```

## AI Suggestions

1. **Implement email queuing** - Queue emails with retry logic for reliability
2. **Add A/B testing** - Test subject lines and content variants
3. **Build preference center** - Let users manage email preferences
4. **Create email analytics dashboard** - Visualize open/click rates
5. **Implement smart sending** - Send at optimal times per recipient
6. **Add email preview** - Preview emails in different clients
7. **Build template versioning** - Track and rollback template changes
8. **Implement bounce handling** - Auto-clean invalid addresses
9. **Add engagement scoring** - Score contacts by email engagement
10. **Create automated workflows** - Trigger emails based on events
