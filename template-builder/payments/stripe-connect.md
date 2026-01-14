# Stripe Connect Template

Production-ready Stripe Connect integration for marketplaces and platforms with onboarding, payouts, and fee management.

## Installation

```bash
npm install stripe @stripe/stripe-js @stripe/connect-js
```

## Environment Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Connect Settings
STRIPE_CONNECT_CLIENT_ID=ca_xxx
STRIPE_PLATFORM_FEE_PERCENT=10
STRIPE_PAYOUT_SCHEDULE=daily

# OAuth Settings
STRIPE_CONNECT_REDIRECT_URI=https://yourapp.com/api/stripe/connect/callback
```

## Project Structure

```
src/
├── lib/
│   └── stripe/
│       ├── connect/
│       │   ├── index.ts
│       │   ├── accounts.ts
│       │   ├── onboarding.ts
│       │   ├── payouts.ts
│       │   ├── transfers.ts
│       │   └── fees.ts
│       └── server.ts
├── components/
│   └── connect/
│       ├── OnboardingButton.tsx
│       ├── AccountStatus.tsx
│       ├── PayoutHistory.tsx
│       ├── EarningsDashboard.tsx
│       └── ConnectEmbed.tsx
├── app/
│   ├── api/
│   │   └── stripe/
│   │       └── connect/
│   │           ├── create-account/route.ts
│   │           ├── callback/route.ts
│   │           ├── onboarding/route.ts
│   │           └── webhook/route.ts
│   └── actions/
│       └── connect-actions.ts
└── types/
    └── connect.ts
```

## Type Definitions

```typescript
// src/types/connect.ts
import Stripe from 'stripe';

export type AccountType = 'express' | 'standard' | 'custom';

export interface CreateAccountParams {
  type: AccountType;
  email: string;
  country?: string;
  businessType?: Stripe.Account.BusinessType;
  metadata?: Record<string, string>;
  capabilities?: {
    cardPayments?: boolean;
    transfers?: boolean;
    bankTransferPayments?: boolean;
  };
}

export interface ConnectedAccount {
  id: string;
  email: string | null;
  type: AccountType;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
    disabledReason: string | null;
  };
  capabilities: {
    cardPayments: string;
    transfers: string;
  };
  balance: {
    available: number;
    pending: number;
    currency: string;
  };
  createdAt: Date;
}

export interface PaymentWithFee {
  amount: number;
  currency: string;
  applicationFee: number;
  platformFee: number;
  sellerReceives: number;
}

export interface TransferParams {
  amount: number;
  currency?: string;
  destinationAccountId: string;
  sourceTransactionId?: string;
  metadata?: Record<string, string>;
}

export interface PayoutSchedule {
  interval: 'daily' | 'weekly' | 'monthly' | 'manual';
  weeklyAnchor?: string;
  monthlyAnchor?: number;
  delayDays?: number;
}

export interface OnboardingStatus {
  complete: boolean;
  currentStep: string;
  stepsRemaining: number;
  percentComplete: number;
  blockedReason?: string;
}

export interface BalanceSummary {
  available: {
    amount: number;
    currency: string;
  }[];
  pending: {
    amount: number;
    currency: string;
  }[];
  instantAvailable?: {
    amount: number;
    currency: string;
  }[];
}

export interface EarningsReport {
  period: {
    start: Date;
    end: Date;
  };
  grossVolume: number;
  platformFees: number;
  refunds: number;
  netEarnings: number;
  payoutTotal: number;
  currency: string;
}
```

## Connected Account Management

```typescript
// src/lib/stripe/connect/accounts.ts
import Stripe from 'stripe';
import { getStripe } from '../server';
import { CreateAccountParams, ConnectedAccount, AccountType } from '@/types/connect';

export async function createConnectedAccount(
  params: CreateAccountParams
): Promise<Stripe.Account> {
  const stripe = getStripe();

  const accountParams: Stripe.AccountCreateParams = {
    type: params.type,
    email: params.email,
    country: params.country || 'US',
    business_type: params.businessType,
    metadata: params.metadata,
    capabilities: {
      card_payments: params.capabilities?.cardPayments !== false ? { requested: true } : undefined,
      transfers: params.capabilities?.transfers !== false ? { requested: true } : undefined,
    },
  };

  // Custom accounts require additional settings
  if (params.type === 'custom') {
    accountParams.tos_acceptance = {
      service_agreement: 'full',
    };
  }

  return stripe.accounts.create(accountParams);
}

export async function getConnectedAccount(
  accountId: string
): Promise<ConnectedAccount | null> {
  const stripe = getStripe();

  try {
    const account = await stripe.accounts.retrieve(accountId);

    // Get balance for this account
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    return formatAccount(account, balance);
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function listConnectedAccounts(
  limit = 10,
  startingAfter?: string
): Promise<{ accounts: ConnectedAccount[]; hasMore: boolean }> {
  const stripe = getStripe();

  const params: Stripe.AccountListParams = { limit };
  if (startingAfter) {
    params.starting_after = startingAfter;
  }

  const accounts = await stripe.accounts.list(params);

  const formattedAccounts = await Promise.all(
    accounts.data.map(async (account) => {
      try {
        const balance = await stripe.balance.retrieve({
          stripeAccount: account.id,
        });
        return formatAccount(account, balance);
      } catch {
        return formatAccount(account);
      }
    })
  );

  return {
    accounts: formattedAccounts,
    hasMore: accounts.has_more,
  };
}

export async function updateConnectedAccount(
  accountId: string,
  updates: Partial<{
    email: string;
    metadata: Record<string, string>;
    businessProfile: {
      name?: string;
      url?: string;
      supportEmail?: string;
      supportPhone?: string;
    };
  }>
): Promise<Stripe.Account> {
  const stripe = getStripe();

  return stripe.accounts.update(accountId, {
    email: updates.email,
    metadata: updates.metadata,
    business_profile: updates.businessProfile,
  });
}

export async function deleteConnectedAccount(accountId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.accounts.del(accountId);
}

function formatAccount(
  account: Stripe.Account,
  balance?: Stripe.Balance
): ConnectedAccount {
  const availableBalance = balance?.available?.[0];
  const pendingBalance = balance?.pending?.[0];

  return {
    id: account.id,
    email: account.email || null,
    type: account.type as AccountType,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requirements: {
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      pastDue: account.requirements?.past_due || [],
      pendingVerification: account.requirements?.pending_verification || [],
      disabledReason: account.requirements?.disabled_reason || null,
    },
    capabilities: {
      cardPayments: account.capabilities?.card_payments || 'inactive',
      transfers: account.capabilities?.transfers || 'inactive',
    },
    balance: {
      available: availableBalance?.amount || 0,
      pending: pendingBalance?.amount || 0,
      currency: availableBalance?.currency || 'usd',
    },
    createdAt: new Date(account.created * 1000),
  };
}
```

## Onboarding Flow

```typescript
// src/lib/stripe/connect/onboarding.ts
import Stripe from 'stripe';
import { getStripe } from '../server';
import { OnboardingStatus } from '@/types/connect';

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
  type: 'account_onboarding' | 'account_update' = 'account_onboarding'
): Promise<Stripe.AccountLink> {
  const stripe = getStripe();

  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type,
    collect: 'eventually_due',
  });
}

export async function createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
  const stripe = getStripe();
  return stripe.accounts.createLoginLink(accountId);
}

export async function getOnboardingStatus(
  accountId: string
): Promise<OnboardingStatus> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);

  const requirements = account.requirements;
  const totalRequired = [
    ...(requirements?.currently_due || []),
    ...(requirements?.eventually_due || []),
    ...(requirements?.past_due || []),
  ];

  const completed = account.details_submitted && account.charges_enabled;

  // Calculate progress
  const stepsRemaining = requirements?.currently_due?.length || 0;
  const totalSteps = totalRequired.length + (completed ? 0 : 1);
  const percentComplete = totalSteps === 0
    ? 100
    : Math.round(((totalSteps - stepsRemaining) / totalSteps) * 100);

  let currentStep = 'Complete';
  if (stepsRemaining > 0) {
    // Map requirement to friendly name
    const stepMappings: Record<string, string> = {
      'individual.first_name': 'Personal Information',
      'individual.last_name': 'Personal Information',
      'individual.dob.day': 'Date of Birth',
      'individual.address.line1': 'Address',
      'external_account': 'Bank Account',
      'tos_acceptance.date': 'Terms of Service',
      'business_profile.url': 'Business Information',
    };

    const firstRequirement = requirements?.currently_due?.[0] || '';
    currentStep = stepMappings[firstRequirement] || 'Additional Information';
  }

  return {
    complete: completed,
    currentStep,
    stepsRemaining,
    percentComplete,
    blockedReason: requirements?.disabled_reason || undefined,
  };
}

// Handle OAuth flow for Standard accounts
export async function handleOAuthCallback(
  code: string
): Promise<{ accountId: string; accessToken: string }> {
  const stripe = getStripe();

  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  });

  return {
    accountId: response.stripe_user_id!,
    accessToken: response.access_token!,
  };
}

export function getOAuthUrl(state: string): string {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  const redirectUri = process.env.STRIPE_CONNECT_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id: clientId!,
    response_type: 'code',
    scope: 'read_write',
    redirect_uri: redirectUri!,
    state,
  });

  return `https://connect.stripe.com/oauth/authorize?${params}`;
}
```

## Payment with Fees

```typescript
// src/lib/stripe/connect/fees.ts
import Stripe from 'stripe';
import { getStripe, formatAmountForStripe } from '../server';
import { PaymentWithFee } from '@/types/connect';

export interface CreatePaymentParams {
  amount: number;
  currency?: string;
  connectedAccountId: string;
  paymentMethodId?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
  applicationFeePercent?: number;
  onBehalfOf?: boolean;
}

// Direct charge: payment goes through connected account
export async function createDirectCharge(
  params: CreatePaymentParams
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  const currency = params.currency || 'usd';
  const amount = formatAmountForStripe(params.amount, currency);
  const feePercent = params.applicationFeePercent || parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10');
  const applicationFee = Math.round(amount * (feePercent / 100));

  return stripe.paymentIntents.create(
    {
      amount,
      currency,
      payment_method: params.paymentMethodId,
      customer: params.customerId,
      description: params.description,
      metadata: params.metadata,
      application_fee_amount: applicationFee,
      automatic_payment_methods: { enabled: true },
    },
    {
      stripeAccount: params.connectedAccountId,
    }
  );
}

// Destination charge: payment goes through platform, transferred to connected account
export async function createDestinationCharge(
  params: CreatePaymentParams
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  const currency = params.currency || 'usd';
  const amount = formatAmountForStripe(params.amount, currency);
  const feePercent = params.applicationFeePercent || parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10');
  const applicationFee = Math.round(amount * (feePercent / 100));

  return stripe.paymentIntents.create({
    amount,
    currency,
    payment_method: params.paymentMethodId,
    customer: params.customerId,
    description: params.description,
    metadata: params.metadata,
    application_fee_amount: applicationFee,
    transfer_data: {
      destination: params.connectedAccountId,
    },
    automatic_payment_methods: { enabled: true },
  });
}

// Separate charges and transfers: full control over funds flow
export async function createSeparateCharge(
  params: CreatePaymentParams
): Promise<{
  paymentIntent: Stripe.PaymentIntent;
  transferAmount: number;
}> {
  const stripe = getStripe();
  const currency = params.currency || 'usd';
  const amount = formatAmountForStripe(params.amount, currency);
  const feePercent = params.applicationFeePercent || parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10');
  const platformFee = Math.round(amount * (feePercent / 100));
  const transferAmount = amount - platformFee;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method: params.paymentMethodId,
    customer: params.customerId,
    description: params.description,
    metadata: {
      ...params.metadata,
      connected_account_id: params.connectedAccountId,
      transfer_amount: String(transferAmount),
    },
    automatic_payment_methods: { enabled: true },
  });

  return { paymentIntent, transferAmount };
}

export function calculateFees(
  amount: number,
  feePercent?: number
): PaymentWithFee {
  const fee = feePercent || parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10');
  const platformFee = amount * (fee / 100);
  const stripeFee = amount * 0.029 + 0.30; // Standard Stripe fee
  const applicationFee = platformFee;
  const sellerReceives = amount - platformFee - stripeFee;

  return {
    amount,
    currency: 'usd',
    applicationFee: Math.round(applicationFee * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    sellerReceives: Math.round(sellerReceives * 100) / 100,
  };
}
```

## Transfers and Payouts

```typescript
// src/lib/stripe/connect/transfers.ts
import Stripe from 'stripe';
import { getStripe, formatAmountForStripe } from '../server';
import { TransferParams, PayoutSchedule, BalanceSummary } from '@/types/connect';

export async function createTransfer(
  params: TransferParams
): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  const currency = params.currency || 'usd';

  const transferParams: Stripe.TransferCreateParams = {
    amount: formatAmountForStripe(params.amount, currency),
    currency,
    destination: params.destinationAccountId,
    metadata: params.metadata,
  };

  // Link to source transaction if provided (for refund handling)
  if (params.sourceTransactionId) {
    transferParams.source_transaction = params.sourceTransactionId;
  }

  return stripe.transfers.create(transferParams);
}

export async function reverseTransfer(
  transferId: string,
  amount?: number
): Promise<Stripe.TransferReversal> {
  const stripe = getStripe();

  const params: Stripe.TransferReversalCreateParams = {};
  if (amount) {
    params.amount = Math.round(amount * 100);
  }

  return stripe.transfers.createReversal(transferId, params);
}

export async function listTransfers(
  destinationAccountId?: string,
  limit = 10
): Promise<Stripe.Transfer[]> {
  const stripe = getStripe();

  const params: Stripe.TransferListParams = { limit };
  if (destinationAccountId) {
    params.destination = destinationAccountId;
  }

  const transfers = await stripe.transfers.list(params);
  return transfers.data;
}

// Payouts (from connected account to their bank)
export async function createPayout(
  accountId: string,
  amount: number,
  currency = 'usd'
): Promise<Stripe.Payout> {
  const stripe = getStripe();

  return stripe.payouts.create(
    {
      amount: formatAmountForStripe(amount, currency),
      currency,
    },
    {
      stripeAccount: accountId,
    }
  );
}

export async function listPayouts(
  accountId: string,
  limit = 10
): Promise<Stripe.Payout[]> {
  const stripe = getStripe();

  const payouts = await stripe.payouts.list(
    { limit },
    { stripeAccount: accountId }
  );

  return payouts.data;
}

export async function updatePayoutSchedule(
  accountId: string,
  schedule: PayoutSchedule
): Promise<Stripe.Account> {
  const stripe = getStripe();

  const scheduleParams: Stripe.AccountUpdateParams.Settings.Payouts.Schedule = {
    interval: schedule.interval,
  };

  if (schedule.interval === 'weekly' && schedule.weeklyAnchor) {
    scheduleParams.weekly_anchor = schedule.weeklyAnchor as any;
  }

  if (schedule.interval === 'monthly' && schedule.monthlyAnchor) {
    scheduleParams.monthly_anchor = schedule.monthlyAnchor;
  }

  if (schedule.delayDays !== undefined) {
    scheduleParams.delay_days = schedule.delayDays;
  }

  return stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: scheduleParams,
      },
    },
  });
}

export async function getBalance(accountId: string): Promise<BalanceSummary> {
  const stripe = getStripe();

  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  });

  return {
    available: balance.available.map((b) => ({
      amount: b.amount / 100,
      currency: b.currency,
    })),
    pending: balance.pending.map((b) => ({
      amount: b.amount / 100,
      currency: b.currency,
    })),
    instantAvailable: balance.instant_available?.map((b) => ({
      amount: b.amount / 100,
      currency: b.currency,
    })),
  };
}
```

## React Components

```tsx
// src/components/connect/OnboardingButton.tsx
'use client';

import { useState } from 'react';

interface OnboardingButtonProps {
  accountId?: string;
  onCreateAccount?: () => Promise<string>;
  onComplete?: () => void;
}

export function OnboardingButton({
  accountId,
  onCreateAccount,
  onComplete,
}: OnboardingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      let targetAccountId = accountId;

      // Create account if not provided
      if (!targetAccountId && onCreateAccount) {
        targetAccountId = await onCreateAccount();
      }

      if (!targetAccountId) {
        throw new Error('No account ID available');
      }

      // Get onboarding URL
      const response = await fetch('/api/stripe/connect/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: targetAccountId }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium
                 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Setting up...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {accountId ? 'Complete Setup' : 'Start Selling'}
        </>
      )}
    </button>
  );
}
```

```tsx
// src/components/connect/AccountStatus.tsx
'use client';

import { ConnectedAccount, OnboardingStatus } from '@/types/connect';

interface AccountStatusProps {
  account: ConnectedAccount;
  onboardingStatus: OnboardingStatus;
  onContinueOnboarding?: () => void;
  onViewDashboard?: () => void;
}

export function AccountStatus({
  account,
  onboardingStatus,
  onContinueOnboarding,
  onViewDashboard,
}: AccountStatusProps) {
  const getStatusColor = () => {
    if (account.chargesEnabled && account.payoutsEnabled) return 'green';
    if (account.requirements.pastDue.length > 0) return 'red';
    if (account.requirements.currentlyDue.length > 0) return 'yellow';
    return 'gray';
  };

  const statusColor = getStatusColor();
  const statusColors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Account Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[statusColor]}`}>
          {account.chargesEnabled ? 'Active' : 'Setup Required'}
        </span>
      </div>

      {/* Progress Bar */}
      {!onboardingStatus.complete && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Setup Progress</span>
            <span className="font-medium">{onboardingStatus.percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${onboardingStatus.percentComplete}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Current step: {onboardingStatus.currentStep}
          </p>
        </div>
      )}

      {/* Capabilities */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              account.chargesEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span className="text-sm font-medium">Payments</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {account.chargesEnabled ? 'Enabled' : 'Not enabled'}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              account.payoutsEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span className="text-sm font-medium">Payouts</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {account.payoutsEnabled ? 'Enabled' : 'Not enabled'}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="border-t pt-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Balance</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              ${(account.balance.available / 100).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-500">
              ${(account.balance.pending / 100).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      {account.requirements.currentlyDue.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Action Required
          </h4>
          <p className="text-sm text-yellow-700">
            {account.requirements.currentlyDue.length} item(s) need attention
            to keep your account active.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!onboardingStatus.complete && onContinueOnboarding && (
          <button
            onClick={onContinueOnboarding}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Continue Setup
          </button>
        )}
        {onboardingStatus.complete && onViewDashboard && (
          <button
            onClick={onViewDashboard}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            View Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
```

```tsx
// src/components/connect/EarningsDashboard.tsx
'use client';

import { BalanceSummary, EarningsReport } from '@/types/connect';

interface EarningsDashboardProps {
  balance: BalanceSummary;
  earnings: EarningsReport;
  onRequestPayout?: () => void;
}

export function EarningsDashboard({
  balance,
  earnings,
  onRequestPayout,
}: EarningsDashboardProps) {
  const formatCurrency = (amount: number, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const availableBalance = balance.available[0] || { amount: 0, currency: 'usd' };
  const pendingBalance = balance.pending[0] || { amount: 0, currency: 'usd' };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Available Balance</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(availableBalance.amount, availableBalance.currency)}
          </div>
          {onRequestPayout && availableBalance.amount > 0 && (
            <button
              onClick={onRequestPayout}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Request Payout
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Pending Balance</div>
          <div className="text-3xl font-bold text-gray-600">
            {formatCurrency(pendingBalance.amount, pendingBalance.currency)}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Usually available in 2 business days
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Total Payouts</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(earnings.payoutTotal, earnings.currency)}
          </div>
          <div className="text-xs text-gray-400 mt-2">This period</div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
        <div className="text-sm text-gray-500 mb-4">
          {earnings.period.start.toLocaleDateString()} - {earnings.period.end.toLocaleDateString()}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Gross Volume</span>
            <span className="font-medium">
              {formatCurrency(earnings.grossVolume, earnings.currency)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Platform Fees</span>
            <span className="text-red-600">
              -{formatCurrency(earnings.platformFees, earnings.currency)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Refunds</span>
            <span className="text-red-600">
              -{formatCurrency(earnings.refunds, earnings.currency)}
            </span>
          </div>
          <div className="flex justify-between py-2 text-lg font-bold">
            <span>Net Earnings</span>
            <span className="text-green-600">
              {formatCurrency(earnings.netEarnings, earnings.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Server Actions

```typescript
// src/app/actions/connect-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import {
  createConnectedAccount,
  getConnectedAccount,
  listConnectedAccounts,
} from '@/lib/stripe/connect/accounts';
import {
  createAccountLink,
  createLoginLink,
  getOnboardingStatus,
} from '@/lib/stripe/connect/onboarding';
import {
  createDestinationCharge,
  calculateFees,
} from '@/lib/stripe/connect/fees';
import {
  createTransfer,
  createPayout,
  getBalance,
  listPayouts,
} from '@/lib/stripe/connect/transfers';

export async function createConnectedAccountAction(
  email: string,
  type: 'express' | 'standard' | 'custom' = 'express'
) {
  try {
    const account = await createConnectedAccount({
      type,
      email,
      capabilities: {
        cardPayments: true,
        transfers: true,
      },
    });

    return { accountId: account.id };
  } catch (error) {
    console.error('Create connected account error:', error);
    throw new Error('Failed to create connected account');
  }
}

export async function getOnboardingUrlAction(
  accountId: string,
  returnUrl: string
) {
  try {
    const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connect/refresh`;
    const accountLink = await createAccountLink(
      accountId,
      refreshUrl,
      returnUrl
    );

    return { url: accountLink.url };
  } catch (error) {
    console.error('Get onboarding URL error:', error);
    throw new Error('Failed to get onboarding URL');
  }
}

export async function getDashboardUrlAction(accountId: string) {
  try {
    const loginLink = await createLoginLink(accountId);
    return { url: loginLink.url };
  } catch (error) {
    console.error('Get dashboard URL error:', error);
    throw new Error('Failed to get dashboard URL');
  }
}

export async function getConnectedAccountAction(accountId: string) {
  try {
    const account = await getConnectedAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const onboardingStatus = await getOnboardingStatus(accountId);

    return { account, onboardingStatus };
  } catch (error) {
    console.error('Get connected account error:', error);
    throw new Error('Failed to get connected account');
  }
}

export async function createMarketplacePaymentAction(params: {
  amount: number;
  sellerAccountId: string;
  description?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const paymentIntent = await createDestinationCharge({
      amount: params.amount,
      connectedAccountId: params.sellerAccountId,
      description: params.description,
      metadata: params.metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Create marketplace payment error:', error);
    throw new Error('Failed to create payment');
  }
}

export async function calculateFeesAction(amount: number) {
  return calculateFees(amount);
}

export async function getBalanceAction(accountId: string) {
  try {
    return await getBalance(accountId);
  } catch (error) {
    console.error('Get balance error:', error);
    throw new Error('Failed to get balance');
  }
}

export async function createPayoutAction(
  accountId: string,
  amount: number
) {
  try {
    const payout = await createPayout(accountId, amount);
    revalidatePath('/seller/dashboard');
    return { payoutId: payout.id, status: payout.status };
  } catch (error) {
    console.error('Create payout error:', error);
    throw new Error('Failed to create payout');
  }
}

export async function getPayoutHistoryAction(accountId: string) {
  try {
    return await listPayouts(accountId);
  } catch (error) {
    console.error('Get payout history error:', error);
    throw new Error('Failed to get payout history');
  }
}
```

## API Routes

```typescript
// src/app/api/stripe/connect/onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAccountLink } from '@/lib/stripe/connect/onboarding';

export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const accountLink = await createAccountLink(
      accountId,
      `${baseUrl}/connect/refresh`,
      `${baseUrl}/connect/complete`
    );

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/stripe/connect/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleWebhook } from '@/lib/stripe/webhooks';

const connectWebhookHandlers = {
  'account.updated': async (event: Stripe.Event) => {
    const account = event.data.object as Stripe.Account;
    console.log(`Account updated: ${account.id}`);

    // Check if onboarding is complete
    if (account.charges_enabled && account.payouts_enabled) {
      // Mark seller as verified in database
      // Send welcome email
    }
  },

  'account.application.deauthorized': async (event: Stripe.Event) => {
    const application = event.data.object as Stripe.Application;
    console.log(`Account disconnected: ${event.account}`);

    // Handle disconnect - revoke access, notify admin
  },

  'payout.created': async (event: Stripe.Event) => {
    const payout = event.data.object as Stripe.Payout;
    console.log(`Payout created: ${payout.id} for account ${event.account}`);
  },

  'payout.paid': async (event: Stripe.Event) => {
    const payout = event.data.object as Stripe.Payout;
    console.log(`Payout completed: ${payout.id}`);

    // Notify seller of successful payout
  },

  'payout.failed': async (event: Stripe.Event) => {
    const payout = event.data.object as Stripe.Payout;
    console.log(`Payout failed: ${payout.id}`);

    // Notify seller and admin of failed payout
  },

  'transfer.created': async (event: Stripe.Event) => {
    const transfer = event.data.object as Stripe.Transfer;
    console.log(`Transfer created: ${transfer.id}`);
  },

  'capability.updated': async (event: Stripe.Event) => {
    const capability = event.data.object as Stripe.Capability;
    console.log(`Capability ${capability.id} status: ${capability.status}`);
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
    const result = await handleWebhook(body, signature, connectWebhookHandlers);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Connect webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
```

## Testing

```typescript
// __tests__/connect.test.ts
import {
  createConnectedAccount,
  getConnectedAccount,
} from '@/lib/stripe/connect/accounts';
import { createDestinationCharge, calculateFees } from '@/lib/stripe/connect/fees';

describe('Stripe Connect Accounts', () => {
  let accountId: string;

  it('should create Express account', async () => {
    const account = await createConnectedAccount({
      type: 'express',
      email: `seller-${Date.now()}@example.com`,
    });

    expect(account.id).toMatch(/^acct_/);
    accountId = account.id;
  });

  it('should retrieve account', async () => {
    const account = await getConnectedAccount(accountId);
    expect(account?.id).toBe(accountId);
  });
});

describe('Fee Calculation', () => {
  it('should calculate platform fees correctly', () => {
    const fees = calculateFees(100);

    expect(fees.platformFee).toBe(10); // 10% default
    expect(fees.sellerReceives).toBeLessThan(90); // After Stripe fees
  });

  it('should respect custom fee percentage', () => {
    const fees = calculateFees(100, 15);

    expect(fees.platformFee).toBe(15);
  });
});
```

## CLAUDE.md Integration

```markdown
# Stripe Connect

## Account Types
- Express: Stripe-hosted onboarding, best for most marketplaces
- Standard: OAuth-based, seller manages their own Stripe
- Custom: Full control, requires more compliance work

## Charge Types
- Direct: Payment on connected account (buyer sees seller)
- Destination: Payment on platform, auto-transfer to seller
- Separate: Full control over timing of transfers

## Fee Structure
- Platform fee set via STRIPE_PLATFORM_FEE_PERCENT
- Can override per-transaction with applicationFeePercent

## Onboarding Flow
1. Create connected account
2. Generate account link
3. Redirect seller to Stripe onboarding
4. Handle return and check status
5. Webhook confirms completion

## Key Files
- `src/lib/stripe/connect/accounts.ts` - Account CRUD
- `src/lib/stripe/connect/onboarding.ts` - Onboarding flow
- `src/lib/stripe/connect/fees.ts` - Payment with fees
- `src/lib/stripe/connect/transfers.ts` - Transfers and payouts

## Testing Connected Accounts
- Use test mode to create accounts
- Skip verification in test mode
- Simulate payouts with test bank accounts
```

## AI Suggestions

1. **Add instant payouts** - Enable Instant Payouts for eligible accounts
2. **Implement split payments** - Support multiple recipients per transaction
3. **Add currency conversion** - Handle cross-border payments with currency conversion
4. **Implement 1099 reporting** - Generate tax forms for US sellers
5. **Add seller verification levels** - Tiered access based on verification status
6. **Implement escrow** - Hold funds until order completion
7. **Add refund routing** - Automatically reverse transfers on refunds
8. **Implement negative balance handling** - Handle seller chargebacks and disputes
9. **Add seller analytics** - Provide detailed earnings analytics
10. **Implement KYC refresh** - Periodic reverification for compliance
