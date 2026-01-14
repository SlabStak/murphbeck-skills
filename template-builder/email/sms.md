# SMS Notifications

## Overview
Multi-provider SMS service supporting Twilio, AWS SNS, and Vonage with templates, delivery tracking, and international number formatting.

## Quick Start

```bash
npm install twilio @aws-sdk/client-sns @vonage/server-sdk libphonenumber-js
```

## Full Implementation

### TypeScript SMS Service

```typescript
// notifications/sms-service.ts
import twilio from 'twilio';
import { SNSClient, PublishCommand, SetSMSAttributesCommand } from '@aws-sdk/client-sns';
import { Vonage } from '@vonage/server-sdk';
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

type SMSProvider = 'twilio' | 'sns' | 'vonage';

interface SMSConfig {
  provider: SMSProvider;
  twilio?: {
    accountSid: string;
    authToken: string;
    defaultFrom: string;
    messagingServiceSid?: string;
  };
  sns?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    senderId?: string;
    smsType?: 'Promotional' | 'Transactional';
  };
  vonage?: {
    apiKey: string;
    apiSecret: string;
    defaultFrom: string;
  };
}

interface SendSMSOptions {
  to: string;
  message: string;
  from?: string;
  statusCallback?: string;
  validityPeriod?: number; // seconds
  maxPrice?: string;
  mediaUrl?: string; // MMS only (Twilio)
}

interface SendResult {
  success: boolean;
  messageId?: string;
  provider: SMSProvider;
  to: string;
  error?: string;
  segments?: number;
  price?: string;
}

interface BulkSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
}

export class SMSService {
  private provider: SMSProvider;
  private twilioClient?: twilio.Twilio;
  private snsClient?: SNSClient;
  private vonageClient?: Vonage;
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.provider = config.provider;
    this.config = config;

    switch (config.provider) {
      case 'twilio':
        if (!config.twilio) throw new Error('Twilio config required');
        this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
        break;

      case 'sns':
        if (!config.sns) throw new Error('SNS config required');
        this.snsClient = new SNSClient({
          region: config.sns.region,
          credentials: config.sns.accessKeyId ? {
            accessKeyId: config.sns.accessKeyId,
            secretAccessKey: config.sns.secretAccessKey!
          } : undefined
        });
        this.configureSNS();
        break;

      case 'vonage':
        if (!config.vonage) throw new Error('Vonage config required');
        this.vonageClient = new Vonage({
          apiKey: config.vonage.apiKey,
          apiSecret: config.vonage.apiSecret
        });
        break;
    }
  }

  private async configureSNS(): Promise<void> {
    if (!this.snsClient || !this.config.sns) return;

    const command = new SetSMSAttributesCommand({
      attributes: {
        DefaultSMSType: this.config.sns.smsType || 'Transactional',
        ...(this.config.sns.senderId && { DefaultSenderID: this.config.sns.senderId })
      }
    });

    await this.snsClient.send(command);
  }

  // Format phone number to E.164
  formatPhoneNumber(phone: string, defaultCountry: CountryCode = 'US'): string {
    try {
      const parsed = parsePhoneNumber(phone, defaultCountry);
      if (!parsed.isValid()) {
        throw new Error('Invalid phone number');
      }
      return parsed.format('E.164');
    } catch (error) {
      throw new Error(`Invalid phone number: ${phone}`);
    }
  }

  // Validate phone number
  isValidPhone(phone: string, country?: CountryCode): boolean {
    return isValidPhoneNumber(phone, country);
  }

  // Send single SMS
  async send(options: SendSMSOptions): Promise<SendResult> {
    const to = this.formatPhoneNumber(options.to);

    switch (this.provider) {
      case 'twilio':
        return this.sendViaTwilio(to, options);
      case 'sns':
        return this.sendViaSNS(to, options);
      case 'vonage':
        return this.sendViaVonage(to, options);
      default:
        return { success: false, provider: this.provider, to, error: 'Unknown provider' };
    }
  }

  // Send bulk SMS
  async sendBulk(
    recipients: string[],
    message: string,
    options?: { from?: string; batchSize?: number; delayMs?: number }
  ): Promise<BulkSendResult> {
    const batchSize = options?.batchSize || 100;
    const delayMs = options?.delayMs || 100;
    const results: SendResult[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(to => this.send({ to, message, from: options?.from }))
      );

      results.push(...batchResults);

      // Rate limiting delay between batches
      if (i + batchSize < recipients.length && delayMs > 0) {
        await this.delay(delayMs);
      }
    }

    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Template-based SMS
  async sendTemplate(
    to: string,
    templateName: string,
    variables: Record<string, string>,
    templates: Record<string, string>
  ): Promise<SendResult> {
    const template = templates[templateName];
    if (!template) {
      return {
        success: false,
        provider: this.provider,
        to,
        error: `Template not found: ${templateName}`
      };
    }

    // Replace variables in template
    let message = template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return this.send({ to, message });
  }

  // Provider-specific implementations
  private async sendViaTwilio(to: string, options: SendSMSOptions): Promise<SendResult> {
    if (!this.twilioClient || !this.config.twilio) {
      return { success: false, provider: 'twilio', to, error: 'Twilio not configured' };
    }

    try {
      const messageOptions: any = {
        to,
        body: options.message,
        statusCallback: options.statusCallback
      };

      // Use messaging service or from number
      if (this.config.twilio.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.config.twilio.messagingServiceSid;
      } else {
        messageOptions.from = options.from || this.config.twilio.defaultFrom;
      }

      // MMS support
      if (options.mediaUrl) {
        messageOptions.mediaUrl = [options.mediaUrl];
      }

      // Validity period
      if (options.validityPeriod) {
        messageOptions.validityPeriod = options.validityPeriod;
      }

      const message = await this.twilioClient.messages.create(messageOptions);

      return {
        success: true,
        messageId: message.sid,
        provider: 'twilio',
        to,
        segments: message.numSegments ? parseInt(message.numSegments) : 1,
        price: message.price || undefined
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'twilio',
        to,
        error: error.message
      };
    }
  }

  private async sendViaSNS(to: string, options: SendSMSOptions): Promise<SendResult> {
    if (!this.snsClient) {
      return { success: false, provider: 'sns', to, error: 'SNS not configured' };
    }

    try {
      const command = new PublishCommand({
        PhoneNumber: to,
        Message: options.message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: options.from || this.config.sns?.senderId || 'NOTICE'
          },
          'AWS.SNS.SMS.MaxPrice': {
            DataType: 'String',
            StringValue: options.maxPrice || '0.50'
          }
        }
      });

      const response = await this.snsClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        provider: 'sns',
        to
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'sns',
        to,
        error: error.message
      };
    }
  }

  private async sendViaVonage(to: string, options: SendSMSOptions): Promise<SendResult> {
    if (!this.vonageClient || !this.config.vonage) {
      return { success: false, provider: 'vonage', to, error: 'Vonage not configured' };
    }

    try {
      const from = options.from || this.config.vonage.defaultFrom;

      const response = await this.vonageClient.sms.send({
        to: to.replace('+', ''),
        from,
        text: options.message
      });

      const message = response.messages[0];

      if (message.status === '0') {
        return {
          success: true,
          messageId: message['message-id'],
          provider: 'vonage',
          to,
          price: message['message-price']
        };
      } else {
        return {
          success: false,
          provider: 'vonage',
          to,
          error: message['error-text']
        };
      }
    } catch (error: any) {
      return {
        success: false,
        provider: 'vonage',
        to,
        error: error.message
      };
    }
  }

  // Get message status (Twilio only)
  async getMessageStatus(messageId: string): Promise<{
    status: string;
    errorCode?: number;
    errorMessage?: string;
    price?: string;
    dateSent?: Date;
    dateDelivered?: Date;
  } | null> {
    if (this.provider !== 'twilio' || !this.twilioClient) {
      return null;
    }

    try {
      const message = await this.twilioClient.messages(messageId).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode || undefined,
        errorMessage: message.errorMessage || undefined,
        price: message.price || undefined,
        dateSent: message.dateSent || undefined,
        dateDelivered: message.status === 'delivered' ? new Date() : undefined
      };
    } catch (error) {
      return null;
    }
  }

  // Lookup phone number info (Twilio)
  async lookupPhoneNumber(phone: string): Promise<{
    valid: boolean;
    countryCode?: string;
    carrier?: string;
    type?: string;
    nationalFormat?: string;
  } | null> {
    if (this.provider !== 'twilio' || !this.twilioClient) {
      return null;
    }

    try {
      const lookup = await this.twilioClient.lookups.v2
        .phoneNumbers(phone)
        .fetch({ fields: 'line_type_intelligence' });

      return {
        valid: lookup.valid,
        countryCode: lookup.countryCode,
        carrier: lookup.lineTypeIntelligence?.carrier_name,
        type: lookup.lineTypeIntelligence?.type,
        nationalFormat: lookup.nationalFormat
      };
    } catch (error) {
      return { valid: false };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// OTP Service using SMS
export class OTPService {
  private smsService: SMSService;
  private otpStore: Map<string, { code: string; expiresAt: Date; attempts: number }> = new Map();
  private config: {
    codeLength: number;
    expiryMinutes: number;
    maxAttempts: number;
    messageTemplate: string;
  };

  constructor(
    smsService: SMSService,
    config?: Partial<{
      codeLength: number;
      expiryMinutes: number;
      maxAttempts: number;
      messageTemplate: string;
    }>
  ) {
    this.smsService = smsService;
    this.config = {
      codeLength: config?.codeLength || 6,
      expiryMinutes: config?.expiryMinutes || 10,
      maxAttempts: config?.maxAttempts || 3,
      messageTemplate: config?.messageTemplate || 'Your verification code is: {{code}}. Expires in {{minutes}} minutes.'
    };
  }

  // Generate and send OTP
  async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.config.expiryMinutes * 60 * 1000);

    // Store OTP
    this.otpStore.set(phone, { code, expiresAt, attempts: 0 });

    // Send SMS
    const message = this.config.messageTemplate
      .replace('{{code}}', code)
      .replace('{{minutes}}', this.config.expiryMinutes.toString());

    const result = await this.smsService.send({ to: phone, message });

    if (!result.success) {
      this.otpStore.delete(phone);
      return { success: false, error: result.error };
    }

    return { success: true };
  }

  // Verify OTP
  verifyOTP(phone: string, code: string): { valid: boolean; error?: string } {
    const stored = this.otpStore.get(phone);

    if (!stored) {
      return { valid: false, error: 'No OTP found for this phone number' };
    }

    if (stored.expiresAt < new Date()) {
      this.otpStore.delete(phone);
      return { valid: false, error: 'OTP has expired' };
    }

    if (stored.attempts >= this.config.maxAttempts) {
      this.otpStore.delete(phone);
      return { valid: false, error: 'Maximum attempts exceeded' };
    }

    if (stored.code !== code) {
      stored.attempts++;
      return { valid: false, error: 'Invalid OTP' };
    }

    // Valid - remove from store
    this.otpStore.delete(phone);
    return { valid: true };
  }

  // Resend OTP
  async resendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    // Delete existing OTP
    this.otpStore.delete(phone);
    return this.sendOTP(phone);
  }

  private generateCode(): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < this.config.codeLength; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }
}
```

### Express API Routes

```typescript
// routes/sms.ts
import { Router, Request, Response } from 'express';
import { SMSService, OTPService } from '../notifications/sms-service';

const router = Router();

const smsService = new SMSService({
  provider: (process.env.SMS_PROVIDER as any) || 'twilio',
  twilio: process.env.TWILIO_ACCOUNT_SID ? {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    defaultFrom: process.env.TWILIO_FROM_NUMBER!,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
  } : undefined,
  sns: process.env.AWS_REGION ? {
    region: process.env.AWS_REGION,
    senderId: process.env.SNS_SENDER_ID,
    smsType: 'Transactional'
  } : undefined,
  vonage: process.env.VONAGE_API_KEY ? {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET!,
    defaultFrom: process.env.VONAGE_FROM!
  } : undefined
});

const otpService = new OTPService(smsService, {
  codeLength: 6,
  expiryMinutes: 10,
  maxAttempts: 3
});

// SMS Templates
const templates: Record<string, string> = {
  welcome: 'Welcome to our service, {{name}}! Reply STOP to unsubscribe.',
  verification: 'Your verification code is {{code}}. Valid for {{minutes}} minutes.',
  orderConfirmation: 'Order #{{orderId}} confirmed! Total: ${{amount}}. Track: {{trackingUrl}}',
  appointmentReminder: 'Reminder: Your appointment is scheduled for {{date}} at {{time}}.',
  passwordReset: 'Your password reset code is {{code}}. If you did not request this, ignore this message.',
  shipping: 'Your order has shipped! Track it here: {{trackingUrl}}'
};

// Send single SMS
router.post('/send', async (req: Request, res: Response) => {
  try {
    const result = await smsService.send(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send with template
router.post('/send-template', async (req: Request, res: Response) => {
  try {
    const { to, template, variables } = req.body;
    const result = await smsService.sendTemplate(to, template, variables, templates);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send bulk SMS
router.post('/send-bulk', async (req: Request, res: Response) => {
  try {
    const { recipients, message, from, batchSize } = req.body;
    const result = await smsService.sendBulk(recipients, message, { from, batchSize });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate phone number
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { phone, country } = req.body;
    const valid = smsService.isValidPhone(phone, country);
    const formatted = valid ? smsService.formatPhoneNumber(phone, country) : null;
    res.json({ valid, formatted });
  } catch (error: any) {
    res.json({ valid: false, error: error.message });
  }
});

// Get message status
router.get('/status/:messageId', async (req: Request, res: Response) => {
  const status = await smsService.getMessageStatus(req.params.messageId);
  if (!status) {
    return res.status(404).json({ error: 'Message not found or status unavailable' });
  }
  res.json(status);
});

// Lookup phone number
router.get('/lookup/:phone', async (req: Request, res: Response) => {
  const info = await smsService.lookupPhoneNumber(req.params.phone);
  if (!info) {
    return res.status(404).json({ error: 'Lookup not available' });
  }
  res.json(info);
});

// OTP endpoints
router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const result = await otpService.sendOTP(req.body.phone);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/otp/verify', (req: Request, res: Response) => {
  const { phone, code } = req.body;
  const result = otpService.verifyOTP(phone, code);
  res.json(result);
});

router.post('/otp/resend', async (req: Request, res: Response) => {
  try {
    const result = await otpService.resendOTP(req.body.phone);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Twilio webhook for status updates
router.post('/webhook/status', (req: Request, res: Response) => {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, To } = req.body;

  console.log(`SMS Status Update: ${MessageSid} -> ${MessageStatus}`);
  if (ErrorCode) {
    console.error(`SMS Error: ${ErrorCode} - ${ErrorMessage}`);
  }

  // Update your database with the status
  // await updateMessageStatus(MessageSid, MessageStatus, ErrorCode);

  res.status(200).send();
});

// Twilio webhook for incoming SMS
router.post('/webhook/incoming', (req: Request, res: Response) => {
  const { From, Body, MessageSid } = req.body;

  console.log(`Incoming SMS from ${From}: ${Body}`);

  // Handle STOP/HELP keywords
  const normalizedBody = Body.trim().toUpperCase();
  if (normalizedBody === 'STOP') {
    // Handle unsubscribe
    res.type('text/xml').send(`
      <Response>
        <Message>You have been unsubscribed. Reply START to resubscribe.</Message>
      </Response>
    `);
    return;
  }

  if (normalizedBody === 'HELP') {
    res.type('text/xml').send(`
      <Response>
        <Message>Reply STOP to unsubscribe. For support, visit example.com/help</Message>
      </Response>
    `);
    return;
  }

  // Process other messages
  res.status(200).send();
});

export default router;
```

### React SMS Hook

```tsx
// hooks/useSMS.ts
import { useState, useCallback } from 'react';

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function useSMS() {
  const [sending, setSending] = useState(false);
  const [validating, setValidating] = useState(false);

  const sendSMS = useCallback(async (
    to: string,
    message: string
  ): Promise<SendResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message })
      });
      return response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  const sendTemplate = useCallback(async (
    to: string,
    template: string,
    variables: Record<string, string>
  ): Promise<SendResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/sms/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, template, variables })
      });
      return response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  const validatePhone = useCallback(async (
    phone: string,
    country?: string
  ): Promise<{ valid: boolean; formatted?: string; error?: string }> => {
    setValidating(true);
    try {
      const response = await fetch('/api/sms/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, country })
      });
      return response.json();
    } catch (error: any) {
      return { valid: false, error: error.message };
    } finally {
      setValidating(false);
    }
  }, []);

  const sendOTP = useCallback(async (phone: string): Promise<SendResult> => {
    setSending(true);
    try {
      const response = await fetch('/api/sms/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  const verifyOTP = useCallback(async (
    phone: string,
    code: string
  ): Promise<{ valid: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/sms/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      return response.json();
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }, []);

  return {
    sendSMS,
    sendTemplate,
    validatePhone,
    sendOTP,
    verifyOTP,
    sending,
    validating
  };
}
```

## Python Implementation

```python
# notifications/sms_service.py
import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import phonenumbers
from twilio.rest import Client as TwilioClient
import boto3

@dataclass
class SendResult:
    success: bool
    message_id: Optional[str] = None
    provider: str = ''
    to: str = ''
    error: Optional[str] = None
    segments: int = 1
    price: Optional[str] = None


class SMSService:
    def __init__(
        self,
        provider: str = 'twilio',
        twilio_account_sid: Optional[str] = None,
        twilio_auth_token: Optional[str] = None,
        twilio_from: Optional[str] = None,
        aws_region: Optional[str] = None,
        sns_sender_id: Optional[str] = None
    ):
        self.provider = provider

        if provider == 'twilio':
            self.twilio_client = TwilioClient(
                twilio_account_sid or os.environ.get('TWILIO_ACCOUNT_SID'),
                twilio_auth_token or os.environ.get('TWILIO_AUTH_TOKEN')
            )
            self.twilio_from = twilio_from or os.environ.get('TWILIO_FROM_NUMBER')
        elif provider == 'sns':
            self.sns_client = boto3.client('sns', region_name=aws_region or 'us-east-1')
            self.sns_sender_id = sns_sender_id

    def format_phone_number(self, phone: str, country: str = 'US') -> str:
        try:
            parsed = phonenumbers.parse(phone, country)
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError('Invalid phone number')
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except Exception as e:
            raise ValueError(f'Invalid phone number: {phone}')

    def is_valid_phone(self, phone: str, country: str = 'US') -> bool:
        try:
            parsed = phonenumbers.parse(phone, country)
            return phonenumbers.is_valid_number(parsed)
        except:
            return False

    def send(
        self,
        to: str,
        message: str,
        from_number: Optional[str] = None
    ) -> SendResult:
        to = self.format_phone_number(to)

        if self.provider == 'twilio':
            return self._send_twilio(to, message, from_number)
        elif self.provider == 'sns':
            return self._send_sns(to, message)
        else:
            return SendResult(success=False, to=to, error='Unknown provider')

    def _send_twilio(self, to: str, message: str, from_number: Optional[str]) -> SendResult:
        try:
            result = self.twilio_client.messages.create(
                to=to,
                from_=from_number or self.twilio_from,
                body=message
            )
            return SendResult(
                success=True,
                message_id=result.sid,
                provider='twilio',
                to=to,
                segments=int(result.num_segments) if result.num_segments else 1
            )
        except Exception as e:
            return SendResult(success=False, provider='twilio', to=to, error=str(e))

    def _send_sns(self, to: str, message: str) -> SendResult:
        try:
            attributes = {}
            if self.sns_sender_id:
                attributes['AWS.SNS.SMS.SenderID'] = {
                    'DataType': 'String',
                    'StringValue': self.sns_sender_id
                }

            response = self.sns_client.publish(
                PhoneNumber=to,
                Message=message,
                MessageAttributes=attributes
            )
            return SendResult(
                success=True,
                message_id=response['MessageId'],
                provider='sns',
                to=to
            )
        except Exception as e:
            return SendResult(success=False, provider='sns', to=to, error=str(e))

    def send_bulk(
        self,
        recipients: List[str],
        message: str,
        from_number: Optional[str] = None
    ) -> Dict[str, Any]:
        results = []
        for recipient in recipients:
            result = self.send(recipient, message, from_number)
            results.append(result)

        return {
            'total': len(results),
            'successful': sum(1 for r in results if r.success),
            'failed': sum(1 for r in results if not r.success),
            'results': results
        }

    def send_template(
        self,
        to: str,
        template: str,
        variables: Dict[str, str],
        templates: Dict[str, str]
    ) -> SendResult:
        if template not in templates:
            return SendResult(
                success=False,
                to=to,
                error=f'Template not found: {template}'
            )

        message = templates[template]
        for key, value in variables.items():
            message = message.replace(f'{{{{{key}}}}}', value)

        return self.send(to, message)


class OTPService:
    def __init__(
        self,
        sms_service: SMSService,
        code_length: int = 6,
        expiry_minutes: int = 10,
        max_attempts: int = 3,
        message_template: str = 'Your verification code is: {code}. Expires in {minutes} minutes.'
    ):
        self.sms_service = sms_service
        self.code_length = code_length
        self.expiry_minutes = expiry_minutes
        self.max_attempts = max_attempts
        self.message_template = message_template
        self.otp_store: Dict[str, Dict] = {}

    def _generate_code(self) -> str:
        return ''.join(random.choices(string.digits, k=self.code_length))

    def send_otp(self, phone: str) -> Dict[str, Any]:
        code = self._generate_code()
        expires_at = datetime.now() + timedelta(minutes=self.expiry_minutes)

        self.otp_store[phone] = {
            'code': code,
            'expires_at': expires_at,
            'attempts': 0
        }

        message = self.message_template.format(
            code=code,
            minutes=self.expiry_minutes
        )

        result = self.sms_service.send(phone, message)

        if not result.success:
            del self.otp_store[phone]
            return {'success': False, 'error': result.error}

        return {'success': True}

    def verify_otp(self, phone: str, code: str) -> Dict[str, Any]:
        stored = self.otp_store.get(phone)

        if not stored:
            return {'valid': False, 'error': 'No OTP found'}

        if stored['expires_at'] < datetime.now():
            del self.otp_store[phone]
            return {'valid': False, 'error': 'OTP expired'}

        if stored['attempts'] >= self.max_attempts:
            del self.otp_store[phone]
            return {'valid': False, 'error': 'Max attempts exceeded'}

        if stored['code'] != code:
            stored['attempts'] += 1
            return {'valid': False, 'error': 'Invalid OTP'}

        del self.otp_store[phone]
        return {'valid': True}

    def resend_otp(self, phone: str) -> Dict[str, Any]:
        self.otp_store.pop(phone, None)
        return self.send_otp(phone)
```

### FastAPI Routes

```python
# routes/sms_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict

from notifications.sms_service import SMSService, OTPService

router = APIRouter(prefix="/api/sms", tags=["SMS"])

sms_service = SMSService(provider='twilio')
otp_service = OTPService(sms_service)

templates = {
    'welcome': 'Welcome to our service, {{name}}!',
    'verification': 'Your verification code is {{code}}.',
    'order': 'Order #{{orderId}} confirmed! Total: ${{amount}}'
}


class SendRequest(BaseModel):
    to: str
    message: str
    from_number: Optional[str] = None


class TemplateRequest(BaseModel):
    to: str
    template: str
    variables: Dict[str, str]


class BulkRequest(BaseModel):
    recipients: List[str]
    message: str
    from_number: Optional[str] = None


class OTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    code: str


@router.post("/send")
async def send_sms(request: SendRequest):
    result = sms_service.send(request.to, request.message, request.from_number)
    return {
        'success': result.success,
        'message_id': result.message_id,
        'error': result.error
    }


@router.post("/send-template")
async def send_template(request: TemplateRequest):
    result = sms_service.send_template(
        request.to,
        request.template,
        request.variables,
        templates
    )
    return {
        'success': result.success,
        'message_id': result.message_id,
        'error': result.error
    }


@router.post("/send-bulk")
async def send_bulk(request: BulkRequest):
    result = sms_service.send_bulk(
        request.recipients,
        request.message,
        request.from_number
    )
    return result


@router.post("/validate")
async def validate_phone(phone: str, country: str = 'US'):
    valid = sms_service.is_valid_phone(phone, country)
    formatted = None
    if valid:
        try:
            formatted = sms_service.format_phone_number(phone, country)
        except:
            pass
    return {'valid': valid, 'formatted': formatted}


@router.post("/otp/send")
async def send_otp(request: OTPRequest):
    result = otp_service.send_otp(request.phone)
    return result


@router.post("/otp/verify")
async def verify_otp(request: VerifyOTPRequest):
    result = otp_service.verify_otp(request.phone, request.code)
    return result


@router.post("/otp/resend")
async def resend_otp(request: OTPRequest):
    result = otp_service.resend_otp(request.phone)
    return result
```

## CLAUDE.md Integration

```markdown
## SMS Notifications

### Provider Configuration
Set `SMS_PROVIDER`: twilio, sns, or vonage

Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
AWS SNS: AWS_REGION, SNS_SENDER_ID
Vonage: VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM

### Send SMS
- Single: `POST /api/sms/send` with to, message
- Template: `POST /api/sms/send-template` with template name and variables
- Bulk: `POST /api/sms/send-bulk` with recipients array

### Phone Validation
`POST /api/sms/validate` validates and formats to E.164
Use libphonenumber-js for client-side validation

### OTP Flow
1. `POST /api/sms/otp/send` - Send verification code
2. User enters code
3. `POST /api/sms/otp/verify` - Verify code
4. `POST /api/sms/otp/resend` - Resend if needed

### Templates
Define templates with {{variable}} placeholders:
- welcome, verification, orderConfirmation
- appointmentReminder, passwordReset, shipping

### Webhooks
- Status updates: `POST /api/sms/webhook/status`
- Incoming SMS: `POST /api/sms/webhook/incoming`
Handle STOP/HELP keywords for compliance
```

## AI Suggestions

1. **Add message segmentation** - Split long messages across SMS segments
2. **Implement rate limiting** - Prevent abuse and stay within provider limits
3. **Build opt-out management** - Track and respect STOP requests
4. **Add delivery receipts** - Track actual delivery vs sent status
5. **Create fallback providers** - Switch providers on failure
6. **Implement shortcodes** - Use shortcodes for high-volume sending
7. **Add MMS support** - Send images and media with messages
8. **Build analytics dashboard** - Track delivery rates and costs
9. **Create scheduling** - Schedule SMS for future delivery
10. **Add A2P 10DLC registration** - Register for carrier compliance
