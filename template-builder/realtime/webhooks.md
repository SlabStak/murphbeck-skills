# Webhook Templates

Production-ready webhook patterns for event delivery and integration.

## Overview

- **Outbound**: Send webhooks to external services
- **Inbound**: Receive and validate webhooks
- **Retry logic**: Exponential backoff and dead letter
- **Security**: Signature verification, replay prevention

## Quick Start

```bash
# Node.js
npm install axios crypto uuid

# Queue for reliable delivery
npm install bullmq ioredis

# Python
pip install httpx cryptography fastapi
```

## Outbound Webhooks

```typescript
// src/webhooks/outbound.ts
import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';

interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  headers?: Record<string, string>;
  retryPolicy?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
  };
}

interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: unknown;
}

interface WebhookDelivery {
  webhookId: string;
  payload: WebhookPayload;
  attempt: number;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: string;
  deliveredAt?: Date;
}

// Signature generator
function generateSignature(
  payload: string,
  secret: string,
  timestamp: string
): string {
  const signaturePayload = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');
}

// Webhook sender
class WebhookSender {
  private connection: IORedis;
  private queue: Queue;
  private worker: Worker;
  private webhookConfigs: Map<string, WebhookConfig> = new Map();

  constructor() {
    this.connection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue('webhooks', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });

    this.worker = new Worker(
      'webhooks',
      async (job) => this.processWebhook(job),
      {
        connection: this.connection,
        concurrency: 10,
      }
    );

    this.worker.on('failed', (job, error) => {
      logger.error('Webhook delivery failed', {
        jobId: job?.id,
        error: error.message,
      });
    });
  }

  // Register webhook endpoint
  registerWebhook(config: WebhookConfig): void {
    this.webhookConfigs.set(config.id, config);
  }

  // Queue webhook for delivery
  async send(
    event: string,
    data: unknown,
    options?: { webhookIds?: string[] }
  ): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const webhooks = options?.webhookIds
      ? options.webhookIds.map((id) => this.webhookConfigs.get(id)).filter(Boolean)
      : Array.from(this.webhookConfigs.values()).filter(
          (w) => w.active && w.events.includes(event)
        );

    for (const webhook of webhooks) {
      if (!webhook) continue;

      await this.queue.add(
        'deliver',
        {
          webhookId: webhook.id,
          payload,
        },
        {
          jobId: `${webhook.id}-${payload.id}`,
        }
      );
    }
  }

  // Process webhook delivery
  private async processWebhook(
    job: Job<{ webhookId: string; payload: WebhookPayload }>
  ): Promise<WebhookDelivery> {
    const { webhookId, payload } = job.data;
    const webhook = this.webhookConfigs.get(webhookId);

    if (!webhook) {
      throw new Error(`Webhook config not found: ${webhookId}`);
    }

    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateSignature(payloadString, webhook.secret, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-ID': payload.id,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Signature': `sha256=${signature}`,
      ...webhook.headers,
    };

    try {
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 30000,
        validateStatus: (status) => status < 500, // Retry on 5xx
      });

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const delivery: WebhookDelivery = {
        webhookId,
        payload,
        attempt: job.attemptsMade + 1,
        response: {
          status: response.status,
          body: JSON.stringify(response.data).slice(0, 1000),
          headers: response.headers as Record<string, string>,
        },
        deliveredAt: new Date(),
      };

      // Store delivery record
      await this.storeDelivery(delivery);

      return delivery;
    } catch (error) {
      const axiosError = error as AxiosError;

      const delivery: WebhookDelivery = {
        webhookId,
        payload,
        attempt: job.attemptsMade + 1,
        error: axiosError.message,
        response: axiosError.response
          ? {
              status: axiosError.response.status,
              body: JSON.stringify(axiosError.response.data).slice(0, 1000),
              headers: axiosError.response.headers as Record<string, string>,
            }
          : undefined,
      };

      await this.storeDelivery(delivery);

      throw error;
    }
  }

  private async storeDelivery(delivery: WebhookDelivery): Promise<void> {
    // Store in database for audit trail
    logger.info('Webhook delivery', {
      webhookId: delivery.webhookId,
      payloadId: delivery.payload.id,
      attempt: delivery.attempt,
      success: !!delivery.deliveredAt,
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}

export const webhookSender = new WebhookSender();

// Usage
webhookSender.registerWebhook({
  id: 'partner-1',
  url: 'https://partner.example.com/webhooks',
  secret: process.env.WEBHOOK_SECRET_PARTNER_1!,
  events: ['order.created', 'order.shipped'],
  active: true,
});

// Send webhook
await webhookSender.send('order.created', {
  orderId: '123',
  total: 99.99,
  items: [{ productId: 'abc', quantity: 2 }],
});
```

## Inbound Webhook Handler

```typescript
// src/webhooks/inbound.ts
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface WebhookProvider {
  name: string;
  verifySignature: (req: Request, secret: string) => boolean;
  extractEvent: (req: Request) => { event: string; data: unknown };
}

// Signature verification for common providers
const providers: Record<string, WebhookProvider> = {
  stripe: {
    name: 'Stripe',
    verifySignature: (req, secret) => {
      const signature = req.headers['stripe-signature'] as string;
      const payload = (req as any).rawBody;

      try {
        // Stripe signature format: t=timestamp,v1=signature
        const parts = signature.split(',').reduce((acc, part) => {
          const [key, value] = part.split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

        const signedPayload = `${parts.t}.${payload}`;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedPayload)
          .digest('hex');

        return crypto.timingSafeEqual(
          Buffer.from(parts.v1),
          Buffer.from(expectedSignature)
        );
      } catch {
        return false;
      }
    },
    extractEvent: (req) => ({
      event: req.body.type,
      data: req.body.data.object,
    }),
  },

  github: {
    name: 'GitHub',
    verifySignature: (req, secret) => {
      const signature = req.headers['x-hub-signature-256'] as string;
      const payload = (req as any).rawBody;

      const expectedSignature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    },
    extractEvent: (req) => ({
      event: req.headers['x-github-event'] as string,
      data: req.body,
    }),
  },

  shopify: {
    name: 'Shopify',
    verifySignature: (req, secret) => {
      const signature = req.headers['x-shopify-hmac-sha256'] as string;
      const payload = (req as any).rawBody;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    },
    extractEvent: (req) => ({
      event: req.headers['x-shopify-topic'] as string,
      data: req.body,
    }),
  },

  custom: {
    name: 'Custom',
    verifySignature: (req, secret) => {
      const signature = req.headers['x-webhook-signature'] as string;
      const timestamp = req.headers['x-webhook-timestamp'] as string;
      const payload = (req as any).rawBody;

      // Check timestamp to prevent replay attacks (5 minute window)
      const requestTime = parseInt(timestamp) * 1000;
      const now = Date.now();
      if (Math.abs(now - requestTime) > 300000) {
        return false;
      }

      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    },
    extractEvent: (req) => ({
      event: req.body.event,
      data: req.body.data,
    }),
  },
};

// Webhook handler type
type WebhookHandler = (event: string, data: unknown) => Promise<void>;

// Webhook router
class WebhookRouter {
  private handlers: Map<string, Map<string, WebhookHandler[]>> = new Map();
  private secrets: Map<string, string> = new Map();

  constructor() {
    // Initialize handler maps for each provider
    for (const provider of Object.keys(providers)) {
      this.handlers.set(provider, new Map());
    }
  }

  setSecret(provider: string, secret: string): void {
    this.secrets.set(provider, secret);
  }

  on(provider: string, event: string, handler: WebhookHandler): void {
    const providerHandlers = this.handlers.get(provider);
    if (!providerHandlers) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const eventHandlers = providerHandlers.get(event) || [];
    eventHandlers.push(handler);
    providerHandlers.set(event, eventHandlers);
  }

  async handle(provider: string, req: Request): Promise<void> {
    const providerConfig = providers[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const secret = this.secrets.get(provider);
    if (!secret) {
      throw new Error(`No secret configured for provider: ${provider}`);
    }

    // Verify signature
    if (!providerConfig.verifySignature(req, secret)) {
      throw new Error('Invalid webhook signature');
    }

    // Extract event
    const { event, data } = providerConfig.extractEvent(req);

    logger.info('Webhook received', { provider, event });

    // Get handlers
    const providerHandlers = this.handlers.get(provider);
    const eventHandlers = providerHandlers?.get(event) || [];
    const wildcardHandlers = providerHandlers?.get('*') || [];

    // Execute handlers
    await Promise.all([
      ...eventHandlers.map((h) => h(event, data)),
      ...wildcardHandlers.map((h) => h(event, data)),
    ]);
  }
}

export const webhookRouter = new WebhookRouter();

// Express middleware
const app = express();

// Raw body parser for signature verification
app.use(
  '/webhooks',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response, next: NextFunction) => {
    (req as any).rawBody = req.body;
    req.body = JSON.parse(req.body.toString());
    next();
  }
);

// Webhook endpoints
app.post('/webhooks/:provider', async (req, res) => {
  const { provider } = req.params;

  try {
    await webhookRouter.handle(provider, req);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error', { provider, error });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Configure secrets
webhookRouter.setSecret('stripe', process.env.STRIPE_WEBHOOK_SECRET!);
webhookRouter.setSecret('github', process.env.GITHUB_WEBHOOK_SECRET!);
webhookRouter.setSecret('custom', process.env.CUSTOM_WEBHOOK_SECRET!);

// Register handlers
webhookRouter.on('stripe', 'payment_intent.succeeded', async (event, data) => {
  logger.info('Payment succeeded', { data });
  // Process payment...
});

webhookRouter.on('stripe', 'customer.subscription.created', async (event, data) => {
  logger.info('Subscription created', { data });
  // Create subscription...
});

webhookRouter.on('github', 'push', async (event, data) => {
  logger.info('GitHub push', { data });
  // Trigger deployment...
});

webhookRouter.on('github', '*', async (event, data) => {
  // Log all GitHub events
  logger.info('GitHub event', { event });
});
```

## Webhook Management API

```typescript
// src/webhooks/management.ts
import express from 'express';
import crypto from 'crypto';
import { Pool } from 'pg';

interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  payload: unknown;
  responseStatus: number;
  responseBody: string;
  success: boolean;
  attempt: number;
  createdAt: Date;
}

class WebhookManagement {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        secret VARCHAR(255) NOT NULL,
        events TEXT[] NOT NULL,
        active BOOLEAN DEFAULT true,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_id UUID REFERENCES webhook_endpoints(id),
        event VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        response_status INTEGER,
        response_body TEXT,
        success BOOLEAN NOT NULL,
        attempt INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhook_endpoints(user_id);
      CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
    `);
  }

  async create(
    userId: string,
    data: { url: string; events: string[]; description?: string }
  ): Promise<WebhookEndpoint> {
    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    const result = await this.pool.query(
      `INSERT INTO webhook_endpoints (user_id, url, secret, events, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, data.url, secret, data.events, data.description]
    );

    return this.mapEndpoint(result.rows[0]);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{ url: string; events: string[]; active: boolean; description: string }>
  ): Promise<WebhookEndpoint | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(data.url);
    }
    if (data.events !== undefined) {
      updates.push(`events = $${paramIndex++}`);
      values.push(data.events);
    }
    if (data.active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(data.active);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (updates.length === 0) {
      return this.get(id, userId);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const result = await this.pool.query(
      `UPDATE webhook_endpoints
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] ? this.mapEndpoint(result.rows[0]) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM webhook_endpoints WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rowCount > 0;
  }

  async get(id: string, userId: string): Promise<WebhookEndpoint | null> {
    const result = await this.pool.query(
      'SELECT * FROM webhook_endpoints WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] ? this.mapEndpoint(result.rows[0]) : null;
  }

  async list(userId: string): Promise<WebhookEndpoint[]> {
    const result = await this.pool.query(
      'SELECT * FROM webhook_endpoints WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(this.mapEndpoint);
  }

  async rotateSecret(id: string, userId: string): Promise<string | null> {
    const newSecret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    const result = await this.pool.query(
      `UPDATE webhook_endpoints
       SET secret = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING secret`,
      [newSecret, id, userId]
    );

    return result.rows[0]?.secret || null;
  }

  async getDeliveries(
    webhookId: string,
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<WebhookDeliveryLog[]> {
    const { limit = 50, offset = 0 } = options;

    const result = await this.pool.query(
      `SELECT d.* FROM webhook_deliveries d
       JOIN webhook_endpoints w ON d.webhook_id = w.id
       WHERE d.webhook_id = $1 AND w.user_id = $2
       ORDER BY d.created_at DESC
       LIMIT $3 OFFSET $4`,
      [webhookId, userId, limit, offset]
    );

    return result.rows.map((row) => ({
      id: row.id,
      webhookId: row.webhook_id,
      event: row.event,
      payload: row.payload,
      responseStatus: row.response_status,
      responseBody: row.response_body,
      success: row.success,
      attempt: row.attempt,
      createdAt: row.created_at,
    }));
  }

  private mapEndpoint(row: any): WebhookEndpoint {
    return {
      id: row.id,
      userId: row.user_id,
      url: row.url,
      secret: row.secret,
      events: row.events,
      active: row.active,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// API routes
const router = express.Router();

router.post('/', async (req, res) => {
  const userId = req.user!.id;
  const webhook = await webhookManagement.create(userId, req.body);
  res.status(201).json(webhook);
});

router.get('/', async (req, res) => {
  const userId = req.user!.id;
  const webhooks = await webhookManagement.list(userId);
  // Hide secrets in list view
  res.json(webhooks.map((w) => ({ ...w, secret: undefined })));
});

router.get('/:id', async (req, res) => {
  const webhook = await webhookManagement.get(req.params.id, req.user!.id);
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  res.json(webhook);
});

router.patch('/:id', async (req, res) => {
  const webhook = await webhookManagement.update(
    req.params.id,
    req.user!.id,
    req.body
  );
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  res.json(webhook);
});

router.delete('/:id', async (req, res) => {
  const deleted = await webhookManagement.delete(req.params.id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  res.status(204).send();
});

router.post('/:id/rotate-secret', async (req, res) => {
  const newSecret = await webhookManagement.rotateSecret(
    req.params.id,
    req.user!.id
  );
  if (!newSecret) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  res.json({ secret: newSecret });
});

router.get('/:id/deliveries', async (req, res) => {
  const deliveries = await webhookManagement.getDeliveries(
    req.params.id,
    req.user!.id,
    {
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    }
  );
  res.json(deliveries);
});

export { router as webhookRouter };
```

## Python Implementation

```python
# src/webhooks/handler.py
import hmac
import hashlib
import time
from typing import Callable, Any
from dataclasses import dataclass
from fastapi import FastAPI, Request, HTTPException, Header
import httpx

app = FastAPI()


def verify_signature(
    payload: bytes,
    signature: str,
    secret: str,
    timestamp: str,
) -> bool:
    """Verify webhook signature with replay protection."""
    # Check timestamp (5 minute window)
    request_time = int(timestamp)
    current_time = int(time.time())
    if abs(current_time - request_time) > 300:
        return False

    # Verify signature
    signed_payload = f"{timestamp}.{payload.decode()}"
    expected_signature = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, f"sha256={expected_signature}")


@dataclass
class WebhookEvent:
    id: str
    event: str
    timestamp: str
    data: dict


# Event handlers
handlers: dict[str, list[Callable[[WebhookEvent], Any]]] = {}


def on_event(event: str):
    """Decorator to register event handler."""
    def decorator(func: Callable[[WebhookEvent], Any]):
        if event not in handlers:
            handlers[event] = []
        handlers[event].append(func)
        return func
    return decorator


@app.post("/webhooks/receive")
async def receive_webhook(
    request: Request,
    x_webhook_signature: str = Header(...),
    x_webhook_timestamp: str = Header(...),
):
    body = await request.body()
    secret = "your-webhook-secret"

    if not verify_signature(body, x_webhook_signature, secret, x_webhook_timestamp):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    event = WebhookEvent(
        id=payload["id"],
        event=payload["event"],
        timestamp=payload["timestamp"],
        data=payload["data"],
    )

    # Execute handlers
    event_handlers = handlers.get(event.event, []) + handlers.get("*", [])
    for handler in event_handlers:
        await handler(event)

    return {"received": True}


# Register handlers
@on_event("order.created")
async def handle_order_created(event: WebhookEvent):
    print(f"Order created: {event.data}")


@on_event("*")
async def log_all_events(event: WebhookEvent):
    print(f"Event received: {event.event}")


# Outbound webhook sender
class WebhookSender:
    def __init__(self, secret: str):
        self.secret = secret
        self.client = httpx.AsyncClient(timeout=30.0)

    def _sign(self, payload: str, timestamp: str) -> str:
        signed_payload = f"{timestamp}.{payload}"
        signature = hmac.new(
            self.secret.encode(),
            signed_payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"sha256={signature}"

    async def send(
        self,
        url: str,
        event: str,
        data: dict,
        retry_count: int = 3,
    ) -> bool:
        import json
        import uuid

        payload = {
            "id": str(uuid.uuid4()),
            "event": event,
            "timestamp": str(int(time.time())),
            "data": data,
        }

        payload_str = json.dumps(payload)
        timestamp = str(int(time.time()))
        signature = self._sign(payload_str, timestamp)

        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Timestamp": timestamp,
        }

        for attempt in range(retry_count):
            try:
                response = await self.client.post(url, json=payload, headers=headers)
                if response.status_code < 500:
                    return response.status_code < 400
            except Exception as e:
                print(f"Webhook delivery failed (attempt {attempt + 1}): {e}")

            # Exponential backoff
            await asyncio.sleep(2 ** attempt)

        return False

    async def close(self):
        await self.client.aclose()
```

## CLAUDE.md Integration

```markdown
# Webhooks

## Outbound
- Queue-based reliable delivery
- Exponential backoff retry
- Signature verification (HMAC-SHA256)

## Inbound Endpoints
- `POST /webhooks/stripe` - Stripe events
- `POST /webhooks/github` - GitHub events
- `POST /webhooks/custom` - Custom integrations

## Signature Format
```
X-Webhook-Signature: sha256=<signature>
X-Webhook-Timestamp: <unix_timestamp>
```

## Event Types
- `order.*` - Order events
- `user.*` - User events
- `payment.*` - Payment events

## Management API
- `POST /api/webhooks` - Create endpoint
- `GET /api/webhooks` - List endpoints
- `POST /api/webhooks/:id/rotate-secret` - Rotate secret
```

## AI Suggestions

1. **Signature verification** - Always verify before processing
2. **Replay prevention** - Check timestamp within tolerance
3. **Idempotency** - Handle duplicate deliveries gracefully
4. **Retry strategy** - Exponential backoff with jitter
5. **Dead letter queue** - Store failed deliveries
6. **Delivery logs** - Track all delivery attempts
7. **Secret rotation** - Support rotating signing secrets
8. **Rate limiting** - Limit outbound webhook rate
9. **Payload size limits** - Validate incoming payload size
10. **SSL verification** - Verify TLS certificates
