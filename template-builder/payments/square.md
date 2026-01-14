# Square Payments Template

Production-ready Square integration with payments, catalog management, inventory, and point-of-sale features.

## Installation

```bash
npm install square
```

## Environment Variables

```env
# Square API Credentials
SQUARE_ACCESS_TOKEN=xxx
SQUARE_APPLICATION_ID=xxx
SQUARE_LOCATION_ID=xxx
SQUARE_ENVIRONMENT=sandbox  # sandbox or production

# Webhook Settings
SQUARE_WEBHOOK_SIGNATURE_KEY=xxx

# Optional
SQUARE_CURRENCY=USD
```

## Project Structure

```
src/
├── lib/
│   └── square/
│       ├── index.ts
│       ├── client.ts
│       ├── payments.ts
│       ├── customers.ts
│       ├── catalog.ts
│       ├── inventory.ts
│       ├── orders.ts
│       └── webhooks.ts
├── components/
│   └── square/
│       ├── SquarePaymentForm.tsx
│       └── SquareGiftCard.tsx
├── app/
│   ├── api/
│   │   └── square/
│   │       ├── create-payment/route.ts
│       │   ├── process-payment/route.ts
│   │       └── webhook/route.ts
│   └── actions/
│       └── square-actions.ts
└── types/
    └── square.ts
```

## Type Definitions

```typescript
// src/types/square.ts
import { Money, Card, Customer, Order, CatalogObject, InventoryCount } from 'square';

export interface CreatePaymentParams {
  sourceId: string;  // Card nonce from Web Payments SDK
  amount: number;
  currency?: string;
  customerId?: string;
  orderId?: string;
  note?: string;
  referenceId?: string;
  verificationToken?: string;
  autocomplete?: boolean;
  locationId?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  receiptUrl?: string;
  error?: string;
}

export interface CreateCustomerParams {
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  referenceId?: string;
  note?: string;
  companyName?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;  // City
    administrativeDistrictLevel1?: string;  // State
    postalCode?: string;
    country?: string;
  };
}

export interface CreateOrderParams {
  lineItems: {
    name?: string;
    quantity: string;
    catalogObjectId?: string;
    variationName?: string;
    basePriceMoney?: {
      amount: bigint;
      currency: string;
    };
    note?: string;
  }[];
  customerId?: string;
  referenceId?: string;
  fulfillments?: {
    type: 'PICKUP' | 'SHIPMENT' | 'DELIVERY';
    state?: string;
    pickupDetails?: {
      recipient?: {
        displayName?: string;
        emailAddress?: string;
        phoneNumber?: string;
      };
      scheduleType?: 'SCHEDULED' | 'ASAP';
      pickupAt?: string;
      note?: string;
    };
    shipmentDetails?: {
      recipient?: {
        displayName?: string;
        emailAddress?: string;
        phoneNumber?: string;
      };
      carrier?: string;
      shippingNote?: string;
      expectedShippedAt?: string;
    };
  }[];
  discounts?: {
    name: string;
    percentage?: string;
    amountMoney?: { amount: bigint; currency: string };
    scope: 'ORDER' | 'LINE_ITEM';
  }[];
  taxes?: {
    name: string;
    percentage: string;
    scope: 'ORDER' | 'LINE_ITEM';
  }[];
}

export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  variations: {
    id: string;
    name: string;
    sku?: string;
    price: number;
    currency: string;
  }[];
  imageIds?: string[];
  modifiers?: string[];
}

export interface InventoryAdjustment {
  catalogObjectId: string;
  locationId: string;
  quantity: string;
  fromState?: string;
  toState: 'IN_STOCK' | 'SOLD' | 'WASTE' | 'NONE';
  reason?: string;
}
```

## Square Client

```typescript
// src/lib/square/client.ts
import { Client, Environment } from 'square';

let squareClient: Client | null = null;

export function getSquareClient(): Client {
  if (!squareClient) {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox;

    if (!accessToken) {
      throw new Error('SQUARE_ACCESS_TOKEN is not set');
    }

    squareClient = new Client({
      accessToken,
      environment,
    });
  }

  return squareClient;
}

export function getLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error('SQUARE_LOCATION_ID is not set');
  }
  return locationId;
}

// Convert dollars to cents (Square uses smallest currency unit)
export function toCents(amount: number): bigint {
  return BigInt(Math.round(amount * 100));
}

// Convert cents to dollars
export function fromCents(amount: bigint): number {
  return Number(amount) / 100;
}

// Generate idempotency key
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

## Payment Processing

```typescript
// src/lib/square/payments.ts
import { getSquareClient, getLocationId, toCents, generateIdempotencyKey, fromCents } from './client';
import { CreatePaymentParams, PaymentResult } from '@/types/square';

export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const client = getSquareClient();
  const locationId = params.locationId || getLocationId();
  const currency = params.currency || process.env.SQUARE_CURRENCY || 'USD';

  try {
    const result = await client.paymentsApi.createPayment({
      sourceId: params.sourceId,
      idempotencyKey: generateIdempotencyKey(),
      amountMoney: {
        amount: toCents(params.amount),
        currency,
      },
      locationId,
      customerId: params.customerId,
      orderId: params.orderId,
      note: params.note,
      referenceId: params.referenceId,
      verificationToken: params.verificationToken,
      autocomplete: params.autocomplete !== false,
    });

    const payment = result.result.payment;

    return {
      success: payment?.status === 'COMPLETED',
      paymentId: payment?.id,
      status: payment?.status,
      receiptUrl: payment?.receiptUrl,
    };
  } catch (error: any) {
    console.error('Square payment error:', error);

    const errors = error.result?.errors || [];
    const errorMessage = errors[0]?.detail || 'Payment failed';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getPayment(paymentId: string) {
  const client = getSquareClient();

  const result = await client.paymentsApi.getPayment(paymentId);
  return result.result.payment;
}

export async function completePayment(paymentId: string) {
  const client = getSquareClient();

  const result = await client.paymentsApi.completePayment(paymentId, {});
  return result.result.payment;
}

export async function cancelPayment(paymentId: string) {
  const client = getSquareClient();

  const result = await client.paymentsApi.cancelPayment(paymentId);
  return result.result.payment;
}

export async function refundPayment(
  paymentId: string,
  amount?: number,
  reason?: string
) {
  const client = getSquareClient();

  const payment = await getPayment(paymentId);

  const refundParams: any = {
    idempotencyKey: generateIdempotencyKey(),
    paymentId,
    reason,
  };

  if (amount) {
    refundParams.amountMoney = {
      amount: toCents(amount),
      currency: payment?.amountMoney?.currency || 'USD',
    };
  } else {
    refundParams.amountMoney = payment?.amountMoney;
  }

  const result = await client.refundsApi.refundPayment(refundParams);
  return result.result.refund;
}

export async function listPayments(params?: {
  beginTime?: string;
  endTime?: string;
  sortOrder?: 'ASC' | 'DESC';
  cursor?: string;
  limit?: number;
}) {
  const client = getSquareClient();
  const locationId = getLocationId();

  const result = await client.paymentsApi.listPayments(
    params?.beginTime,
    params?.endTime,
    params?.sortOrder,
    params?.cursor,
    locationId,
    undefined,
    undefined,
    params?.limit
  );

  return {
    payments: result.result.payments || [],
    cursor: result.result.cursor,
  };
}

// Create card-on-file for customer
export async function createCard(
  customerId: string,
  sourceId: string,
  cardholderName?: string
) {
  const client = getSquareClient();

  const result = await client.cardsApi.createCard({
    idempotencyKey: generateIdempotencyKey(),
    sourceId,
    card: {
      customerId,
      cardholderName,
    },
  });

  return result.result.card;
}

export async function listCustomerCards(customerId: string) {
  const client = getSquareClient();

  const result = await client.cardsApi.listCards(
    undefined,
    customerId,
    undefined,
    undefined
  );

  return result.result.cards || [];
}

export async function disableCard(cardId: string) {
  const client = getSquareClient();
  const result = await client.cardsApi.disableCard(cardId);
  return result.result.card;
}
```

## Customer Management

```typescript
// src/lib/square/customers.ts
import { getSquareClient, generateIdempotencyKey } from './client';
import { CreateCustomerParams } from '@/types/square';

export async function createCustomer(params: CreateCustomerParams) {
  const client = getSquareClient();

  const result = await client.customersApi.createCustomer({
    idempotencyKey: generateIdempotencyKey(),
    givenName: params.givenName,
    familyName: params.familyName,
    emailAddress: params.emailAddress,
    phoneNumber: params.phoneNumber,
    referenceId: params.referenceId,
    note: params.note,
    companyName: params.companyName,
    address: params.address,
  });

  return result.result.customer;
}

export async function getCustomer(customerId: string) {
  const client = getSquareClient();

  const result = await client.customersApi.retrieveCustomer(customerId);
  return result.result.customer;
}

export async function updateCustomer(customerId: string, params: Partial<CreateCustomerParams>) {
  const client = getSquareClient();

  const result = await client.customersApi.updateCustomer(customerId, {
    givenName: params.givenName,
    familyName: params.familyName,
    emailAddress: params.emailAddress,
    phoneNumber: params.phoneNumber,
    note: params.note,
    companyName: params.companyName,
    address: params.address,
  });

  return result.result.customer;
}

export async function searchCustomers(params: {
  query?: string;
  email?: string;
  phoneNumber?: string;
  referenceId?: string;
  limit?: number;
  cursor?: string;
}) {
  const client = getSquareClient();

  const filters: any = {};

  if (params.email) {
    filters.emailAddress = { exact: params.email };
  }
  if (params.phoneNumber) {
    filters.phoneNumber = { exact: params.phoneNumber };
  }
  if (params.referenceId) {
    filters.referenceId = { exact: params.referenceId };
  }

  const searchParams: any = {
    limit: params.limit || 50,
    cursor: params.cursor,
  };

  if (Object.keys(filters).length > 0 || params.query) {
    searchParams.query = {
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      sort: {
        field: 'CREATED_AT',
        order: 'DESC',
      },
    };
  }

  const result = await client.customersApi.searchCustomers(searchParams);

  return {
    customers: result.result.customers || [],
    cursor: result.result.cursor,
  };
}

export async function deleteCustomer(customerId: string) {
  const client = getSquareClient();
  await client.customersApi.deleteCustomer(customerId);
}

// Customer groups
export async function addCustomerToGroup(customerId: string, groupId: string) {
  const client = getSquareClient();

  await client.customersApi.addGroupToCustomer(customerId, groupId);
}

export async function removeCustomerFromGroup(customerId: string, groupId: string) {
  const client = getSquareClient();

  await client.customersApi.removeGroupFromCustomer(customerId, groupId);
}
```

## Catalog Management

```typescript
// src/lib/square/catalog.ts
import { getSquareClient, generateIdempotencyKey, toCents, fromCents } from './client';
import { CatalogItem } from '@/types/square';

export async function listCatalogItems(params?: {
  types?: ('ITEM' | 'CATEGORY' | 'TAX' | 'DISCOUNT' | 'MODIFIER_LIST')[];
  cursor?: string;
}) {
  const client = getSquareClient();

  const result = await client.catalogApi.listCatalog(
    params?.cursor,
    params?.types?.join(',')
  );

  return {
    objects: result.result.objects || [],
    cursor: result.result.cursor,
  };
}

export async function getCatalogItem(objectId: string) {
  const client = getSquareClient();

  const result = await client.catalogApi.retrieveCatalogObject(objectId, true);
  return result.result.object;
}

export async function searchCatalogItems(params: {
  textFilter?: string;
  categoryIds?: string[];
  productTypes?: string[];
  cursor?: string;
  limit?: number;
}) {
  const client = getSquareClient();

  const result = await client.catalogApi.searchCatalogItems({
    textFilter: params.textFilter,
    categoryIds: params.categoryIds,
    productTypes: params.productTypes,
    cursor: params.cursor,
    limit: params.limit,
  });

  return {
    items: result.result.items || [],
    cursor: result.result.cursor,
  };
}

export async function createCatalogItem(params: {
  name: string;
  description?: string;
  categoryId?: string;
  variations: {
    name: string;
    sku?: string;
    price: number;
    currency?: string;
  }[];
}) {
  const client = getSquareClient();
  const currency = process.env.SQUARE_CURRENCY || 'USD';

  const result = await client.catalogApi.upsertCatalogObject({
    idempotencyKey: generateIdempotencyKey(),
    object: {
      type: 'ITEM',
      id: `#item_${Date.now()}`,
      itemData: {
        name: params.name,
        description: params.description,
        categoryId: params.categoryId,
        variations: params.variations.map((v, i) => ({
          type: 'ITEM_VARIATION',
          id: `#variation_${Date.now()}_${i}`,
          itemVariationData: {
            name: v.name,
            sku: v.sku,
            pricingType: 'FIXED_PRICING',
            priceMoney: {
              amount: toCents(v.price),
              currency: v.currency || currency,
            },
          },
        })),
      },
    },
  });

  return result.result.catalogObject;
}

export async function updateCatalogItem(
  objectId: string,
  version: bigint,
  updates: {
    name?: string;
    description?: string;
  }
) {
  const client = getSquareClient();

  const currentItem = await getCatalogItem(objectId);

  const result = await client.catalogApi.upsertCatalogObject({
    idempotencyKey: generateIdempotencyKey(),
    object: {
      type: 'ITEM',
      id: objectId,
      version,
      itemData: {
        ...currentItem?.itemData,
        name: updates.name || currentItem?.itemData?.name,
        description: updates.description || currentItem?.itemData?.description,
      },
    },
  });

  return result.result.catalogObject;
}

export async function deleteCatalogItem(objectId: string) {
  const client = getSquareClient();

  const result = await client.catalogApi.deleteCatalogObject(objectId);
  return result.result.deletedObjectIds;
}

// Categories
export async function createCategory(name: string, parentCategoryId?: string) {
  const client = getSquareClient();

  const result = await client.catalogApi.upsertCatalogObject({
    idempotencyKey: generateIdempotencyKey(),
    object: {
      type: 'CATEGORY',
      id: `#category_${Date.now()}`,
      categoryData: {
        name,
        parentCategory: parentCategoryId
          ? { id: parentCategoryId }
          : undefined,
      },
    },
  });

  return result.result.catalogObject;
}

// Images
export async function createCatalogImage(
  objectId: string,
  imageUrl: string,
  caption?: string
) {
  const client = getSquareClient();

  const result = await client.catalogApi.upsertCatalogObject({
    idempotencyKey: generateIdempotencyKey(),
    object: {
      type: 'IMAGE',
      id: `#image_${Date.now()}`,
      imageData: {
        url: imageUrl,
        caption,
      },
    },
  });

  // Link image to item
  const image = result.result.catalogObject;
  if (image) {
    await client.catalogApi.updateItemModifierLists({
      itemIds: [objectId],
      imageIdsToEnable: [image.id],
    });
  }

  return image;
}

// Helper to convert catalog object to our format
export function formatCatalogItem(object: any): CatalogItem {
  const item = object.itemData;

  return {
    id: object.id,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
    variations: (item.variations || []).map((v: any) => ({
      id: v.id,
      name: v.itemVariationData.name,
      sku: v.itemVariationData.sku,
      price: fromCents(v.itemVariationData.priceMoney?.amount || BigInt(0)),
      currency: v.itemVariationData.priceMoney?.currency || 'USD',
    })),
    imageIds: item.imageIds,
    modifiers: item.modifierListInfo?.map((m: any) => m.modifierListId),
  };
}
```

## Inventory Management

```typescript
// src/lib/square/inventory.ts
import { getSquareClient, generateIdempotencyKey, getLocationId } from './client';
import { InventoryAdjustment } from '@/types/square';

export async function getInventoryCounts(
  catalogObjectIds: string[],
  locationId?: string
) {
  const client = getSquareClient();
  const location = locationId || getLocationId();

  const result = await client.inventoryApi.batchRetrieveInventoryCounts({
    catalogObjectIds,
    locationIds: [location],
  });

  return result.result.counts || [];
}

export async function adjustInventory(
  adjustments: InventoryAdjustment[]
) {
  const client = getSquareClient();

  const result = await client.inventoryApi.batchChangeInventory({
    idempotencyKey: generateIdempotencyKey(),
    changes: adjustments.map((adj) => ({
      type: 'ADJUSTMENT',
      adjustment: {
        catalogObjectId: adj.catalogObjectId,
        locationId: adj.locationId,
        quantity: adj.quantity,
        fromState: adj.fromState || 'NONE',
        toState: adj.toState,
        occurredAt: new Date().toISOString(),
      },
    })),
  });

  return result.result.counts || [];
}

export async function setInventoryCount(
  catalogObjectId: string,
  quantity: string,
  locationId?: string
) {
  const client = getSquareClient();
  const location = locationId || getLocationId();

  const result = await client.inventoryApi.batchChangeInventory({
    idempotencyKey: generateIdempotencyKey(),
    changes: [
      {
        type: 'PHYSICAL_COUNT',
        physicalCount: {
          catalogObjectId,
          locationId: location,
          quantity,
          state: 'IN_STOCK',
          occurredAt: new Date().toISOString(),
        },
      },
    ],
  });

  return result.result.counts?.[0];
}

export async function transferInventory(params: {
  catalogObjectId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: string;
}) {
  const client = getSquareClient();

  const result = await client.inventoryApi.batchChangeInventory({
    idempotencyKey: generateIdempotencyKey(),
    changes: [
      {
        type: 'TRANSFER',
        transfer: {
          catalogObjectId: params.catalogObjectId,
          fromLocationId: params.fromLocationId,
          toLocationId: params.toLocationId,
          quantity: params.quantity,
          occurredAt: new Date().toISOString(),
        },
      },
    ],
  });

  return result.result.counts || [];
}

// Get inventory adjustment history
export async function getInventoryHistory(
  catalogObjectId: string,
  locationId?: string
) {
  const client = getSquareClient();
  const location = locationId || getLocationId();

  const result = await client.inventoryApi.retrieveInventoryChanges(
    catalogObjectId,
    location
  );

  return result.result.changes || [];
}

// Low stock alerts
export async function getLowStockItems(threshold = 10) {
  const client = getSquareClient();
  const locationId = getLocationId();

  // Get all items
  const catalogResult = await client.catalogApi.searchCatalogItems({
    productTypes: ['REGULAR'],
  });

  const items = catalogResult.result.items || [];
  const variationIds = items
    .flatMap((item) => item.itemData?.variations || [])
    .map((v) => v.id);

  if (variationIds.length === 0) return [];

  // Get inventory counts
  const inventoryResult = await client.inventoryApi.batchRetrieveInventoryCounts({
    catalogObjectIds: variationIds.filter(Boolean) as string[],
    locationIds: [locationId],
  });

  const counts = inventoryResult.result.counts || [];

  // Find low stock
  return counts.filter((count) => {
    const quantity = parseInt(count.quantity || '0');
    return quantity <= threshold && quantity >= 0;
  });
}
```

## Order Management

```typescript
// src/lib/square/orders.ts
import { getSquareClient, getLocationId, generateIdempotencyKey, toCents } from './client';
import { CreateOrderParams } from '@/types/square';

export async function createOrder(params: CreateOrderParams) {
  const client = getSquareClient();
  const locationId = getLocationId();

  const result = await client.ordersApi.createOrder({
    idempotencyKey: generateIdempotencyKey(),
    order: {
      locationId,
      customerId: params.customerId,
      referenceId: params.referenceId,
      lineItems: params.lineItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        catalogObjectId: item.catalogObjectId,
        variationName: item.variationName,
        basePriceMoney: item.basePriceMoney,
        note: item.note,
      })),
      fulfillments: params.fulfillments,
      discounts: params.discounts?.map((d) => ({
        name: d.name,
        percentage: d.percentage,
        amountMoney: d.amountMoney,
        scope: d.scope,
      })),
      taxes: params.taxes?.map((t) => ({
        name: t.name,
        percentage: t.percentage,
        scope: t.scope,
      })),
    },
  });

  return result.result.order;
}

export async function getOrder(orderId: string) {
  const client = getSquareClient();

  const result = await client.ordersApi.retrieveOrder(orderId);
  return result.result.order;
}

export async function updateOrder(
  orderId: string,
  version: number,
  updates: {
    state?: 'OPEN' | 'COMPLETED' | 'CANCELED';
    fulfillments?: any[];
  }
) {
  const client = getSquareClient();
  const locationId = getLocationId();

  const result = await client.ordersApi.updateOrder(orderId, {
    idempotencyKey: generateIdempotencyKey(),
    order: {
      locationId,
      version,
      state: updates.state,
      fulfillments: updates.fulfillments,
    },
  });

  return result.result.order;
}

export async function payOrder(
  orderId: string,
  paymentIds: string[]
) {
  const client = getSquareClient();

  const result = await client.ordersApi.payOrder(orderId, {
    idempotencyKey: generateIdempotencyKey(),
    paymentIds,
  });

  return result.result.order;
}

export async function searchOrders(params?: {
  customerId?: string;
  states?: ('OPEN' | 'COMPLETED' | 'CANCELED')[];
  startAt?: string;
  endAt?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  cursor?: string;
}) {
  const client = getSquareClient();
  const locationId = getLocationId();

  const filters: any = {};

  if (params?.customerId) {
    filters.customerFilter = {
      customerIds: [params.customerId],
    };
  }

  if (params?.states) {
    filters.stateFilter = {
      states: params.states,
    };
  }

  if (params?.startAt || params?.endAt) {
    filters.dateTimeFilter = {
      createdAt: {
        startAt: params.startAt,
        endAt: params.endAt,
      },
    };
  }

  const result = await client.ordersApi.searchOrders({
    locationIds: [locationId],
    query: {
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      sort: {
        sortField: 'CREATED_AT',
        sortOrder: params?.sortOrder || 'DESC',
      },
    },
    limit: params?.limit,
    cursor: params?.cursor,
  });

  return {
    orders: result.result.orders || [],
    cursor: result.result.cursor,
  };
}

// Calculate order totals
export async function calculateOrder(params: CreateOrderParams) {
  const client = getSquareClient();
  const locationId = getLocationId();

  const result = await client.ordersApi.calculateOrder({
    order: {
      locationId,
      lineItems: params.lineItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        catalogObjectId: item.catalogObjectId,
        basePriceMoney: item.basePriceMoney,
      })),
      discounts: params.discounts,
      taxes: params.taxes,
    },
  });

  return result.result.order;
}
```

## Webhook Handler

```typescript
// src/lib/square/webhooks.ts
import crypto from 'crypto';

export interface SquareWebhookEvent {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: Record<string, any>;
  };
}

export type WebhookHandler = {
  [eventType: string]: (event: SquareWebhookEvent) => Promise<void>;
};

export function verifyWebhookSignature(
  body: string,
  signature: string,
  signatureKey: string,
  notificationUrl: string
): boolean {
  const combined = notificationUrl + body;
  const expectedSignature = crypto
    .createHmac('sha256', signatureKey)
    .update(combined)
    .digest('base64');

  return signature === expectedSignature;
}

export async function handleWebhook(
  body: string,
  signature: string,
  handlers: WebhookHandler
): Promise<{ received: boolean; type: string }> {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/webhook`;

  if (signatureKey) {
    const isValid = verifyWebhookSignature(body, signature, signatureKey, webhookUrl);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
  }

  const event: SquareWebhookEvent = JSON.parse(body);
  const handler = handlers[event.type];

  if (handler) {
    await handler(event);
  }

  return { received: true, type: event.type };
}

export const defaultWebhookHandlers: WebhookHandler = {
  'payment.completed': async (event) => {
    const payment = event.data.object.payment;
    console.log(`Payment completed: ${payment.id}`);
    // Fulfill order, send confirmation
  },

  'payment.updated': async (event) => {
    const payment = event.data.object.payment;
    console.log(`Payment updated: ${payment.id}, status: ${payment.status}`);
  },

  'refund.created': async (event) => {
    const refund = event.data.object.refund;
    console.log(`Refund created: ${refund.id}`);
  },

  'order.created': async (event) => {
    const order = event.data.object.order;
    console.log(`Order created: ${order.id}`);
  },

  'order.updated': async (event) => {
    const order = event.data.object.order;
    console.log(`Order updated: ${order.id}, state: ${order.state}`);
  },

  'order.fulfillment.updated': async (event) => {
    const order = event.data.object.order;
    console.log(`Fulfillment updated for order: ${order.id}`);
  },

  'inventory.count.updated': async (event) => {
    const inventoryCount = event.data.object.inventory_count;
    console.log(`Inventory updated: ${inventoryCount.catalog_object_id}`);
    // Check for low stock
  },

  'customer.created': async (event) => {
    const customer = event.data.object.customer;
    console.log(`Customer created: ${customer.id}`);
  },

  'catalog.version.updated': async (event) => {
    console.log('Catalog updated');
    // Sync catalog changes
  },
};
```

## React Components

```tsx
// src/components/square/SquarePaymentForm.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Square: any;
  }
}

interface SquarePaymentFormProps {
  applicationId: string;
  locationId: string;
  amount: number;
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: any) => void;
}

export function SquarePaymentForm({
  applicationId,
  locationId,
  amount,
  onPaymentSuccess,
  onPaymentError,
}: SquarePaymentFormProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadSquare = async () => {
      if (!window.Square) {
        const script = document.createElement('script');
        script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
        script.onload = initializeCard;
        document.body.appendChild(script);
      } else {
        await initializeCard();
      }
    };

    const initializeCard = async () => {
      try {
        const payments = window.Square.payments(applicationId, locationId);
        const cardInstance = await payments.card();
        await cardInstance.attach(cardRef.current);
        setCard(cardInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Square initialization error:', error);
        onPaymentError(error);
        setIsLoading(false);
      }
    };

    loadSquare();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, [applicationId, locationId]);

  const handlePayment = async () => {
    if (!card) return;

    setIsProcessing(true);

    try {
      const result = await card.tokenize();

      if (result.status === 'OK') {
        // Send token to server
        const response = await fetch('/api/square/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            amount,
          }),
        });

        const data = await response.json();

        if (data.success) {
          onPaymentSuccess(data);
        } else {
          onPaymentError(data.error);
        }
      } else {
        onPaymentError(result.errors);
      }
    } catch (error) {
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="min-h-[100px] border rounded-lg p-4"
      />

      {isLoading && (
        <div className="text-center text-gray-500">Loading payment form...</div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading || isProcessing || !card}
        className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium
                   hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </div>
  );
}
```

## Server Actions

```typescript
// src/app/actions/square-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createPayment, refundPayment, listPayments } from '@/lib/square/payments';
import { createCustomer, searchCustomers } from '@/lib/square/customers';
import { createOrder, searchOrders } from '@/lib/square/orders';
import { searchCatalogItems, createCatalogItem } from '@/lib/square/catalog';
import { getInventoryCounts, adjustInventory } from '@/lib/square/inventory';

export async function processPaymentAction(
  sourceId: string,
  amount: number,
  customerId?: string
) {
  try {
    const result = await createPayment({
      sourceId,
      amount,
      customerId,
    });

    if (result.success) {
      revalidatePath('/orders');
    }

    return result;
  } catch (error) {
    console.error('Process payment error:', error);
    throw new Error('Failed to process payment');
  }
}

export async function refundPaymentAction(
  paymentId: string,
  amount?: number,
  reason?: string
) {
  try {
    const refund = await refundPayment(paymentId, amount, reason);
    revalidatePath('/orders');
    return { refundId: refund?.id, status: refund?.status };
  } catch (error) {
    console.error('Refund payment error:', error);
    throw new Error('Failed to refund payment');
  }
}

export async function createCustomerAction(params: {
  email: string;
  givenName?: string;
  familyName?: string;
  phone?: string;
}) {
  try {
    const customer = await createCustomer({
      emailAddress: params.email,
      givenName: params.givenName,
      familyName: params.familyName,
      phoneNumber: params.phone,
    });

    return { customerId: customer?.id };
  } catch (error) {
    console.error('Create customer error:', error);
    throw new Error('Failed to create customer');
  }
}

export async function searchProductsAction(query: string) {
  try {
    const { items } = await searchCatalogItems({ textFilter: query });
    return items;
  } catch (error) {
    console.error('Search products error:', error);
    throw new Error('Failed to search products');
  }
}

export async function getInventoryAction(catalogObjectIds: string[]) {
  try {
    return await getInventoryCounts(catalogObjectIds);
  } catch (error) {
    console.error('Get inventory error:', error);
    throw new Error('Failed to get inventory');
  }
}

export async function adjustInventoryAction(
  catalogObjectId: string,
  quantity: number,
  reason?: string
) {
  try {
    const { SQUARE_LOCATION_ID } = process.env;

    const counts = await adjustInventory([
      {
        catalogObjectId,
        locationId: SQUARE_LOCATION_ID!,
        quantity: Math.abs(quantity).toString(),
        toState: quantity > 0 ? 'IN_STOCK' : 'SOLD',
        reason,
      },
    ]);

    revalidatePath('/inventory');
    return counts;
  } catch (error) {
    console.error('Adjust inventory error:', error);
    throw new Error('Failed to adjust inventory');
  }
}
```

## API Routes

```typescript
// src/app/api/square/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/square/payments';

export async function POST(req: NextRequest) {
  try {
    const { sourceId, amount, customerId } = await req.json();

    if (!sourceId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createPayment({
      sourceId,
      amount,
      customerId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Process payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', success: false },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/square/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook, defaultWebhookHandlers } from '@/lib/square/webhooks';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-square-hmacsha256-signature') || '';

  try {
    const result = await handleWebhook(body, signature, defaultWebhookHandlers);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
```

## CLAUDE.md Integration

```markdown
# Square Payments

## Setup
1. Create Square Developer account
2. Get API credentials from Developer Dashboard
3. Set SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID

## Features
- One-time payments with Web Payments SDK
- Customer management with card-on-file
- Catalog and inventory management
- Order creation and fulfillment

## Web Payments SDK
- Load from CDN: web.squarecdn.com/v1/square.js
- Use sandbox URL for testing
- Tokenize card before sending to server

## Key Files
- `src/lib/square/client.ts` - Square client setup
- `src/lib/square/payments.ts` - Payment processing
- `src/lib/square/catalog.ts` - Product catalog
- `src/lib/square/inventory.ts` - Inventory management

## Testing
- Use sandbox credentials
- Test card: 4532 0155 5296 0764
- CVV: 111, Expiry: any future date
```

## AI Suggestions

1. **Add Square Terminal integration** - Support in-person payments with Square Terminal
2. **Implement loyalty program** - Use Square Loyalty API for rewards
3. **Add gift cards** - Square Gift Cards API integration
4. **Implement subscriptions** - Recurring billing with Square Subscriptions
5. **Add Apple Pay / Google Pay** - Digital wallet support via Web Payments SDK
6. **Implement invoicing** - Send invoices via Square Invoices API
7. **Add team management** - Square Team API for employee management
8. **Implement disputes handling** - Manage chargebacks via Disputes API
9. **Add reporting** - Square Reporting API for financial reports
10. **Implement OAuth** - Allow merchants to connect their Square accounts
