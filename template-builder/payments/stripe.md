# Stripe Payments Template

Production-ready Stripe integration with one-time payments, payment intents, customer management, and webhook handling.

## Installation

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install @types/stripe
```

## Environment Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional Settings
STRIPE_API_VERSION=2023-10-16
STRIPE_APP_INFO_NAME=MyApp
STRIPE_APP_INFO_VERSION=1.0.0

# Currency & Region
STRIPE_DEFAULT_CURRENCY=usd
STRIPE_ACCOUNT_COUNTRY=US
```

## Project Structure

```
src/
├── lib/
│   └── stripe/
│       ├── index.ts
│       ├── client.ts
│       ├── server.ts
│       ├── customers.ts
│       ├── payments.ts
│       ├── payment-methods.ts
│       └── webhooks.ts
├── components/
│   └── payments/
│       ├── StripeProvider.tsx
│       ├── PaymentForm.tsx
│       ├── CardElement.tsx
│       ├── PaymentStatus.tsx
│       └── SavedCards.tsx
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── create-payment-intent/route.ts
│   │       ├── create-customer/route.ts
│   │       └── webhook/route.ts
│   └── actions/
│       └── stripe-actions.ts
└── types/
    └── stripe.ts
```

## Type Definitions

```typescript
// src/types/stripe.ts
import Stripe from 'stripe';

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  description?: string;
  receiptEmail?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
  automaticPaymentMethods?: boolean;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  address?: Stripe.AddressParam;
  paymentMethod?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  status?: Stripe.PaymentIntent.Status;
  error?: string;
}

export interface CustomerWithPaymentMethods {
  customer: Stripe.Customer;
  paymentMethods: Stripe.PaymentMethod[];
  defaultPaymentMethod?: Stripe.PaymentMethod;
}

export interface WebhookEvent {
  type: string;
  data: {
    object: Stripe.PaymentIntent | Stripe.Customer | Stripe.Invoice | Stripe.Charge;
  };
}

export interface PaymentElementOptions {
  layout?: 'tabs' | 'accordion' | 'auto';
  paymentMethodOrder?: string[];
  defaultValues?: {
    billingDetails?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        country?: string;
        postal_code?: string;
      };
    };
  };
  business?: {
    name?: string;
  };
  terms?: {
    card?: 'auto' | 'always' | 'never';
  };
}
```

## Stripe Server Client

```typescript
// src/lib/stripe/server.ts
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
      appInfo: {
        name: process.env.STRIPE_APP_INFO_NAME || 'MyApp',
        version: process.env.STRIPE_APP_INFO_VERSION || '1.0.0',
      },
      maxNetworkRetries: 3,
      timeout: 30000,
    });
  }

  return stripeInstance;
}

// Helper to format amounts for Stripe (convert to cents)
export function formatAmountForStripe(amount: number, currency: string): number {
  const zeroDecimalCurrencies = [
    'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
    'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'
  ];

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
}

// Helper to format amounts from Stripe (convert from cents)
export function formatAmountFromStripe(amount: number, currency: string): number {
  const zeroDecimalCurrencies = [
    'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
    'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'
  ];

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }

  return amount / 100;
}
```

## Customer Management

```typescript
// src/lib/stripe/customers.ts
import Stripe from 'stripe';
import { getStripe } from './server';
import { CreateCustomerParams, CustomerWithPaymentMethods } from '@/types/stripe';

export async function createCustomer(
  params: CreateCustomerParams
): Promise<Stripe.Customer> {
  const stripe = getStripe();

  const customerData: Stripe.CustomerCreateParams = {
    email: params.email,
    name: params.name,
    phone: params.phone,
    metadata: params.metadata,
    address: params.address,
  };

  // Attach payment method if provided
  if (params.paymentMethod) {
    customerData.payment_method = params.paymentMethod;
    customerData.invoice_settings = {
      default_payment_method: params.paymentMethod,
    };
  }

  return stripe.customers.create(customerData);
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  const stripe = getStripe();

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function getCustomerByEmail(
  email: string
): Promise<Stripe.Customer | null> {
  const stripe = getStripe();

  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  return customers.data[0] || null;
}

export async function updateCustomer(
  customerId: string,
  params: Partial<CreateCustomerParams>
): Promise<Stripe.Customer> {
  const stripe = getStripe();

  return stripe.customers.update(customerId, {
    email: params.email,
    name: params.name,
    phone: params.phone,
    metadata: params.metadata,
    address: params.address,
  });
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.customers.del(customerId);
}

export async function getCustomerWithPaymentMethods(
  customerId: string
): Promise<CustomerWithPaymentMethods | null> {
  const stripe = getStripe();

  const customer = await getCustomer(customerId);
  if (!customer) return null;

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  const defaultPaymentMethodId =
    typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id;

  const defaultPaymentMethod = defaultPaymentMethodId
    ? paymentMethods.data.find(pm => pm.id === defaultPaymentMethodId)
    : undefined;

  return {
    customer,
    paymentMethods: paymentMethods.data,
    defaultPaymentMethod,
  };
}

export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  const stripe = getStripe();

  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}
```

## Payment Intent Management

```typescript
// src/lib/stripe/payments.ts
import Stripe from 'stripe';
import { getStripe, formatAmountForStripe } from './server';
import { CreatePaymentIntentParams, PaymentResult } from '@/types/stripe';

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  const currency = params.currency || process.env.STRIPE_DEFAULT_CURRENCY || 'usd';

  const intentParams: Stripe.PaymentIntentCreateParams = {
    amount: formatAmountForStripe(params.amount, currency),
    currency,
    metadata: params.metadata || {},
    description: params.description,
    receipt_email: params.receiptEmail,
  };

  // Customer and saved payment method
  if (params.customerId) {
    intentParams.customer = params.customerId;
  }

  if (params.paymentMethodId) {
    intentParams.payment_method = params.paymentMethodId;
  }

  // Enable automatic payment methods or specific payment method types
  if (params.automaticPaymentMethods !== false) {
    intentParams.automatic_payment_methods = { enabled: true };
  }

  // Setup for future usage (save card)
  if (params.setupFutureUsage) {
    intentParams.setup_future_usage = params.setupFutureUsage;
  }

  return stripe.paymentIntents.create(intentParams);
}

export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  const stripe = getStripe();

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<PaymentResult> {
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment confirmation failed',
    };
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string,
  reason?: Stripe.PaymentIntentCancelParams.CancellationReason
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  return stripe.paymentIntents.cancel(paymentIntentId, {
    cancellation_reason: reason,
  });
}

export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  return stripe.paymentIntents.capture(paymentIntentId, {
    amount_to_capture: amountToCapture,
  });
}

export async function listPaymentIntents(
  customerId?: string,
  limit = 10
): Promise<Stripe.PaymentIntent[]> {
  const stripe = getStripe();

  const params: Stripe.PaymentIntentListParams = { limit };

  if (customerId) {
    params.customer = customerId;
  }

  const paymentIntents = await stripe.paymentIntents.list(params);
  return paymentIntents.data;
}

// Refund a payment
export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  const stripe = getStripe();

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
}
```

## Payment Method Management

```typescript
// src/lib/stripe/payment-methods.ts
import Stripe from 'stripe';
import { getStripe } from './server';

export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  const stripe = getStripe();

  return stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  const stripe = getStripe();
  return stripe.paymentMethods.detach(paymentMethodId);
}

export async function listPaymentMethods(
  customerId: string,
  type: Stripe.PaymentMethodListParams.Type = 'card'
): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type,
  });

  return paymentMethods.data;
}

export async function getPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod | null> {
  const stripe = getStripe();

  try {
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function updatePaymentMethod(
  paymentMethodId: string,
  billingDetails: Stripe.PaymentMethodUpdateParams.BillingDetails
): Promise<Stripe.PaymentMethod> {
  const stripe = getStripe();

  return stripe.paymentMethods.update(paymentMethodId, {
    billing_details: billingDetails,
  });
}

// Create a SetupIntent for saving a card without payment
export async function createSetupIntent(
  customerId: string,
  paymentMethodTypes: string[] = ['card']
): Promise<Stripe.SetupIntent> {
  const stripe = getStripe();

  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: paymentMethodTypes,
    usage: 'off_session',
  });
}

export async function confirmSetupIntent(
  setupIntentId: string,
  paymentMethodId: string
): Promise<Stripe.SetupIntent> {
  const stripe = getStripe();

  return stripe.setupIntents.confirm(setupIntentId, {
    payment_method: paymentMethodId,
  });
}
```

## Webhook Handler

```typescript
// src/lib/stripe/webhooks.ts
import Stripe from 'stripe';
import { getStripe } from './server';
import { headers } from 'next/headers';

export async function constructWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

export type WebhookHandler = {
  [key in Stripe.Event.Type]?: (event: Stripe.Event) => Promise<void>;
};

export async function handleWebhook(
  body: string,
  signature: string,
  handlers: WebhookHandler
): Promise<{ received: boolean; type: string }> {
  const event = await constructWebhookEvent(body, signature);

  const handler = handlers[event.type];

  if (handler) {
    await handler(event);
  }

  return { received: true, type: event.type };
}

// Default webhook handlers
export const defaultWebhookHandlers: WebhookHandler = {
  'payment_intent.succeeded': async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    // Update order status, send confirmation email, etc.
  },

  'payment_intent.payment_failed': async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`Payment failed: ${paymentIntent.id}`);
    // Notify user, log error, etc.
  },

  'customer.created': async (event) => {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer created: ${customer.id}`);
    // Sync to database, etc.
  },

  'customer.updated': async (event) => {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer updated: ${customer.id}`);
  },

  'charge.refunded': async (event) => {
    const charge = event.data.object as Stripe.Charge;
    console.log(`Charge refunded: ${charge.id}`);
    // Update order status, notify user, etc.
  },

  'charge.dispute.created': async (event) => {
    const dispute = event.data.object as Stripe.Dispute;
    console.log(`Dispute created: ${dispute.id}`);
    // Alert team, gather evidence, etc.
  },
};
```

## React Components

```tsx
// src/components/payments/StripeProvider.tsx
'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode, useMemo } from 'react';

let stripePromise: Promise<Stripe | null>;

function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
  options?: {
    appearance?: {
      theme?: 'stripe' | 'night' | 'flat';
      variables?: {
        colorPrimary?: string;
        colorBackground?: string;
        colorText?: string;
        colorDanger?: string;
        fontFamily?: string;
        borderRadius?: string;
      };
    };
    locale?: string;
  };
}

export function StripeProvider({
  children,
  clientSecret,
  options = {},
}: StripeProviderProps) {
  const elementsOptions = useMemo(() => ({
    clientSecret,
    appearance: options.appearance || {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0066ff',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
    locale: options.locale || 'auto',
  }), [clientSecret, options]);

  if (!clientSecret) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={getStripe()} options={elementsOptions}>
      {children}
    </Elements>
  );
}
```

```tsx
// src/components/payments/PaymentForm.tsx
'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
  submitButtonText?: string;
}

export function PaymentForm({
  amount,
  currency = 'usd',
  onSuccess,
  onError,
  returnUrl,
  submitButtonText = 'Pay Now',
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl || `${window.location.origin}/payment/complete`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An error occurred');
      onError?.(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment successful!');
      onSuccess?.(paymentIntent.id);
    }

    setIsProcessing(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        }}
      />

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('successful')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `${submitButtonText} ${formatCurrency(amount, currency)}`
        )}
      </button>
    </form>
  );
}
```

```tsx
// src/components/payments/SavedCards.tsx
'use client';

import { useState } from 'react';
import type Stripe from 'stripe';

interface SavedCardsProps {
  paymentMethods: Stripe.PaymentMethod[];
  defaultPaymentMethodId?: string;
  onSelect?: (paymentMethodId: string) => void;
  onDelete?: (paymentMethodId: string) => Promise<void>;
  onSetDefault?: (paymentMethodId: string) => Promise<void>;
}

export function SavedCards({
  paymentMethods,
  defaultPaymentMethodId,
  onSelect,
  onDelete,
  onSetDefault,
}: SavedCardsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultPaymentMethodId || null
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleSelect = (paymentMethodId: string) => {
    setSelectedId(paymentMethodId);
    onSelect?.(paymentMethodId);
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!onDelete) return;

    setIsDeleting(paymentMethodId);
    try {
      await onDelete(paymentMethodId);
    } finally {
      setIsDeleting(null);
    }
  };

  const getCardIcon = (brand: string) => {
    const icons: Record<string, string> = {
      visa: '💳 Visa',
      mastercard: '💳 Mastercard',
      amex: '💳 Amex',
      discover: '💳 Discover',
    };
    return icons[brand.toLowerCase()] || '💳 Card';
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No saved payment methods
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paymentMethods.map((pm) => {
        const card = pm.card;
        if (!card) return null;

        const isDefault = pm.id === defaultPaymentMethodId;
        const isSelected = pm.id === selectedId;

        return (
          <div
            key={pm.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleSelect(pm.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => handleSelect(pm.id)}
                  className="h-4 w-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">
                    {getCardIcon(card.brand)} •••• {card.last4}
                  </div>
                  <div className="text-sm text-gray-500">
                    Expires {card.exp_month}/{card.exp_year}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isDefault && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                    Default
                  </span>
                )}
                {!isDefault && onSetDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDefault(pm.id);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Set Default
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(pm.id);
                    }}
                    disabled={isDeleting === pm.id}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {isDeleting === pm.id ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## Server Actions

```typescript
// src/app/actions/stripe-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createPaymentIntent, getPaymentIntent, refundPayment } from '@/lib/stripe/payments';
import {
  createCustomer,
  getCustomer,
  getCustomerByEmail,
  getCustomerWithPaymentMethods,
  setDefaultPaymentMethod,
} from '@/lib/stripe/customers';
import {
  attachPaymentMethod,
  detachPaymentMethod,
  createSetupIntent,
} from '@/lib/stripe/payment-methods';
import { CreatePaymentIntentParams, CreateCustomerParams } from '@/types/stripe';

// Payment Intent Actions
export async function createPaymentIntentAction(params: CreatePaymentIntentParams) {
  try {
    const paymentIntent = await createPaymentIntent(params);
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw new Error('Failed to create payment intent');
  }
}

export async function getPaymentStatusAction(paymentIntentId: string) {
  try {
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
      return { error: 'Payment not found' };
    }
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (error) {
    console.error('Get payment status error:', error);
    throw new Error('Failed to get payment status');
  }
}

// Customer Actions
export async function createCustomerAction(params: CreateCustomerParams) {
  try {
    // Check if customer already exists
    const existing = await getCustomerByEmail(params.email);
    if (existing) {
      return { customerId: existing.id, existing: true };
    }

    const customer = await createCustomer(params);
    return { customerId: customer.id, existing: false };
  } catch (error) {
    console.error('Create customer error:', error);
    throw new Error('Failed to create customer');
  }
}

export async function getCustomerAction(customerId: string) {
  try {
    return await getCustomerWithPaymentMethods(customerId);
  } catch (error) {
    console.error('Get customer error:', error);
    throw new Error('Failed to get customer');
  }
}

// Payment Method Actions
export async function addPaymentMethodAction(
  customerId: string,
  paymentMethodId: string
) {
  try {
    await attachPaymentMethod(paymentMethodId, customerId);
    revalidatePath('/account/payment-methods');
    return { success: true };
  } catch (error) {
    console.error('Add payment method error:', error);
    throw new Error('Failed to add payment method');
  }
}

export async function removePaymentMethodAction(paymentMethodId: string) {
  try {
    await detachPaymentMethod(paymentMethodId);
    revalidatePath('/account/payment-methods');
    return { success: true };
  } catch (error) {
    console.error('Remove payment method error:', error);
    throw new Error('Failed to remove payment method');
  }
}

export async function setDefaultPaymentMethodAction(
  customerId: string,
  paymentMethodId: string
) {
  try {
    await setDefaultPaymentMethod(customerId, paymentMethodId);
    revalidatePath('/account/payment-methods');
    return { success: true };
  } catch (error) {
    console.error('Set default payment method error:', error);
    throw new Error('Failed to set default payment method');
  }
}

export async function createSetupIntentAction(customerId: string) {
  try {
    const setupIntent = await createSetupIntent(customerId);
    return { clientSecret: setupIntent.client_secret };
  } catch (error) {
    console.error('Create setup intent error:', error);
    throw new Error('Failed to create setup intent');
  }
}

// Refund Action
export async function createRefundAction(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  try {
    const refund = await refundPayment(paymentIntentId, amount, reason);
    return { refundId: refund.id, status: refund.status };
  } catch (error) {
    console.error('Create refund error:', error);
    throw new Error('Failed to create refund');
  }
}
```

## API Routes

```typescript
// src/app/api/stripe/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/payments';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, customerId, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      customerId,
      metadata,
      automaticPaymentMethods: true,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook, defaultWebhookHandlers } from '@/lib/stripe/webhooks';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const result = await handleWebhook(body, signature, {
      ...defaultWebhookHandlers,
      // Add custom handlers here
      'payment_intent.succeeded': async (event) => {
        // Custom handling
        await defaultWebhookHandlers['payment_intent.succeeded']?.(event);
        // Additional logic: update database, send emails, etc.
      },
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

## Usage Example

```tsx
// src/app/checkout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { StripeProvider } from '@/components/payments/StripeProvider';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { createPaymentIntentAction } from '@/app/actions/stripe-actions';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const amount = 99.99; // Example amount

  useEffect(() => {
    createPaymentIntentAction({
      amount,
      metadata: { orderId: 'order_123' },
    })
      .then(({ clientSecret }) => setClientSecret(clientSecret!))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!clientSecret) {
    return <div>Loading payment form...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Purchase</h1>

      <StripeProvider clientSecret={clientSecret}>
        <PaymentForm
          amount={amount}
          onSuccess={(paymentIntentId) => {
            console.log('Payment successful:', paymentIntentId);
            // Redirect to success page
          }}
          onError={(error) => {
            console.error('Payment error:', error);
          }}
        />
      </StripeProvider>
    </div>
  );
}
```

## Testing

```typescript
// __tests__/stripe.test.ts
import { createPaymentIntent, getPaymentIntent } from '@/lib/stripe/payments';
import { createCustomer, getCustomer } from '@/lib/stripe/customers';

// Use test mode keys
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';

describe('Stripe Payments', () => {
  it('should create a payment intent', async () => {
    const paymentIntent = await createPaymentIntent({
      amount: 19.99,
      currency: 'usd',
      metadata: { test: 'true' },
    });

    expect(paymentIntent.id).toMatch(/^pi_/);
    expect(paymentIntent.amount).toBe(1999); // In cents
    expect(paymentIntent.currency).toBe('usd');
  });

  it('should retrieve a payment intent', async () => {
    const created = await createPaymentIntent({ amount: 10 });
    const retrieved = await getPaymentIntent(created.id);

    expect(retrieved?.id).toBe(created.id);
  });
});

describe('Stripe Customers', () => {
  it('should create a customer', async () => {
    const customer = await createCustomer({
      email: `test-${Date.now()}@example.com`,
      name: 'Test Customer',
    });

    expect(customer.id).toMatch(/^cus_/);
    expect(customer.email).toContain('@example.com');
  });
});
```

## CLAUDE.md Integration

```markdown
# Stripe Payments

## Setup
1. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY
2. Configure webhook endpoint at /api/stripe/webhook
3. Set STRIPE_WEBHOOK_SECRET from Stripe Dashboard

## Payment Flow
1. Create PaymentIntent on server
2. Pass clientSecret to frontend
3. Use PaymentElement for card input
4. Confirm payment with Stripe.js
5. Handle webhook for fulfillment

## Key Files
- `src/lib/stripe/server.ts` - Stripe client initialization
- `src/lib/stripe/payments.ts` - Payment intent operations
- `src/lib/stripe/customers.ts` - Customer management
- `src/lib/stripe/webhooks.ts` - Webhook handling

## Testing
- Use sk_test_xxx key for testing
- Test card: 4242 4242 4242 4242
- Webhook testing: stripe listen --forward-to localhost:3000/api/stripe/webhook

## Security
- Never log full card numbers
- Always verify webhook signatures
- Use HTTPS in production
```

## AI Suggestions

1. **Add idempotency keys** - Prevent duplicate charges with Stripe idempotency keys
2. **Implement 3D Secure handling** - Handle authentication challenges for SCA compliance
3. **Add payment retry logic** - Automatic retry for failed payments with exponential backoff
4. **Implement fraud detection** - Use Stripe Radar rules and custom fraud scoring
5. **Add multi-currency support** - Dynamic currency conversion based on customer location
6. **Implement payment links** - Generate shareable payment links for invoices
7. **Add Apple Pay / Google Pay** - Integrate native wallet payments
8. **Implement payment analytics** - Track conversion rates, failed payments, revenue metrics
9. **Add dispute management** - Automated evidence collection for chargebacks
10. **Implement smart retries** - Use Stripe's Smart Retries for subscription failures
