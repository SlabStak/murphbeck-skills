# Checkout Flow Template

A comprehensive checkout system with multi-step flows, address validation, shipping calculation, and payment integration.

## Installation

```bash
npm install zustand zod react-hook-form @hookform/resolvers stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Shipping APIs (optional)
SHIPPO_API_KEY=shippo_...
EASYPOST_API_KEY=...

# Address Validation (optional)
SMARTY_AUTH_ID=...
SMARTY_AUTH_TOKEN=...

# Tax Calculation (optional)
TAXJAR_API_KEY=...
```

## Project Structure

```
lib/
├── checkout/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── store.ts              # Checkout state management
│   ├── validation.ts         # Form validation schemas
│   ├── shipping.ts           # Shipping calculation
│   ├── address.ts            # Address validation
│   └── tax.ts                # Tax calculation
components/
├── checkout/
│   ├── CheckoutProvider.tsx  # Context provider
│   ├── CheckoutWizard.tsx    # Multi-step wizard
│   ├── ContactStep.tsx       # Contact information
│   ├── ShippingStep.tsx      # Shipping address & method
│   ├── PaymentStep.tsx       # Payment information
│   ├── ReviewStep.tsx        # Order review
│   ├── OrderSummary.tsx      # Cart summary sidebar
│   ├── AddressForm.tsx       # Reusable address form
│   ├── ShippingOptions.tsx   # Shipping method selector
│   └── ProgressIndicator.tsx # Step progress
app/
├── checkout/
│   └── page.tsx              # Checkout page
├── api/
│   └── checkout/
│       ├── route.ts          # Create checkout session
│       ├── shipping/
│       │   └── route.ts      # Calculate shipping
│       ├── validate-address/
│       │   └── route.ts      # Validate address
│       └── complete/
│           └── route.ts      # Complete order
```

## Type Definitions

```typescript
// lib/checkout/types.ts
export type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review';

export interface ContactInfo {
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  marketingOptIn: boolean;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface ValidatedAddress extends Address {
  isValidated: boolean;
  validationResult?: {
    isValid: boolean;
    suggestedAddress?: Address;
    deliverability: 'deliverable' | 'undeliverable' | 'unknown';
    components?: {
      streetNumber: string;
      streetName: string;
      streetSuffix: string;
      city: string;
      state: string;
      zipCode: string;
      plus4Code?: string;
    };
  };
}

export interface ShippingMethod {
  id: string;
  carrier: string;
  service: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  estimatedDays: number;
  estimatedDelivery?: Date;
}

export interface PaymentInfo {
  method: 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'afterpay' | 'klarna';
  stripePaymentMethodId?: string;
  billingAddressSameAsShipping: boolean;
  billingAddress?: Address;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  quantity: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
}

export interface CheckoutState {
  step: CheckoutStep;
  contact: ContactInfo | null;
  shippingAddress: ValidatedAddress | null;
  billingAddress: Address | null;
  shippingMethod: ShippingMethod | null;
  availableShippingMethods: ShippingMethod[];
  payment: PaymentInfo | null;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;
  isProcessing: boolean;
  error: string | null;
  orderId?: string;
  orderNumber?: string;
}

export interface CheckoutSession {
  id: string;
  state: CheckoutState;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  paymentStatus?: 'succeeded' | 'processing' | 'failed';
  confirmationUrl?: string;
}

export interface CheckoutConfig {
  allowGuestCheckout: boolean;
  requirePhone: boolean;
  defaultCountry: string;
  allowedCountries: string[];
  allowedShippingMethods: string[];
  enableAddressValidation: boolean;
  enableTaxCalculation: boolean;
  paymentMethods: PaymentInfo['method'][];
  savePaymentMethods: boolean;
  abandonedCartRecovery: boolean;
  expirationMinutes: number;
}
```

## Checkout State Management

```typescript
// lib/checkout/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CheckoutState,
  CheckoutStep,
  ContactInfo,
  ValidatedAddress,
  Address,
  ShippingMethod,
  PaymentInfo,
  CartItem,
} from './types';

interface CheckoutStore extends CheckoutState {
  // Navigation
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceed: () => boolean;

  // Contact
  setContact: (contact: ContactInfo) => void;

  // Shipping
  setShippingAddress: (address: ValidatedAddress) => void;
  setAvailableShippingMethods: (methods: ShippingMethod[]) => void;
  setShippingMethod: (method: ShippingMethod) => void;

  // Billing
  setBillingAddress: (address: Address | null) => void;
  setBillingAddressSameAsShipping: (same: boolean) => void;

  // Payment
  setPayment: (payment: PaymentInfo) => void;

  // Cart
  setItems: (items: CartItem[]) => void;
  updateTotals: () => void;

  // Discount
  applyDiscount: (code: string, discount: number) => void;
  removeDiscount: () => void;

  // Processing
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  setOrderResult: (orderId: string, orderNumber: string) => void;

  // Reset
  resetCheckout: () => void;
}

const STEP_ORDER: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review'];

const initialState: CheckoutState = {
  step: 'contact',
  contact: null,
  shippingAddress: null,
  billingAddress: null,
  shippingMethod: null,
  availableShippingMethods: [],
  payment: null,
  items: [],
  subtotal: 0,
  shippingCost: 0,
  taxAmount: 0,
  discount: 0,
  discountCode: undefined,
  total: 0,
  currency: 'USD',
  isProcessing: false,
  error: null,
};

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step, error: null }),

      nextStep: () => {
        const { step } = get();
        const currentIndex = STEP_ORDER.indexOf(step);
        if (currentIndex < STEP_ORDER.length - 1) {
          set({ step: STEP_ORDER[currentIndex + 1], error: null });
        }
      },

      previousStep: () => {
        const { step } = get();
        const currentIndex = STEP_ORDER.indexOf(step);
        if (currentIndex > 0) {
          set({ step: STEP_ORDER[currentIndex - 1], error: null });
        }
      },

      canProceed: () => {
        const state = get();
        switch (state.step) {
          case 'contact':
            return !!state.contact;
          case 'shipping':
            return !!state.shippingAddress && !!state.shippingMethod;
          case 'payment':
            return !!state.payment;
          case 'review':
            return true;
          default:
            return false;
        }
      },

      setContact: (contact) => set({ contact, error: null }),

      setShippingAddress: (address) => {
        set({ shippingAddress: address, shippingMethod: null, error: null });
      },

      setAvailableShippingMethods: (methods) => {
        set({ availableShippingMethods: methods });
      },

      setShippingMethod: (method) => {
        set({ shippingMethod: method, shippingCost: method.price });
        get().updateTotals();
      },

      setBillingAddress: (address) => set({ billingAddress: address }),

      setBillingAddressSameAsShipping: (same) => {
        const { shippingAddress } = get();
        set({
          billingAddress: same && shippingAddress ? shippingAddress : null,
        });
      },

      setPayment: (payment) => set({ payment, error: null }),

      setItems: (items) => {
        const subtotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        set({ items, subtotal });
        get().updateTotals();
      },

      updateTotals: () => {
        const { subtotal, shippingCost, taxAmount, discount } = get();
        const total = Math.max(0, subtotal + shippingCost + taxAmount - discount);
        set({ total });
      },

      applyDiscount: (code, discount) => {
        set({ discountCode: code, discount });
        get().updateTotals();
      },

      removeDiscount: () => {
        set({ discountCode: undefined, discount: 0 });
        get().updateTotals();
      },

      setProcessing: (isProcessing) => set({ isProcessing }),

      setError: (error) => set({ error, isProcessing: false }),

      setOrderResult: (orderId, orderNumber) => set({ orderId, orderNumber }),

      resetCheckout: () => set(initialState),
    }),
    {
      name: 'checkout-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        contact: state.contact,
        shippingAddress: state.shippingAddress,
        billingAddress: state.billingAddress,
        shippingMethod: state.shippingMethod,
        discountCode: state.discountCode,
        discount: state.discount,
      }),
    }
  )
);

// Selectors
export const selectCheckoutProgress = (state: CheckoutStore) => {
  const steps = STEP_ORDER;
  const currentIndex = steps.indexOf(state.step);
  return {
    currentStep: state.step,
    currentIndex,
    totalSteps: steps.length,
    completedSteps: steps.slice(0, currentIndex),
    progress: ((currentIndex + 1) / steps.length) * 100,
  };
};

export const selectIsStepComplete = (step: CheckoutStep) => (state: CheckoutStore) => {
  switch (step) {
    case 'contact':
      return !!state.contact;
    case 'shipping':
      return !!state.shippingAddress && !!state.shippingMethod;
    case 'payment':
      return !!state.payment;
    case 'review':
      return false;
    default:
      return false;
  }
};
```

## Validation Schemas

```typescript
// lib/checkout/validation.ts
import { z } from 'zod';

export const contactSchema = z.object({
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  marketingOptIn: z.boolean().default(false),
});

export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  postalCode: z.string().min(1, 'Postal code required'),
  country: z.string().min(2, 'Country required'),
  phone: z.string().optional(),
});

export const shippingSchema = z.object({
  address: addressSchema,
  methodId: z.string().min(1, 'Shipping method required'),
});

export const paymentSchema = z.object({
  method: z.enum(['card', 'paypal', 'apple_pay', 'google_pay', 'afterpay', 'klarna']),
  stripePaymentMethodId: z.string().optional(),
  billingAddressSameAsShipping: z.boolean(),
  billingAddress: addressSchema.optional(),
}).refine(
  (data) => data.billingAddressSameAsShipping || data.billingAddress,
  { message: 'Billing address required', path: ['billingAddress'] }
);

export const discountSchema = z.object({
  code: z.string().min(1, 'Enter discount code'),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ShippingInput = z.infer<typeof shippingSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type DiscountInput = z.infer<typeof discountSchema>;
```

## Address Validation

```typescript
// lib/checkout/address.ts
import type { Address, ValidatedAddress } from './types';

interface SmartyResponse {
  input_index: number;
  candidate_index: number;
  delivery_line_1: string;
  delivery_line_2?: string;
  last_line: string;
  components: {
    primary_number: string;
    street_name: string;
    street_suffix: string;
    city_name: string;
    state_abbreviation: string;
    zipcode: string;
    plus4_code?: string;
  };
  analysis: {
    dpv_match_code: string;
    dpv_footnotes: string;
    active: string;
  };
}

export async function validateAddress(address: Address): Promise<ValidatedAddress> {
  const authId = process.env.SMARTY_AUTH_ID;
  const authToken = process.env.SMARTY_AUTH_TOKEN;

  if (!authId || !authToken) {
    // Return unvalidated if no API keys
    return {
      ...address,
      isValidated: false,
    };
  }

  try {
    const params = new URLSearchParams({
      'auth-id': authId,
      'auth-token': authToken,
      street: address.address1,
      street2: address.address2 || '',
      city: address.city,
      state: address.state,
      zipcode: address.postalCode,
      candidates: '1',
    });

    const response = await fetch(
      `https://us-street.api.smarty.com/street-address?${params}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error('Address validation failed');
    }

    const results: SmartyResponse[] = await response.json();

    if (results.length === 0) {
      return {
        ...address,
        isValidated: true,
        validationResult: {
          isValid: false,
          deliverability: 'undeliverable',
        },
      };
    }

    const result = results[0];
    const isDeliverable = result.analysis.dpv_match_code === 'Y';

    const suggestedAddress: Address = {
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      address1: result.delivery_line_1,
      address2: result.delivery_line_2,
      city: result.components.city_name,
      state: result.components.state_abbreviation,
      postalCode: result.components.plus4_code
        ? `${result.components.zipcode}-${result.components.plus4_code}`
        : result.components.zipcode,
      country: address.country,
      phone: address.phone,
    };

    return {
      ...address,
      isValidated: true,
      validationResult: {
        isValid: isDeliverable,
        suggestedAddress,
        deliverability: isDeliverable ? 'deliverable' : 'unknown',
        components: {
          streetNumber: result.components.primary_number,
          streetName: result.components.street_name,
          streetSuffix: result.components.street_suffix,
          city: result.components.city_name,
          state: result.components.state_abbreviation,
          zipCode: result.components.zipcode,
          plus4Code: result.components.plus4_code,
        },
      },
    };
  } catch (error) {
    console.error('Address validation error:', error);
    return {
      ...address,
      isValidated: false,
    };
  }
}

export function formatAddress(address: Address): string {
  const lines = [
    `${address.firstName} ${address.lastName}`,
    address.company,
    address.address1,
    address.address2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);

  return lines.join('\n');
}

export function areAddressesEqual(a: Address, b: Address): boolean {
  return (
    a.address1.toLowerCase() === b.address1.toLowerCase() &&
    (a.address2 || '').toLowerCase() === (b.address2 || '').toLowerCase() &&
    a.city.toLowerCase() === b.city.toLowerCase() &&
    a.state.toLowerCase() === b.state.toLowerCase() &&
    a.postalCode.replace(/[-\s]/g, '') === b.postalCode.replace(/[-\s]/g, '') &&
    a.country.toLowerCase() === b.country.toLowerCase()
  );
}
```

## Shipping Calculation

```typescript
// lib/checkout/shipping.ts
import type { Address, CartItem, ShippingMethod } from './types';

interface ShippoRate {
  object_id: string;
  carrier_account: string;
  servicelevel: {
    name: string;
    token: string;
  };
  amount: string;
  currency: string;
  estimated_days: number;
  duration_terms: string;
  provider: string;
}

interface ShippoShipment {
  object_id: string;
  rates: ShippoRate[];
}

export async function calculateShipping(
  origin: Address,
  destination: Address,
  items: CartItem[]
): Promise<ShippingMethod[]> {
  const apiKey = process.env.SHIPPO_API_KEY;

  if (!apiKey) {
    // Return mock rates if no API key
    return getMockShippingRates();
  }

  try {
    // Calculate total weight and dimensions
    const totalWeight = items.reduce(
      (sum, item) => sum + (item.weight || 0.5) * item.quantity,
      0
    );

    const parcel = {
      length: '10',
      width: '8',
      height: '4',
      distance_unit: 'in',
      weight: String(Math.max(totalWeight, 0.5)),
      mass_unit: 'lb',
    };

    const shipment = {
      address_from: {
        name: `${origin.firstName} ${origin.lastName}`,
        street1: origin.address1,
        street2: origin.address2,
        city: origin.city,
        state: origin.state,
        zip: origin.postalCode,
        country: origin.country,
      },
      address_to: {
        name: `${destination.firstName} ${destination.lastName}`,
        street1: destination.address1,
        street2: destination.address2,
        city: destination.city,
        state: destination.state,
        zip: destination.postalCode,
        country: destination.country,
      },
      parcels: [parcel],
      async: false,
    };

    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipment),
    });

    if (!response.ok) {
      throw new Error('Failed to get shipping rates');
    }

    const result: ShippoShipment = await response.json();

    return result.rates.map((rate) => ({
      id: rate.object_id,
      carrier: rate.provider,
      service: rate.servicelevel.token,
      name: `${rate.provider} ${rate.servicelevel.name}`,
      description: rate.duration_terms,
      price: Math.round(parseFloat(rate.amount) * 100) / 100,
      currency: rate.currency.toUpperCase(),
      estimatedDays: rate.estimated_days,
      estimatedDelivery: addBusinessDays(new Date(), rate.estimated_days),
    }));
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return getMockShippingRates();
  }
}

function getMockShippingRates(): ShippingMethod[] {
  const today = new Date();

  return [
    {
      id: 'standard',
      carrier: 'USPS',
      service: 'standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: 5.99,
      currency: 'USD',
      estimatedDays: 7,
      estimatedDelivery: addBusinessDays(today, 7),
    },
    {
      id: 'express',
      carrier: 'UPS',
      service: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 12.99,
      currency: 'USD',
      estimatedDays: 3,
      estimatedDelivery: addBusinessDays(today, 3),
    },
    {
      id: 'overnight',
      carrier: 'FedEx',
      service: 'overnight',
      name: 'Overnight Shipping',
      description: 'Next business day',
      price: 24.99,
      currency: 'USD',
      estimatedDays: 1,
      estimatedDelivery: addBusinessDays(today, 1),
    },
  ];
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  return result;
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isFreeShippingEligible(subtotal: number, threshold: number = 50): boolean {
  return subtotal >= threshold;
}
```

## Tax Calculation

```typescript
// lib/checkout/tax.ts
import type { Address, CartItem } from './types';

interface TaxJarResponse {
  tax: {
    amount_to_collect: number;
    rate: number;
    has_nexus: boolean;
    freight_taxable: boolean;
    tax_source: string;
    breakdown?: {
      state_taxable_amount: number;
      state_tax_rate: number;
      state_tax_collectable: number;
      county_taxable_amount: number;
      county_tax_rate: number;
      county_tax_collectable: number;
      city_taxable_amount: number;
      city_tax_rate: number;
      city_tax_collectable: number;
      special_district_taxable_amount: number;
      special_tax_rate: number;
      special_district_tax_collectable: number;
    };
  };
}

interface TaxCalculation {
  taxAmount: number;
  taxRate: number;
  taxBreakdown?: {
    state: number;
    county: number;
    city: number;
    special: number;
  };
  isTaxable: boolean;
}

export async function calculateTax(
  fromAddress: Address,
  toAddress: Address,
  items: CartItem[],
  shippingCost: number
): Promise<TaxCalculation> {
  const apiKey = process.env.TAXJAR_API_KEY;

  if (!apiKey) {
    // Return mock tax calculation
    return calculateMockTax(toAddress, items, shippingCost);
  }

  try {
    const lineItems = items.map((item, index) => ({
      id: item.id || String(index),
      quantity: item.quantity,
      unit_price: item.price,
      product_tax_code: '00000', // General goods
    }));

    const response = await fetch('https://api.taxjar.com/v2/taxes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_country: fromAddress.country,
        from_zip: fromAddress.postalCode,
        from_state: fromAddress.state,
        from_city: fromAddress.city,
        from_street: fromAddress.address1,
        to_country: toAddress.country,
        to_zip: toAddress.postalCode,
        to_state: toAddress.state,
        to_city: toAddress.city,
        to_street: toAddress.address1,
        shipping: shippingCost,
        line_items: lineItems,
      }),
    });

    if (!response.ok) {
      throw new Error('Tax calculation failed');
    }

    const result: TaxJarResponse = await response.json();
    const { tax } = result;

    return {
      taxAmount: Math.round(tax.amount_to_collect * 100) / 100,
      taxRate: tax.rate,
      taxBreakdown: tax.breakdown
        ? {
            state: tax.breakdown.state_tax_collectable,
            county: tax.breakdown.county_tax_collectable,
            city: tax.breakdown.city_tax_collectable,
            special: tax.breakdown.special_district_tax_collectable,
          }
        : undefined,
      isTaxable: tax.has_nexus,
    };
  } catch (error) {
    console.error('Tax calculation error:', error);
    return calculateMockTax(toAddress, items, shippingCost);
  }
}

function calculateMockTax(
  address: Address,
  items: CartItem[],
  shippingCost: number
): TaxCalculation {
  // State tax rates (simplified)
  const stateTaxRates: Record<string, number> = {
    CA: 0.0725,
    NY: 0.08,
    TX: 0.0625,
    FL: 0.06,
    WA: 0.065,
    // No sales tax
    DE: 0,
    MT: 0,
    NH: 0,
    OR: 0,
    AK: 0,
  };

  const rate = stateTaxRates[address.state] || 0.05;
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Some states tax shipping
  const taxableAmount = ['CA', 'NY', 'TX'].includes(address.state)
    ? subtotal + shippingCost
    : subtotal;

  return {
    taxAmount: Math.round(taxableAmount * rate * 100) / 100,
    taxRate: rate,
    isTaxable: rate > 0,
  };
}

export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}
```

## React Components

```tsx
// components/checkout/CheckoutProvider.tsx
'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useCheckoutStore } from '@/lib/checkout/store';
import type { CartItem, CheckoutConfig } from '@/lib/checkout/types';

interface CheckoutContextValue {
  config: CheckoutConfig;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

let stripePromise: Promise<Stripe | null>;

function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

const defaultConfig: CheckoutConfig = {
  allowGuestCheckout: true,
  requirePhone: false,
  defaultCountry: 'US',
  allowedCountries: ['US', 'CA', 'GB', 'AU'],
  allowedShippingMethods: ['standard', 'express', 'overnight'],
  enableAddressValidation: true,
  enableTaxCalculation: true,
  paymentMethods: ['card', 'apple_pay', 'google_pay'],
  savePaymentMethods: true,
  abandonedCartRecovery: true,
  expirationMinutes: 30,
};

interface CheckoutProviderProps {
  children: ReactNode;
  items: CartItem[];
  config?: Partial<CheckoutConfig>;
}

export function CheckoutProvider({
  children,
  items,
  config: customConfig,
}: CheckoutProviderProps) {
  const config = { ...defaultConfig, ...customConfig };
  const setItems = useCheckoutStore((state) => state.setItems);

  useEffect(() => {
    setItems(items);
  }, [items, setItems]);

  return (
    <CheckoutContext.Provider value={{ config }}>
      <Elements stripe={getStripe()}>
        {children}
      </Elements>
    </CheckoutContext.Provider>
  );
}

export function useCheckoutConfig() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckoutConfig must be used within CheckoutProvider');
  }
  return context.config;
}
```

```tsx
// components/checkout/CheckoutWizard.tsx
'use client';

import { useCheckoutStore, selectCheckoutProgress } from '@/lib/checkout/store';
import { ContactStep } from './ContactStep';
import { ShippingStep } from './ShippingStep';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';
import { OrderSummary } from './OrderSummary';
import { ProgressIndicator } from './ProgressIndicator';

export function CheckoutWizard() {
  const step = useCheckoutStore((state) => state.step);
  const progress = useCheckoutStore(selectCheckoutProgress);

  const renderStep = () => {
    switch (step) {
      case 'contact':
        return <ContactStep />;
      case 'shipping':
        return <ShippingStep />;
      case 'payment':
        return <PaymentStep />;
      case 'review':
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProgressIndicator {...progress} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {renderStep()}
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// components/checkout/ProgressIndicator.tsx
'use client';

import { CheckIcon } from 'lucide-react';
import type { CheckoutStep } from '@/lib/checkout/types';

interface ProgressIndicatorProps {
  currentStep: CheckoutStep;
  currentIndex: number;
  totalSteps: number;
  completedSteps: CheckoutStep[];
}

const STEP_LABELS: Record<CheckoutStep, string> = {
  contact: 'Contact',
  shipping: 'Shipping',
  payment: 'Payment',
  review: 'Review',
};

const STEPS: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review'];

export function ProgressIndicator({
  currentStep,
  completedSteps,
}: ProgressIndicatorProps) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;

          return (
            <li
              key={step}
              className={`flex items-center ${index !== STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex items-center">
                <span
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${isCompleted ? 'bg-green-600' : ''}
                    ${isCurrent ? 'bg-blue-600' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-200' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        isCurrent ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>

                <span
                  className={`ml-3 text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : ''
                  } ${isCompleted ? 'text-green-600' : ''} ${
                    !isCompleted && !isCurrent ? 'text-gray-500' : ''
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>

              {index !== STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

```tsx
// components/checkout/ContactStep.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCheckoutStore } from '@/lib/checkout/store';
import { contactSchema, ContactInput } from '@/lib/checkout/validation';
import { useCheckoutConfig } from './CheckoutProvider';

export function ContactStep() {
  const config = useCheckoutConfig();
  const contact = useCheckoutStore((state) => state.contact);
  const setContact = useCheckoutStore((state) => state.setContact);
  const nextStep = useCheckoutStore((state) => state.nextStep);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact || {
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      marketingOptIn: false,
    },
  });

  const onSubmit = async (data: ContactInput) => {
    setContact(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-semibold">Contact Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            {...register('firstName')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            {...register('lastName')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {config.requirePhone && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      )}

      <div className="flex items-center">
        <input
          {...register('marketingOptIn')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="ml-2 text-sm text-gray-600">
          Sign up for news and exclusive offers
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Continue to Shipping
        </button>
      </div>
    </form>
  );
}
```

```tsx
// components/checkout/ShippingStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCheckoutStore } from '@/lib/checkout/store';
import { addressSchema, AddressInput } from '@/lib/checkout/validation';
import { AddressForm } from './AddressForm';
import { ShippingOptions } from './ShippingOptions';
import { useCheckoutConfig } from './CheckoutProvider';
import type { ShippingMethod, ValidatedAddress } from '@/lib/checkout/types';

export function ShippingStep() {
  const config = useCheckoutConfig();
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  const items = useCheckoutStore((state) => state.items);
  const setShippingAddress = useCheckoutStore((state) => state.setShippingAddress);
  const setAvailableShippingMethods = useCheckoutStore(
    (state) => state.setAvailableShippingMethods
  );
  const availableShippingMethods = useCheckoutStore(
    (state) => state.availableShippingMethods
  );
  const shippingMethod = useCheckoutStore((state) => state.shippingMethod);
  const setShippingMethod = useCheckoutStore((state) => state.setShippingMethod);
  const nextStep = useCheckoutStore((state) => state.nextStep);
  const previousStep = useCheckoutStore((state) => state.previousStep);

  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: shippingAddress || {
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: config.defaultCountry,
    },
  });

  const watchedAddress = watch();

  const validateAndFetchRates = async (address: AddressInput) => {
    setIsValidating(true);

    try {
      // Validate address
      const validateResponse = await fetch('/api/checkout/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      const validatedAddress: ValidatedAddress = await validateResponse.json();

      if (
        validatedAddress.validationResult?.suggestedAddress &&
        !validatedAddress.validationResult.isValid
      ) {
        setShowSuggestion(true);
      }

      setShippingAddress(validatedAddress);

      // Fetch shipping rates
      setIsLoadingRates(true);

      const ratesResponse = await fetch('/api/checkout/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: validatedAddress, items }),
      });

      const rates: ShippingMethod[] = await ratesResponse.json();
      setAvailableShippingMethods(rates);
    } catch (error) {
      console.error('Error validating address:', error);
    } finally {
      setIsValidating(false);
      setIsLoadingRates(false);
    }
  };

  const handleAddressSubmit = async (data: AddressInput) => {
    await validateAndFetchRates(data);
  };

  const handleUseSuggested = () => {
    const suggested = shippingAddress?.validationResult?.suggestedAddress;
    if (suggested) {
      Object.entries(suggested).forEach(([key, value]) => {
        setValue(key as keyof AddressInput, value as string);
      });
      setShowSuggestion(false);
    }
  };

  const handleContinue = () => {
    if (shippingAddress && shippingMethod) {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Shipping Address</h2>

      <form onSubmit={handleSubmit(handleAddressSubmit)}>
        <AddressForm
          register={register}
          errors={errors}
          countries={config.allowedCountries}
        />

        <button
          type="submit"
          disabled={isValidating}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : 'Calculate Shipping'}
        </button>
      </form>

      {showSuggestion && shippingAddress?.validationResult?.suggestedAddress && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            We found a more accurate address. Would you like to use it?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleUseSuggested}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
            >
              Use Suggested
            </button>
            <button
              onClick={() => setShowSuggestion(false)}
              className="px-3 py-1 bg-gray-200 rounded text-sm"
            >
              Keep Original
            </button>
          </div>
        </div>
      )}

      {availableShippingMethods.length > 0 && (
        <ShippingOptions
          methods={availableShippingMethods}
          selectedId={shippingMethod?.id}
          onSelect={setShippingMethod}
          isLoading={isLoadingRates}
        />
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={previousStep}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!shippingAddress || !shippingMethod}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
```

```tsx
// components/checkout/AddressForm.tsx
'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { AddressInput } from '@/lib/checkout/validation';

interface AddressFormProps {
  register: UseFormRegister<AddressInput>;
  errors: FieldErrors<AddressInput>;
  countries: string[];
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
};

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'NY', name: 'New York' },
  { code: 'TX', name: 'Texas' },
  // ... more states
];

export function AddressForm({ register, errors, countries }: AddressFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            {...register('firstName')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            {...register('lastName')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Company (optional)
        </label>
        <input
          {...register('company')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          {...register('address1')}
          type="text"
          placeholder="Street address"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.address1 && (
          <p className="mt-1 text-sm text-red-600">{errors.address1.message}</p>
        )}
      </div>

      <div>
        <input
          {...register('address2')}
          type="text"
          placeholder="Apartment, suite, etc. (optional)"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            {...register('city')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            State
          </label>
          <select
            {...register('state')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            {...register('postalCode')}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <select
          {...register('country')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {countries.map((code) => (
            <option key={code} value={code}>
              {COUNTRY_NAMES[code] || code}
            </option>
          ))}
        </select>
        {errors.country && (
          <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
        )}
      </div>
    </div>
  );
}
```

```tsx
// components/checkout/ShippingOptions.tsx
'use client';

import { TruckIcon } from 'lucide-react';
import type { ShippingMethod } from '@/lib/checkout/types';
import { formatDeliveryDate } from '@/lib/checkout/shipping';

interface ShippingOptionsProps {
  methods: ShippingMethod[];
  selectedId?: string;
  onSelect: (method: ShippingMethod) => void;
  isLoading: boolean;
}

export function ShippingOptions({
  methods,
  selectedId,
  onSelect,
  isLoading,
}: ShippingOptionsProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Shipping Method</h3>

      <div className="space-y-3">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`
              flex items-center p-4 border rounded-lg cursor-pointer
              ${selectedId === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <input
              type="radio"
              name="shippingMethod"
              value={method.id}
              checked={selectedId === method.id}
              onChange={() => onSelect(method)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />

            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
                <p className="font-medium">
                  {method.price === 0 ? 'FREE' : `$${method.price.toFixed(2)}`}
                </p>
              </div>

              {method.estimatedDelivery && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <TruckIcon className="w-4 h-4 mr-1" />
                  <span>
                    Estimated delivery: {formatDeliveryDate(method.estimatedDelivery)}
                  </span>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// components/checkout/PaymentStep.tsx
'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCheckoutStore } from '@/lib/checkout/store';
import { AddressForm } from './AddressForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, AddressInput } from '@/lib/checkout/validation';

export function PaymentStep() {
  const stripe = useStripe();
  const elements = useElements();

  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  const setPayment = useCheckoutStore((state) => state.setPayment);
  const setBillingAddress = useCheckoutStore((state) => state.setBillingAddress);
  const nextStep = useCheckoutStore((state) => state.nextStep);
  const previousStep = useCheckoutStore((state) => state.previousStep);
  const setError = useCheckoutStore((state) => state.setError);

  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: shippingAddress || undefined,
  });

  const handleContinue = async () => {
    if (!stripe || !elements) return;

    try {
      // Validate card element
      const { error } = await elements.submit();

      if (error) {
        setError(error.message || 'Payment validation failed');
        return;
      }

      setPayment({
        method: 'card',
        billingAddressSameAsShipping,
      });

      if (!billingAddressSameAsShipping) {
        const billingData = await new Promise<AddressInput>((resolve, reject) => {
          handleSubmit(resolve, reject)();
        });
        setBillingAddress(billingData);
      } else if (shippingAddress) {
        setBillingAddress(shippingAddress);
      }

      nextStep();
    } catch (error) {
      setError('Please complete payment information');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Payment Information</h2>

      <div className="bg-gray-50 rounded-lg p-4">
        <PaymentElement
          onReady={() => setIsReady(true)}
          options={{
            layout: 'accordion',
          }}
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Billing Address</h3>

        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={billingAddressSameAsShipping}
            onChange={(e) => setBillingAddressSameAsShipping(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">
            Same as shipping address
          </span>
        </label>

        {!billingAddressSameAsShipping && (
          <AddressForm
            register={register}
            errors={errors}
            countries={['US', 'CA', 'GB', 'AU']}
          />
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={previousStep}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!stripe || !elements || !isReady}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Review Order
        </button>
      </div>
    </div>
  );
}
```

```tsx
// components/checkout/ReviewStep.tsx
'use client';

import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useCheckoutStore } from '@/lib/checkout/store';
import { formatAddress } from '@/lib/checkout/address';
import { formatDeliveryDate } from '@/lib/checkout/shipping';
import { useRouter } from 'next/navigation';

export function ReviewStep() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const state = useCheckoutStore();
  const {
    contact,
    shippingAddress,
    billingAddress,
    shippingMethod,
    items,
    subtotal,
    shippingCost,
    taxAmount,
    discount,
    total,
    isProcessing,
    error,
    setProcessing,
    setError,
    setOrderResult,
    resetCheckout,
    previousStep,
  } = state;

  const handlePlaceOrder = async () => {
    if (!stripe || !elements || !contact || !shippingAddress) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent on server
      const intentResponse = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          shippingAddress,
          billingAddress,
          shippingMethod,
          items,
          subtotal,
          shippingCost,
          taxAmount,
          discount,
          total,
        }),
      });

      const { clientSecret, orderId, orderNumber } = await intentResponse.json();

      // Confirm payment with Stripe
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        return;
      }

      // Payment succeeded
      setOrderResult(orderId, orderNumber);
      resetCheckout();
      router.push(`/checkout/success?order=${orderId}`);
    } catch (error) {
      setError('Failed to process order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review Your Order</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Contact Information */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">Contact</h3>
            <p className="text-sm text-gray-600 mt-1">{contact?.email}</p>
            {contact?.phone && (
              <p className="text-sm text-gray-600">{contact.phone}</p>
            )}
          </div>
          <button
            onClick={() => useCheckoutStore.getState().setStep('contact')}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">Ship to</h3>
            {shippingAddress && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                {formatAddress(shippingAddress)}
              </p>
            )}
          </div>
          <button
            onClick={() => useCheckoutStore.getState().setStep('shipping')}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">Shipping Method</h3>
            {shippingMethod && (
              <div className="text-sm text-gray-600 mt-1">
                <p>{shippingMethod.name}</p>
                {shippingMethod.estimatedDelivery && (
                  <p>
                    Estimated delivery:{' '}
                    {formatDeliveryDate(shippingMethod.estimatedDelivery)}
                  </p>
                )}
              </div>
            )}
          </div>
          <p className="font-medium">
            {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-4">Order Items</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={previousStep}
          disabled={isProcessing}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
```

```tsx
// components/checkout/OrderSummary.tsx
'use client';

import { useState } from 'react';
import { useCheckoutStore } from '@/lib/checkout/store';
import { TagIcon, XIcon } from 'lucide-react';

export function OrderSummary() {
  const {
    items,
    subtotal,
    shippingCost,
    taxAmount,
    discount,
    discountCode,
    total,
    applyDiscount,
    removeDiscount,
  } = useCheckoutStore();

  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleApplyDiscount = async () => {
    if (!code.trim()) return;

    setIsApplying(true);
    setCodeError(null);

    try {
      const response = await fetch('/api/checkout/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });

      const result = await response.json();

      if (result.valid) {
        applyDiscount(code, result.discount);
        setCode('');
      } else {
        setCodeError(result.message || 'Invalid discount code');
      }
    } catch (error) {
      setCodeError('Failed to apply discount code');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
            </div>
            <p className="text-sm">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Discount Code */}
      {!discountCode ? (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Discount code"
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <button
              onClick={handleApplyDiscount}
              disabled={isApplying || !code}
              className="px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {codeError && (
            <p className="mt-1 text-sm text-red-600">{codeError}</p>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {discountCode}
            </span>
          </div>
          <button
            onClick={removeDiscount}
            className="p-1 hover:bg-green-100 rounded"
          >
            <XIcon className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span>
            {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>

        {taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
```

## API Routes

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { items, currency = 'usd' } = await request.json();

    const amount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity * 100,
      0
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/checkout/validate-address/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateAddress } from '@/lib/checkout/address';

export async function POST(request: NextRequest) {
  try {
    const address = await request.json();
    const validatedAddress = await validateAddress(address);
    return NextResponse.json(validatedAddress);
  } catch (error) {
    console.error('Address validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate address' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/checkout/shipping/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/checkout/shipping';

// Store origin address (your fulfillment center)
const ORIGIN_ADDRESS = {
  firstName: 'Fulfillment',
  lastName: 'Center',
  address1: '123 Warehouse St',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94102',
  country: 'US',
};

export async function POST(request: NextRequest) {
  try {
    const { address, items } = await request.json();
    const rates = await calculateShipping(ORIGIN_ADDRESS, address, items);
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/checkout/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const {
      contact,
      shippingAddress,
      billingAddress,
      shippingMethod,
      items,
      subtotal,
      shippingCost,
      taxAmount,
      discount,
      total,
    } = await request.json();

    // Generate order ID
    const orderId = nanoid();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId,
        orderNumber,
        customerEmail: contact.email,
      },
      receipt_email: contact.email,
      shipping: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        address: {
          line1: shippingAddress.address1,
          line2: shippingAddress.address2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
        carrier: shippingMethod.carrier,
      },
    });

    // TODO: Save order to database
    // await db.orders.create({
    //   id: orderId,
    //   orderNumber,
    //   paymentIntentId: paymentIntent.id,
    //   contact,
    //   shippingAddress,
    //   billingAddress,
    //   shippingMethod,
    //   items,
    //   subtotal,
    //   shippingCost,
    //   taxAmount,
    //   discount,
    //   total,
    //   status: 'pending',
    //   createdAt: new Date(),
    // });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId,
      orderNumber,
    });
  } catch (error) {
    console.error('Order completion error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/checkout/discount/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount: number;
}

// Mock discount codes (replace with database)
const DISCOUNT_CODES: DiscountCode[] = [
  {
    code: 'SAVE10',
    type: 'percentage',
    value: 10,
    maxDiscount: 50,
    usedCount: 0,
  },
  {
    code: 'FLAT20',
    type: 'fixed',
    value: 20,
    minOrderAmount: 100,
    usedCount: 0,
  },
  {
    code: 'FREESHIP',
    type: 'fixed',
    value: 0,
    usedCount: 0,
  },
];

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    const discountCode = DISCOUNT_CODES.find(
      (dc) => dc.code.toLowerCase() === code.toLowerCase()
    );

    if (!discountCode) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid discount code',
      });
    }

    if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
      return NextResponse.json({
        valid: false,
        message: 'This discount code has expired',
      });
    }

    if (
      discountCode.usageLimit &&
      discountCode.usedCount >= discountCode.usageLimit
    ) {
      return NextResponse.json({
        valid: false,
        message: 'This discount code has reached its usage limit',
      });
    }

    if (discountCode.minOrderAmount && subtotal < discountCode.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order amount of $${discountCode.minOrderAmount} required`,
      });
    }

    let discount = 0;
    if (discountCode.type === 'percentage') {
      discount = subtotal * (discountCode.value / 100);
      if (discountCode.maxDiscount) {
        discount = Math.min(discount, discountCode.maxDiscount);
      }
    } else {
      discount = discountCode.value;
    }

    return NextResponse.json({
      valid: true,
      discount: Math.round(discount * 100) / 100,
      message: 'Discount applied!',
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}
```

## Checkout Page

```tsx
// app/checkout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { CheckoutProvider } from '@/components/checkout/CheckoutProvider';
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard';
import type { CartItem } from '@/lib/checkout/types';

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load cart items from your cart store
    const loadCart = async () => {
      // Replace with your cart loading logic
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setItems(cart);
      setIsLoading(false);
    };
    loadCart();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <a href="/" className="text-blue-600 hover:underline">
          Continue shopping
        </a>
      </div>
    );
  }

  return (
    <CheckoutProvider items={items}>
      <CheckoutWizard />
    </CheckoutProvider>
  );
}
```

```tsx
// app/checkout/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';

interface OrderDetails {
  orderNumber: string;
  email: string;
  total: number;
  estimatedDelivery?: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        // Fetch order details
        // const response = await fetch(`/api/orders/${orderId}`);
        // const data = await response.json();
        // setOrder(data);

        // Mock order details
        setOrder({
          orderNumber: 'ORD-ABC123',
          email: 'customer@example.com',
          total: 99.99,
          estimatedDelivery: 'January 20, 2026',
        });
      }
      setIsLoading(false);
    };
    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for your order. We&apos;ve sent a confirmation to{' '}
          <span className="font-medium">{order?.email}</span>
        </p>

        {order && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Order number</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">${order.total.toFixed(2)}</span>
            </div>
            {order.estimatedDelivery && (
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated delivery</span>
                <span className="font-medium">{order.estimatedDelivery}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/orders"
            className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Order
          </Link>
          <Link
            href="/"
            className="block w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
```

## CLAUDE.md Integration

```markdown
## Checkout System

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests

### Key Files
- `lib/checkout/store.ts` - Zustand checkout state
- `lib/checkout/validation.ts` - Zod validation schemas
- `lib/checkout/address.ts` - Address validation (Smarty API)
- `lib/checkout/shipping.ts` - Shipping calculation (Shippo API)
- `lib/checkout/tax.ts` - Tax calculation (TaxJar API)

### Checkout Flow
1. Contact → 2. Shipping → 3. Payment → 4. Review → Order

### API Routes
- POST `/api/checkout` - Create payment intent
- POST `/api/checkout/validate-address` - Validate shipping address
- POST `/api/checkout/shipping` - Get shipping rates
- POST `/api/checkout/complete` - Complete order
- POST `/api/checkout/discount` - Validate discount code

### Configuration
- Edit `CheckoutProvider` for default config
- Configure allowed countries, payment methods
- Set free shipping threshold in `shipping.ts`

### Testing Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155
```

## AI Suggestions

1. **Express Checkout** - Add Apple Pay and Google Pay express checkout buttons on cart page for one-click purchases
2. **Guest Checkout Email Capture** - Capture email early in flow for abandoned cart recovery before checkout completion
3. **Address Autocomplete** - Integrate Google Places or Mapbox Address Autofill for faster address entry
4. **Saved Addresses** - Allow authenticated users to save multiple shipping addresses for faster checkout
5. **Order Tracking** - Add real-time order tracking with carrier integration and email/SMS updates
6. **Inventory Reservation** - Reserve inventory during checkout to prevent overselling during payment processing
7. **Multi-Currency Support** - Add currency detection and conversion for international customers
8. **Checkout Analytics** - Track step completion, drop-off rates, and payment method preferences
9. **Gift Options** - Add gift wrapping, gift messages, and ship-to-different-address options
10. **A/B Testing** - Implement checkout flow variations to optimize conversion rates
