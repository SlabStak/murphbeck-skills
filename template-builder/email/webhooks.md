# Webhook Delivery System

## Overview
Reliable webhook delivery service with retry logic, signature verification, event queuing, and delivery monitoring for outbound and inbound webhooks.

## Quick Start

```bash
npm install crypto uuid bull ioredis
```

## Full Implementation

### TypeScript Webhook Service

```typescript
// webhooks/webhook-service.ts
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Queue from 'bull';
import Redis from 'ioredis';

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
  headers?: Record<string, string>;
  retryConfig?: RetryConfig;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventId: string;
  event: WebhookEvent;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  response?: {
    statusCode: number;
    body?: string;
    headers?: Record<string, string>;
  };
  error?: string;
  duration?: number;
  createdAt: Date;
}

interface WebhookConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultRetryConfig: RetryConfig;
  signatureHeader: string;
  timestampHeader: string;
  deliveryIdHeader: string;
  timeout: number;
  maxPayloadSize: number;
}

export class WebhookService {
  private config: WebhookConfig;
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private queue: Queue.Queue;
  private redis: Redis;

  constructor(config: Partial<WebhookConfig> = {}) {
    this.config = {
      redis: config.redis || { host: 'localhost', port: 6379 },
      defaultRetryConfig: config.defaultRetryConfig || {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 3600000, // 1 hour
        backoffMultiplier: 2
      },
      signatureHeader: config.signatureHeader || 'x-webhook-signature',
      timestampHeader: config.timestampHeader || 'x-webhook-timestamp',
      deliveryIdHeader: config.deliveryIdHeader || 'x-webhook-delivery-id',
      timeout: config.timeout || 30000,
      maxPayloadSize: config.maxPayloadSize || 1024 * 1024 // 1MB
    };

    this.redis = new Redis(this.config.redis);
    this.queue = new Queue('webhooks', {
      redis: this.config.redis
    });

    this.setupQueueProcessor();
  }

  private setupQueueProcessor(): void {
    this.queue.process(async (job) => {
      const { deliveryId } = job.data;
      const delivery = this.deliveries.get(deliveryId);

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      const endpoint = this.endpoints.get(delivery.endpointId);
      if (!endpoint || !endpoint.active) {
        delivery.status = 'failed';
        delivery.error = 'Endpoint not found or inactive';
        return;
      }

      await this.sendWebhook(delivery, endpoint);
    });

    this.queue.on('failed', async (job, error) => {
      const { deliveryId } = job.data;
      const delivery = this.deliveries.get(deliveryId);

      if (delivery) {
        delivery.error = error.message;

        const endpoint = this.endpoints.get(delivery.endpointId);
        const retryConfig = endpoint?.retryConfig || this.config.defaultRetryConfig;

        if (delivery.attempts < retryConfig.maxRetries) {
          delivery.status = 'retrying';
          const delay = this.calculateBackoff(delivery.attempts, retryConfig);
          delivery.nextRetryAt = new Date(Date.now() + delay);

          await this.queue.add({ deliveryId }, {
            delay,
            attempts: delivery.attempts + 1
          });
        } else {
          delivery.status = 'failed';
        }
      }
    });
  }

  // Endpoint Management
  registerEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'secret' | 'createdAt'>): WebhookEndpoint {
    const id = uuidv4();
    const secret = this.generateSecret();

    const newEndpoint: WebhookEndpoint = {
      id,
      secret,
      createdAt: new Date(),
      ...endpoint
    };

    this.endpoints.set(id, newEndpoint);
    return newEndpoint;
  }

  updateEndpoint(id: string, updates: Partial<Omit<WebhookEndpoint, 'id' | 'secret' | 'createdAt'>>): WebhookEndpoint | null {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return null;

    Object.assign(endpoint, updates);
    return endpoint;
  }

  deleteEndpoint(id: string): boolean {
    return this.endpoints.delete(id);
  }

  getEndpoint(id: string): WebhookEndpoint | undefined {
    return this.endpoints.get(id);
  }

  listEndpoints(): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  rotateSecret(id: string): string | null {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return null;

    endpoint.secret = this.generateSecret();
    return endpoint.secret;
  }

  // Event Dispatch
  async dispatch(eventType: string, data: Record<string, any>): Promise<WebhookDelivery[]> {
    const event: WebhookEvent = {
      id: uuidv4(),
      type: eventType,
      data,
      timestamp: new Date()
    };

    // Find matching endpoints
    const matchingEndpoints = Array.from(this.endpoints.values()).filter(
      ep => ep.active && (ep.events.includes('*') || ep.events.includes(eventType))
    );

    const deliveries: WebhookDelivery[] = [];

    for (const endpoint of matchingEndpoints) {
      const delivery = await this.createDelivery(endpoint, event);
      deliveries.push(delivery);
    }

    return deliveries;
  }

  private async createDelivery(endpoint: WebhookEndpoint, event: WebhookEvent): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: uuidv4(),
      endpointId: endpoint.id,
      eventId: event.id,
      event,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    };

    this.deliveries.set(delivery.id, delivery);

    // Add to queue
    await this.queue.add({ deliveryId: delivery.id }, {
      attempts: 1
    });

    return delivery;
  }

  private async sendWebhook(delivery: WebhookDelivery, endpoint: WebhookEndpoint): Promise<void> {
    delivery.attempts++;
    delivery.lastAttemptAt = new Date();

    const payload = JSON.stringify({
      id: delivery.event.id,
      type: delivery.event.type,
      data: delivery.event.data,
      timestamp: delivery.event.timestamp.toISOString()
    });

    if (payload.length > this.config.maxPayloadSize) {
      throw new Error('Payload too large');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(payload, timestamp, endpoint.secret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [this.config.signatureHeader]: signature,
      [this.config.timestampHeader]: timestamp,
      [this.config.deliveryIdHeader]: delivery.id,
      'User-Agent': 'Webhook-Service/1.0',
      ...endpoint.headers
    };

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal
      });

      clearTimeout(timeout);

      delivery.duration = Date.now() - startTime;
      delivery.response = {
        statusCode: response.status,
        body: await response.text().catch(() => undefined),
        headers: Object.fromEntries(response.headers.entries())
      };

      if (response.ok) {
        delivery.status = 'delivered';
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      delivery.duration = Date.now() - startTime;
      throw error;
    }
  }

  // Signature Generation and Verification
  generateSignature(payload: string, timestamp: string, secret: string): string {
    const signaturePayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signaturePayload);
    return `v1=${hmac.digest('hex')}`;
  }

  verifySignature(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string,
    tolerance: number = 300 // 5 minutes
  ): boolean {
    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    const webhookTimestamp = parseInt(timestamp, 10);

    if (Math.abs(now - webhookTimestamp) > tolerance) {
      return false;
    }

    const expectedSignature = this.generateSignature(payload, timestamp, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Delivery Management
  getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id);
  }

  getDeliveriesByEndpoint(endpointId: string, options?: {
    limit?: number;
    offset?: number;
    status?: WebhookDelivery['status'];
  }): WebhookDelivery[] {
    let deliveries = Array.from(this.deliveries.values())
      .filter(d => d.endpointId === endpointId);

    if (options?.status) {
      deliveries = deliveries.filter(d => d.status === options.status);
    }

    deliveries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.offset) {
      deliveries = deliveries.slice(options.offset);
    }
    if (options?.limit) {
      deliveries = deliveries.slice(0, options.limit);
    }

    return deliveries;
  }

  async retryDelivery(deliveryId: string): Promise<boolean> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery || delivery.status === 'delivered') {
      return false;
    }

    delivery.status = 'pending';
    delivery.attempts = 0;
    delivery.error = undefined;

    await this.queue.add({ deliveryId }, { attempts: 1 });
    return true;
  }

  // Statistics
  getEndpointStats(endpointId: string): {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    avgDuration: number;
    successRate: number;
  } {
    const deliveries = Array.from(this.deliveries.values())
      .filter(d => d.endpointId === endpointId);

    const total = deliveries.length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const pending = deliveries.filter(d => d.status === 'pending' || d.status === 'retrying').length;

    const durations = deliveries
      .filter(d => d.duration)
      .map(d => d.duration!);

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const successRate = total > 0 ? (delivered / total) * 100 : 0;

    return { total, delivered, failed, pending, avgDuration, successRate };
  }

  // Helpers
  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  }

  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  // Cleanup
  async close(): Promise<void> {
    await this.queue.close();
    await this.redis.quit();
  }
}

// Inbound Webhook Handler
export class InboundWebhookHandler {
  private handlers: Map<string, (payload: any, headers: Record<string, string>) => Promise<void>> = new Map();

  registerHandler(
    source: string,
    handler: (payload: any, headers: Record<string, string>) => Promise<void>
  ): void {
    this.handlers.set(source, handler);
  }

  async handle(source: string, payload: any, headers: Record<string, string>): Promise<void> {
    const handler = this.handlers.get(source);
    if (!handler) {
      throw new Error(`No handler registered for source: ${source}`);
    }

    await handler(payload, headers);
  }

  // Common signature verification methods
  verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
    const elements = signature.split(',').reduce((acc, element) => {
      const [key, value] = element.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = elements['t'];
    const signatures = Object.entries(elements)
      .filter(([k]) => k.startsWith('v1'))
      .map(([, v]) => v);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return signatures.some(sig =>
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))
    );
  }

  verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  verifySlackSignature(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string
  ): boolean {
    const baseString = `v0:${timestamp}:${payload}`;
    const expectedSignature = `v0=${crypto
      .createHmac('sha256', secret)
      .update(baseString)
      .digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
```

### Express API Routes

```typescript
// routes/webhooks.ts
import { Router, Request, Response, raw } from 'express';
import { WebhookService, InboundWebhookHandler } from '../webhooks/webhook-service';

const router = Router();
const webhookService = new WebhookService();
const inboundHandler = new InboundWebhookHandler();

// Endpoint Management
router.post('/endpoints', (req: Request, res: Response) => {
  try {
    const endpoint = webhookService.registerEndpoint(req.body);
    res.status(201).json(endpoint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/endpoints', (req: Request, res: Response) => {
  const endpoints = webhookService.listEndpoints();
  // Hide secrets
  const safeEndpoints = endpoints.map(({ secret, ...rest }) => rest);
  res.json({ endpoints: safeEndpoints });
});

router.get('/endpoints/:id', (req: Request, res: Response) => {
  const endpoint = webhookService.getEndpoint(req.params.id);
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const { secret, ...safeEndpoint } = endpoint;
  res.json(safeEndpoint);
});

router.patch('/endpoints/:id', (req: Request, res: Response) => {
  const endpoint = webhookService.updateEndpoint(req.params.id, req.body);
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const { secret, ...safeEndpoint } = endpoint;
  res.json(safeEndpoint);
});

router.delete('/endpoints/:id', (req: Request, res: Response) => {
  const deleted = webhookService.deleteEndpoint(req.params.id);
  res.json({ success: deleted });
});

router.post('/endpoints/:id/rotate-secret', (req: Request, res: Response) => {
  const newSecret = webhookService.rotateSecret(req.params.id);
  if (!newSecret) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.json({ secret: newSecret });
});

// Delivery Management
router.get('/endpoints/:id/deliveries', (req: Request, res: Response) => {
  const { limit, offset, status } = req.query;

  const deliveries = webhookService.getDeliveriesByEndpoint(req.params.id, {
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    status: status as any
  });

  res.json({ deliveries });
});

router.get('/deliveries/:id', (req: Request, res: Response) => {
  const delivery = webhookService.getDelivery(req.params.id);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }
  res.json(delivery);
});

router.post('/deliveries/:id/retry', async (req: Request, res: Response) => {
  const retried = await webhookService.retryDelivery(req.params.id);
  res.json({ success: retried });
});

// Statistics
router.get('/endpoints/:id/stats', (req: Request, res: Response) => {
  const stats = webhookService.getEndpointStats(req.params.id);
  res.json(stats);
});

// Dispatch Event (internal use)
router.post('/dispatch', async (req: Request, res: Response) => {
  try {
    const { eventType, data } = req.body;
    const deliveries = await webhookService.dispatch(eventType, data);
    res.json({ deliveries: deliveries.map(d => ({ id: d.id, endpointId: d.endpointId, status: d.status })) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Inbound Webhooks
router.post('/receive/stripe', raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!inboundHandler.verifyStripeSignature(
    req.body.toString(),
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const event = JSON.parse(req.body.toString());
    await inboundHandler.handle('stripe', event, req.headers as any);
    res.json({ received: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/receive/github', raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!inboundHandler.verifyGitHubSignature(
    req.body.toString(),
    signature,
    process.env.GITHUB_WEBHOOK_SECRET!
  )) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const event = JSON.parse(req.body.toString());
    const eventType = req.headers['x-github-event'] as string;
    await inboundHandler.handle('github', { type: eventType, ...event }, req.headers as any);
    res.json({ received: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/receive/slack', raw({ type: 'application/x-www-form-urlencoded' }), async (req: Request, res: Response) => {
  const signature = req.headers['x-slack-signature'] as string;
  const timestamp = req.headers['x-slack-request-timestamp'] as string;

  if (!inboundHandler.verifySlackSignature(
    req.body.toString(),
    signature,
    timestamp,
    process.env.SLACK_SIGNING_SECRET!
  )) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const payload = JSON.parse(req.body.toString());

    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
      return res.json({ challenge: payload.challenge });
    }

    await inboundHandler.handle('slack', payload, req.headers as any);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generic inbound webhook with custom verification
router.post('/receive/:source', raw({ type: '*/*' }), async (req: Request, res: Response) => {
  try {
    const payload = JSON.parse(req.body.toString());
    await inboundHandler.handle(req.params.source, payload, req.headers as any);
    res.json({ received: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### React Webhook Management

```tsx
// components/WebhookManager.tsx
import React, { useState, useEffect, useCallback } from 'react';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  eventId: string;
  status: string;
  attempts: number;
  lastAttemptAt?: string;
  response?: {
    statusCode: number;
  };
  duration?: number;
}

export function WebhookManager() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  // New endpoint form
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const availableEvents = [
    'user.created', 'user.updated', 'user.deleted',
    'order.created', 'order.updated', 'order.completed',
    'payment.succeeded', 'payment.failed',
    'subscription.created', 'subscription.cancelled'
  ];

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    if (selectedEndpoint) {
      fetchDeliveries(selectedEndpoint);
    }
  }, [selectedEndpoint]);

  const fetchEndpoints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/webhooks/endpoints');
      const data = await response.json();
      setEndpoints(data.endpoints);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async (endpointId: string) => {
    const response = await fetch(`/api/webhooks/endpoints/${endpointId}/deliveries?limit=50`);
    const data = await response.json();
    setDeliveries(data.deliveries);
  };

  const createEndpoint = async () => {
    const response = await fetch('/api/webhooks/endpoints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: newUrl,
        events: newEvents,
        active: true
      })
    });

    if (response.ok) {
      const endpoint = await response.json();
      setEndpoints([...endpoints, endpoint]);
      setNewUrl('');
      setNewEvents([]);

      // Show secret (only shown once)
      alert(`Webhook secret (save this): ${endpoint.secret}`);
    }
  };

  const toggleEndpoint = async (id: string, active: boolean) => {
    await fetch(`/api/webhooks/endpoints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });

    setEndpoints(endpoints.map(ep =>
      ep.id === id ? { ...ep, active } : ep
    ));
  };

  const deleteEndpoint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;

    await fetch(`/api/webhooks/endpoints/${id}`, { method: 'DELETE' });
    setEndpoints(endpoints.filter(ep => ep.id !== id));
    if (selectedEndpoint === id) {
      setSelectedEndpoint(null);
      setDeliveries([]);
    }
  };

  const rotateSecret = async (id: string) => {
    if (!confirm('Are you sure? The old secret will stop working immediately.')) return;

    const response = await fetch(`/api/webhooks/endpoints/${id}/rotate-secret`, {
      method: 'POST'
    });

    const { secret } = await response.json();
    alert(`New webhook secret (save this): ${secret}`);
  };

  const retryDelivery = async (deliveryId: string) => {
    await fetch(`/api/webhooks/deliveries/${deliveryId}/retry`, {
      method: 'POST'
    });
    if (selectedEndpoint) {
      fetchDeliveries(selectedEndpoint);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#28a745';
      case 'failed': return '#dc3545';
      case 'pending': return '#ffc107';
      case 'retrying': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  return (
    <div className="webhook-manager">
      <h2>Webhook Endpoints</h2>

      {/* Create New Endpoint */}
      <div className="new-endpoint-form">
        <h3>Add New Endpoint</h3>
        <input
          type="url"
          placeholder="https://your-server.com/webhook"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
        />
        <div className="events-selector">
          {availableEvents.map(event => (
            <label key={event}>
              <input
                type="checkbox"
                checked={newEvents.includes(event)}
                onChange={e => {
                  if (e.target.checked) {
                    setNewEvents([...newEvents, event]);
                  } else {
                    setNewEvents(newEvents.filter(ev => ev !== event));
                  }
                }}
              />
              {event}
            </label>
          ))}
        </div>
        <button onClick={createEndpoint} disabled={!newUrl || newEvents.length === 0}>
          Create Endpoint
        </button>
      </div>

      {/* Endpoints List */}
      <div className="endpoints-list">
        {loading ? (
          <p>Loading...</p>
        ) : endpoints.length === 0 ? (
          <p>No webhooks configured</p>
        ) : (
          endpoints.map(endpoint => (
            <div
              key={endpoint.id}
              className={`endpoint-card ${selectedEndpoint === endpoint.id ? 'selected' : ''} ${!endpoint.active ? 'inactive' : ''}`}
              onClick={() => setSelectedEndpoint(endpoint.id)}
            >
              <div className="endpoint-url">{endpoint.url}</div>
              <div className="endpoint-events">
                {endpoint.events.join(', ')}
              </div>
              <div className="endpoint-actions">
                <button onClick={e => { e.stopPropagation(); toggleEndpoint(endpoint.id, !endpoint.active); }}>
                  {endpoint.active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={e => { e.stopPropagation(); rotateSecret(endpoint.id); }}>
                  Rotate Secret
                </button>
                <button onClick={e => { e.stopPropagation(); deleteEndpoint(endpoint.id); }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Deliveries */}
      {selectedEndpoint && (
        <div className="deliveries-panel">
          <h3>Recent Deliveries</h3>
          <button onClick={() => fetchDeliveries(selectedEndpoint)}>Refresh</button>

          {deliveries.length === 0 ? (
            <p>No deliveries yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Response</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(delivery => (
                  <tr key={delivery.id}>
                    <td>{delivery.eventId.slice(0, 8)}...</td>
                    <td>
                      <span style={{ color: getStatusColor(delivery.status) }}>
                        {delivery.status}
                      </span>
                    </td>
                    <td>{delivery.attempts}</td>
                    <td>{delivery.response?.statusCode || '-'}</td>
                    <td>{delivery.duration ? `${delivery.duration}ms` : '-'}</td>
                    <td>
                      {delivery.status === 'failed' && (
                        <button onClick={() => retryDelivery(delivery.id)}>Retry</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
```

## Python Implementation

```python
# webhooks/webhook_service.py
import hashlib
import hmac
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
import httpx
import asyncio
from redis import Redis
from rq import Queue

@dataclass
class WebhookEndpoint:
    id: str
    url: str
    secret: str
    events: List[str]
    active: bool = True
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class WebhookDelivery:
    id: str
    endpoint_id: str
    event_type: str
    payload: Dict[str, Any]
    status: str = 'pending'
    attempts: int = 0
    response_code: Optional[int] = None
    response_body: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


class WebhookService:
    def __init__(self, redis_url: str = 'redis://localhost:6379'):
        self.redis = Redis.from_url(redis_url)
        self.queue = Queue(connection=self.redis)
        self.endpoints: Dict[str, WebhookEndpoint] = {}
        self.deliveries: Dict[str, WebhookDelivery] = {}

    def register_endpoint(
        self,
        url: str,
        events: List[str],
        active: bool = True
    ) -> WebhookEndpoint:
        endpoint_id = str(uuid.uuid4())
        secret = f'whsec_{uuid.uuid4().hex}'

        endpoint = WebhookEndpoint(
            id=endpoint_id,
            url=url,
            secret=secret,
            events=events,
            active=active
        )

        self.endpoints[endpoint_id] = endpoint
        return endpoint

    def dispatch(self, event_type: str, data: Dict[str, Any]) -> List[WebhookDelivery]:
        matching_endpoints = [
            ep for ep in self.endpoints.values()
            if ep.active and ('*' in ep.events or event_type in ep.events)
        ]

        deliveries = []
        for endpoint in matching_endpoints:
            delivery = self._create_delivery(endpoint, event_type, data)
            deliveries.append(delivery)
            self.queue.enqueue(self._send_webhook, delivery.id)

        return deliveries

    def _create_delivery(
        self,
        endpoint: WebhookEndpoint,
        event_type: str,
        data: Dict[str, Any]
    ) -> WebhookDelivery:
        delivery = WebhookDelivery(
            id=str(uuid.uuid4()),
            endpoint_id=endpoint.id,
            event_type=event_type,
            payload=data
        )
        self.deliveries[delivery.id] = delivery
        return delivery

    def _send_webhook(self, delivery_id: str) -> None:
        delivery = self.deliveries.get(delivery_id)
        if not delivery:
            return

        endpoint = self.endpoints.get(delivery.endpoint_id)
        if not endpoint or not endpoint.active:
            delivery.status = 'failed'
            delivery.error = 'Endpoint not found or inactive'
            return

        delivery.attempts += 1

        payload = {
            'id': str(uuid.uuid4()),
            'type': delivery.event_type,
            'data': delivery.payload,
            'timestamp': datetime.now().isoformat()
        }

        timestamp = str(int(time.time()))
        signature = self._generate_signature(payload, timestamp, endpoint.secret)

        headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': timestamp,
            'X-Webhook-Delivery-Id': delivery.id
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(endpoint.url, json=payload, headers=headers)
                delivery.response_code = response.status_code
                delivery.response_body = response.text[:1000]

                if response.is_success:
                    delivery.status = 'delivered'
                else:
                    raise Exception(f'HTTP {response.status_code}')

        except Exception as e:
            delivery.error = str(e)
            if delivery.attempts < 5:
                delivery.status = 'retrying'
                delay = 60 * (2 ** (delivery.attempts - 1))
                self.queue.enqueue_in(delay, self._send_webhook, delivery_id)
            else:
                delivery.status = 'failed'

    def _generate_signature(self, payload: Dict, timestamp: str, secret: str) -> str:
        import json
        payload_str = json.dumps(payload, separators=(',', ':'))
        signature_payload = f'{timestamp}.{payload_str}'
        signature = hmac.new(
            secret.encode(),
            signature_payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return f'v1={signature}'

    def verify_signature(
        self,
        payload: str,
        signature: str,
        timestamp: str,
        secret: str,
        tolerance: int = 300
    ) -> bool:
        now = int(time.time())
        webhook_timestamp = int(timestamp)

        if abs(now - webhook_timestamp) > tolerance:
            return False

        expected = self._generate_signature_from_string(payload, timestamp, secret)
        return hmac.compare_digest(signature, expected)

    def _generate_signature_from_string(self, payload: str, timestamp: str, secret: str) -> str:
        signature_payload = f'{timestamp}.{payload}'
        signature = hmac.new(
            secret.encode(),
            signature_payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return f'v1={signature}'
```

## CLAUDE.md Integration

```markdown
## Webhooks

### Outbound Webhooks
- Register: `POST /api/webhooks/endpoints` with url, events
- Update: `PATCH /api/webhooks/endpoints/:id`
- Delete: `DELETE /api/webhooks/endpoints/:id`
- Rotate secret: `POST /api/webhooks/endpoints/:id/rotate-secret`

### Signature Verification
Signature header: `x-webhook-signature`
Format: `v1={hmac_sha256(timestamp.payload, secret)}`

Verify with timing-safe comparison:
```typescript
const isValid = webhookService.verifySignature(payload, signature, timestamp, secret);
```

### Retry Logic
- 5 retries with exponential backoff
- Initial delay: 1 second
- Max delay: 1 hour
- Backoff multiplier: 2x

### Inbound Webhooks
Pre-configured handlers for:
- Stripe: `/api/webhooks/receive/stripe`
- GitHub: `/api/webhooks/receive/github`
- Slack: `/api/webhooks/receive/slack`

### Delivery Monitoring
- List deliveries: `GET /api/webhooks/endpoints/:id/deliveries`
- Retry delivery: `POST /api/webhooks/deliveries/:id/retry`
- View stats: `GET /api/webhooks/endpoints/:id/stats`
```

## AI Suggestions

1. **Add webhook testing** - Test endpoint with sample payloads
2. **Implement dead letter queue** - Store failed webhooks for analysis
3. **Build webhook logs viewer** - Full request/response inspection
4. **Add IP whitelisting** - Restrict webhook sources by IP
5. **Implement webhook versioning** - Support multiple payload versions
6. **Create webhook templates** - Pre-configured webhook setups
7. **Add rate limiting** - Prevent webhook flooding
8. **Build webhook debugging** - Replay and inspect webhooks
9. **Implement webhook batching** - Batch multiple events
10. **Add webhook analytics** - Track delivery metrics over time
