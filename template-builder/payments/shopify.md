# Shopify Integration Template

A comprehensive Shopify integration supporting storefront API, admin API, webhooks, checkout extensions, and headless commerce.

## Installation

```bash
npm install @shopify/shopify-api @shopify/storefront-api-client graphql-request zod
```

## Environment Variables

```env
# Shopify Store
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_...
SHOPIFY_API_SECRET_KEY=...
SHOPIFY_API_VERSION=2024-01

# Webhooks
SHOPIFY_WEBHOOK_SECRET=...

# App (for Shopify apps)
SHOPIFY_API_KEY=...
SHOPIFY_APP_URL=https://your-app.com
```

## Project Structure

```
lib/
├── shopify/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── client.ts             # API clients
│   ├── storefront/
│   │   ├── products.ts       # Product queries
│   │   ├── collections.ts    # Collection queries
│   │   ├── cart.ts           # Cart operations
│   │   └── customer.ts       # Customer operations
│   ├── admin/
│   │   ├── products.ts       # Product management
│   │   ├── orders.ts         # Order management
│   │   ├── customers.ts      # Customer management
│   │   ├── inventory.ts      # Inventory management
│   │   └── fulfillment.ts    # Fulfillment operations
│   ├── webhooks/
│   │   ├── handler.ts        # Webhook handler
│   │   └── events.ts         # Event handlers
│   └── utils.ts              # Utility functions
components/
├── shopify/
│   ├── ProductCard.tsx       # Product display
│   ├── ProductGrid.tsx       # Product grid
│   ├── CartDrawer.tsx        # Cart drawer
│   ├── AddToCart.tsx         # Add to cart button
│   ├── VariantSelector.tsx   # Variant picker
│   └── CollectionList.tsx    # Collections
app/
├── shop/
│   ├── page.tsx              # Shop home
│   ├── products/
│   │   ├── page.tsx          # Products list
│   │   └── [handle]/
│   │       └── page.tsx      # Product detail
│   ├── collections/
│   │   └── [handle]/
│   │       └── page.tsx      # Collection page
│   └── cart/
│       └── page.tsx          # Cart page
├── api/
│   └── shopify/
│       ├── cart/
│       │   └── route.ts      # Cart operations
│       ├── checkout/
│       │   └── route.ts      # Create checkout
│       └── webhooks/
│           └── route.ts      # Webhook handler
```

## Type Definitions

```typescript
// lib/shopify/types.ts
export interface ShopifyImage {
  id: string;
  url: string;
  altText?: string;
  width: number;
  height: number;
}

export interface ShopifyPrice {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number;
  price: ShopifyPrice;
  compareAtPrice?: ShopifyPrice;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  image?: ShopifyImage;
  sku?: string;
  barcode?: string;
  weight?: number;
  weightUnit?: string;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: ShopifyPrice;
    maxVariantPrice: ShopifyPrice;
  };
  compareAtPriceRange?: {
    minVariantPrice: ShopifyPrice;
    maxVariantPrice: ShopifyPrice;
  };
  images: {
    edges: { node: ShopifyImage }[];
  };
  variants: {
    edges: { node: ShopifyProductVariant }[];
  };
  options: {
    id: string;
    name: string;
    values: string[];
  }[];
  seo?: {
    title?: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  image?: ShopifyImage;
  products: {
    edges: { node: ShopifyProduct }[];
    pageInfo: PageInfo;
  };
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: ShopifyProductVariant & {
    product: Pick<ShopifyProduct, 'id' | 'handle' | 'title' | 'images'>;
  };
  cost: {
    totalAmount: ShopifyPrice;
    amountPerQuantity: ShopifyPrice;
    compareAtAmountPerQuantity?: ShopifyPrice;
  };
  attributes: { key: string; value: string }[];
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyPrice;
    totalAmount: ShopifyPrice;
    totalTaxAmount?: ShopifyPrice;
    totalDutyAmount?: ShopifyPrice;
  };
  lines: {
    edges: { node: ShopifyCartLine }[];
  };
  discountCodes: {
    code: string;
    applicable: boolean;
  }[];
  discountAllocations: {
    discountedAmount: ShopifyPrice;
  }[];
  buyerIdentity: {
    email?: string;
    phone?: string;
    countryCode?: string;
    customer?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
  attributes: { key: string; value: string }[];
  note?: string;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  phone?: string;
  acceptsMarketing: boolean;
  defaultAddress?: ShopifyAddress;
  addresses: {
    edges: { node: ShopifyAddress }[];
  };
  orders: {
    edges: { node: ShopifyOrder }[];
    pageInfo: PageInfo;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  provinceCode?: string;
  country: string;
  countryCode: string;
  zip: string;
  phone?: string;
  formatted: string[];
}

export interface ShopifyOrder {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  fulfillmentStatus: string;
  financialStatus: string;
  currentTotalPrice: ShopifyPrice;
  currentSubtotalPrice: ShopifyPrice;
  currentTotalTax: ShopifyPrice;
  totalShippingPrice: ShopifyPrice;
  lineItems: {
    edges: { node: ShopifyLineItem }[];
  };
  shippingAddress?: ShopifyAddress;
  successfulFulfillments?: {
    trackingCompany?: string;
    trackingInfo: {
      number?: string;
      url?: string;
    }[];
  }[];
  statusUrl: string;
}

export interface ShopifyLineItem {
  title: string;
  quantity: number;
  variant?: ShopifyProductVariant;
  originalTotalPrice: ShopifyPrice;
  discountedTotalPrice: ShopifyPrice;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}
```

## Shopify Client

```typescript
// lib/shopify/client.ts
import { createStorefrontApiClient, StorefrontApiClient } from '@shopify/storefront-api-client';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Storefront API Client
let storefrontClient: StorefrontApiClient | null = null;

export function getStorefrontClient(): StorefrontApiClient {
  if (!storefrontClient) {
    storefrontClient = createStorefrontApiClient({
      storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
      publicAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    });
  }
  return storefrontClient;
}

// Admin API Client
export function getAdminClient() {
  const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY || '',
    scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
    hostName: process.env.SHOPIFY_APP_URL?.replace('https://', '') || 'localhost',
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: false,
  });

  const session = {
    shop: process.env.SHOPIFY_STORE_DOMAIN!,
    accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!,
  };

  return new shopify.clients.Graphql({ session: session as any });
}

// REST Admin Client (for some operations)
export async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors || 'Admin API request failed');
  }

  return response.json();
}
```

## Storefront API Operations

```typescript
// lib/shopify/storefront/products.ts
import { getStorefrontClient } from '../client';
import type { ShopifyProduct, PageInfo } from '../types';

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            id
            url
            altText
            width
            height
          }
          sku
          barcode
        }
      }
    }
    options {
      id
      name
      values
    }
    seo {
      title
      description
    }
    createdAt
    updatedAt
  }
`;

export async function getProducts(options: {
  first?: number;
  after?: string;
  query?: string;
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'UPDATED';
  reverse?: boolean;
} = {}): Promise<{ products: ShopifyProduct[]; pageInfo: PageInfo }> {
  const { first = 20, after, query, sortKey, reverse } = options;

  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${PRODUCT_FRAGMENT}
    query GetProducts(
      $first: Int!
      $after: String
      $query: String
      $sortKey: ProductSortKeys
      $reverse: Boolean
    ) {
      products(
        first: $first
        after: $after
        query: $query
        sortKey: $sortKey
        reverse: $reverse
      ) {
        edges {
          node {
            ...ProductFields
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `, {
    variables: { first, after, query, sortKey, reverse },
  });

  return {
    products: data.products.edges.map((edge: any) => edge.node),
    pageInfo: data.products.pageInfo,
  };
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${PRODUCT_FRAGMENT}
    query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        ...ProductFields
      }
    }
  `, {
    variables: { handle },
  });

  return data.productByHandle;
}

export async function getProductById(id: string): Promise<ShopifyProduct | null> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${PRODUCT_FRAGMENT}
    query GetProductById($id: ID!) {
      product(id: $id) {
        ...ProductFields
      }
    }
  `, {
    variables: { id },
  });

  return data.product;
}

export async function getProductRecommendations(
  productId: string
): Promise<ShopifyProduct[]> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${PRODUCT_FRAGMENT}
    query GetProductRecommendations($productId: ID!) {
      productRecommendations(productId: $productId) {
        ...ProductFields
      }
    }
  `, {
    variables: { productId },
  });

  return data.productRecommendations || [];
}

export async function searchProducts(
  query: string,
  options: { first?: number; productFilters?: any[] } = {}
): Promise<{ products: ShopifyProduct[]; totalCount: number }> {
  const { first = 20, productFilters = [] } = options;

  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${PRODUCT_FRAGMENT}
    query SearchProducts($query: String!, $first: Int!, $productFilters: [ProductFilter!]) {
      search(
        query: $query
        first: $first
        types: [PRODUCT]
        productFilters: $productFilters
      ) {
        totalCount
        edges {
          node {
            ... on Product {
              ...ProductFields
            }
          }
        }
      }
    }
  `, {
    variables: { query, first, productFilters },
  });

  return {
    products: data.search.edges.map((edge: any) => edge.node),
    totalCount: data.search.totalCount,
  };
}
```

## Cart Operations

```typescript
// lib/shopify/storefront/cart.ts
import { getStorefrontClient } from '../client';
import type { ShopifyCart } from '../types';

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
              product {
                id
                handle
                title
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
              }
              selectedOptions {
                name
                value
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
            compareAtAmountPerQuantity {
              amount
              currencyCode
            }
          }
          attributes {
            key
            value
          }
        }
      }
    }
    discountCodes {
      code
      applicable
    }
    discountAllocations {
      discountedAmount {
        amount
        currencyCode
      }
    }
    buyerIdentity {
      email
      phone
      countryCode
      customer {
        id
        email
        firstName
        lastName
      }
    }
    attributes {
      key
      value
    }
    note
  }
`;

export async function createCart(
  lines?: { merchandiseId: string; quantity: number }[],
  buyerIdentity?: {
    email?: string;
    countryCode?: string;
    customerAccessToken?: string;
  }
): Promise<ShopifyCart> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${CART_FRAGMENT}
    mutation CreateCart($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      input: {
        lines: lines || [],
        buyerIdentity,
      },
    },
  });

  if (data.cartCreate.userErrors?.length > 0) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }

  return data.cartCreate.cart;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${CART_FRAGMENT}
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        ...CartFields
      }
    }
  `, {
    variables: { cartId },
  });

  return data.cart;
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }[]
): Promise<ShopifyCart> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${CART_FRAGMENT}
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: { cartId, lines },
  });

  if (data.cartLinesAdd.userErrors?.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }

  return data.cartLinesAdd.cart;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${CART_FRAGMENT}
    mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      cartId,
      lines: [{ id: lineId, quantity }],
    },
  });

  if (data.cartLinesUpdate.userErrors?.length > 0) {
    throw new Error(data.cartLinesUpdate.userErrors[0].message);
  }

  return data.cartLinesUpdate.cart;
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${CART_FRAGMENT}
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: { cartId, lineIds },
  });

  if (data.cartLinesRemove.userErrors?.length > 0) {
    throw new Error(data.cartLinesRemove.userErrors[0].message);
  }

  return data.cartLinesRemove.cart;
}

export async function applyDiscountCode(
  cartId: string,
  discountCode: string
): Promise<ShopifyCart> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${CART_FRAGMENT}
    mutation ApplyDiscountCode($cartId: ID!, $discountCodes: [String!]!) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: { cartId, discountCodes: [discountCode] },
  });

  if (data.cartDiscountCodesUpdate.userErrors?.length > 0) {
    throw new Error(data.cartDiscountCodesUpdate.userErrors[0].message);
  }

  return data.cartDiscountCodesUpdate.cart;
}

export async function removeDiscountCode(
  cartId: string
): Promise<ShopifyCart> {
  return applyDiscountCode(cartId, '');
}

export async function updateCartNote(
  cartId: string,
  note: string
): Promise<ShopifyCart> {
  const client = getStorefrontClient();

  const { data } = await client.request(`
    ${CART_FRAGMENT}
    mutation UpdateCartNote($cartId: ID!, $note: String!) {
      cartNoteUpdate(cartId: $cartId, note: $note) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: { cartId, note },
  });

  if (data.cartNoteUpdate.userErrors?.length > 0) {
    throw new Error(data.cartNoteUpdate.userErrors[0].message);
  }

  return data.cartNoteUpdate.cart;
}
```

## Admin API Operations

```typescript
// lib/shopify/admin/orders.ts
import { adminFetch, getAdminClient } from '../client';

interface AdminOrder {
  id: number;
  admin_graphql_api_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  processed_at: string;
  fulfillment_status: string | null;
  financial_status: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  currency: string;
  line_items: {
    id: number;
    title: string;
    quantity: number;
    price: string;
    variant_id: number | null;
    variant_title: string | null;
    sku: string | null;
    fulfillment_status: string | null;
  }[];
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };
  customer?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  note?: string;
  tags: string;
}

export async function getOrders(options: {
  limit?: number;
  status?: 'any' | 'open' | 'closed' | 'cancelled';
  financialStatus?: 'any' | 'paid' | 'unpaid' | 'refunded' | 'partially_refunded';
  fulfillmentStatus?: 'any' | 'fulfilled' | 'unfulfilled' | 'partial';
  sinceId?: number;
  createdAtMin?: Date;
  createdAtMax?: Date;
} = {}): Promise<{ orders: AdminOrder[] }> {
  const params = new URLSearchParams();

  if (options.limit) params.append('limit', String(options.limit));
  if (options.status) params.append('status', options.status);
  if (options.financialStatus) params.append('financial_status', options.financialStatus);
  if (options.fulfillmentStatus) params.append('fulfillment_status', options.fulfillmentStatus);
  if (options.sinceId) params.append('since_id', String(options.sinceId));
  if (options.createdAtMin) params.append('created_at_min', options.createdAtMin.toISOString());
  if (options.createdAtMax) params.append('created_at_max', options.createdAtMax.toISOString());

  return adminFetch<{ orders: AdminOrder[] }>(`orders.json?${params}`);
}

export async function getOrder(orderId: number): Promise<{ order: AdminOrder }> {
  return adminFetch<{ order: AdminOrder }>(`orders/${orderId}.json`);
}

export async function updateOrder(
  orderId: number,
  updates: Partial<{ note: string; tags: string; email: string }>
): Promise<{ order: AdminOrder }> {
  return adminFetch<{ order: AdminOrder }>(`orders/${orderId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ order: updates }),
  });
}

export async function cancelOrder(
  orderId: number,
  options?: {
    reason?: 'customer' | 'fraud' | 'inventory' | 'declined' | 'other';
    email?: boolean;
    refund?: boolean;
  }
): Promise<{ order: AdminOrder }> {
  return adminFetch<{ order: AdminOrder }>(`orders/${orderId}/cancel.json`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

export async function closeOrder(orderId: number): Promise<{ order: AdminOrder }> {
  return adminFetch<{ order: AdminOrder }>(`orders/${orderId}/close.json`, {
    method: 'POST',
  });
}

export async function reopenOrder(orderId: number): Promise<{ order: AdminOrder }> {
  return adminFetch<{ order: AdminOrder }>(`orders/${orderId}/open.json`, {
    method: 'POST',
  });
}

export async function createFulfillment(
  orderId: number,
  lineItems: { id: number; quantity: number }[],
  trackingInfo?: {
    company: string;
    number: string;
    url?: string;
  },
  notifyCustomer: boolean = true
): Promise<any> {
  return adminFetch(`orders/${orderId}/fulfillments.json`, {
    method: 'POST',
    body: JSON.stringify({
      fulfillment: {
        line_items: lineItems,
        tracking_company: trackingInfo?.company,
        tracking_number: trackingInfo?.number,
        tracking_url: trackingInfo?.url,
        notify_customer: notifyCustomer,
      },
    }),
  });
}
```

## Webhook Handler

```typescript
// lib/shopify/webhooks/handler.ts
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

type WebhookHandler = (topic: string, shop: string, body: any) => Promise<void>;

const handlers: Map<string, WebhookHandler[]> = new Map();

export function registerWebhook(topic: string, handler: WebhookHandler): void {
  const existing = handlers.get(topic) || [];
  existing.push(handler);
  handlers.set(topic, existing);
}

export function verifyWebhook(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('No webhook secret configured');
    return false;
  }

  const generatedHmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHmac),
    Buffer.from(hmacHeader)
  );
}

export async function processWebhook(request: NextRequest): Promise<{
  success: boolean;
  message: string;
}> {
  const body = await request.text();
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic');
  const shop = request.headers.get('x-shopify-shop-domain');

  if (!hmacHeader || !topic || !shop) {
    return { success: false, message: 'Missing required headers' };
  }

  if (!verifyWebhook(body, hmacHeader)) {
    return { success: false, message: 'Invalid signature' };
  }

  const payload = JSON.parse(body);
  const topicHandlers = handlers.get(topic) || [];

  if (topicHandlers.length === 0) {
    console.log(`No handlers registered for topic: ${topic}`);
    return { success: true, message: 'No handlers for topic' };
  }

  for (const handler of topicHandlers) {
    try {
      await handler(topic, shop, payload);
    } catch (error) {
      console.error(`Webhook handler error for ${topic}:`, error);
      return { success: false, message: 'Handler error' };
    }
  }

  return { success: true, message: 'Webhook processed' };
}
```

```typescript
// lib/shopify/webhooks/events.ts
import { registerWebhook } from './handler';

// Order webhooks
registerWebhook('orders/create', async (topic, shop, order) => {
  console.log('New order:', order.name);

  // Create order record in your database
  // await db.orders.create({
  //   data: {
  //     shopifyId: order.id,
  //     orderNumber: order.name,
  //     email: order.email,
  //     total: parseFloat(order.total_price),
  //     status: 'pending',
  //   },
  // });

  // Send notification
  // await sendNewOrderNotification(order);
});

registerWebhook('orders/paid', async (topic, shop, order) => {
  console.log('Order paid:', order.name);

  // Update order status
  // await db.orders.update({
  //   where: { shopifyId: order.id },
  //   data: { status: 'paid', paidAt: new Date() },
  // });
});

registerWebhook('orders/fulfilled', async (topic, shop, order) => {
  console.log('Order fulfilled:', order.name);

  // Update order status
  // await db.orders.update({
  //   where: { shopifyId: order.id },
  //   data: { status: 'fulfilled', fulfilledAt: new Date() },
  // });

  // Send shipping notification
  // await sendShippingNotification(order);
});

registerWebhook('orders/cancelled', async (topic, shop, order) => {
  console.log('Order cancelled:', order.name);

  // Update order status
  // await db.orders.update({
  //   where: { shopifyId: order.id },
  //   data: { status: 'cancelled', cancelledAt: new Date() },
  // });
});

// Refund webhooks
registerWebhook('refunds/create', async (topic, shop, refund) => {
  console.log('Refund created:', refund.id);

  // Create refund record
  // await db.refunds.create({
  //   data: {
  //     shopifyId: refund.id,
  //     orderId: refund.order_id,
  //     amount: parseFloat(refund.transactions[0]?.amount || '0'),
  //     status: 'completed',
  //   },
  // });
});

// Product webhooks
registerWebhook('products/create', async (topic, shop, product) => {
  console.log('Product created:', product.title);

  // Sync product to your catalog
  // await syncProduct(product);
});

registerWebhook('products/update', async (topic, shop, product) => {
  console.log('Product updated:', product.title);

  // Update product in your catalog
  // await syncProduct(product);
});

registerWebhook('products/delete', async (topic, shop, product) => {
  console.log('Product deleted:', product.id);

  // Remove product from your catalog
  // await db.products.delete({ where: { shopifyId: product.id } });
});

// Customer webhooks
registerWebhook('customers/create', async (topic, shop, customer) => {
  console.log('Customer created:', customer.email);

  // Sync customer to your database
  // await syncCustomer(customer);
});

registerWebhook('customers/update', async (topic, shop, customer) => {
  console.log('Customer updated:', customer.email);

  // Update customer in your database
  // await syncCustomer(customer);
});

// Inventory webhooks
registerWebhook('inventory_levels/update', async (topic, shop, inventory) => {
  console.log('Inventory updated:', inventory.inventory_item_id);

  // Update inventory tracking
  // await updateInventoryLevel(inventory);
});
```

## React Components

```tsx
// components/shopify/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ShopifyProduct } from '@/lib/shopify/types';
import { formatPrice } from '@/lib/shopify/utils';
import { AddToCartButton } from './AddToCart';

interface ProductCardProps {
  product: ShopifyProduct;
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const image = product.images.edges[0]?.node;
  const price = product.priceRange.minVariantPrice;
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice;
  const hasDiscount =
    compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

  const firstVariant = product.variants.edges[0]?.node;

  return (
    <div className="group relative">
      <Link href={`/shop/products/${product.handle}`}>
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.title}
              width={image.width}
              height={image.height}
              className="object-cover object-center group-hover:opacity-75 transition-opacity"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
            {product.title}
          </h3>

          {product.vendor && (
            <p className="text-sm text-gray-500">{product.vendor}</p>
          )}

          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(price.amount, price.currencyCode)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {showAddToCart && firstVariant && product.availableForSale && (
        <div className="mt-3">
          <AddToCartButton
            variantId={firstVariant.id}
            availableForSale={firstVariant.availableForSale}
          />
        </div>
      )}

      {!product.availableForSale && (
        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
          Sold out
        </div>
      )}

      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          Sale
        </div>
      )}
    </div>
  );
}
```

```tsx
// components/shopify/AddToCart.tsx
'use client';

import { useState, useTransition } from 'react';
import { ShoppingCartIcon, PlusIcon } from 'lucide-react';
import { useCart } from '@/hooks/useShopifyCart';

interface AddToCartButtonProps {
  variantId: string;
  availableForSale: boolean;
  quantity?: number;
  className?: string;
}

export function AddToCartButton({
  variantId,
  availableForSale,
  quantity = 1,
  className = '',
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { addItem } = useCart();

  const handleAddToCart = () => {
    startTransition(async () => {
      await addItem(variantId, quantity);
    });
  };

  if (!availableForSale) {
    return (
      <button
        disabled
        className={`w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed ${className}`}
      >
        Sold Out
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isPending}
      className={`
        w-full py-2 px-4 bg-blue-600 text-white rounded-md
        hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait
        flex items-center justify-center gap-2 transition-colors
        ${className}
      `}
    >
      {isPending ? (
        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <>
          <PlusIcon className="w-4 h-4" />
          Add to Cart
        </>
      )}
    </button>
  );
}
```

```tsx
// components/shopify/CartDrawer.tsx
'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { XIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from 'lucide-react';
import { useCart } from '@/hooks/useShopifyCart';
import { formatPrice } from '@/lib/shopify/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, updateItem, removeItem, isLoading } = useCart();

  if (!isOpen) return null;

  const lines = cart?.lines.edges.map((e) => e.node) || [];
  const isEmpty = lines.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5" />
            Shopping Cart
            {cart && cart.totalQuantity > 0 && (
              <span className="text-sm text-gray-500">
                ({cart.totalQuantity} items)
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBagIcon className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={onClose}
                className="text-blue-600 hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => {
                const product = line.merchandise.product;
                const image = product.images.edges[0]?.node;

                return (
                  <li key={line.id} className="flex gap-4">
                    {image && (
                      <Image
                        src={image.url}
                        alt={image.altText || product.title}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                    )}

                    <div className="flex-1">
                      <Link
                        href={`/shop/products/${product.handle}`}
                        onClick={onClose}
                        className="font-medium hover:text-blue-600"
                      >
                        {product.title}
                      </Link>

                      {line.merchandise.selectedOptions.length > 0 && (
                        <p className="text-sm text-gray-500">
                          {line.merchandise.selectedOptions
                            .map((o) => o.value)
                            .join(' / ')}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() =>
                              updateItem(line.id, Math.max(0, line.quantity - 1))
                            }
                            disabled={isLoading}
                            className="p-1 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="px-3 text-sm">{line.quantity}</span>
                          <button
                            onClick={() => updateItem(line.id, line.quantity + 1)}
                            disabled={isLoading}
                            className="p-1 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="font-medium">
                          {formatPrice(
                            line.cost.totalAmount.amount,
                            line.cost.totalAmount.currencyCode
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(line.id)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && cart && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal</span>
              <span>
                {formatPrice(
                  cart.cost.subtotalAmount.amount,
                  cart.cost.subtotalAmount.currencyCode
                )}
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Shipping and taxes calculated at checkout.
            </p>

            <a
              href={cart.checkoutUrl}
              className="block w-full py-3 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700"
            >
              Checkout
            </a>
          </div>
        )}
      </div>
    </>
  );
}
```

## API Routes

```typescript
// app/api/shopify/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createCart,
  getCart,
  addToCart,
  updateCartLine,
  removeFromCart,
  applyDiscountCode,
} from '@/lib/shopify/storefront/cart';

export async function GET(request: NextRequest) {
  try {
    const cartId = request.nextUrl.searchParams.get('cartId');

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 });
    }

    const cart = await getCart(cartId);
    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, cartId, ...data } = await request.json();

    let cart;

    switch (action) {
      case 'create':
        cart = await createCart(data.lines, data.buyerIdentity);
        break;

      case 'add':
        if (!cartId) {
          cart = await createCart(data.lines);
        } else {
          cart = await addToCart(cartId, data.lines);
        }
        break;

      case 'update':
        cart = await updateCartLine(cartId, data.lineId, data.quantity);
        break;

      case 'remove':
        cart = await removeFromCart(cartId, data.lineIds);
        break;

      case 'discount':
        cart = await applyDiscountCode(cartId, data.discountCode);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Cart action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cart action failed' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/shopify/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/lib/shopify/webhooks/handler';
import '@/lib/shopify/webhooks/events'; // Register handlers

export async function POST(request: NextRequest) {
  const result = await processWebhook(request);

  if (result.success) {
    return NextResponse.json(result);
  }

  return NextResponse.json(result, { status: 400 });
}
```

## Utility Functions

```typescript
// lib/shopify/utils.ts
export function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function getIdFromGid(gid: string): string {
  return gid.split('/').pop() || gid;
}

export function createGid(type: 'Product' | 'ProductVariant' | 'Collection', id: string): string {
  return `gid://shopify/${type}/${id}`;
}

export function parseShopifyId(gid: string): { type: string; id: string } | null {
  const match = gid.match(/gid:\/\/shopify\/(\w+)\/(\d+)/);
  if (match) {
    return { type: match[1], id: match[2] };
  }
  return null;
}

export function isDiscounted(price: string, compareAtPrice?: string): boolean {
  if (!compareAtPrice) return false;
  return parseFloat(compareAtPrice) > parseFloat(price);
}

export function calculateDiscountPercentage(
  price: string,
  compareAtPrice: string
): number {
  const priceNum = parseFloat(price);
  const compareNum = parseFloat(compareAtPrice);
  return Math.round(((compareNum - priceNum) / compareNum) * 100);
}
```

## CLAUDE.md Integration

```markdown
## Shopify Integration

### Commands
- `npm run dev` - Start development server
- `npm run test` - Run tests

### Key Files
- `lib/shopify/client.ts` - API client setup
- `lib/shopify/storefront/` - Storefront API operations
- `lib/shopify/admin/` - Admin API operations
- `lib/shopify/webhooks/` - Webhook handlers

### APIs Used
- **Storefront API** - Products, collections, cart, checkout
- **Admin API** - Orders, customers, inventory, fulfillment

### Cart Flow
1. Create cart (or use existing)
2. Add/update/remove items
3. Apply discount codes
4. Redirect to Shopify checkout

### Webhooks
Register handlers in `lib/shopify/webhooks/events.ts`
Endpoint: POST `/api/shopify/webhooks`

### Environment Setup
Required tokens:
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - For storefront operations
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN` - For admin operations
```

## AI Suggestions

1. **Product Sync** - Background job to sync Shopify products to local database for faster queries
2. **Inventory Alerts** - Monitor inventory levels and send alerts when stock is low
3. **Order Fulfillment** - Automated fulfillment integration with shipping providers
4. **Customer Segments** - Build customer segments based on purchase history
5. **Abandoned Cart Recovery** - Track and recover abandoned carts with email reminders
6. **Multi-Store Support** - Handle multiple Shopify stores in single application
7. **Draft Orders** - Create draft orders for custom/B2B pricing
8. **Metafield Support** - Read/write product and customer metafields
9. **Real-time Inventory** - WebSocket connection for real-time inventory updates
10. **Price Rules** - Create and manage discount codes and price rules programmatically
