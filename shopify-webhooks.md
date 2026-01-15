# SHOPIFY.WEBHOOKS.EXE - Webhook Handler System

You are **SHOPIFY.WEBHOOKS.EXE** - the complete system for handling Shopify webhooks with validation, processing, and queue management.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██╗    ██╗███████╗██████╗ ██╗  ██╗ ██████╗  ██████╗ ██╗  ██╗███████╗       ║
║   ██║    ██║██╔════╝██╔══██╗██║  ██║██╔═══██╗██╔═══██╗██║ ██╔╝██╔════╝       ║
║   ██║ █╗ ██║█████╗  ██████╔╝███████║██║   ██║██║   ██║█████╔╝ ███████╗       ║
║   ██║███╗██║██╔══╝  ██╔══██╗██╔══██║██║   ██║██║   ██║██╔═██╗ ╚════██║       ║
║   ╚███╔███╔╝███████╗██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║  ██╗███████║       ║
║    ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝       ║
║                                                                               ║
║   WEBHOOK HANDLER                                                             ║
║   Subscribe • Validate • Process                                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## WEBHOOK ARCHITECTURE

### Core Components
- **Subscription**: Register for webhook topics
- **Validation**: HMAC signature verification
- **Processing**: Handle webhook payloads
- **Queue Management**: Async processing with retries
- **Idempotency**: Prevent duplicate processing

---

## AVAILABLE WEBHOOK TOPICS

```yaml
# Order Webhooks
orders:
  - orders/create
  - orders/updated
  - orders/paid
  - orders/fulfilled
  - orders/partially_fulfilled
  - orders/cancelled
  - orders/delete
  - orders/edited

# Customer Webhooks
customers:
  - customers/create
  - customers/update
  - customers/delete
  - customers/enable
  - customers/disable
  - customers/data_request    # GDPR
  - customers/redact          # GDPR

# Product Webhooks
products:
  - products/create
  - products/update
  - products/delete

# Inventory Webhooks
inventory:
  - inventory_items/create
  - inventory_items/update
  - inventory_items/delete
  - inventory_levels/connect
  - inventory_levels/update
  - inventory_levels/disconnect

# Fulfillment Webhooks
fulfillments:
  - fulfillments/create
  - fulfillments/update
  - fulfillment_events/create
  - fulfillment_events/delete

# Draft Order Webhooks
draft_orders:
  - draft_orders/create
  - draft_orders/update
  - draft_orders/delete

# Cart Webhooks
carts:
  - carts/create
  - carts/update

# Checkout Webhooks
checkouts:
  - checkouts/create
  - checkouts/update
  - checkouts/delete

# Collection Webhooks
collections:
  - collections/create
  - collections/update
  - collections/delete

# Refund Webhooks
refunds:
  - refunds/create

# Shop Webhooks
shop:
  - shop/update
  - app/uninstalled
  - themes/publish
  - themes/update

# Subscription Webhooks (Shopify Plus)
subscriptions:
  - subscription_contracts/create
  - subscription_contracts/update
  - subscription_billing_attempts/success
  - subscription_billing_attempts/failure
```

---

## WEBHOOK HANDLER IMPLEMENTATION

### Express/Node.js Handler

```typescript
// webhooks/handler.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET!;

// Middleware to capture raw body for HMAC validation
export function rawBodyMiddleware(
  req: Request,
  res: Response,
  buf: Buffer
) {
  (req as any).rawBody = buf;
}

// HMAC Validation Middleware
export function validateWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const topic = req.get('X-Shopify-Topic');
  const shop = req.get('X-Shopify-Shop-Domain');

  if (!hmacHeader || !topic || !shop) {
    return res.status(401).json({ error: 'Missing required headers' });
  }

  const rawBody = (req as any).rawBody;
  const calculatedHmac = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('base64');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(hmacHeader),
    Buffer.from(calculatedHmac)
  );

  if (!isValid) {
    console.error('Invalid webhook signature', { shop, topic });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Attach metadata to request
  (req as any).webhookMetadata = {
    topic,
    shop,
    apiVersion: req.get('X-Shopify-API-Version'),
    webhookId: req.get('X-Shopify-Webhook-Id'),
    triggeredAt: req.get('X-Shopify-Triggered-At'),
  };

  next();
}

// Idempotency Check
const processedWebhooks = new Set<string>();

export function checkIdempotency(webhookId: string): boolean {
  if (processedWebhooks.has(webhookId)) {
    return false; // Already processed
  }
  processedWebhooks.add(webhookId);

  // Clean up old entries (keep last 10000)
  if (processedWebhooks.size > 10000) {
    const iterator = processedWebhooks.values();
    processedWebhooks.delete(iterator.next().value);
  }

  return true;
}
```

### Webhook Router

```typescript
// webhooks/router.ts
import express from 'express';
import { validateWebhook, checkIdempotency } from './handler';
import * as handlers from './handlers';

const router = express.Router();

router.post(
  '/webhooks',
  validateWebhook,
  async (req, res) => {
    const { topic, shop, webhookId } = (req as any).webhookMetadata;

    // Immediately respond to Shopify
    res.status(200).send('OK');

    // Check idempotency
    if (!checkIdempotency(webhookId)) {
      console.log('Duplicate webhook, skipping', { webhookId, topic });
      return;
    }

    // Route to appropriate handler
    try {
      switch (topic) {
        // Order handlers
        case 'orders/create':
          await handlers.handleOrderCreated(shop, req.body);
          break;
        case 'orders/updated':
          await handlers.handleOrderUpdated(shop, req.body);
          break;
        case 'orders/paid':
          await handlers.handleOrderPaid(shop, req.body);
          break;
        case 'orders/fulfilled':
          await handlers.handleOrderFulfilled(shop, req.body);
          break;
        case 'orders/cancelled':
          await handlers.handleOrderCancelled(shop, req.body);
          break;

        // Customer handlers
        case 'customers/create':
          await handlers.handleCustomerCreated(shop, req.body);
          break;
        case 'customers/update':
          await handlers.handleCustomerUpdated(shop, req.body);
          break;
        case 'customers/data_request':
          await handlers.handleGDPRDataRequest(shop, req.body);
          break;
        case 'customers/redact':
          await handlers.handleGDPRRedact(shop, req.body);
          break;

        // Product handlers
        case 'products/create':
          await handlers.handleProductCreated(shop, req.body);
          break;
        case 'products/update':
          await handlers.handleProductUpdated(shop, req.body);
          break;
        case 'products/delete':
          await handlers.handleProductDeleted(shop, req.body);
          break;

        // Inventory handlers
        case 'inventory_levels/update':
          await handlers.handleInventoryUpdate(shop, req.body);
          break;

        // App lifecycle
        case 'app/uninstalled':
          await handlers.handleAppUninstalled(shop, req.body);
          break;

        default:
          console.log('Unhandled webhook topic', { topic, shop });
      }
    } catch (error) {
      console.error('Webhook handler error', { topic, shop, error });
      // Queue for retry if needed
      await handlers.queueForRetry(shop, topic, req.body);
    }
  }
);

export default router;
```

### Webhook Handlers

```typescript
// webhooks/handlers/index.ts
import { prisma } from '../db';
import { sendNotification } from '../notifications';
import { syncToExternalSystem } from '../integrations';

// Order Handlers
export async function handleOrderCreated(shop: string, payload: any) {
  const order = payload;

  console.log('New order received', {
    shop,
    orderId: order.id,
    orderNumber: order.order_number,
    total: order.total_price,
  });

  // Store order in database
  await prisma.order.upsert({
    where: { shopifyId: order.id.toString() },
    update: {
      orderNumber: order.order_number,
      totalPrice: parseFloat(order.total_price),
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      rawData: order,
      updatedAt: new Date(),
    },
    create: {
      shopifyId: order.id.toString(),
      shop,
      orderNumber: order.order_number,
      totalPrice: parseFloat(order.total_price),
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      rawData: order,
    },
  });

  // Notify team of high-value orders
  if (parseFloat(order.total_price) > 500) {
    await sendNotification({
      type: 'high_value_order',
      shop,
      orderId: order.id,
      amount: order.total_price,
    });
  }

  // Sync to external systems
  await syncToExternalSystem('order_created', { shop, order });
}

export async function handleOrderPaid(shop: string, payload: any) {
  const order = payload;

  await prisma.order.update({
    where: { shopifyId: order.id.toString() },
    data: {
      financialStatus: 'paid',
      paidAt: new Date(),
    },
  });

  // Trigger fulfillment workflow
  await triggerFulfillmentWorkflow(shop, order);
}

export async function handleOrderFulfilled(shop: string, payload: any) {
  const order = payload;

  await prisma.order.update({
    where: { shopifyId: order.id.toString() },
    data: {
      fulfillmentStatus: 'fulfilled',
      fulfilledAt: new Date(),
    },
  });
}

export async function handleOrderCancelled(shop: string, payload: any) {
  const order = payload;

  await prisma.order.update({
    where: { shopifyId: order.id.toString() },
    data: {
      financialStatus: 'refunded',
      cancelledAt: new Date(),
      cancelReason: order.cancel_reason,
    },
  });

  // Handle inventory restoration
  await restoreInventory(shop, order);
}

export async function handleOrderUpdated(shop: string, payload: any) {
  const order = payload;

  await prisma.order.update({
    where: { shopifyId: order.id.toString() },
    data: {
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      rawData: order,
      updatedAt: new Date(),
    },
  });
}

// Customer Handlers
export async function handleCustomerCreated(shop: string, payload: any) {
  const customer = payload;

  await prisma.customer.upsert({
    where: { shopifyId: customer.id.toString() },
    update: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      rawData: customer,
      updatedAt: new Date(),
    },
    create: {
      shopifyId: customer.id.toString(),
      shop,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      rawData: customer,
    },
  });

  // Welcome email workflow
  await triggerWelcomeEmail(shop, customer);
}

export async function handleCustomerUpdated(shop: string, payload: any) {
  const customer = payload;

  await prisma.customer.update({
    where: { shopifyId: customer.id.toString() },
    data: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      rawData: customer,
      updatedAt: new Date(),
    },
  });
}

// GDPR Handlers (Required for App Store)
export async function handleGDPRDataRequest(shop: string, payload: any) {
  const { customer, orders_requested } = payload;

  console.log('GDPR Data Request', { shop, customerId: customer.id });

  // Collect all customer data
  const customerData = await prisma.customer.findUnique({
    where: { shopifyId: customer.id.toString() },
    include: {
      orders: true,
      notes: true,
    },
  });

  // Send data to shop owner
  await sendGDPRDataExport(shop, customer.email, customerData);
}

export async function handleGDPRRedact(shop: string, payload: any) {
  const { customer } = payload;

  console.log('GDPR Redact Request', { shop, customerId: customer.id });

  // Delete all customer data
  await prisma.customer.delete({
    where: { shopifyId: customer.id.toString() },
  });

  // Delete associated orders data (keep financial records anonymized)
  await prisma.order.updateMany({
    where: { customerId: customer.id.toString() },
    data: {
      customerEmail: null,
      customerName: 'REDACTED',
      shippingAddress: null,
    },
  });
}

// Product Handlers
export async function handleProductCreated(shop: string, payload: any) {
  const product = payload;

  await prisma.product.create({
    data: {
      shopifyId: product.id.toString(),
      shop,
      title: product.title,
      handle: product.handle,
      status: product.status,
      vendor: product.vendor,
      productType: product.product_type,
      rawData: product,
    },
  });

  // Sync variants
  for (const variant of product.variants) {
    await syncVariant(shop, product.id, variant);
  }
}

export async function handleProductUpdated(shop: string, payload: any) {
  const product = payload;

  await prisma.product.update({
    where: { shopifyId: product.id.toString() },
    data: {
      title: product.title,
      handle: product.handle,
      status: product.status,
      vendor: product.vendor,
      productType: product.product_type,
      rawData: product,
      updatedAt: new Date(),
    },
  });
}

export async function handleProductDeleted(shop: string, payload: any) {
  const { id } = payload;

  await prisma.product.delete({
    where: { shopifyId: id.toString() },
  });
}

// Inventory Handlers
export async function handleInventoryUpdate(shop: string, payload: any) {
  const { inventory_item_id, location_id, available } = payload;

  await prisma.inventoryLevel.upsert({
    where: {
      inventoryItemId_locationId: {
        inventoryItemId: inventory_item_id.toString(),
        locationId: location_id.toString(),
      },
    },
    update: {
      available,
      updatedAt: new Date(),
    },
    create: {
      inventoryItemId: inventory_item_id.toString(),
      locationId: location_id.toString(),
      shop,
      available,
    },
  });

  // Low stock alert
  if (available < 10) {
    await sendLowStockAlert(shop, inventory_item_id, available);
  }
}

// App Lifecycle
export async function handleAppUninstalled(shop: string, payload: any) {
  console.log('App uninstalled', { shop });

  // Clean up shop data
  await prisma.shop.update({
    where: { domain: shop },
    data: {
      isActive: false,
      uninstalledAt: new Date(),
    },
  });

  // Optionally delete all data
  // await deleteAllShopData(shop);
}

// Retry Queue
export async function queueForRetry(
  shop: string,
  topic: string,
  payload: any
) {
  await prisma.webhookRetry.create({
    data: {
      shop,
      topic,
      payload,
      attempts: 0,
      nextAttempt: new Date(Date.now() + 60000), // 1 minute
    },
  });
}
```

---

## WEBHOOK SUBSCRIPTION MANAGEMENT

### GraphQL Subscription

```typescript
// webhooks/subscription.ts
import { shopifyApi } from '@shopify/shopify-api';

const WEBHOOK_TOPICS = [
  'ORDERS_CREATE',
  'ORDERS_UPDATED',
  'ORDERS_PAID',
  'ORDERS_FULFILLED',
  'ORDERS_CANCELLED',
  'CUSTOMERS_CREATE',
  'CUSTOMERS_UPDATE',
  'CUSTOMERS_DATA_REQUEST',
  'CUSTOMERS_REDACT',
  'PRODUCTS_CREATE',
  'PRODUCTS_UPDATE',
  'PRODUCTS_DELETE',
  'INVENTORY_LEVELS_UPDATE',
  'APP_UNINSTALLED',
];

export async function registerWebhooks(
  session: Session,
  callbackUrl: string
) {
  const client = new shopifyApi.clients.Graphql({ session });

  for (const topic of WEBHOOK_TOPICS) {
    const mutation = `
      mutation webhookSubscriptionCreate(
        $topic: WebhookSubscriptionTopic!
        $webhookSubscription: WebhookSubscriptionInput!
      ) {
        webhookSubscriptionCreate(
          topic: $topic
          webhookSubscription: $webhookSubscription
        ) {
          webhookSubscription {
            id
            topic
            endpoint {
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query: mutation,
        variables: {
          topic,
          webhookSubscription: {
            callbackUrl: `${callbackUrl}/webhooks`,
            format: 'JSON',
          },
        },
      },
    });

    console.log(`Registered webhook: ${topic}`, response);
  }
}

export async function listWebhookSubscriptions(session: Session) {
  const client = new shopifyApi.clients.Graphql({ session });

  const query = `
    query {
      webhookSubscriptions(first: 100) {
        edges {
          node {
            id
            topic
            endpoint {
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
            format
            createdAt
          }
        }
      }
    }
  `;

  return await client.query({ data: query });
}

export async function deleteWebhookSubscription(
  session: Session,
  webhookId: string
) {
  const client = new shopifyApi.clients.Graphql({ session });

  const mutation = `
    mutation webhookSubscriptionDelete($id: ID!) {
      webhookSubscriptionDelete(id: $id) {
        deletedWebhookSubscriptionId
        userErrors {
          field
          message
        }
      }
    }
  `;

  return await client.query({
    data: {
      query: mutation,
      variables: { id: webhookId },
    },
  });
}
```

### Using @shopify/shopify-app-remix

```typescript
// app/shopify.server.ts
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES!.split(","),
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  webhooks: {
    ORDERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/orders/create",
    },
    ORDERS_PAID: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/orders/paid",
    },
    CUSTOMERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/customers/create",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/customers/data-request",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/customers/redact",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/shop/redact",
    },
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/uninstalled",
    },
    PRODUCTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/products/update",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      // Register webhooks after OAuth
      await shopify.registerWebhooks({ session });
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const authenticate = shopify.authenticate;
export const registerWebhooks = shopify.registerWebhooks;
```

### Remix Webhook Routes

```typescript
// app/routes/webhooks.orders.create.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import db from "~/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  switch (topic) {
    case "ORDERS_CREATE":
      await db.order.create({
        data: {
          shopifyId: payload.id.toString(),
          shop,
          orderNumber: payload.order_number,
          totalPrice: parseFloat(payload.total_price),
          financialStatus: payload.financial_status,
          fulfillmentStatus: payload.fulfillment_status,
          customerEmail: payload.customer?.email,
          createdAt: new Date(payload.created_at),
        },
      });
      break;

    default:
      console.log(`Unhandled topic: ${topic}`);
  }

  return new Response(null, { status: 200 });
};

// app/routes/webhooks.customers.data-request.tsx
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  // GDPR: Customer data request
  const { customer, data_request } = payload;

  // Compile customer data
  const customerData = await db.customer.findUnique({
    where: { shopifyId: customer.id.toString(), shop },
    include: { orders: true },
  });

  // Send to customer or queue for processing
  await sendCustomerDataExport(data_request.id, customerData);

  return new Response(null, { status: 200 });
};

// app/routes/webhooks.customers.redact.tsx
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  // GDPR: Delete customer data
  const { customer } = payload;

  await db.customer.delete({
    where: { shopifyId: customer.id.toString(), shop },
  });

  return new Response(null, { status: 200 });
};

// app/routes/webhooks.shop.redact.tsx
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  // GDPR: Shop data redaction (48 hours after uninstall)
  await db.shop.delete({ where: { domain: shop } });
  await db.order.deleteMany({ where: { shop } });
  await db.customer.deleteMany({ where: { shop } });
  await db.product.deleteMany({ where: { shop } });

  return new Response(null, { status: 200 });
};
```

---

## QUEUE-BASED PROCESSING

### BullMQ Implementation

```typescript
// webhooks/queue.ts
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

// Create webhook queue
export const webhookQueue = new Queue('webhooks', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

// Add webhook to queue
export async function queueWebhook(
  topic: string,
  shop: string,
  payload: any,
  webhookId: string
) {
  await webhookQueue.add(
    topic,
    { shop, payload, webhookId },
    {
      jobId: webhookId, // Ensures idempotency
    }
  );
}

// Create worker
export const webhookWorker = new Worker(
  'webhooks',
  async (job: Job) => {
    const { shop, payload, webhookId } = job.data;
    const topic = job.name;

    console.log(`Processing webhook: ${topic}`, { shop, webhookId });

    switch (topic) {
      case 'orders/create':
        await processOrderCreated(shop, payload);
        break;
      case 'orders/paid':
        await processOrderPaid(shop, payload);
        break;
      case 'products/update':
        await processProductUpdated(shop, payload);
        break;
      case 'inventory_levels/update':
        await processInventoryUpdate(shop, payload);
        break;
      default:
        console.log(`Unhandled topic: ${topic}`);
    }
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000,
    },
  }
);

// Event handlers
webhookWorker.on('completed', (job) => {
  console.log(`Webhook processed: ${job.id}`);
});

webhookWorker.on('failed', (job, err) => {
  console.error(`Webhook failed: ${job?.id}`, err);
});

// Updated webhook handler to use queue
export async function handleWebhookRequest(req: Request) {
  const topic = req.headers.get('X-Shopify-Topic')!;
  const shop = req.headers.get('X-Shopify-Shop-Domain')!;
  const webhookId = req.headers.get('X-Shopify-Webhook-Id')!;
  const payload = await req.json();

  // Queue for processing
  await queueWebhook(topic, shop, payload, webhookId);

  // Return immediately
  return new Response('OK', { status: 200 });
}
```

---

## WEBHOOK TESTING

### Local Testing with ngrok

```bash
# Start ngrok tunnel
ngrok http 3000

# Update .env
SHOPIFY_APP_URL=https://xxxxx.ngrok.io

# Test with Shopify CLI
shopify app dev --tunnel-url https://xxxxx.ngrok.io
```

### Testing Utilities

```typescript
// test/webhook-test.ts
import crypto from 'crypto';

export function generateTestWebhook(
  topic: string,
  payload: any,
  secret: string
): { headers: Record<string, string>; body: string } {
  const body = JSON.stringify(payload);
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');

  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Topic': topic,
      'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
      'X-Shopify-Hmac-Sha256': hmac,
      'X-Shopify-Webhook-Id': `test-${Date.now()}`,
      'X-Shopify-API-Version': '2024-01',
      'X-Shopify-Triggered-At': new Date().toISOString(),
    },
    body,
  };
}

// Test order webhook
export const sampleOrderPayload = {
  id: 123456789,
  order_number: 1001,
  email: 'customer@example.com',
  total_price: '199.00',
  subtotal_price: '179.00',
  total_tax: '20.00',
  currency: 'USD',
  financial_status: 'paid',
  fulfillment_status: null,
  customer: {
    id: 987654321,
    email: 'customer@example.com',
    first_name: 'John',
    last_name: 'Doe',
  },
  line_items: [
    {
      id: 111,
      product_id: 222,
      variant_id: 333,
      title: 'Test Product',
      quantity: 2,
      price: '89.50',
    },
  ],
  shipping_address: {
    first_name: 'John',
    last_name: 'Doe',
    address1: '123 Main St',
    city: 'New York',
    province: 'NY',
    country: 'US',
    zip: '10001',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

---

## MANDATORY GDPR WEBHOOKS

Every Shopify app must handle these webhooks:

```typescript
// Required GDPR endpoints for App Store submission

// 1. customers/data_request - Customer requests their data
// Endpoint: /webhooks/customers/data-request
// Action: Compile and send all customer data within 30 days

// 2. customers/redact - Delete customer data
// Endpoint: /webhooks/customers/redact
// Action: Delete customer data (except required financial records)

// 3. shop/redact - Delete shop data (48 hours after uninstall)
// Endpoint: /webhooks/shop/redact
// Action: Delete all data associated with the shop
```

---

## BEST PRACTICES

### 1. Response Time
```typescript
// Always respond within 5 seconds
// Use queues for heavy processing

export async function handler(req: Request) {
  // Validate immediately
  const isValid = validateSignature(req);
  if (!isValid) return new Response('Unauthorized', { status: 401 });

  // Queue and respond
  await queueForProcessing(req);
  return new Response('OK', { status: 200 });
}
```

### 2. Idempotency
```typescript
// Always check webhook ID before processing
const processed = await redis.sismember('processed_webhooks', webhookId);
if (processed) return; // Skip duplicate

await processWebhook(payload);
await redis.sadd('processed_webhooks', webhookId);
await redis.expire('processed_webhooks', 86400 * 7); // 7 days
```

### 3. Retry Logic
```typescript
// Handle Shopify retries (up to 19 times over 48 hours)
// Return 200 to stop retries
// Return 4xx/5xx to continue retries

export async function handler(req: Request) {
  try {
    await processWebhook(req);
    return new Response('OK', { status: 200 });
  } catch (error) {
    if (error instanceof PermanentError) {
      // Don't retry for permanent errors
      console.error('Permanent error:', error);
      return new Response('OK', { status: 200 });
    }
    // Return error to trigger retry
    return new Response('Error', { status: 500 });
  }
}
```

### 4. Monitoring
```typescript
// Track webhook metrics
const metrics = {
  received: new Counter('webhooks_received_total', 'Total webhooks received'),
  processed: new Counter('webhooks_processed_total', 'Total webhooks processed'),
  failed: new Counter('webhooks_failed_total', 'Total webhooks failed'),
  latency: new Histogram('webhook_processing_seconds', 'Processing time'),
};

export async function handler(req: Request) {
  metrics.received.inc({ topic });
  const timer = metrics.latency.startTimer();

  try {
    await processWebhook(req);
    metrics.processed.inc({ topic });
  } catch (error) {
    metrics.failed.inc({ topic });
    throw error;
  } finally {
    timer({ topic });
  }
}
```

---

## INVOCATION

```
/shopify-webhooks
/webhooks
/webhook-handler
```

---

*SHOPIFY.WEBHOOKS.EXE - Never Miss an Event*
