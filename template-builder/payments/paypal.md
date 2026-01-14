# PayPal Integration Template

Production-ready PayPal integration with checkout, subscriptions, payouts, and webhook handling using the PayPal REST API.

## Installation

```bash
npm install @paypal/checkout-server-sdk @paypal/paypal-js @paypal/react-paypal-js
```

## Environment Variables

```env
# PayPal API Credentials
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx

# Environment
PAYPAL_MODE=sandbox  # sandbox or live
PAYPAL_API_URL=https://api-m.sandbox.paypal.com

# Optional Settings
PAYPAL_CURRENCY=USD
PAYPAL_LOCALE=en_US
PAYPAL_BRAND_NAME=MyApp
```

## Project Structure

```
src/
├── lib/
│   └── paypal/
│       ├── index.ts
│       ├── client.ts
│       ├── orders.ts
│       ├── subscriptions.ts
│       ├── payouts.ts
│       └── webhooks.ts
├── components/
│   └── paypal/
│       ├── PayPalProvider.tsx
│       ├── PayPalButtons.tsx
│       ├── PayPalHostedFields.tsx
│       └── PayPalSubscriptionButton.tsx
├── app/
│   ├── api/
│   │   └── paypal/
│   │       ├── create-order/route.ts
│   │       ├── capture-order/route.ts
│   │       └── webhook/route.ts
│   └── actions/
│       └── paypal-actions.ts
└── types/
    └── paypal.ts
```

## Type Definitions

```typescript
// src/types/paypal.ts
export interface PayPalOrder {
  id: string;
  status: PayPalOrderStatus;
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchaseUnits: PurchaseUnit[];
  payer?: Payer;
  createTime: string;
  updateTime: string;
  links: Link[];
}

export type PayPalOrderStatus =
  | 'CREATED'
  | 'SAVED'
  | 'APPROVED'
  | 'VOIDED'
  | 'COMPLETED'
  | 'PAYER_ACTION_REQUIRED';

export interface PurchaseUnit {
  referenceId?: string;
  description?: string;
  customId?: string;
  invoiceId?: string;
  softDescriptor?: string;
  amount: {
    currencyCode: string;
    value: string;
    breakdown?: {
      itemTotal?: Money;
      shipping?: Money;
      handling?: Money;
      taxTotal?: Money;
      discount?: Money;
    };
  };
  items?: OrderItem[];
  shipping?: ShippingInfo;
  payee?: {
    emailAddress?: string;
    merchantId?: string;
  };
}

export interface OrderItem {
  name: string;
  quantity: string;
  unitAmount: Money;
  description?: string;
  sku?: string;
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
}

export interface Money {
  currencyCode: string;
  value: string;
}

export interface Payer {
  name?: {
    givenName: string;
    surname: string;
  };
  emailAddress?: string;
  payerId?: string;
  address?: Address;
}

export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  adminArea1?: string; // State
  adminArea2?: string; // City
  postalCode?: string;
  countryCode: string;
}

export interface ShippingInfo {
  name?: {
    fullName: string;
  };
  address?: Address;
}

export interface Link {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalSubscription {
  id: string;
  status: SubscriptionStatus;
  planId: string;
  startTime: string;
  billingInfo: BillingInfo;
  subscriber: Subscriber;
  links: Link[];
}

export type SubscriptionStatus =
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface BillingInfo {
  outstandingBalance: Money;
  cycleExecutions: CycleExecution[];
  lastPayment?: {
    amount: Money;
    time: string;
  };
  nextBillingTime?: string;
  failedPaymentsCount: number;
}

export interface CycleExecution {
  tenureType: 'REGULAR' | 'TRIAL';
  sequence: number;
  cyclesCompleted: number;
  cyclesRemaining?: number;
  currentPricingScheme?: {
    pricingModel: string;
    price: Money;
  };
  totalCycles?: number;
}

export interface Subscriber {
  name?: {
    givenName: string;
    surname: string;
  };
  emailAddress?: string;
  payerId?: string;
  shippingAddress?: Address;
}

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  items?: OrderItem[];
  description?: string;
  customId?: string;
  shipping?: number;
  tax?: number;
}

export interface PayPalPayout {
  batchHeader: {
    payoutBatchId: string;
    batchStatus: string;
    timeCreated: string;
    senderBatchHeader: {
      senderBatchId: string;
      emailSubject?: string;
    };
    amount: Money;
    fees: Money;
  };
  items: PayoutItem[];
}

export interface PayoutItem {
  payoutItemId: string;
  transactionId?: string;
  transactionStatus: string;
  payoutItemFee: Money;
  payoutBatchId: string;
  payoutItem: {
    recipientType: 'EMAIL' | 'PHONE' | 'PAYPAL_ID';
    amount: Money;
    receiver: string;
    note?: string;
    senderItemId: string;
  };
}
```

## PayPal Client

```typescript
// src/lib/paypal/client.ts
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

let paypalClient: checkoutNodeJssdk.core.PayPalHttpClient | null = null;

export function getPayPalClient(): checkoutNodeJssdk.core.PayPalHttpClient {
  if (!paypalClient) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const environment = mode === 'live'
      ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
      : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);

    paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
  }

  return paypalClient;
}

// Raw API client for endpoints not covered by SDK
export async function paypalApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, any>
): Promise<T> {
  const accessToken = await getAccessToken();
  const baseUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `PayPal API error: ${response.status}`);
  }

  return response.json();
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedAccessToken.token;
}
```

## Order Management

```typescript
// src/lib/paypal/orders.ts
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { getPayPalClient } from './client';
import { PayPalOrder, CreateOrderParams, OrderItem } from '@/types/paypal';

export async function createOrder(params: CreateOrderParams): Promise<PayPalOrder> {
  const client = getPayPalClient();
  const currency = params.currency || process.env.PAYPAL_CURRENCY || 'USD';

  const itemTotal = params.amount;
  const shipping = params.shipping || 0;
  const tax = params.tax || 0;
  const total = itemTotal + shipping + tax;

  const purchaseUnit: any = {
    amount: {
      currency_code: currency,
      value: total.toFixed(2),
      breakdown: {
        item_total: {
          currency_code: currency,
          value: itemTotal.toFixed(2),
        },
      },
    },
  };

  if (shipping > 0) {
    purchaseUnit.amount.breakdown.shipping = {
      currency_code: currency,
      value: shipping.toFixed(2),
    };
  }

  if (tax > 0) {
    purchaseUnit.amount.breakdown.tax_total = {
      currency_code: currency,
      value: tax.toFixed(2),
    };
  }

  if (params.description) {
    purchaseUnit.description = params.description;
  }

  if (params.customId) {
    purchaseUnit.custom_id = params.customId;
  }

  if (params.items && params.items.length > 0) {
    purchaseUnit.items = params.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_amount: {
        currency_code: item.unitAmount.currencyCode,
        value: item.unitAmount.value,
      },
      description: item.description,
      sku: item.sku,
      category: item.category || 'PHYSICAL_GOODS',
    }));
  }

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [purchaseUnit],
    application_context: {
      brand_name: process.env.PAYPAL_BRAND_NAME || 'MyApp',
      locale: process.env.PAYPAL_LOCALE || 'en-US',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
    },
  });

  const response = await client.execute(request);
  return response.result as PayPalOrder;
}

export async function getOrder(orderId: string): Promise<PayPalOrder> {
  const client = getPayPalClient();
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);
  const response = await client.execute(request);
  return response.result as PayPalOrder;
}

export async function captureOrder(orderId: string): Promise<PayPalOrder> {
  const client = getPayPalClient();
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const response = await client.execute(request);
  return response.result as PayPalOrder;
}

export async function authorizeOrder(orderId: string): Promise<PayPalOrder> {
  const client = getPayPalClient();
  const request = new checkoutNodeJssdk.orders.OrdersAuthorizeRequest(orderId);
  request.requestBody({});
  const response = await client.execute(request);
  return response.result as PayPalOrder;
}

export async function captureAuthorization(
  authorizationId: string,
  amount?: { currency: string; value: string }
): Promise<any> {
  const client = getPayPalClient();
  const request = new checkoutNodeJssdk.payments.AuthorizationsCaptureRequest(authorizationId);
  request.requestBody({
    amount: amount,
    final_capture: true,
  });
  const response = await client.execute(request);
  return response.result;
}

export async function voidAuthorization(authorizationId: string): Promise<void> {
  const client = getPayPalClient();
  const request = new checkoutNodeJssdk.payments.AuthorizationsVoidRequest(authorizationId);
  await client.execute(request);
}

export async function refundCapture(
  captureId: string,
  amount?: { currency: string; value: string },
  reason?: string
): Promise<any> {
  const client = getPayPalClient();
  const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(captureId);
  request.requestBody({
    amount: amount,
    note_to_payer: reason,
  });
  const response = await client.execute(request);
  return response.result;
}
```

## Subscription Management

```typescript
// src/lib/paypal/subscriptions.ts
import { paypalApiRequest } from './client';
import { PayPalSubscription } from '@/types/paypal';

export interface CreatePlanParams {
  productId: string;
  name: string;
  description?: string;
  billingCycles: {
    frequency: {
      intervalUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
      intervalCount: number;
    };
    tenureType: 'REGULAR' | 'TRIAL';
    sequence: number;
    totalCycles?: number;
    pricingScheme: {
      fixedPrice: {
        value: string;
        currencyCode: string;
      };
    };
  }[];
  paymentPreferences?: {
    autoBillOutstanding: boolean;
    setupFee?: {
      value: string;
      currencyCode: string;
    };
    setupFeeFailureAction?: 'CONTINUE' | 'CANCEL';
    paymentFailureThreshold?: number;
  };
}

// Create a product first (required for plans)
export async function createProduct(params: {
  name: string;
  description?: string;
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  category?: string;
}): Promise<{ id: string; name: string }> {
  return paypalApiRequest('/v1/catalogs/products', 'POST', {
    name: params.name,
    description: params.description,
    type: params.type,
    category: params.category || 'SOFTWARE',
  });
}

export async function createPlan(params: CreatePlanParams): Promise<{ id: string }> {
  return paypalApiRequest('/v1/billing/plans', 'POST', {
    product_id: params.productId,
    name: params.name,
    description: params.description,
    billing_cycles: params.billingCycles.map((cycle) => ({
      frequency: {
        interval_unit: cycle.frequency.intervalUnit,
        interval_count: cycle.frequency.intervalCount,
      },
      tenure_type: cycle.tenureType,
      sequence: cycle.sequence,
      total_cycles: cycle.totalCycles,
      pricing_scheme: {
        fixed_price: cycle.pricingScheme.fixedPrice,
      },
    })),
    payment_preferences: params.paymentPreferences
      ? {
          auto_bill_outstanding: params.paymentPreferences.autoBillOutstanding,
          setup_fee: params.paymentPreferences.setupFee,
          setup_fee_failure_action: params.paymentPreferences.setupFeeFailureAction,
          payment_failure_threshold: params.paymentPreferences.paymentFailureThreshold,
        }
      : undefined,
  });
}

export async function createSubscription(params: {
  planId: string;
  customId?: string;
  startTime?: string;
  applicationContext?: {
    brandName?: string;
    returnUrl: string;
    cancelUrl: string;
  };
}): Promise<PayPalSubscription> {
  return paypalApiRequest('/v1/billing/subscriptions', 'POST', {
    plan_id: params.planId,
    custom_id: params.customId,
    start_time: params.startTime,
    application_context: params.applicationContext
      ? {
          brand_name: params.applicationContext.brandName,
          return_url: params.applicationContext.returnUrl,
          cancel_url: params.applicationContext.cancelUrl,
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
        }
      : undefined,
  });
}

export async function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  return paypalApiRequest(`/v1/billing/subscriptions/${subscriptionId}`);
}

export async function cancelSubscription(
  subscriptionId: string,
  reason: string
): Promise<void> {
  await paypalApiRequest(
    `/v1/billing/subscriptions/${subscriptionId}/cancel`,
    'POST',
    { reason }
  );
}

export async function suspendSubscription(
  subscriptionId: string,
  reason: string
): Promise<void> {
  await paypalApiRequest(
    `/v1/billing/subscriptions/${subscriptionId}/suspend`,
    'POST',
    { reason }
  );
}

export async function activateSubscription(
  subscriptionId: string,
  reason: string
): Promise<void> {
  await paypalApiRequest(
    `/v1/billing/subscriptions/${subscriptionId}/activate`,
    'POST',
    { reason }
  );
}

export async function reviseSubscription(
  subscriptionId: string,
  planId: string
): Promise<{ links: Array<{ href: string; rel: string }> }> {
  return paypalApiRequest(
    `/v1/billing/subscriptions/${subscriptionId}/revise`,
    'POST',
    { plan_id: planId }
  );
}

export async function getSubscriptionTransactions(
  subscriptionId: string,
  startTime: string,
  endTime: string
): Promise<{ transactions: any[] }> {
  const params = new URLSearchParams({
    start_time: startTime,
    end_time: endTime,
  });

  return paypalApiRequest(
    `/v1/billing/subscriptions/${subscriptionId}/transactions?${params}`
  );
}
```

## Payouts

```typescript
// src/lib/paypal/payouts.ts
import { paypalApiRequest } from './client';
import { PayPalPayout, PayoutItem } from '@/types/paypal';

export interface CreatePayoutParams {
  senderBatchId: string;
  emailSubject?: string;
  emailMessage?: string;
  items: {
    recipientType: 'EMAIL' | 'PHONE' | 'PAYPAL_ID';
    amount: {
      value: string;
      currency: string;
    };
    receiver: string;
    note?: string;
    senderItemId: string;
  }[];
}

export async function createPayout(params: CreatePayoutParams): Promise<PayPalPayout> {
  return paypalApiRequest('/v1/payments/payouts', 'POST', {
    sender_batch_header: {
      sender_batch_id: params.senderBatchId,
      email_subject: params.emailSubject || 'You have a payout!',
      email_message: params.emailMessage,
    },
    items: params.items.map((item) => ({
      recipient_type: item.recipientType,
      amount: {
        value: item.amount.value,
        currency: item.amount.currency,
      },
      receiver: item.receiver,
      note: item.note,
      sender_item_id: item.senderItemId,
    })),
  });
}

export async function getPayout(payoutBatchId: string): Promise<PayPalPayout> {
  return paypalApiRequest(`/v1/payments/payouts/${payoutBatchId}`);
}

export async function getPayoutItem(payoutItemId: string): Promise<PayoutItem> {
  return paypalApiRequest(`/v1/payments/payouts-item/${payoutItemId}`);
}

export async function cancelPayoutItem(payoutItemId: string): Promise<PayoutItem> {
  return paypalApiRequest(
    `/v1/payments/payouts-item/${payoutItemId}/cancel`,
    'POST'
  );
}
```

## Webhook Handler

```typescript
// src/lib/paypal/webhooks.ts
import { paypalApiRequest } from './client';
import crypto from 'crypto';

export interface WebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource: Record<string, any>;
  create_time: string;
  event_version: string;
}

export type WebhookHandler = {
  [eventType: string]: (event: WebhookEvent) => Promise<void>;
};

export async function verifyWebhook(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.warn('PAYPAL_WEBHOOK_ID not set, skipping verification');
    return true;
  }

  try {
    const verificationResponse = await paypalApiRequest<{ verification_status: string }>(
      '/v1/notifications/verify-webhook-signature',
      'POST',
      {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }
    );

    return verificationResponse.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

export async function handleWebhook(
  headers: Record<string, string>,
  body: string,
  handlers: WebhookHandler
): Promise<{ received: boolean; type: string }> {
  const isValid = await verifyWebhook(headers, body);

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  const event: WebhookEvent = JSON.parse(body);
  const handler = handlers[event.event_type];

  if (handler) {
    await handler(event);
  }

  return { received: true, type: event.event_type };
}

export const defaultWebhookHandlers: WebhookHandler = {
  'CHECKOUT.ORDER.APPROVED': async (event) => {
    const orderId = event.resource.id;
    console.log(`Order approved: ${orderId}`);
    // Auto-capture or notify frontend
  },

  'PAYMENT.CAPTURE.COMPLETED': async (event) => {
    const captureId = event.resource.id;
    console.log(`Payment captured: ${captureId}`);
    // Fulfill order, send confirmation
  },

  'PAYMENT.CAPTURE.DENIED': async (event) => {
    const captureId = event.resource.id;
    console.log(`Payment denied: ${captureId}`);
    // Notify customer, update order status
  },

  'PAYMENT.CAPTURE.REFUNDED': async (event) => {
    const captureId = event.resource.id;
    console.log(`Payment refunded: ${captureId}`);
    // Update order status, notify customer
  },

  'BILLING.SUBSCRIPTION.CREATED': async (event) => {
    const subscriptionId = event.resource.id;
    console.log(`Subscription created: ${subscriptionId}`);
  },

  'BILLING.SUBSCRIPTION.ACTIVATED': async (event) => {
    const subscriptionId = event.resource.id;
    console.log(`Subscription activated: ${subscriptionId}`);
    // Grant access
  },

  'BILLING.SUBSCRIPTION.CANCELLED': async (event) => {
    const subscriptionId = event.resource.id;
    console.log(`Subscription cancelled: ${subscriptionId}`);
    // Revoke access
  },

  'BILLING.SUBSCRIPTION.SUSPENDED': async (event) => {
    const subscriptionId = event.resource.id;
    console.log(`Subscription suspended: ${subscriptionId}`);
    // Suspend access
  },

  'PAYMENT.SALE.COMPLETED': async (event) => {
    const saleId = event.resource.id;
    console.log(`Sale completed: ${saleId}`);
    // Process subscription payment
  },
};
```

## React Components

```tsx
// src/components/paypal/PayPalProvider.tsx
'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { ReactNode } from 'react';

interface PayPalProviderProps {
  children: ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    console.error('PayPal Client ID not configured');
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || 'USD',
        intent: 'capture',
        components: 'buttons,hosted-fields',
        vault: true,
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
```

```tsx
// src/components/paypal/PayPalButtons.tsx
'use client';

import { PayPalButtons as PPButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

interface PayPalButtonsProps {
  amount: number;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
  customId?: string;
}

export function PayPalButtons({
  amount,
  onSuccess,
  onError,
  onCancel,
  disabled,
  customId,
}: PayPalButtonsProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return <div className="animate-pulse bg-gray-200 h-12 rounded" />;
  }

  if (isRejected) {
    return (
      <div className="text-red-600 text-sm">
        Failed to load PayPal. Please refresh the page.
      </div>
    );
  }

  return (
    <PPButtons
      disabled={disabled}
      style={{
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 48,
      }}
      createOrder={async () => {
        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, customId }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        return data.orderId;
      }}
      onApprove={async (data) => {
        const response = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID }),
        });

        const details = await response.json();

        if (details.error) {
          onError?.(details.error);
          return;
        }

        onSuccess?.(details);
      }}
      onError={(err) => {
        console.error('PayPal error:', err);
        onError?.(err);
      }}
      onCancel={() => {
        console.log('Payment cancelled');
        onCancel?.();
      }}
    />
  );
}
```

```tsx
// src/components/paypal/PayPalSubscriptionButton.tsx
'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

interface PayPalSubscriptionButtonProps {
  planId: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function PayPalSubscriptionButton({
  planId,
  onSuccess,
  onError,
  onCancel,
  disabled,
}: PayPalSubscriptionButtonProps) {
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending) {
    return <div className="animate-pulse bg-gray-200 h-12 rounded" />;
  }

  return (
    <PayPalButtons
      disabled={disabled}
      style={{
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'subscribe',
      }}
      createSubscription={(data, actions) => {
        return actions.subscription.create({
          plan_id: planId,
        });
      }}
      onApprove={async (data) => {
        console.log('Subscription approved:', data.subscriptionID);

        // Notify backend
        await fetch('/api/paypal/subscription-activated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: data.subscriptionID }),
        });

        onSuccess?.(data.subscriptionID!);
      }}
      onError={(err) => {
        console.error('PayPal subscription error:', err);
        onError?.(err);
      }}
      onCancel={() => {
        onCancel?.();
      }}
    />
  );
}
```

## Server Actions

```typescript
// src/app/actions/paypal-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createOrder, captureOrder, getOrder, refundCapture } from '@/lib/paypal/orders';
import {
  createSubscription,
  getSubscription,
  cancelSubscription,
} from '@/lib/paypal/subscriptions';
import { createPayout, getPayout } from '@/lib/paypal/payouts';

export async function createPayPalOrderAction(
  amount: number,
  customId?: string,
  description?: string
) {
  try {
    const order = await createOrder({
      amount,
      customId,
      description,
    });

    return { orderId: order.id };
  } catch (error) {
    console.error('Create PayPal order error:', error);
    throw new Error('Failed to create order');
  }
}

export async function capturePayPalOrderAction(orderId: string) {
  try {
    const order = await captureOrder(orderId);

    revalidatePath('/orders');

    return {
      status: order.status,
      payerId: order.payer?.payerId,
      purchaseUnits: order.purchaseUnits,
    };
  } catch (error) {
    console.error('Capture PayPal order error:', error);
    throw new Error('Failed to capture order');
  }
}

export async function getPayPalOrderAction(orderId: string) {
  try {
    return await getOrder(orderId);
  } catch (error) {
    console.error('Get PayPal order error:', error);
    throw new Error('Failed to get order');
  }
}

export async function refundPayPalOrderAction(
  captureId: string,
  amount?: number,
  reason?: string
) {
  try {
    const refund = await refundCapture(
      captureId,
      amount
        ? {
            currency: 'USD',
            value: amount.toFixed(2),
          }
        : undefined,
      reason
    );

    revalidatePath('/orders');

    return { refundId: refund.id, status: refund.status };
  } catch (error) {
    console.error('Refund PayPal order error:', error);
    throw new Error('Failed to refund order');
  }
}

export async function createPayPalSubscriptionAction(planId: string) {
  try {
    const subscription = await createSubscription({
      planId,
      applicationContext: {
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      },
    });

    // Find approval URL
    const approvalUrl = subscription.links.find((link) => link.rel === 'approve')?.href;

    return {
      subscriptionId: subscription.id,
      approvalUrl,
    };
  } catch (error) {
    console.error('Create PayPal subscription error:', error);
    throw new Error('Failed to create subscription');
  }
}

export async function getPayPalSubscriptionAction(subscriptionId: string) {
  try {
    return await getSubscription(subscriptionId);
  } catch (error) {
    console.error('Get PayPal subscription error:', error);
    throw new Error('Failed to get subscription');
  }
}

export async function cancelPayPalSubscriptionAction(
  subscriptionId: string,
  reason: string
) {
  try {
    await cancelSubscription(subscriptionId, reason);
    revalidatePath('/account');
    return { success: true };
  } catch (error) {
    console.error('Cancel PayPal subscription error:', error);
    throw new Error('Failed to cancel subscription');
  }
}

export async function createPayPalPayoutAction(params: {
  recipients: Array<{
    email: string;
    amount: number;
    note?: string;
  }>;
}) {
  try {
    const payout = await createPayout({
      senderBatchId: `payout_${Date.now()}`,
      emailSubject: 'You have a payout!',
      items: params.recipients.map((r, i) => ({
        recipientType: 'EMAIL' as const,
        amount: {
          value: r.amount.toFixed(2),
          currency: 'USD',
        },
        receiver: r.email,
        note: r.note,
        senderItemId: `item_${i}_${Date.now()}`,
      })),
    });

    return { payoutBatchId: payout.batchHeader.payoutBatchId };
  } catch (error) {
    console.error('Create PayPal payout error:', error);
    throw new Error('Failed to create payout');
  }
}
```

## API Routes

```typescript
// src/app/api/paypal/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal/orders';

export async function POST(req: NextRequest) {
  try {
    const { amount, customId, description, items } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const order = await createOrder({
      amount,
      customId,
      description,
      items,
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal/orders';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await captureOrder(orderId);

    return NextResponse.json({
      status: order.status,
      orderId: order.id,
      payer: order.payer,
    });
  } catch (error) {
    console.error('Capture order error:', error);
    return NextResponse.json(
      { error: 'Failed to capture order' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/paypal/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook, defaultWebhookHandlers } from '@/lib/paypal/webhooks';

export async function POST(req: NextRequest) {
  const body = await req.text();

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  try {
    const result = await handleWebhook(body, headers, {
      ...defaultWebhookHandlers,
      // Add custom handlers here
    });

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

## Testing

```typescript
// __tests__/paypal.test.ts
import { createOrder, captureOrder, getOrder } from '@/lib/paypal/orders';

describe('PayPal Orders', () => {
  let orderId: string;

  it('should create an order', async () => {
    const order = await createOrder({
      amount: 29.99,
      description: 'Test Order',
      customId: 'test_123',
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('CREATED');
    orderId = order.id;
  });

  it('should retrieve an order', async () => {
    const order = await getOrder(orderId);
    expect(order.id).toBe(orderId);
  });
});
```

## CLAUDE.md Integration

```markdown
# PayPal Integration

## Payment Flow
1. Create order on server
2. Return order ID to frontend
3. User approves in PayPal popup
4. Capture order on approval
5. Handle webhook for fulfillment

## Environment
- PAYPAL_MODE: sandbox for testing, live for production
- Sandbox accounts at developer.paypal.com

## Key Files
- `src/lib/paypal/client.ts` - PayPal client setup
- `src/lib/paypal/orders.ts` - Order creation and capture
- `src/lib/paypal/subscriptions.ts` - Recurring billing
- `src/lib/paypal/webhooks.ts` - Webhook handling

## Webhooks
Register webhook at PayPal Developer Dashboard:
- CHECKOUT.ORDER.APPROVED
- PAYMENT.CAPTURE.COMPLETED
- BILLING.SUBSCRIPTION.* events

## Testing
- Use sandbox credentials
- Test buyer: sb-buyer@example.com
- Test credit card: provided in sandbox dashboard
```

## AI Suggestions

1. **Add PayPal Vault** - Save payment methods for returning customers
2. **Implement Pay Later** - Enable PayPal Pay in 4 and Pay Monthly
3. **Add Venmo support** - Enable Venmo as payment method
4. **Implement Advanced Credit Cards** - Use hosted fields for PCI compliance
5. **Add multi-currency support** - Handle international transactions
6. **Implement order tracking** - Share shipping info with PayPal
7. **Add seller protection** - Implement transaction verification
8. **Implement dispute handling** - API for managing disputes
9. **Add Payouts to cards** - Support instant payouts to debit cards
10. **Implement Reference Transactions** - Billing agreements for future charges
