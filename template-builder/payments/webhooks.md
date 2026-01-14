# Payment Webhooks Template

A robust webhook handling system for payment providers with signature verification, idempotency, retry handling, and event processing.

## Installation

```bash
npm install stripe zod nanoid bull ioredis
```

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_WEBHOOK_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Square
SQUARE_WEBHOOK_SIGNATURE_KEY=...

# Redis (for queue and idempotency)
REDIS_URL=redis://localhost:6379

# Webhook Settings
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_IDEMPOTENCY_TTL=86400
```

## Project Structure

```
lib/
├── webhooks/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── processor.ts          # Webhook processor
│   ├── queue.ts              # Background processing queue
│   ├── idempotency.ts        # Idempotency handling
│   ├── signature.ts          # Signature verification
│   ├── handlers/
│   │   ├── base.ts           # Base handler interface
│   │   ├── stripe.ts         # Stripe webhook handlers
│   │   ├── paypal.ts         # PayPal webhook handlers
│   │   └── square.ts         # Square webhook handlers
│   └── registry.ts           # Handler registry
app/
├── api/
│   └── webhooks/
│       ├── stripe/
│       │   └── route.ts      # Stripe webhook endpoint
│       ├── paypal/
│       │   └── route.ts      # PayPal webhook endpoint
│       └── square/
│           └── route.ts      # Square webhook endpoint
```

## Type Definitions

```typescript
// lib/webhooks/types.ts
export type WebhookProvider = 'stripe' | 'paypal' | 'square' | 'shopify';

export type WebhookEventStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface WebhookEvent {
  id: string;
  provider: WebhookProvider;
  eventId: string;
  eventType: string;
  payload: unknown;
  headers: Record<string, string>;
  signature?: string;
  status: WebhookEventStatus;
  attempts: number;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookHandler<T = unknown> {
  eventType: string | string[];
  handle: (payload: T, event: WebhookEvent) => Promise<WebhookHandlerResult>;
}

export interface WebhookHandlerResult {
  success: boolean;
  message?: string;
  data?: unknown;
  retry?: boolean;
}

export interface WebhookProcessorConfig {
  provider: WebhookProvider;
  handlers: Map<string, WebhookHandler[]>;
  verifySignature: (
    payload: string | Buffer,
    signature: string,
    headers: Record<string, string>
  ) => Promise<boolean>;
  parseEvent: (payload: unknown) => { eventId: string; eventType: string };
}

export interface IdempotencyRecord {
  eventId: string;
  provider: WebhookProvider;
  status: WebhookEventStatus;
  result?: unknown;
  createdAt: Date;
  expiresAt: Date;
}

export interface WebhookLogEntry {
  id: string;
  eventId: string;
  provider: WebhookProvider;
  eventType: string;
  status: WebhookEventStatus;
  duration: number;
  error?: string;
  timestamp: Date;
}

// Stripe-specific types
export interface StripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: unknown;
    previous_attributes?: unknown;
  };
  created: number;
  livemode: boolean;
  api_version: string;
}

// PayPal-specific types
export interface PayPalWebhookPayload {
  id: string;
  event_type: string;
  resource: unknown;
  resource_type: string;
  summary: string;
  create_time: string;
}

// Square-specific types
export interface SquareWebhookPayload {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: unknown;
  };
}
```

## Signature Verification

```typescript
// lib/webhooks/signature.ts
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function verifyStripeSignature(
  payload: string | Buffer,
  signature: string
): Promise<boolean> {
  try {
    stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    return true;
  } catch (error) {
    console.error('Stripe signature verification failed:', error);
    return false;
  }
}

export function constructStripeEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export async function verifyPayPalSignature(
  payload: string,
  headers: Record<string, string>
): Promise<boolean> {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const actualSignature = headers['paypal-transmission-sig'];
    const authAlgo = headers['paypal-auth-algo'];

    // Fetch PayPal certificate
    const certResponse = await fetch(certUrl);
    const cert = await certResponse.text();

    // Construct expected signature string
    const expectedSignature = `${transmissionId}|${transmissionTime}|${webhookId}|${crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex')}`;

    // Verify signature
    const verifier = crypto.createVerify(authAlgo);
    verifier.update(expectedSignature);

    return verifier.verify(cert, actualSignature, 'base64');
  } catch (error) {
    console.error('PayPal signature verification failed:', error);
    return false;
  }
}

export function verifySquareSignature(
  payload: string,
  signature: string
): boolean {
  try {
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;

    const hmac = crypto.createHmac('sha256', signatureKey);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Square signature verification failed:', error);
    return false;
  }
}

export function verifyShopifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Shopify signature verification failed:', error);
    return false;
  }
}
```

## Idempotency Handler

```typescript
// lib/webhooks/idempotency.ts
import Redis from 'ioredis';
import type { WebhookProvider, WebhookEventStatus, IdempotencyRecord } from './types';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const DEFAULT_TTL = parseInt(process.env.WEBHOOK_IDEMPOTENCY_TTL || '86400');

export class IdempotencyHandler {
  private keyPrefix = 'webhook:idempotency';

  private getKey(provider: WebhookProvider, eventId: string): string {
    return `${this.keyPrefix}:${provider}:${eventId}`;
  }

  async checkAndSet(
    provider: WebhookProvider,
    eventId: string
  ): Promise<{ isNew: boolean; existing?: IdempotencyRecord }> {
    const key = this.getKey(provider, eventId);

    // Try to set if not exists
    const result = await redis.set(
      key,
      JSON.stringify({
        eventId,
        provider,
        status: 'processing',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + DEFAULT_TTL * 1000),
      }),
      'EX',
      DEFAULT_TTL,
      'NX'
    );

    if (result === 'OK') {
      return { isNew: true };
    }

    // Already exists, get existing record
    const existing = await redis.get(key);
    if (existing) {
      return {
        isNew: false,
        existing: JSON.parse(existing) as IdempotencyRecord,
      };
    }

    return { isNew: true };
  }

  async updateStatus(
    provider: WebhookProvider,
    eventId: string,
    status: WebhookEventStatus,
    result?: unknown
  ): Promise<void> {
    const key = this.getKey(provider, eventId);
    const existing = await redis.get(key);

    if (existing) {
      const record: IdempotencyRecord = JSON.parse(existing);
      record.status = status;
      record.result = result;

      await redis.set(key, JSON.stringify(record), 'KEEPTTL');
    }
  }

  async getStatus(
    provider: WebhookProvider,
    eventId: string
  ): Promise<IdempotencyRecord | null> {
    const key = this.getKey(provider, eventId);
    const existing = await redis.get(key);

    if (existing) {
      return JSON.parse(existing) as IdempotencyRecord;
    }

    return null;
  }

  async delete(provider: WebhookProvider, eventId: string): Promise<void> {
    const key = this.getKey(provider, eventId);
    await redis.del(key);
  }

  async cleanup(olderThanMs: number = DEFAULT_TTL * 1000): Promise<number> {
    // Redis TTL handles cleanup automatically
    // This method is for manual cleanup if needed
    return 0;
  }
}

export const idempotencyHandler = new IdempotencyHandler();
```

## Webhook Queue

```typescript
// lib/webhooks/queue.ts
import Bull from 'bull';
import type { WebhookEvent, WebhookHandlerResult } from './types';

const QUEUE_NAME = 'webhook-processing';

export const webhookQueue = new Bull<WebhookEvent>(QUEUE_NAME, {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// Job processor is set up in the worker
export function setupQueueProcessor(
  processor: (event: WebhookEvent) => Promise<WebhookHandlerResult>
): void {
  webhookQueue.process(async (job) => {
    const result = await processor(job.data);

    if (!result.success && result.retry) {
      throw new Error(result.message || 'Processing failed, will retry');
    }

    return result;
  });

  webhookQueue.on('completed', (job, result) => {
    console.log(`Webhook job ${job.id} completed:`, result);
  });

  webhookQueue.on('failed', (job, error) => {
    console.error(`Webhook job ${job.id} failed:`, error.message);
  });

  webhookQueue.on('stalled', (job) => {
    console.warn(`Webhook job ${job.id} stalled`);
  });
}

export async function enqueueWebhook(
  event: WebhookEvent,
  options?: Bull.JobOptions
): Promise<Bull.Job<WebhookEvent>> {
  return webhookQueue.add(event, {
    ...options,
    jobId: `${event.provider}-${event.eventId}`,
  });
}

export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    webhookQueue.getWaitingCount(),
    webhookQueue.getActiveCount(),
    webhookQueue.getCompletedCount(),
    webhookQueue.getFailedCount(),
    webhookQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

export async function retryFailedJobs(limit: number = 100): Promise<number> {
  const failed = await webhookQueue.getFailed(0, limit);
  let retried = 0;

  for (const job of failed) {
    await job.retry();
    retried++;
  }

  return retried;
}
```

## Webhook Processor

```typescript
// lib/webhooks/processor.ts
import { nanoid } from 'nanoid';
import type {
  WebhookEvent,
  WebhookHandler,
  WebhookHandlerResult,
  WebhookProvider,
} from './types';
import { idempotencyHandler } from './idempotency';
import { enqueueWebhook } from './queue';

interface ProcessorOptions {
  useQueue?: boolean;
  throwOnError?: boolean;
}

export class WebhookProcessor {
  private handlers: Map<string, WebhookHandler[]> = new Map();
  private provider: WebhookProvider;

  constructor(provider: WebhookProvider) {
    this.provider = provider;
  }

  registerHandler(handler: WebhookHandler): void {
    const eventTypes = Array.isArray(handler.eventType)
      ? handler.eventType
      : [handler.eventType];

    for (const eventType of eventTypes) {
      const existing = this.handlers.get(eventType) || [];
      existing.push(handler);
      this.handlers.set(eventType, existing);
    }
  }

  registerHandlers(handlers: WebhookHandler[]): void {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  async process(
    eventId: string,
    eventType: string,
    payload: unknown,
    headers: Record<string, string>,
    options: ProcessorOptions = {}
  ): Promise<WebhookHandlerResult> {
    const { useQueue = false, throwOnError = false } = options;

    // Check idempotency
    const idempotencyCheck = await idempotencyHandler.checkAndSet(
      this.provider,
      eventId
    );

    if (!idempotencyCheck.isNew) {
      const existing = idempotencyCheck.existing!;

      // If already completed, skip
      if (existing.status === 'completed') {
        return {
          success: true,
          message: 'Event already processed',
          data: existing.result,
        };
      }

      // If still processing, skip to avoid duplicate work
      if (existing.status === 'processing') {
        return {
          success: true,
          message: 'Event is currently being processed',
        };
      }
    }

    // Create webhook event record
    const event: WebhookEvent = {
      id: nanoid(),
      provider: this.provider,
      eventId,
      eventType,
      payload,
      headers,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If queue is enabled, enqueue and return
    if (useQueue) {
      await enqueueWebhook(event);
      return {
        success: true,
        message: 'Event queued for processing',
      };
    }

    // Process directly
    return this.executeHandlers(event, throwOnError);
  }

  async executeHandlers(
    event: WebhookEvent,
    throwOnError: boolean = false
  ): Promise<WebhookHandlerResult> {
    const handlers = this.handlers.get(event.eventType) || [];

    // Also check for wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    if (allHandlers.length === 0) {
      await idempotencyHandler.updateStatus(
        this.provider,
        event.eventId,
        'skipped'
      );
      return {
        success: true,
        message: `No handlers registered for event type: ${event.eventType}`,
      };
    }

    event.status = 'processing';
    event.attempts++;
    event.updatedAt = new Date();

    const results: WebhookHandlerResult[] = [];
    let hasError = false;

    for (const handler of allHandlers) {
      try {
        const result = await handler.handle(event.payload, event);
        results.push(result);

        if (!result.success) {
          hasError = true;
          if (throwOnError) {
            throw new Error(result.message);
          }
        }
      } catch (error) {
        hasError = true;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        results.push({
          success: false,
          message: errorMessage,
          retry: true,
        });

        if (throwOnError) {
          throw error;
        }
      }
    }

    // Update status
    const finalStatus = hasError ? 'failed' : 'completed';
    await idempotencyHandler.updateStatus(
      this.provider,
      event.eventId,
      finalStatus,
      results
    );

    event.status = finalStatus;
    event.processedAt = new Date();
    event.updatedAt = new Date();

    return {
      success: !hasError,
      message: hasError
        ? 'Some handlers failed'
        : 'All handlers completed successfully',
      data: results,
      retry: hasError,
    };
  }

  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
```

## Stripe Webhook Handlers

```typescript
// lib/webhooks/handlers/stripe.ts
import type Stripe from 'stripe';
import type { WebhookHandler, WebhookHandlerResult, WebhookEvent } from '../types';

// Payment Intent handlers
export const paymentIntentSucceeded: WebhookHandler<Stripe.PaymentIntent> = {
  eventType: 'payment_intent.succeeded',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Payment succeeded:', payload.id);

    // Update order status
    // await db.orders.update({
    //   where: { paymentIntentId: payload.id },
    //   data: { status: 'paid', paidAt: new Date() },
    // });

    // Send confirmation email
    // await sendOrderConfirmation(payload.metadata?.orderId);

    return {
      success: true,
      message: `Payment ${payload.id} processed successfully`,
      data: { paymentIntentId: payload.id, amount: payload.amount },
    };
  },
};

export const paymentIntentFailed: WebhookHandler<Stripe.PaymentIntent> = {
  eventType: 'payment_intent.payment_failed',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Payment failed:', payload.id);

    const error = payload.last_payment_error;

    // Update order status
    // await db.orders.update({
    //   where: { paymentIntentId: payload.id },
    //   data: {
    //     status: 'payment_failed',
    //     failureReason: error?.message,
    //   },
    // });

    // Notify customer
    // await sendPaymentFailedEmail(payload.metadata?.customerId, error?.message);

    return {
      success: true,
      message: `Payment failure recorded for ${payload.id}`,
      data: { paymentIntentId: payload.id, error: error?.message },
    };
  },
};

// Charge handlers
export const chargeRefunded: WebhookHandler<Stripe.Charge> = {
  eventType: 'charge.refunded',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Charge refunded:', payload.id);

    const refundAmount = payload.amount_refunded;
    const isFullRefund = payload.refunded;

    // Update order/refund status
    // await db.refunds.updateMany({
    //   where: { chargeId: payload.id },
    //   data: {
    //     status: 'completed',
    //     processedAt: new Date(),
    //   },
    // });

    return {
      success: true,
      message: `Refund processed for charge ${payload.id}`,
      data: { chargeId: payload.id, refundAmount, isFullRefund },
    };
  },
};

export const chargeDisputed: WebhookHandler<Stripe.Charge> = {
  eventType: 'charge.dispute.created',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Charge disputed:', payload.id);

    // Create dispute record
    // await db.disputes.create({
    //   data: {
    //     chargeId: payload.id,
    //     amount: payload.amount,
    //     status: 'needs_response',
    //     createdAt: new Date(),
    //   },
    // });

    // Notify admin
    // await notifyAdmin('New dispute', { chargeId: payload.id });

    return {
      success: true,
      message: `Dispute recorded for charge ${payload.id}`,
    };
  },
};

// Subscription handlers
export const subscriptionCreated: WebhookHandler<Stripe.Subscription> = {
  eventType: 'customer.subscription.created',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Subscription created:', payload.id);

    // Create subscription record
    // await db.subscriptions.create({
    //   data: {
    //     stripeId: payload.id,
    //     customerId: payload.customer as string,
    //     status: payload.status,
    //     priceId: payload.items.data[0]?.price.id,
    //     currentPeriodStart: new Date(payload.current_period_start * 1000),
    //     currentPeriodEnd: new Date(payload.current_period_end * 1000),
    //   },
    // });

    return {
      success: true,
      message: `Subscription ${payload.id} created`,
    };
  },
};

export const subscriptionUpdated: WebhookHandler<Stripe.Subscription> = {
  eventType: 'customer.subscription.updated',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Subscription updated:', payload.id);

    // Update subscription record
    // await db.subscriptions.update({
    //   where: { stripeId: payload.id },
    //   data: {
    //     status: payload.status,
    //     currentPeriodStart: new Date(payload.current_period_start * 1000),
    //     currentPeriodEnd: new Date(payload.current_period_end * 1000),
    //     cancelAtPeriodEnd: payload.cancel_at_period_end,
    //   },
    // });

    return {
      success: true,
      message: `Subscription ${payload.id} updated`,
    };
  },
};

export const subscriptionDeleted: WebhookHandler<Stripe.Subscription> = {
  eventType: 'customer.subscription.deleted',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Subscription deleted:', payload.id);

    // Update subscription status
    // await db.subscriptions.update({
    //   where: { stripeId: payload.id },
    //   data: { status: 'cancelled', cancelledAt: new Date() },
    // });

    // Revoke access
    // await revokeSubscriptionAccess(payload.customer as string);

    return {
      success: true,
      message: `Subscription ${payload.id} deleted`,
    };
  },
};

// Invoice handlers
export const invoicePaid: WebhookHandler<Stripe.Invoice> = {
  eventType: 'invoice.paid',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Invoice paid:', payload.id);

    // Record payment
    // await db.invoicePayments.create({
    //   data: {
    //     invoiceId: payload.id,
    //     subscriptionId: payload.subscription as string,
    //     amount: payload.amount_paid,
    //     paidAt: new Date(),
    //   },
    // });

    return {
      success: true,
      message: `Invoice ${payload.id} paid`,
    };
  },
};

export const invoicePaymentFailed: WebhookHandler<Stripe.Invoice> = {
  eventType: 'invoice.payment_failed',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Invoice payment failed:', payload.id);

    // Send payment failed notification
    // await sendInvoicePaymentFailedEmail(
    //   payload.customer_email,
    //   payload.hosted_invoice_url
    // );

    return {
      success: true,
      message: `Invoice payment failure recorded for ${payload.id}`,
    };
  },
};

// Customer handlers
export const customerCreated: WebhookHandler<Stripe.Customer> = {
  eventType: 'customer.created',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Customer created:', payload.id);

    // Sync customer to local database
    // await db.customers.upsert({
    //   where: { stripeId: payload.id },
    //   create: {
    //     stripeId: payload.id,
    //     email: payload.email,
    //     name: payload.name,
    //   },
    //   update: {
    //     email: payload.email,
    //     name: payload.name,
    //   },
    // });

    return {
      success: true,
      message: `Customer ${payload.id} created`,
    };
  },
};

// Checkout handlers
export const checkoutCompleted: WebhookHandler<Stripe.Checkout.Session> = {
  eventType: 'checkout.session.completed',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    console.log('Checkout completed:', payload.id);

    const { customer, payment_intent, subscription, metadata } = payload;

    if (subscription) {
      // Handle subscription checkout
      // await activateSubscription(subscription as string);
    } else if (payment_intent) {
      // Handle one-time payment
      // await fulfillOrder(metadata?.orderId);
    }

    return {
      success: true,
      message: `Checkout session ${payload.id} completed`,
    };
  },
};

// Export all handlers
export const stripeHandlers: WebhookHandler[] = [
  paymentIntentSucceeded,
  paymentIntentFailed,
  chargeRefunded,
  chargeDisputed,
  subscriptionCreated,
  subscriptionUpdated,
  subscriptionDeleted,
  invoicePaid,
  invoicePaymentFailed,
  customerCreated,
  checkoutCompleted,
];
```

## PayPal Webhook Handlers

```typescript
// lib/webhooks/handlers/paypal.ts
import type { WebhookHandler, WebhookHandlerResult } from '../types';

interface PayPalPaymentCapture {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  custom_id?: string;
  invoice_id?: string;
}

interface PayPalSubscription {
  id: string;
  status: string;
  plan_id: string;
  subscriber: {
    email_address: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
  billing_info: {
    next_billing_time: string;
    cycle_executions: {
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
    }[];
  };
}

export const paymentCaptureCompleted: WebhookHandler<{ resource: PayPalPaymentCapture }> = {
  eventType: 'PAYMENT.CAPTURE.COMPLETED',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    const capture = payload.resource;
    console.log('PayPal payment captured:', capture.id);

    // Update order status
    // await db.orders.update({
    //   where: { paypalCaptureId: capture.id },
    //   data: {
    //     status: 'paid',
    //     paidAt: new Date(),
    //     paidAmount: parseFloat(capture.amount.value),
    //   },
    // });

    return {
      success: true,
      message: `PayPal capture ${capture.id} processed`,
      data: {
        captureId: capture.id,
        amount: capture.amount.value,
        currency: capture.amount.currency_code,
      },
    };
  },
};

export const paymentCaptureDenied: WebhookHandler<{ resource: PayPalPaymentCapture }> = {
  eventType: 'PAYMENT.CAPTURE.DENIED',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    const capture = payload.resource;
    console.log('PayPal payment denied:', capture.id);

    // Update order status
    // await db.orders.update({
    //   where: { paypalCaptureId: capture.id },
    //   data: { status: 'payment_failed' },
    // });

    return {
      success: true,
      message: `PayPal capture ${capture.id} denied`,
    };
  },
};

export const paymentCaptureRefunded: WebhookHandler<{ resource: PayPalPaymentCapture }> = {
  eventType: 'PAYMENT.CAPTURE.REFUNDED',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    const capture = payload.resource;
    console.log('PayPal payment refunded:', capture.id);

    // Update refund status
    // await db.refunds.updateMany({
    //   where: { paypalCaptureId: capture.id },
    //   data: { status: 'completed', processedAt: new Date() },
    // });

    return {
      success: true,
      message: `PayPal refund processed for ${capture.id}`,
    };
  },
};

export const subscriptionActivated: WebhookHandler<{ resource: PayPalSubscription }> = {
  eventType: 'BILLING.SUBSCRIPTION.ACTIVATED',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    const subscription = payload.resource;
    console.log('PayPal subscription activated:', subscription.id);

    // Create/update subscription
    // await db.subscriptions.upsert({
    //   where: { paypalId: subscription.id },
    //   create: {
    //     paypalId: subscription.id,
    //     status: 'active',
    //     planId: subscription.plan_id,
    //     email: subscription.subscriber.email_address,
    //   },
    //   update: { status: 'active' },
    // });

    return {
      success: true,
      message: `PayPal subscription ${subscription.id} activated`,
    };
  },
};

export const subscriptionCancelled: WebhookHandler<{ resource: PayPalSubscription }> = {
  eventType: 'BILLING.SUBSCRIPTION.CANCELLED',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    const subscription = payload.resource;
    console.log('PayPal subscription cancelled:', subscription.id);

    // Update subscription status
    // await db.subscriptions.update({
    //   where: { paypalId: subscription.id },
    //   data: { status: 'cancelled', cancelledAt: new Date() },
    // });

    return {
      success: true,
      message: `PayPal subscription ${subscription.id} cancelled`,
    };
  },
};

export const subscriptionPaymentFailed: WebhookHandler<{ resource: PayPalSubscription }> = {
  eventType: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  async handle(payload, event): Promise<WebhookHandlerResult> {
    const subscription = payload.resource;
    console.log('PayPal subscription payment failed:', subscription.id);

    // Send notification
    // await sendPaymentFailedNotification(subscription.subscriber.email_address);

    return {
      success: true,
      message: `PayPal subscription payment failed for ${subscription.id}`,
    };
  },
};

export const paypalHandlers: WebhookHandler[] = [
  paymentCaptureCompleted,
  paymentCaptureDenied,
  paymentCaptureRefunded,
  subscriptionActivated,
  subscriptionCancelled,
  subscriptionPaymentFailed,
];
```

## API Routes

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookProcessor } from '@/lib/webhooks/processor';
import { constructStripeEvent, verifyStripeSignature } from '@/lib/webhooks/signature';
import { stripeHandlers } from '@/lib/webhooks/handlers/stripe';

const processor = new WebhookProcessor('stripe');
processor.registerHandlers(stripeHandlers);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify signature and construct event
    let event;
    try {
      event = constructStripeEvent(payload, signature);
    } catch (error) {
      console.error('Stripe signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process webhook
    const result = await processor.process(
      event.id,
      event.type,
      event.data.object,
      Object.fromEntries(request.headers),
      { useQueue: true }
    );

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};
```

```typescript
// app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookProcessor } from '@/lib/webhooks/processor';
import { verifyPayPalSignature } from '@/lib/webhooks/signature';
import { paypalHandlers } from '@/lib/webhooks/handlers/paypal';

const processor = new WebhookProcessor('paypal');
processor.registerHandlers(paypalHandlers);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const headers: Record<string, string> = {};

    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Verify signature
    const isValid = await verifyPayPalSignature(payload, headers);

    if (!isValid) {
      console.error('PayPal signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(payload);

    // Process webhook
    const result = await processor.process(
      event.id,
      event.event_type,
      event,
      headers,
      { useQueue: true }
    );

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

## Webhook Worker

```typescript
// workers/webhook-worker.ts
import { setupQueueProcessor, webhookQueue } from '@/lib/webhooks/queue';
import { WebhookProcessor } from '@/lib/webhooks/processor';
import { stripeHandlers } from '@/lib/webhooks/handlers/stripe';
import { paypalHandlers } from '@/lib/webhooks/handlers/paypal';
import type { WebhookEvent } from '@/lib/webhooks/types';

// Initialize processors
const processors = {
  stripe: new WebhookProcessor('stripe'),
  paypal: new WebhookProcessor('paypal'),
};

processors.stripe.registerHandlers(stripeHandlers);
processors.paypal.registerHandlers(paypalHandlers);

// Set up queue processor
setupQueueProcessor(async (event: WebhookEvent) => {
  const processor = processors[event.provider];

  if (!processor) {
    throw new Error(`Unknown provider: ${event.provider}`);
  }

  return processor.executeHandlers(event, true);
});

console.log('Webhook worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down webhook worker...');
  await webhookQueue.close();
  process.exit(0);
});
```

## Testing Utilities

```typescript
// lib/webhooks/testing.ts
import crypto from 'crypto';
import type { StripeWebhookPayload, PayPalWebhookPayload } from './types';

export function createMockStripeEvent(
  type: string,
  data: unknown
): StripeWebhookPayload {
  return {
    id: `evt_test_${crypto.randomBytes(12).toString('hex')}`,
    type,
    data: {
      object: data,
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: '2024-12-18',
  };
}

export function createMockStripeSignature(
  payload: string,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

export function createMockPayPalEvent(
  eventType: string,
  resource: unknown
): PayPalWebhookPayload {
  return {
    id: `WH-${crypto.randomBytes(12).toString('hex').toUpperCase()}`,
    event_type: eventType,
    resource,
    resource_type: 'capture',
    summary: `Test ${eventType} event`,
    create_time: new Date().toISOString(),
  };
}

// Test webhook endpoint
export async function testWebhookEndpoint(
  url: string,
  payload: unknown,
  headers: Record<string, string>
): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
}
```

## CLAUDE.md Integration

```markdown
## Payment Webhooks

### Commands
- `npm run dev` - Start development server
- `npm run worker` - Start webhook queue worker
- `npm run test` - Run tests

### Key Files
- `lib/webhooks/processor.ts` - Main webhook processor
- `lib/webhooks/signature.ts` - Signature verification
- `lib/webhooks/idempotency.ts` - Idempotency handling
- `lib/webhooks/queue.ts` - Background queue (Bull)
- `lib/webhooks/handlers/` - Provider-specific handlers

### Webhook Endpoints
- POST `/api/webhooks/stripe` - Stripe webhooks
- POST `/api/webhooks/paypal` - PayPal webhooks
- POST `/api/webhooks/square` - Square webhooks

### Adding New Handlers
1. Create handler in `lib/webhooks/handlers/`
2. Register with processor: `processor.registerHandler(handler)`
3. Handler receives typed payload and event metadata

### Testing
Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Queue Processing
Start worker separately for production:
```bash
node workers/webhook-worker.js
```
```

## AI Suggestions

1. **Dead Letter Queue** - Move repeatedly failed webhooks to DLQ for manual review
2. **Webhook Replay** - Admin interface to replay failed webhooks with modifications
3. **Event Filtering** - Configure which events to process vs. ignore per environment
4. **Rate Limiting** - Implement rate limiting to prevent webhook flooding
5. **Webhook Analytics** - Dashboard showing webhook volume, success rates, latency
6. **Multi-Tenant Routing** - Route webhooks to different handlers based on account/metadata
7. **Webhook Simulator** - Test interface to simulate webhook events for development
8. **Async Notifications** - Push webhook processing status to admin via WebSockets
9. **Audit Trail** - Complete audit log of all webhook events and processing results
10. **Health Monitoring** - Endpoint for monitoring webhook processing health and queue status
