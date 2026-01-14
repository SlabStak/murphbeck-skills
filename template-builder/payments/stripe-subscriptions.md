# Stripe Subscriptions Template

Production-ready Stripe subscription management with plans, trials, usage-based billing, proration, and lifecycle management.

## Installation

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Environment Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Product Configuration
STRIPE_PRODUCT_ID=prod_xxx
STRIPE_BASIC_PRICE_ID=price_xxx_basic
STRIPE_PRO_PRICE_ID=price_xxx_pro
STRIPE_ENTERPRISE_PRICE_ID=price_xxx_enterprise

# Trial Settings
STRIPE_TRIAL_DAYS=14
STRIPE_TRIAL_END_BEHAVIOR=pause

# Billing Settings
STRIPE_PRORATION_BEHAVIOR=create_prorations
STRIPE_COLLECTION_METHOD=charge_automatically
```

## Project Structure

```
src/
├── lib/
│   └── stripe/
│       ├── subscriptions.ts
│       ├── products.ts
│       ├── invoices.ts
│       ├── usage.ts
│       └── billing-portal.ts
├── components/
│   └── subscriptions/
│       ├── PricingTable.tsx
│       ├── SubscriptionStatus.tsx
│       ├── UpgradeModal.tsx
│       ├── UsageDisplay.tsx
│       └── BillingHistory.tsx
├── app/
│   ├── api/
│   │   └── subscriptions/
│   │       ├── create/route.ts
│   │       ├── update/route.ts
│   │       ├── cancel/route.ts
│   │       └── webhook/route.ts
│   └── actions/
│       └── subscription-actions.ts
├── hooks/
│   └── useSubscription.ts
└── types/
    └── subscription.ts
```

## Type Definitions

```typescript
// src/types/subscription.ts
import Stripe from 'stripe';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  limits?: {
    apiCalls?: number;
    storage?: number;
    users?: number;
    projects?: number;
  };
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: PricingPlan | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  status: Stripe.Subscription.Status;
  trialEnd: Date | null;
  usage?: UsageRecord[];
}

export interface UsageRecord {
  metric: string;
  current: number;
  limit: number;
  percentage: number;
  resetDate: Date;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  couponId?: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
  collectionMethod?: 'charge_automatically' | 'send_invoice';
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  quantity?: number;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

export interface SubscriptionEvent {
  type: 'created' | 'updated' | 'canceled' | 'trial_ending' | 'payment_failed';
  subscriptionId: string;
  customerId: string;
  data: Record<string, any>;
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  created: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  amount: number;
  period: {
    start: Date;
    end: Date;
  };
}
```

## Subscription Management

```typescript
// src/lib/stripe/subscriptions.ts
import Stripe from 'stripe';
import { getStripe } from './server';
import {
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  SubscriptionStatus,
} from '@/types/subscription';

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: params.customerId,
    items: [{ price: params.priceId }],
    metadata: params.metadata || {},
    collection_method: params.collectionMethod || 'charge_automatically',
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  };

  // Add trial if specified
  if (params.trialDays && params.trialDays > 0) {
    subscriptionParams.trial_period_days = params.trialDays;
  }

  // Add coupon if specified
  if (params.couponId) {
    subscriptionParams.coupon = params.couponId;
  }

  // Set default payment method
  if (params.paymentMethodId) {
    subscriptionParams.default_payment_method = params.paymentMethodId;
  }

  return stripe.subscriptions.create(subscriptionParams);
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    });
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const stripe = getStripe();

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data;
}

export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

export async function updateSubscription(
  params: UpdateSubscriptionParams
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  const updateParams: Stripe.SubscriptionUpdateParams = {
    metadata: params.metadata,
    proration_behavior: params.prorationBehavior || 'create_prorations',
  };

  // Change plan/price
  if (params.priceId) {
    const subscription = await getSubscription(params.subscriptionId);
    if (subscription) {
      updateParams.items = [
        {
          id: subscription.items.data[0].id,
          price: params.priceId,
        },
      ];
    }
  }

  // Update quantity
  if (params.quantity !== undefined) {
    const subscription = await getSubscription(params.subscriptionId);
    if (subscription) {
      updateParams.items = [
        {
          id: subscription.items.data[0].id,
          quantity: params.quantity,
        },
      ];
    }
  }

  // Cancel at period end
  if (params.cancelAtPeriodEnd !== undefined) {
    updateParams.cancel_at_period_end = params.cancelAtPeriodEnd;
  }

  return stripe.subscriptions.update(params.subscriptionId, updateParams);
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  // Cancel at end of billing period
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function pauseSubscription(
  subscriptionId: string,
  resumeAt?: Date
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  const params: Stripe.SubscriptionUpdateParams = {
    pause_collection: {
      behavior: 'void',
    },
  };

  if (resumeAt) {
    params.pause_collection!.resumes_at = Math.floor(resumeAt.getTime() / 1000);
  }

  return stripe.subscriptions.update(subscriptionId, params);
}

export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: '',
  });
}

// Preview proration for plan change
export async function previewProration(
  subscriptionId: string,
  newPriceId: string
): Promise<{
  amount: number;
  currency: string;
  lineItems: Array<{ description: string; amount: number }>;
}> {
  const stripe = getStripe();

  const subscription = await getSubscription(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const prorationDate = Math.floor(Date.now() / 1000);

  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: subscription.customer as string,
    subscription: subscriptionId,
    subscription_items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    subscription_proration_date: prorationDate,
  });

  return {
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    lineItems: invoice.lines.data.map((line) => ({
      description: line.description || '',
      amount: line.amount / 100,
    })),
  };
}
```

## Usage-Based Billing

```typescript
// src/lib/stripe/usage.ts
import Stripe from 'stripe';
import { getStripe } from './server';

export interface UsageReportParams {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: 'increment' | 'set';
}

export async function reportUsage(
  params: UsageReportParams
): Promise<Stripe.UsageRecord> {
  const stripe = getStripe();

  return stripe.subscriptionItems.createUsageRecord(
    params.subscriptionItemId,
    {
      quantity: params.quantity,
      timestamp: params.timestamp || Math.floor(Date.now() / 1000),
      action: params.action || 'increment',
    }
  );
}

export async function getUsageSummary(
  subscriptionItemId: string
): Promise<Stripe.UsageRecordSummary[]> {
  const stripe = getStripe();

  const summaries = await stripe.subscriptionItems.listUsageRecordSummaries(
    subscriptionItemId,
    { limit: 10 }
  );

  return summaries.data;
}

// Metered billing helper
export class UsageTracker {
  private subscriptionItemId: string;
  private pendingUsage: number = 0;
  private flushInterval: NodeJS.Timer | null = null;

  constructor(subscriptionItemId: string, flushIntervalMs = 60000) {
    this.subscriptionItemId = subscriptionItemId;

    // Batch usage reports
    this.flushInterval = setInterval(
      () => this.flush(),
      flushIntervalMs
    );
  }

  increment(amount = 1): void {
    this.pendingUsage += amount;
  }

  async flush(): Promise<void> {
    if (this.pendingUsage === 0) return;

    const quantity = this.pendingUsage;
    this.pendingUsage = 0;

    try {
      await reportUsage({
        subscriptionItemId: this.subscriptionItemId,
        quantity,
        action: 'increment',
      });
    } catch (error) {
      // Restore usage on failure
      this.pendingUsage += quantity;
      console.error('Failed to report usage:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// Create metered subscription
export async function createMeteredSubscription(
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  return stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    // For metered billing, don't charge immediately
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}
```

## Invoice Management

```typescript
// src/lib/stripe/invoices.ts
import Stripe from 'stripe';
import { getStripe } from './server';
import { Invoice, InvoiceLineItem } from '@/types/subscription';

export async function getInvoices(
  customerId: string,
  limit = 10
): Promise<Invoice[]> {
  const stripe = getStripe();

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
    expand: ['data.lines'],
  });

  return invoices.data.map(formatInvoice);
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const stripe = getStripe();

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ['lines'],
    });
    return formatInvoice(invoice);
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function getUpcomingInvoice(
  customerId: string
): Promise<Invoice | null> {
  const stripe = getStripe();

  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
    return formatInvoice(invoice as Stripe.Invoice);
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'invoice_upcoming_none') {
      return null;
    }
    throw error;
  }
}

export async function payInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  const stripe = getStripe();
  return stripe.invoices.pay(invoiceId);
}

export async function voidInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  const stripe = getStripe();
  return stripe.invoices.voidInvoice(invoiceId);
}

export async function sendInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  const stripe = getStripe();
  return stripe.invoices.sendInvoice(invoiceId);
}

function formatInvoice(invoice: Stripe.Invoice): Invoice {
  return {
    id: invoice.id,
    number: invoice.number || '',
    status: invoice.status || 'draft',
    amount: (invoice.amount_due || 0) / 100,
    currency: invoice.currency,
    created: new Date(invoice.created * 1000),
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    paidAt: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : null,
    pdfUrl: invoice.invoice_pdf || null,
    hostedUrl: invoice.hosted_invoice_url || null,
    lineItems: (invoice.lines?.data || []).map((line) => ({
      description: line.description || '',
      quantity: line.quantity || 1,
      amount: line.amount / 100,
      period: {
        start: new Date(line.period.start * 1000),
        end: new Date(line.period.end * 1000),
      },
    })),
  };
}

// Create one-off invoice item
export async function createInvoiceItem(
  customerId: string,
  amount: number,
  description: string,
  currency = 'usd'
): Promise<Stripe.InvoiceItem> {
  const stripe = getStripe();

  return stripe.invoiceItems.create({
    customer: customerId,
    amount: Math.round(amount * 100),
    currency,
    description,
  });
}
```

## Billing Portal

```typescript
// src/lib/stripe/billing-portal.ts
import Stripe from 'stripe';
import { getStripe } from './server';

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Configure billing portal (run once during setup)
export async function configureBillingPortal(): Promise<Stripe.BillingPortal.Configuration> {
  const stripe = getStripe();

  return stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Manage your subscription',
      privacy_policy_url: 'https://example.com/privacy',
      terms_of_service_url: 'https://example.com/terms',
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'address', 'phone', 'tax_id'],
      },
      invoice_history: {
        enabled: true,
      },
      payment_method_update: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive',
            'missing_features',
            'switched_service',
            'unused',
            'other',
          ],
        },
      },
      subscription_pause: {
        enabled: true,
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price', 'quantity'],
        proration_behavior: 'create_prorations',
        products: [
          {
            product: process.env.STRIPE_PRODUCT_ID!,
            prices: [
              process.env.STRIPE_BASIC_PRICE_ID!,
              process.env.STRIPE_PRO_PRICE_ID!,
              process.env.STRIPE_ENTERPRISE_PRICE_ID!,
            ],
          },
        ],
      },
    },
  });
}
```

## Products and Pricing

```typescript
// src/lib/stripe/products.ts
import Stripe from 'stripe';
import { getStripe } from './server';
import { PricingPlan } from '@/types/subscription';

export async function getProducts(): Promise<Stripe.Product[]> {
  const stripe = getStripe();

  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
  });

  return products.data;
}

export async function getPrices(productId?: string): Promise<Stripe.Price[]> {
  const stripe = getStripe();

  const params: Stripe.PriceListParams = {
    active: true,
    expand: ['data.product'],
  };

  if (productId) {
    params.product = productId;
  }

  const prices = await stripe.prices.list(params);
  return prices.data;
}

export async function getPrice(priceId: string): Promise<Stripe.Price | null> {
  const stripe = getStripe();

  try {
    return await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

// Create pricing plans from Stripe products
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const prices = await getPrices(process.env.STRIPE_PRODUCT_ID);

  return prices.map((price) => {
    const product = price.product as Stripe.Product;

    return {
      id: price.id,
      name: product.name,
      description: product.description || '',
      priceId: price.id,
      price: (price.unit_amount || 0) / 100,
      currency: price.currency,
      interval: price.recurring?.interval as 'month' | 'year',
      features: (product.metadata.features || '').split(',').filter(Boolean),
      popular: product.metadata.popular === 'true',
      limits: {
        apiCalls: parseInt(product.metadata.apiCalls || '0'),
        storage: parseInt(product.metadata.storage || '0'),
        users: parseInt(product.metadata.users || '0'),
        projects: parseInt(product.metadata.projects || '0'),
      },
    };
  });
}

// Create a product and prices programmatically
export async function createProduct(params: {
  name: string;
  description?: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
}): Promise<{ product: Stripe.Product; monthlyPrice: Stripe.Price; yearlyPrice: Stripe.Price }> {
  const stripe = getStripe();
  const currency = params.currency || 'usd';

  const product = await stripe.products.create({
    name: params.name,
    description: params.description,
    metadata: {
      features: params.features.join(','),
    },
  });

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(params.monthlyPrice * 100),
    currency,
    recurring: {
      interval: 'month',
    },
  });

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(params.yearlyPrice * 100),
    currency,
    recurring: {
      interval: 'year',
    },
  });

  return { product, monthlyPrice, yearlyPrice };
}

// Create coupon/discount
export async function createCoupon(params: {
  name: string;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: 'forever' | 'once' | 'repeating';
  durationInMonths?: number;
  maxRedemptions?: number;
  redeemBy?: Date;
}): Promise<Stripe.Coupon> {
  const stripe = getStripe();

  const couponParams: Stripe.CouponCreateParams = {
    name: params.name,
    duration: params.duration,
  };

  if (params.percentOff) {
    couponParams.percent_off = params.percentOff;
  } else if (params.amountOff) {
    couponParams.amount_off = Math.round(params.amountOff * 100);
    couponParams.currency = params.currency || 'usd';
  }

  if (params.duration === 'repeating' && params.durationInMonths) {
    couponParams.duration_in_months = params.durationInMonths;
  }

  if (params.maxRedemptions) {
    couponParams.max_redemptions = params.maxRedemptions;
  }

  if (params.redeemBy) {
    couponParams.redeem_by = Math.floor(params.redeemBy.getTime() / 1000);
  }

  return stripe.coupons.create(couponParams);
}
```

## React Components

```tsx
// src/components/subscriptions/PricingTable.tsx
'use client';

import { useState } from 'react';
import { PricingPlan } from '@/types/subscription';

interface PricingTableProps {
  plans: PricingPlan[];
  currentPlanId?: string;
  onSelectPlan: (plan: PricingPlan) => void;
  isLoading?: boolean;
}

export function PricingTable({
  plans,
  currentPlanId,
  onSelectPlan,
  isLoading,
}: PricingTableProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const filteredPlans = plans.filter((plan) => plan.interval === billingInterval);

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'month'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'year'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Yearly
            <span className="ml-1 text-green-600 text-xs">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => {
          const isCurrent = plan.priceId === currentPlanId;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 ${
                isPopular
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 mt-2">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-500">/{plan.interval}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.limits && (
                <div className="border-t pt-4 mb-6 space-y-2 text-sm text-gray-500">
                  {plan.limits.apiCalls && (
                    <div>API Calls: {plan.limits.apiCalls.toLocaleString()}/mo</div>
                  )}
                  {plan.limits.storage && (
                    <div>Storage: {plan.limits.storage} GB</div>
                  )}
                  {plan.limits.users && (
                    <div>Team Members: {plan.limits.users}</div>
                  )}
                </div>
              )}

              <button
                onClick={() => onSelectPlan(plan)}
                disabled={isCurrent || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

```tsx
// src/components/subscriptions/SubscriptionStatus.tsx
'use client';

import { SubscriptionStatus as Status } from '@/types/subscription';

interface SubscriptionStatusProps {
  status: Status;
  onManage: () => void;
  onCancel: () => void;
  onReactivate: () => void;
}

export function SubscriptionStatus({
  status,
  onManage,
  onCancel,
  onReactivate,
}: SubscriptionStatusProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
    }).format(date);
  };

  const getStatusBadge = () => {
    const badges: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      trialing: { color: 'bg-blue-100 text-blue-800', label: 'Trial' },
      past_due: { color: 'bg-yellow-100 text-yellow-800', label: 'Past Due' },
      canceled: { color: 'bg-red-100 text-red-800', label: 'Canceled' },
      unpaid: { color: 'bg-red-100 text-red-800', label: 'Unpaid' },
      incomplete: { color: 'bg-gray-100 text-gray-800', label: 'Incomplete' },
    };

    const badge = badges[status.status] || badges.incomplete;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (!status.isActive && !status.plan) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">No Active Subscription</h3>
        <p className="text-gray-600 mb-4">
          You don't have an active subscription. Choose a plan to get started.
        </p>
        <button
          onClick={onManage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          View Plans
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Subscription</h3>
        {getStatusBadge()}
      </div>

      {status.plan && (
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold">{status.plan.name}</div>
            <div className="text-gray-500">
              ${status.plan.price}/{status.plan.interval}
            </div>
          </div>

          {status.trialEnd && status.status === 'trialing' && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg">
              Trial ends on {formatDate(status.trialEnd)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Current Period Ends</div>
              <div className="font-medium">{formatDate(status.currentPeriodEnd)}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium capitalize">{status.status}</div>
            </div>
          </div>

          {status.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg">
              Your subscription will be canceled on {formatDate(status.currentPeriodEnd)}
            </div>
          )}

          {/* Usage Display */}
          {status.usage && status.usage.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Usage</h4>
              <div className="space-y-3">
                {status.usage.map((usage) => (
                  <div key={usage.metric}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{usage.metric}</span>
                      <span>
                        {usage.current.toLocaleString()} / {usage.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          usage.percentage > 90
                            ? 'bg-red-500'
                            : usage.percentage > 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onManage}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Manage Subscription
            </button>
            {status.cancelAtPeriodEnd ? (
              <button
                onClick={onReactivate}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Reactivate
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="flex-1 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Server Actions

```typescript
// src/app/actions/subscription-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  getActiveSubscription,
  previewProration,
} from '@/lib/stripe/subscriptions';
import { createBillingPortalSession } from '@/lib/stripe/billing-portal';
import { getPricingPlans, getPrice } from '@/lib/stripe/products';
import { getInvoices, getUpcomingInvoice } from '@/lib/stripe/invoices';
import { CreateSubscriptionParams, SubscriptionStatus, PricingPlan } from '@/types/subscription';

export async function createSubscriptionAction(
  customerId: string,
  priceId: string,
  paymentMethodId?: string
) {
  try {
    const subscription = await createSubscription({
      customerId,
      priceId,
      paymentMethodId,
      trialDays: parseInt(process.env.STRIPE_TRIAL_DAYS || '0'),
    });

    const invoice = subscription.latest_invoice as any;

    revalidatePath('/account');

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: invoice?.payment_intent?.client_secret,
    };
  } catch (error) {
    console.error('Create subscription error:', error);
    throw new Error('Failed to create subscription');
  }
}

export async function updateSubscriptionAction(
  subscriptionId: string,
  priceId: string
) {
  try {
    await updateSubscription({
      subscriptionId,
      priceId,
      prorationBehavior: 'create_prorations',
    });

    revalidatePath('/account');
    return { success: true };
  } catch (error) {
    console.error('Update subscription error:', error);
    throw new Error('Failed to update subscription');
  }
}

export async function cancelSubscriptionAction(
  subscriptionId: string,
  immediately = false
) {
  try {
    await cancelSubscription(subscriptionId, immediately);
    revalidatePath('/account');
    return { success: true };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw new Error('Failed to cancel subscription');
  }
}

export async function reactivateSubscriptionAction(subscriptionId: string) {
  try {
    await reactivateSubscription(subscriptionId);
    revalidatePath('/account');
    return { success: true };
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    throw new Error('Failed to reactivate subscription');
  }
}

export async function getSubscriptionStatusAction(
  customerId: string
): Promise<SubscriptionStatus> {
  try {
    const subscription = await getActiveSubscription(customerId);

    if (!subscription) {
      return {
        isActive: false,
        plan: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        status: 'canceled',
        trialEnd: null,
      };
    }

    const priceId = subscription.items.data[0]?.price.id;
    const plans = await getPricingPlans();
    const plan = plans.find((p) => p.priceId === priceId) || null;

    return {
      isActive: ['active', 'trialing'].includes(subscription.status),
      plan,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      status: subscription.status,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    };
  } catch (error) {
    console.error('Get subscription status error:', error);
    throw new Error('Failed to get subscription status');
  }
}

export async function getPricingPlansAction(): Promise<PricingPlan[]> {
  return getPricingPlans();
}

export async function previewProrationAction(
  subscriptionId: string,
  newPriceId: string
) {
  try {
    return await previewProration(subscriptionId, newPriceId);
  } catch (error) {
    console.error('Preview proration error:', error);
    throw new Error('Failed to preview proration');
  }
}

export async function getBillingPortalUrlAction(
  customerId: string,
  returnUrl: string
) {
  try {
    const session = await createBillingPortalSession(customerId, returnUrl);
    return { url: session.url };
  } catch (error) {
    console.error('Create billing portal session error:', error);
    throw new Error('Failed to create billing portal session');
  }
}

export async function redirectToBillingPortal(customerId: string) {
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account`;
  const session = await createBillingPortalSession(customerId, returnUrl);
  redirect(session.url);
}

export async function getInvoicesAction(customerId: string, limit = 10) {
  return getInvoices(customerId, limit);
}

export async function getUpcomingInvoiceAction(customerId: string) {
  return getUpcomingInvoice(customerId);
}
```

## Webhook Handler

```typescript
// src/app/api/subscriptions/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleWebhook } from '@/lib/stripe/webhooks';

const subscriptionWebhookHandlers = {
  'customer.subscription.created': async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Subscription created: ${subscription.id}`);

    // Sync to database, send welcome email, etc.
  },

  'customer.subscription.updated': async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Subscription updated: ${subscription.id}`);

    // Update database, handle plan changes, etc.
  },

  'customer.subscription.deleted': async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Subscription deleted: ${subscription.id}`);

    // Revoke access, send cancellation email, etc.
  },

  'customer.subscription.trial_will_end': async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Trial ending for subscription: ${subscription.id}`);

    // Send trial ending reminder email
  },

  'invoice.payment_succeeded': async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(`Invoice paid: ${invoice.id}`);

    // Send receipt, update billing records
  },

  'invoice.payment_failed': async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(`Invoice payment failed: ${invoice.id}`);

    // Notify customer, implement dunning
  },

  'invoice.upcoming': async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(`Upcoming invoice: ${invoice.id}`);

    // Send upcoming charge notification
  },
};

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
    const result = await handleWebhook(body, signature, subscriptionWebhookHandlers);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Subscription webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
```

## Testing

```typescript
// __tests__/subscriptions.test.ts
import {
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
} from '@/lib/stripe/subscriptions';
import { createCustomer } from '@/lib/stripe/customers';

describe('Stripe Subscriptions', () => {
  let customerId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const customer = await createCustomer({
      email: `test-${Date.now()}@example.com`,
      name: 'Test Customer',
    });
    customerId = customer.id;
  });

  it('should create a subscription', async () => {
    const subscription = await createSubscription({
      customerId,
      priceId: process.env.STRIPE_BASIC_PRICE_ID!,
      trialDays: 7,
    });

    expect(subscription.id).toMatch(/^sub_/);
    expect(subscription.status).toBe('trialing');
    subscriptionId = subscription.id;
  });

  it('should retrieve a subscription', async () => {
    const subscription = await getSubscription(subscriptionId);
    expect(subscription?.id).toBe(subscriptionId);
  });

  it('should update a subscription', async () => {
    const subscription = await updateSubscription({
      subscriptionId,
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
    });

    expect(subscription.items.data[0].price.id).toBe(process.env.STRIPE_PRO_PRICE_ID);
  });

  it('should cancel a subscription', async () => {
    const subscription = await cancelSubscription(subscriptionId);
    expect(subscription.cancel_at_period_end).toBe(true);
  });
});
```

## CLAUDE.md Integration

```markdown
# Stripe Subscriptions

## Subscription Flow
1. Create customer (if not exists)
2. Show pricing table
3. Create subscription with selected plan
4. Handle payment confirmation
5. Webhook updates database

## Webhook Events to Handle
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- customer.subscription.trial_will_end
- invoice.payment_succeeded
- invoice.payment_failed

## Plan Changes
- Use previewProration() before changing plans
- Apply prorations automatically
- Webhook will sync final state

## Billing Portal
- Use redirectToBillingPortal() for self-service
- Customers can update payment method, cancel, view invoices

## Key Files
- `src/lib/stripe/subscriptions.ts` - Core subscription logic
- `src/lib/stripe/products.ts` - Plans and pricing
- `src/lib/stripe/usage.ts` - Metered billing
- `src/components/subscriptions/` - UI components
```

## AI Suggestions

1. **Add grace period handling** - Allow continued access during payment retries
2. **Implement subscription pausing** - Let users pause instead of cancel
3. **Add upgrade/downgrade paths** - Define valid plan transitions
4. **Implement grandfathered pricing** - Honor old prices for existing customers
5. **Add subscription analytics** - Track MRR, churn, LTV metrics
6. **Implement entitlement system** - Feature flags based on plan
7. **Add dunning management** - Smart retry schedules for failed payments
8. **Implement subscription gifts** - Allow users to gift subscriptions
9. **Add annual prepayment discounts** - Incentivize annual billing
10. **Implement multi-product subscriptions** - Bundle multiple products
