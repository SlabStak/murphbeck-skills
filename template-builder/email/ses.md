# AWS SES (Simple Email Service)

## Overview
Production-ready AWS SES integration for transactional emails with templates, configuration sets, and email verification.

## Quick Start

```bash
npm install @aws-sdk/client-ses @aws-sdk/client-sesv2
```

## Full Implementation

### TypeScript SES Service

```typescript
// email/ses-service.ts
import {
  SESv2Client,
  SendEmailCommand,
  SendBulkEmailCommand,
  CreateEmailTemplateCommand,
  UpdateEmailTemplateCommand,
  DeleteEmailTemplateCommand,
  GetEmailTemplateCommand,
  ListEmailTemplatesCommand,
  CreateContactCommand,
  CreateContactListCommand,
  GetContactCommand,
  ListContactsCommand,
  DeleteContactCommand,
  CreateConfigurationSetCommand,
  PutConfigurationSetTrackingOptionsCommand,
  PutConfigurationSetReputationOptionsCommand,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  ListEmailIdentitiesCommand,
  DeleteEmailIdentityCommand,
  GetAccountCommand,
  PutAccountSendingAttributesCommand,
  GetSuppressedDestinationCommand,
  ListSuppressedDestinationsCommand,
  PutSuppressedDestinationCommand,
  DeleteSuppressedDestinationCommand,
  BatchGetMetricDataCommand
} from '@aws-sdk/client-sesv2';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string[];
  cc?: string[];
  bcc?: string[];
  templateName?: string;
  templateData?: Record<string, any>;
  configurationSetName?: string;
  tags?: Array<{ name: string; value: string }>;
}

interface BulkEmailEntry {
  to: string;
  templateData?: Record<string, any>;
}

interface EmailTemplate {
  name: string;
  subject: string;
  html?: string;
  text?: string;
}

interface SESConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  defaultFrom: string;
  configurationSetName?: string;
}

export class SESService {
  private client: SESv2Client;
  private defaultFrom: string;
  private configurationSetName?: string;

  constructor(config: SESConfig) {
    this.client = new SESv2Client({
      region: config.region,
      credentials: config.accessKeyId ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey!
      } : undefined
    });
    this.defaultFrom = config.defaultFrom;
    this.configurationSetName = config.configurationSetName;
  }

  // Send single email
  async sendEmail(options: EmailOptions): Promise<string> {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

    const command = new SendEmailCommand({
      FromEmailAddress: options.from || this.defaultFrom,
      Destination: {
        ToAddresses: toAddresses,
        CcAddresses: options.cc,
        BccAddresses: options.bcc
      },
      ReplyToAddresses: options.replyTo,
      Content: options.templateName ? {
        Template: {
          TemplateName: options.templateName,
          TemplateData: JSON.stringify(options.templateData || {})
        }
      } : {
        Simple: {
          Subject: { Data: options.subject },
          Body: {
            Text: options.text ? { Data: options.text } : undefined,
            Html: options.html ? { Data: options.html } : undefined
          }
        }
      },
      ConfigurationSetName: options.configurationSetName || this.configurationSetName,
      EmailTags: options.tags?.map(t => ({ Name: t.name, Value: t.value }))
    });

    const response = await this.client.send(command);
    return response.MessageId!;
  }

  // Send bulk email
  async sendBulkEmail(
    entries: BulkEmailEntry[],
    templateName: string,
    defaultTemplateData?: Record<string, any>
  ): Promise<Array<{ messageId?: string; error?: string }>> {
    const command = new SendBulkEmailCommand({
      FromEmailAddress: this.defaultFrom,
      DefaultContent: {
        Template: {
          TemplateName: templateName,
          TemplateData: JSON.stringify(defaultTemplateData || {})
        }
      },
      BulkEmailEntries: entries.map(entry => ({
        Destination: {
          ToAddresses: [entry.to]
        },
        ReplacementEmailContent: entry.templateData ? {
          ReplacementTemplate: {
            ReplacementTemplateData: JSON.stringify(entry.templateData)
          }
        } : undefined
      })),
      ConfigurationSetName: this.configurationSetName
    });

    const response = await this.client.send(command);
    return response.BulkEmailEntryResults?.map(result => ({
      messageId: result.MessageId,
      error: result.Error
    })) || [];
  }

  // Template management
  async createTemplate(template: EmailTemplate): Promise<void> {
    const command = new CreateEmailTemplateCommand({
      TemplateName: template.name,
      TemplateContent: {
        Subject: template.subject,
        Html: template.html,
        Text: template.text
      }
    });

    await this.client.send(command);
  }

  async updateTemplate(template: EmailTemplate): Promise<void> {
    const command = new UpdateEmailTemplateCommand({
      TemplateName: template.name,
      TemplateContent: {
        Subject: template.subject,
        Html: template.html,
        Text: template.text
      }
    });

    await this.client.send(command);
  }

  async getTemplate(name: string): Promise<EmailTemplate | null> {
    try {
      const command = new GetEmailTemplateCommand({
        TemplateName: name
      });

      const response = await this.client.send(command);
      return {
        name: response.TemplateName!,
        subject: response.TemplateContent?.Subject || '',
        html: response.TemplateContent?.Html,
        text: response.TemplateContent?.Text
      };
    } catch (error: any) {
      if (error.name === 'NotFoundException') {
        return null;
      }
      throw error;
    }
  }

  async listTemplates(pageSize: number = 10): Promise<string[]> {
    const templates: string[] = [];
    let nextToken: string | undefined;

    do {
      const command = new ListEmailTemplatesCommand({
        PageSize: pageSize,
        NextToken: nextToken
      });

      const response = await this.client.send(command);
      templates.push(...(response.TemplatesMetadata?.map(t => t.TemplateName!) || []));
      nextToken = response.NextToken;
    } while (nextToken);

    return templates;
  }

  async deleteTemplate(name: string): Promise<void> {
    const command = new DeleteEmailTemplateCommand({
      TemplateName: name
    });

    await this.client.send(command);
  }

  // Contact list management
  async createContactList(listName: string, description?: string): Promise<void> {
    const command = new CreateContactListCommand({
      ContactListName: listName,
      Description: description
    });

    await this.client.send(command);
  }

  async addContact(
    listName: string,
    email: string,
    attributes?: Record<string, string>,
    unsubscribeAll?: boolean
  ): Promise<void> {
    const command = new CreateContactCommand({
      ContactListName: listName,
      EmailAddress: email,
      AttributesData: attributes ? JSON.stringify(attributes) : undefined,
      UnsubscribeAll: unsubscribeAll
    });

    await this.client.send(command);
  }

  async getContact(listName: string, email: string): Promise<any> {
    const command = new GetContactCommand({
      ContactListName: listName,
      EmailAddress: email
    });

    return this.client.send(command);
  }

  async listContacts(listName: string, pageSize: number = 100): Promise<string[]> {
    const contacts: string[] = [];
    let nextToken: string | undefined;

    do {
      const command = new ListContactsCommand({
        ContactListName: listName,
        PageSize: pageSize,
        NextToken: nextToken
      });

      const response = await this.client.send(command);
      contacts.push(...(response.Contacts?.map(c => c.EmailAddress!) || []));
      nextToken = response.NextToken;
    } while (nextToken);

    return contacts;
  }

  async deleteContact(listName: string, email: string): Promise<void> {
    const command = new DeleteContactCommand({
      ContactListName: listName,
      EmailAddress: email
    });

    await this.client.send(command);
  }

  // Configuration set
  async createConfigurationSet(
    name: string,
    options?: {
      trackingOptions?: {
        customRedirectDomain?: string;
      };
      reputationOptions?: {
        reputationMetricsEnabled?: boolean;
        lastFreshStart?: Date;
      };
    }
  ): Promise<void> {
    const createCommand = new CreateConfigurationSetCommand({
      ConfigurationSetName: name
    });

    await this.client.send(createCommand);

    if (options?.trackingOptions) {
      const trackingCommand = new PutConfigurationSetTrackingOptionsCommand({
        ConfigurationSetName: name,
        CustomRedirectDomain: options.trackingOptions.customRedirectDomain
      });
      await this.client.send(trackingCommand);
    }

    if (options?.reputationOptions) {
      const reputationCommand = new PutConfigurationSetReputationOptionsCommand({
        ConfigurationSetName: name,
        ReputationMetricsEnabled: options.reputationOptions.reputationMetricsEnabled,
        LastFreshStart: options.reputationOptions.lastFreshStart
      });
      await this.client.send(reputationCommand);
    }
  }

  // Email identity (domain/email verification)
  async createEmailIdentity(identity: string): Promise<{
    identityType: string;
    verifiedForSendingStatus: boolean;
    dkimAttributes?: any;
  }> {
    const command = new CreateEmailIdentityCommand({
      EmailIdentity: identity
    });

    const response = await this.client.send(command);
    return {
      identityType: response.IdentityType!,
      verifiedForSendingStatus: response.VerifiedForSendingStatus || false,
      dkimAttributes: response.DkimAttributes
    };
  }

  async getEmailIdentity(identity: string): Promise<any> {
    const command = new GetEmailIdentityCommand({
      EmailIdentity: identity
    });

    return this.client.send(command);
  }

  async listEmailIdentities(): Promise<Array<{ identity: string; type: string }>> {
    const identities: Array<{ identity: string; type: string }> = [];
    let nextToken: string | undefined;

    do {
      const command = new ListEmailIdentitiesCommand({
        NextToken: nextToken
      });

      const response = await this.client.send(command);
      identities.push(...(response.EmailIdentities?.map(i => ({
        identity: i.IdentityName!,
        type: i.IdentityType!
      })) || []));
      nextToken = response.NextToken;
    } while (nextToken);

    return identities;
  }

  async deleteEmailIdentity(identity: string): Promise<void> {
    const command = new DeleteEmailIdentityCommand({
      EmailIdentity: identity
    });

    await this.client.send(command);
  }

  // Account management
  async getAccountInfo(): Promise<{
    sendingEnabled: boolean;
    dedicatedIpAutoWarmupEnabled: boolean;
    enforcementStatus: string;
    productionAccessEnabled: boolean;
    sendQuota: {
      max24HourSend: number;
      maxSendRate: number;
      sentLast24Hours: number;
    };
  }> {
    const command = new GetAccountCommand({});
    const response = await this.client.send(command);

    return {
      sendingEnabled: response.SendingEnabled || false,
      dedicatedIpAutoWarmupEnabled: response.DedicatedIpAutoWarmupEnabled || false,
      enforcementStatus: response.EnforcementStatus || 'UNKNOWN',
      productionAccessEnabled: response.ProductionAccessEnabled || false,
      sendQuota: {
        max24HourSend: response.SendQuota?.Max24HourSend || 0,
        maxSendRate: response.SendQuota?.MaxSendRate || 0,
        sentLast24Hours: response.SendQuota?.SentLast24Hours || 0
      }
    };
  }

  async setSendingEnabled(enabled: boolean): Promise<void> {
    const command = new PutAccountSendingAttributesCommand({
      SendingEnabled: enabled
    });

    await this.client.send(command);
  }

  // Suppression list management
  async getSuppressedDestination(email: string): Promise<any> {
    const command = new GetSuppressedDestinationCommand({
      EmailAddress: email
    });

    return this.client.send(command);
  }

  async listSuppressedDestinations(
    reasons?: ('BOUNCE' | 'COMPLAINT')[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ email: string; reason: string; lastUpdateTime: Date }>> {
    const destinations: Array<{ email: string; reason: string; lastUpdateTime: Date }> = [];
    let nextToken: string | undefined;

    do {
      const command = new ListSuppressedDestinationsCommand({
        Reasons: reasons,
        StartDate: startDate,
        EndDate: endDate,
        NextToken: nextToken
      });

      const response = await this.client.send(command);
      destinations.push(...(response.SuppressedDestinationSummaries?.map(d => ({
        email: d.EmailAddress!,
        reason: d.Reason!,
        lastUpdateTime: d.LastUpdateTime!
      })) || []));
      nextToken = response.NextToken;
    } while (nextToken);

    return destinations;
  }

  async addToSuppressionList(
    email: string,
    reason: 'BOUNCE' | 'COMPLAINT'
  ): Promise<void> {
    const command = new PutSuppressedDestinationCommand({
      EmailAddress: email,
      Reason: reason
    });

    await this.client.send(command);
  }

  async removeFromSuppressionList(email: string): Promise<void> {
    const command = new DeleteSuppressedDestinationCommand({
      EmailAddress: email
    });

    await this.client.send(command);
  }

  // Metrics
  async getMetrics(
    startDate: Date,
    endDate: Date,
    metrics: ('SEND' | 'COMPLAINT' | 'PERMANENT_BOUNCE' | 'TRANSIENT_BOUNCE' | 'OPEN' | 'CLICK' | 'DELIVERY' | 'DELIVERY_OPEN' | 'DELIVERY_CLICK' | 'DELIVERY_COMPLAINT')[]
  ): Promise<any[]> {
    const command = new BatchGetMetricDataCommand({
      Queries: metrics.map(metric => ({
        Id: metric.toLowerCase(),
        Namespace: 'VDM',
        Metric: metric,
        StartDate: startDate,
        EndDate: endDate
      }))
    });

    const response = await this.client.send(command);
    return response.Results || [];
  }
}
```

### Express API Routes

```typescript
// routes/ses.ts
import { Router, Request, Response } from 'express';
import { SESService } from '../email/ses-service';

const router = Router();
const sesService = new SESService({
  region: process.env.AWS_REGION || 'us-east-1',
  defaultFrom: process.env.SES_DEFAULT_FROM!,
  configurationSetName: process.env.SES_CONFIGURATION_SET
});

// Send email
router.post('/send', async (req: Request, res: Response) => {
  try {
    const messageId = await sesService.sendEmail(req.body);
    res.json({ success: true, messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send with template
router.post('/send-template', async (req: Request, res: Response) => {
  try {
    const { to, templateName, templateData, ...options } = req.body;
    const messageId = await sesService.sendEmail({
      to,
      subject: '', // Subject comes from template
      templateName,
      templateData,
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
    const { entries, templateName, defaultTemplateData } = req.body;
    const results = await sesService.sendBulkEmail(
      entries,
      templateName,
      defaultTemplateData
    );
    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Template management
router.post('/templates', async (req: Request, res: Response) => {
  try {
    await sesService.createTemplate(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await sesService.listTemplates();
    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates/:name', async (req: Request, res: Response) => {
  try {
    const template = await sesService.getTemplate(req.params.name);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/templates/:name', async (req: Request, res: Response) => {
  try {
    await sesService.updateTemplate({ name: req.params.name, ...req.body });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/templates/:name', async (req: Request, res: Response) => {
  try {
    await sesService.deleteTemplate(req.params.name);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Contact lists
router.post('/contact-lists', async (req: Request, res: Response) => {
  try {
    await sesService.createContactList(req.body.name, req.body.description);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/contact-lists/:listName/contacts', async (req: Request, res: Response) => {
  try {
    await sesService.addContact(
      req.params.listName,
      req.body.email,
      req.body.attributes
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/contact-lists/:listName/contacts', async (req: Request, res: Response) => {
  try {
    const contacts = await sesService.listContacts(req.params.listName);
    res.json({ contacts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Email identities
router.post('/identities', async (req: Request, res: Response) => {
  try {
    const result = await sesService.createEmailIdentity(req.body.identity);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/identities', async (req: Request, res: Response) => {
  try {
    const identities = await sesService.listEmailIdentities();
    res.json({ identities });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/identities/:identity', async (req: Request, res: Response) => {
  try {
    const identity = await sesService.getEmailIdentity(req.params.identity);
    res.json(identity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Account info
router.get('/account', async (req: Request, res: Response) => {
  try {
    const account = await sesService.getAccountInfo();
    res.json(account);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Suppression list
router.get('/suppression', async (req: Request, res: Response) => {
  try {
    const { reasons, startDate, endDate } = req.query;
    const suppressed = await sesService.listSuppressedDestinations(
      reasons ? (reasons as string).split(',') as any : undefined,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ suppressed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/suppression', async (req: Request, res: Response) => {
  try {
    await sesService.addToSuppressionList(req.body.email, req.body.reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/suppression/:email', async (req: Request, res: Response) => {
  try {
    await sesService.removeFromSuppressionList(req.params.email);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SNS notification handler for bounces/complaints
router.post('/webhook/notifications', async (req: Request, res: Response) => {
  const message = JSON.parse(req.body.Message || req.body);

  switch (message.notificationType) {
    case 'Bounce':
      console.log('Bounce:', message.bounce);
      // Handle bounce - remove from lists, update status
      break;
    case 'Complaint':
      console.log('Complaint:', message.complaint);
      // Handle complaint - add to suppression, notify
      break;
    case 'Delivery':
      console.log('Delivery:', message.delivery);
      break;
  }

  res.status(200).send();
});

export default router;
```

## Python Implementation

```python
# email_service/ses_service.py
import json
import boto3
from typing import Optional, List, Dict, Any
from datetime import datetime


class SESService:
    def __init__(
        self,
        region: str = 'us-east-1',
        default_from: str = None,
        configuration_set: Optional[str] = None,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None
    ):
        session_kwargs = {'region_name': region}
        if aws_access_key_id:
            session_kwargs['aws_access_key_id'] = aws_access_key_id
            session_kwargs['aws_secret_access_key'] = aws_secret_access_key

        self.client = boto3.client('sesv2', **session_kwargs)
        self.default_from = default_from
        self.configuration_set = configuration_set

    def send_email(
        self,
        to: str | List[str],
        subject: str,
        text: Optional[str] = None,
        html: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[List[str]] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        template_name: Optional[str] = None,
        template_data: Optional[Dict] = None,
        tags: Optional[List[Dict[str, str]]] = None
    ) -> str:
        to_addresses = [to] if isinstance(to, str) else to

        params = {
            'FromEmailAddress': from_email or self.default_from,
            'Destination': {
                'ToAddresses': to_addresses
            }
        }

        if cc:
            params['Destination']['CcAddresses'] = cc
        if bcc:
            params['Destination']['BccAddresses'] = bcc
        if reply_to:
            params['ReplyToAddresses'] = reply_to

        if template_name:
            params['Content'] = {
                'Template': {
                    'TemplateName': template_name,
                    'TemplateData': json.dumps(template_data or {})
                }
            }
        else:
            body = {}
            if text:
                body['Text'] = {'Data': text}
            if html:
                body['Html'] = {'Data': html}

            params['Content'] = {
                'Simple': {
                    'Subject': {'Data': subject},
                    'Body': body
                }
            }

        if self.configuration_set:
            params['ConfigurationSetName'] = self.configuration_set

        if tags:
            params['EmailTags'] = [{'Name': t['name'], 'Value': t['value']} for t in tags]

        response = self.client.send_email(**params)
        return response['MessageId']

    def send_bulk_email(
        self,
        entries: List[Dict],
        template_name: str,
        default_template_data: Optional[Dict] = None
    ) -> List[Dict]:
        bulk_entries = []
        for entry in entries:
            bulk_entry = {
                'Destination': {
                    'ToAddresses': [entry['to']]
                }
            }

            if entry.get('template_data'):
                bulk_entry['ReplacementEmailContent'] = {
                    'ReplacementTemplate': {
                        'ReplacementTemplateData': json.dumps(entry['template_data'])
                    }
                }

            bulk_entries.append(bulk_entry)

        params = {
            'FromEmailAddress': self.default_from,
            'DefaultContent': {
                'Template': {
                    'TemplateName': template_name,
                    'TemplateData': json.dumps(default_template_data or {})
                }
            },
            'BulkEmailEntries': bulk_entries
        }

        if self.configuration_set:
            params['ConfigurationSetName'] = self.configuration_set

        response = self.client.send_bulk_email(**params)
        return [
            {
                'message_id': r.get('MessageId'),
                'error': r.get('Error')
            }
            for r in response.get('BulkEmailEntryResults', [])
        ]

    def create_template(
        self,
        name: str,
        subject: str,
        html: Optional[str] = None,
        text: Optional[str] = None
    ):
        self.client.create_email_template(
            TemplateName=name,
            TemplateContent={
                'Subject': subject,
                'Html': html,
                'Text': text
            }
        )

    def update_template(
        self,
        name: str,
        subject: str,
        html: Optional[str] = None,
        text: Optional[str] = None
    ):
        self.client.update_email_template(
            TemplateName=name,
            TemplateContent={
                'Subject': subject,
                'Html': html,
                'Text': text
            }
        )

    def get_template(self, name: str) -> Optional[Dict]:
        try:
            response = self.client.get_email_template(TemplateName=name)
            return {
                'name': response['TemplateName'],
                'subject': response['TemplateContent'].get('Subject'),
                'html': response['TemplateContent'].get('Html'),
                'text': response['TemplateContent'].get('Text')
            }
        except self.client.exceptions.NotFoundException:
            return None

    def list_templates(self) -> List[str]:
        templates = []
        paginator = self.client.get_paginator('list_email_templates')

        for page in paginator.paginate():
            for template in page.get('TemplatesMetadata', []):
                templates.append(template['TemplateName'])

        return templates

    def delete_template(self, name: str):
        self.client.delete_email_template(TemplateName=name)

    def create_contact_list(self, name: str, description: Optional[str] = None):
        params = {'ContactListName': name}
        if description:
            params['Description'] = description
        self.client.create_contact_list(**params)

    def add_contact(
        self,
        list_name: str,
        email: str,
        attributes: Optional[Dict] = None,
        unsubscribe_all: bool = False
    ):
        params = {
            'ContactListName': list_name,
            'EmailAddress': email,
            'UnsubscribeAll': unsubscribe_all
        }
        if attributes:
            params['AttributesData'] = json.dumps(attributes)

        self.client.create_contact(**params)

    def list_contacts(self, list_name: str) -> List[str]:
        contacts = []
        paginator = self.client.get_paginator('list_contacts')

        for page in paginator.paginate(ContactListName=list_name):
            for contact in page.get('Contacts', []):
                contacts.append(contact['EmailAddress'])

        return contacts

    def delete_contact(self, list_name: str, email: str):
        self.client.delete_contact(
            ContactListName=list_name,
            EmailAddress=email
        )

    def verify_email_identity(self, email: str) -> Dict:
        response = self.client.create_email_identity(EmailIdentity=email)
        return {
            'identity_type': response['IdentityType'],
            'verified': response.get('VerifiedForSendingStatus', False),
            'dkim': response.get('DkimAttributes')
        }

    def verify_domain_identity(self, domain: str) -> Dict:
        response = self.client.create_email_identity(EmailIdentity=domain)
        return {
            'identity_type': response['IdentityType'],
            'verified': response.get('VerifiedForSendingStatus', False),
            'dkim': response.get('DkimAttributes')
        }

    def list_identities(self) -> List[Dict]:
        identities = []
        paginator = self.client.get_paginator('list_email_identities')

        for page in paginator.paginate():
            for identity in page.get('EmailIdentities', []):
                identities.append({
                    'identity': identity['IdentityName'],
                    'type': identity['IdentityType']
                })

        return identities

    def get_account_info(self) -> Dict:
        response = self.client.get_account()
        return {
            'sending_enabled': response.get('SendingEnabled', False),
            'dedicated_ip_warmup': response.get('DedicatedIpAutoWarmupEnabled', False),
            'enforcement_status': response.get('EnforcementStatus', 'UNKNOWN'),
            'production_access': response.get('ProductionAccessEnabled', False),
            'send_quota': {
                'max_24_hour': response['SendQuota'].get('Max24HourSend', 0),
                'max_rate': response['SendQuota'].get('MaxSendRate', 0),
                'sent_last_24_hours': response['SendQuota'].get('SentLast24Hours', 0)
            }
        }

    def list_suppressed_destinations(
        self,
        reasons: Optional[List[str]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        destinations = []
        params = {}

        if reasons:
            params['Reasons'] = reasons
        if start_date:
            params['StartDate'] = start_date
        if end_date:
            params['EndDate'] = end_date

        paginator = self.client.get_paginator('list_suppressed_destinations')

        for page in paginator.paginate(**params):
            for dest in page.get('SuppressedDestinationSummaries', []):
                destinations.append({
                    'email': dest['EmailAddress'],
                    'reason': dest['Reason'],
                    'last_update': dest['LastUpdateTime']
                })

        return destinations

    def add_to_suppression_list(self, email: str, reason: str):
        self.client.put_suppressed_destination(
            EmailAddress=email,
            Reason=reason
        )

    def remove_from_suppression_list(self, email: str):
        self.client.delete_suppressed_destination(EmailAddress=email)
```

### FastAPI Routes

```python
# routes/ses_routes.py
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

from email_service.ses_service import SESService

router = APIRouter(prefix="/api/ses", tags=["SES"])
ses_service = SESService()


class EmailRequest(BaseModel):
    to: str | List[str]
    subject: str
    text: Optional[str] = None
    html: Optional[str] = None
    template_name: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    tags: Optional[List[Dict[str, str]]] = None


class TemplateRequest(BaseModel):
    name: str
    subject: str
    html: Optional[str] = None
    text: Optional[str] = None


class BulkEmailRequest(BaseModel):
    entries: List[Dict]
    template_name: str
    default_template_data: Optional[Dict] = None


@router.post("/send")
async def send_email(request: EmailRequest):
    try:
        message_id = ses_service.send_email(
            to=request.to,
            subject=request.subject,
            text=request.text,
            html=request.html,
            template_name=request.template_name,
            template_data=request.template_data,
            tags=request.tags
        )
        return {"success": True, "message_id": message_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-bulk")
async def send_bulk_email(request: BulkEmailRequest):
    try:
        results = ses_service.send_bulk_email(
            entries=request.entries,
            template_name=request.template_name,
            default_template_data=request.default_template_data
        )
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/templates")
async def create_template(request: TemplateRequest):
    try:
        ses_service.create_template(
            name=request.name,
            subject=request.subject,
            html=request.html,
            text=request.text
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def list_templates():
    try:
        templates = ses_service.list_templates()
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{name}")
async def get_template(name: str):
    try:
        template = ses_service.get_template(name)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/account")
async def get_account():
    try:
        account = ses_service.get_account_info()
        return account
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/identities")
async def list_identities():
    try:
        identities = ses_service.list_identities()
        return {"identities": identities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/identities")
async def create_identity(identity: str, identity_type: str = "email"):
    try:
        if identity_type == "domain":
            result = ses_service.verify_domain_identity(identity)
        else:
            result = ses_service.verify_email_identity(identity)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suppression")
async def list_suppressed(
    reasons: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    try:
        suppressed = ses_service.list_suppressed_destinations(
            reasons=reasons.split(',') if reasons else None,
            start_date=datetime.fromisoformat(start_date) if start_date else None,
            end_date=datetime.fromisoformat(end_date) if end_date else None
        )
        return {"suppressed": suppressed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/notifications")
async def handle_notification(request: Request):
    body = await request.json()
    message = body.get('Message', body)

    if isinstance(message, str):
        import json
        message = json.loads(message)

    notification_type = message.get('notificationType')

    if notification_type == 'Bounce':
        print(f"Bounce: {message.get('bounce')}")
    elif notification_type == 'Complaint':
        print(f"Complaint: {message.get('complaint')}")
    elif notification_type == 'Delivery':
        print(f"Delivery: {message.get('delivery')}")

    return {"status": "ok"}
```

## CLAUDE.md Integration

```markdown
## AWS SES Email

### Send Emails
- Single: `POST /api/ses/send` with to, subject, html/text
- Template: Include templateName and templateData in request
- Bulk: `POST /api/ses/send-bulk` with entries array and templateName

### Templates
SES templates use {{variable}} syntax in subject, HTML, and text
- Create: `POST /api/ses/templates`
- List: `GET /api/ses/templates`
- Get: `GET /api/ses/templates/{name}`

### Identity Verification
Before sending, verify your domain or email:
- `POST /api/ses/identities` with identity (email or domain)
- Check DKIM records for domain verification

### Configuration Sets
Use configuration sets for tracking and event handling
Set `SES_CONFIGURATION_SET` env var for default

### Quotas & Limits
Check account limits: `GET /api/ses/account`
- Max 24-hour send volume
- Max send rate (emails/second)
- Current 24-hour usage

### Suppression List
SES maintains account-level suppression list
- List: `GET /api/ses/suppression?reasons=BOUNCE,COMPLAINT`
- Add: `POST /api/ses/suppression` - manually suppress
- Remove: `DELETE /api/ses/suppression/{email}`

### SNS Notifications
Configure SNS topic for bounce/complaint handling
Webhook: `POST /api/ses/webhook/notifications`
```

## AI Suggestions

1. **Implement dedicated IPs** - Use dedicated IPs for better deliverability
2. **Add email warmup** - Gradually increase sending volume for new IPs
3. **Build reputation dashboard** - Monitor sender reputation metrics
4. **Create bounce handler** - Auto-remove bounced addresses from lists
5. **Implement virtual deliverability manager** - Use VDM for insights
6. **Add custom headers** - Track emails with custom message headers
7. **Build feedback loop** - Process ISP feedback loop data
8. **Create sending limits** - Rate limit emails to protect reputation
9. **Implement email archiving** - Store sent emails for compliance
10. **Add DMARC reporting** - Monitor domain authentication status
