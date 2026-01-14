# Shopping Cart Template

Production-ready shopping cart system with persistent storage, real-time updates, discount codes, and checkout integration.

## Installation

```bash
npm install zustand immer zod
npm install @tanstack/react-query  # For cart sync
npm install js-cookie  # For guest carts
```

## Environment Variables

```env
# Cart Settings
CART_COOKIE_NAME=cart_id
CART_EXPIRY_DAYS=30
CART_MAX_ITEMS=100
CART_MAX_QUANTITY_PER_ITEM=99

# Tax Settings
TAX_RATE=0.0825
TAX_SHIPPING=false

# Shipping
FREE_SHIPPING_THRESHOLD=50
DEFAULT_SHIPPING_RATE=5.99
```

## Project Structure

```
src/
├── lib/
│   └── cart/
│       ├── index.ts
│       ├── store.ts
│       ├── api.ts
│       ├── calculations.ts
│       ├── validation.ts
│       └── storage.ts
├── components/
│   └── cart/
│       ├── CartProvider.tsx
│       ├── CartDrawer.tsx
│       ├── CartItem.tsx
│       ├── CartSummary.tsx
│       ├── CartIcon.tsx
│       ├── QuantitySelector.tsx
│       ├── DiscountCode.tsx
│       └── EmptyCart.tsx
├── hooks/
│   ├── useCart.ts
│   └── useCartSync.ts
├── app/
│   ├── api/
│   │   └── cart/
│   │       ├── route.ts
│   │       ├── items/route.ts
│   │       └── discount/route.ts
│   └── actions/
│       └── cart-actions.ts
└── types/
    └── cart.ts
```

## Type Definitions

```typescript
// src/types/cart.ts
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  originalPrice?: number;  // For showing discounts
  quantity: number;
  maxQuantity?: number;
  sku?: string;
  attributes?: Record<string, string>;  // Size, Color, etc.
  metadata?: Record<string, any>;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: DiscountInfo | null;
  shipping: ShippingInfo | null;
  tax: number;
  total: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  customerId?: string;
  sessionId?: string;
  currency: string;
  metadata?: Record<string, any>;
}

export interface DiscountInfo {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  appliedAmount: number;
  description?: string;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: Date;
}

export interface ShippingInfo {
  method: string;
  name: string;
  price: number;
  estimatedDays: string;
  freeShippingEligible: boolean;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface AddToCartParams {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  attributes?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface UpdateCartItemParams {
  itemId: string;
  quantity?: number;
  attributes?: Record<string, string>;
}

export interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;
}

export interface CartActions {
  addItem: (params: AddToCartParams) => Promise<void>;
  updateItem: (params: UpdateCartItemParams) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<boolean>;
  removeDiscount: () => Promise<void>;
  setShipping: (method: string) => Promise<void>;
  syncCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}
```

## Cart Store with Zustand

```typescript
// src/lib/cart/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Cart,
  CartItem,
  CartState,
  CartActions,
  AddToCartParams,
  UpdateCartItemParams,
  DiscountInfo,
  ShippingInfo,
} from '@/types/cart';
import { calculateCartTotals } from './calculations';
import { validateCartItem, validateDiscount } from './validation';
import { generateCartId, generateItemId } from './utils';

const MAX_ITEMS = parseInt(process.env.NEXT_PUBLIC_CART_MAX_ITEMS || '100');
const MAX_QUANTITY = parseInt(process.env.NEXT_PUBLIC_CART_MAX_QUANTITY_PER_ITEM || '99');

interface CartStore extends CartState, CartActions {}

const createEmptyCart = (): Cart => ({
  id: generateCartId(),
  items: [],
  subtotal: 0,
  discount: null,
  shipping: null,
  tax: 0,
  total: 0,
  itemCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  currency: 'USD',
});

export const useCartStore = create<CartStore>()(
  persist(
    immer((set, get) => ({
      cart: null,
      isLoading: false,
      isOpen: false,
      error: null,

      addItem: async (params: AddToCartParams) => {
        const validation = validateCartItem(params);
        if (!validation.valid) {
          set((state) => {
            state.error = validation.error || 'Invalid item';
          });
          return;
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;

          if (!state.cart) {
            state.cart = createEmptyCart();
          }

          const cart = state.cart;

          // Check max items
          if (cart.items.length >= MAX_ITEMS) {
            state.error = `Cart cannot have more than ${MAX_ITEMS} items`;
            state.isLoading = false;
            return;
          }

          // Check for existing item
          const existingIndex = cart.items.findIndex(
            (item) =>
              item.productId === params.productId &&
              item.variantId === params.variantId &&
              JSON.stringify(item.attributes) === JSON.stringify(params.attributes)
          );

          if (existingIndex >= 0) {
            // Update quantity
            const newQuantity = cart.items[existingIndex].quantity + params.quantity;
            cart.items[existingIndex].quantity = Math.min(newQuantity, MAX_QUANTITY);
          } else {
            // Add new item
            const newItem: CartItem = {
              id: generateItemId(),
              productId: params.productId,
              variantId: params.variantId,
              name: params.name,
              image: params.image,
              price: params.price,
              quantity: Math.min(params.quantity, MAX_QUANTITY),
              attributes: params.attributes,
              metadata: params.metadata,
            };
            cart.items.push(newItem);
          }

          // Recalculate totals
          const totals = calculateCartTotals(cart.items, cart.discount, cart.shipping);
          cart.subtotal = totals.subtotal;
          cart.tax = totals.tax;
          cart.total = totals.total;
          cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          cart.updatedAt = new Date();

          state.isLoading = false;
          state.isOpen = true; // Open cart drawer
        });
      },

      updateItem: async (params: UpdateCartItemParams) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;

          if (!state.cart) return;

          const cart = state.cart;
          const itemIndex = cart.items.findIndex((item) => item.id === params.itemId);

          if (itemIndex === -1) {
            state.error = 'Item not found';
            state.isLoading = false;
            return;
          }

          if (params.quantity !== undefined) {
            if (params.quantity <= 0) {
              // Remove item
              cart.items.splice(itemIndex, 1);
            } else {
              cart.items[itemIndex].quantity = Math.min(params.quantity, MAX_QUANTITY);
            }
          }

          if (params.attributes) {
            cart.items[itemIndex].attributes = {
              ...cart.items[itemIndex].attributes,
              ...params.attributes,
            };
          }

          // Recalculate totals
          const totals = calculateCartTotals(cart.items, cart.discount, cart.shipping);
          cart.subtotal = totals.subtotal;
          cart.tax = totals.tax;
          cart.total = totals.total;
          cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          cart.updatedAt = new Date();

          state.isLoading = false;
        });
      },

      removeItem: async (itemId: string) => {
        set((state) => {
          if (!state.cart) return;

          const cart = state.cart;
          cart.items = cart.items.filter((item) => item.id !== itemId);

          // Recalculate totals
          const totals = calculateCartTotals(cart.items, cart.discount, cart.shipping);
          cart.subtotal = totals.subtotal;
          cart.tax = totals.tax;
          cart.total = totals.total;
          cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          cart.updatedAt = new Date();

          // Remove discount if minimum not met
          if (cart.discount?.minPurchase && cart.subtotal < cart.discount.minPurchase) {
            cart.discount = null;
          }
        });
      },

      clearCart: async () => {
        set((state) => {
          state.cart = createEmptyCart();
          state.error = null;
        });
      },

      applyDiscount: async (code: string) => {
        const { cart } = get();
        if (!cart) return false;

        // Validate discount code (would call API in real implementation)
        const discount = await validateDiscount(code, cart.subtotal);

        if (!discount) {
          set((state) => {
            state.error = 'Invalid or expired discount code';
          });
          return false;
        }

        set((state) => {
          if (!state.cart) return;

          state.cart.discount = discount;

          // Recalculate totals
          const totals = calculateCartTotals(
            state.cart.items,
            discount,
            state.cart.shipping
          );
          state.cart.subtotal = totals.subtotal;
          state.cart.tax = totals.tax;
          state.cart.total = totals.total;
          state.cart.updatedAt = new Date();
          state.error = null;
        });

        return true;
      },

      removeDiscount: async () => {
        set((state) => {
          if (!state.cart) return;

          state.cart.discount = null;

          // Recalculate totals
          const totals = calculateCartTotals(
            state.cart.items,
            null,
            state.cart.shipping
          );
          state.cart.subtotal = totals.subtotal;
          state.cart.tax = totals.tax;
          state.cart.total = totals.total;
          state.cart.updatedAt = new Date();
        });
      },

      setShipping: async (method: string) => {
        // Would fetch shipping rates from API
        const shippingRates: Record<string, ShippingInfo> = {
          standard: {
            method: 'standard',
            name: 'Standard Shipping',
            price: 5.99,
            estimatedDays: '5-7 business days',
            freeShippingEligible: true,
          },
          express: {
            method: 'express',
            name: 'Express Shipping',
            price: 14.99,
            estimatedDays: '2-3 business days',
            freeShippingEligible: false,
          },
          overnight: {
            method: 'overnight',
            name: 'Overnight Shipping',
            price: 29.99,
            estimatedDays: '1 business day',
            freeShippingEligible: false,
          },
        };

        const shipping = shippingRates[method];
        if (!shipping) return;

        set((state) => {
          if (!state.cart) return;

          state.cart.shipping = shipping;

          // Recalculate totals
          const totals = calculateCartTotals(
            state.cart.items,
            state.cart.discount,
            shipping
          );
          state.cart.subtotal = totals.subtotal;
          state.cart.tax = totals.tax;
          state.cart.total = totals.total;
          state.cart.updatedAt = new Date();
        });
      },

      syncCart: async () => {
        // Sync cart with server (for logged-in users)
        const { cart } = get();
        if (!cart) return;

        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cart),
          });

          if (response.ok) {
            const serverCart = await response.json();
            set((state) => {
              state.cart = serverCart;
            });
          }
        } catch (error) {
          console.error('Cart sync error:', error);
        }
      },

      openCart: () => set((state) => { state.isOpen = true; }),
      closeCart: () => set((state) => { state.isOpen = false; }),
      toggleCart: () => set((state) => { state.isOpen = !state.isOpen; }),
    })),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);
```

## Cart Calculations

```typescript
// src/lib/cart/calculations.ts
import { CartItem, DiscountInfo, ShippingInfo, CartTotals } from '@/types/cart';

const TAX_RATE = parseFloat(process.env.NEXT_PUBLIC_TAX_RATE || '0.0825');
const FREE_SHIPPING_THRESHOLD = parseFloat(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || '50'
);
const TAX_SHIPPING = process.env.NEXT_PUBLIC_TAX_SHIPPING === 'true';

export function calculateCartTotals(
  items: CartItem[],
  discount: DiscountInfo | null,
  shipping: ShippingInfo | null
): CartTotals {
  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate discount
  let discountAmount = 0;
  if (discount) {
    if (discount.minPurchase && subtotal < discount.minPurchase) {
      // Discount doesn't apply
      discountAmount = 0;
    } else if (discount.type === 'percentage') {
      discountAmount = subtotal * (discount.value / 100);
      if (discount.maxDiscount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount);
      }
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(discount.value, subtotal);
    } else if (discount.type === 'shipping') {
      // Free shipping discount applied to shipping
    }
  }

  // Calculate shipping
  let shippingAmount = shipping?.price || 0;

  // Apply free shipping
  if (
    shipping?.freeShippingEligible &&
    subtotal >= FREE_SHIPPING_THRESHOLD
  ) {
    shippingAmount = 0;
  }

  // Apply shipping discount
  if (discount?.type === 'shipping') {
    shippingAmount = 0;
  }

  // Calculate tax
  const taxableAmount = subtotal - discountAmount + (TAX_SHIPPING ? shippingAmount : 0);
  const tax = taxableAmount * TAX_RATE;

  // Calculate total
  const total = subtotal - discountAmount + shippingAmount + tax;

  return {
    subtotal: roundToTwo(subtotal),
    discount: roundToTwo(discountAmount),
    shipping: roundToTwo(shippingAmount),
    tax: roundToTwo(tax),
    total: roundToTwo(Math.max(0, total)),
  };
}

export function calculateItemSubtotal(item: CartItem): number {
  return roundToTwo(item.price * item.quantity);
}

export function calculateSavings(item: CartItem): number {
  if (!item.originalPrice) return 0;
  const savings = (item.originalPrice - item.price) * item.quantity;
  return roundToTwo(Math.max(0, savings));
}

export function calculateTotalSavings(
  items: CartItem[],
  discount: DiscountInfo | null
): number {
  const itemSavings = items.reduce(
    (sum, item) => sum + calculateSavings(item),
    0
  );
  const discountSavings = discount?.appliedAmount || 0;
  return roundToTwo(itemSavings + discountSavings);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
```

## Cart Validation

```typescript
// src/lib/cart/validation.ts
import { z } from 'zod';
import { AddToCartParams, DiscountInfo } from '@/types/cart';

const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  price: z.number().min(0),
  name: z.string().min(1).max(200),
  image: z.string().url().optional(),
  attributes: z.record(z.string()).optional(),
});

export function validateCartItem(
  params: AddToCartParams
): { valid: boolean; error?: string } {
  try {
    addToCartSchema.parse(params);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid item data' };
  }
}

// Mock discount validation - replace with API call
export async function validateDiscount(
  code: string,
  subtotal: number
): Promise<DiscountInfo | null> {
  // In real implementation, call API to validate
  const discounts: Record<string, Omit<DiscountInfo, 'appliedAmount'>> = {
    SAVE10: {
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      description: '10% off your order',
      minPurchase: 25,
    },
    FLAT20: {
      code: 'FLAT20',
      type: 'fixed',
      value: 20,
      description: '$20 off your order',
      minPurchase: 50,
    },
    FREESHIP: {
      code: 'FREESHIP',
      type: 'shipping',
      value: 0,
      description: 'Free shipping',
    },
  };

  const discount = discounts[code.toUpperCase()];
  if (!discount) return null;

  if (discount.minPurchase && subtotal < discount.minPurchase) {
    return null;
  }

  // Calculate applied amount
  let appliedAmount = 0;
  if (discount.type === 'percentage') {
    appliedAmount = subtotal * (discount.value / 100);
    if (discount.maxDiscount) {
      appliedAmount = Math.min(appliedAmount, discount.maxDiscount);
    }
  } else if (discount.type === 'fixed') {
    appliedAmount = Math.min(discount.value, subtotal);
  }

  return {
    ...discount,
    appliedAmount,
  };
}

export function validateQuantity(
  currentQuantity: number,
  change: number,
  maxQuantity = 99
): number {
  const newQuantity = currentQuantity + change;
  return Math.max(0, Math.min(newQuantity, maxQuantity));
}
```

## React Components

```tsx
// src/components/cart/CartProvider.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useCartStore } from '@/lib/cart/store';

interface CartProviderProps {
  children: ReactNode;
  userId?: string;
}

export function CartProvider({ children, userId }: CartProviderProps) {
  const syncCart = useCartStore((state) => state.syncCart);
  const cart = useCartStore((state) => state.cart);

  // Sync cart when user logs in
  useEffect(() => {
    if (userId && cart) {
      syncCart();
    }
  }, [userId]);

  return <>{children}</>;
}
```

```tsx
// src/components/cart/CartDrawer.tsx
'use client';

import { useCartStore } from '@/lib/cart/store';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { EmptyCart } from './EmptyCart';
import { DiscountCode } from './DiscountCode';

export function CartDrawer() {
  const { cart, isOpen, closeCart } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Your Cart {cart && cart.itemCount > 0 && `(${cart.itemCount})`}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!cart || cart.items.length === 0 ? (
            <EmptyCart onClose={closeCart} />
          ) : (
            <div className="p-4 space-y-4">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <DiscountCode />
            <CartSummary cart={cart} />

            <a
              href="/checkout"
              className="block w-full py-3 px-4 bg-black text-white text-center rounded-lg font-medium hover:bg-gray-800"
            >
              Proceed to Checkout
            </a>

            <button
              onClick={closeCart}
              className="block w-full py-2 text-center text-gray-600 hover:text-gray-900"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
```

```tsx
// src/components/cart/CartItem.tsx
'use client';

import { CartItem as CartItemType } from '@/types/cart';
import { useCartStore } from '@/lib/cart/store';
import { QuantitySelector } from './QuantitySelector';
import { formatCurrency, calculateSavings } from '@/lib/cart/calculations';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateItem, removeItem } = useCartStore();
  const savings = calculateSavings(item);

  const handleQuantityChange = (quantity: number) => {
    if (quantity <= 0) {
      removeItem(item.id);
    } else {
      updateItem({ itemId: item.id, quantity });
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      {/* Image */}
      {item.image && (
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>

        {/* Attributes */}
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {Object.entries(item.attributes)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' / ')}
          </p>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-medium">
            {formatCurrency(item.price)}
          </span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
        </div>

        {/* Savings */}
        {savings > 0 && (
          <p className="text-sm text-green-600 mt-1">
            You save {formatCurrency(savings)}
          </p>
        )}

        {/* Quantity & Remove */}
        <div className="mt-3 flex items-center justify-between">
          <QuantitySelector
            quantity={item.quantity}
            onChange={handleQuantityChange}
            max={item.maxQuantity}
          />

          <button
            onClick={() => removeItem(item.id)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Line Total */}
      <div className="text-right">
        <span className="font-medium">
          {formatCurrency(item.price * item.quantity)}
        </span>
      </div>
    </div>
  );
}
```

```tsx
// src/components/cart/QuantitySelector.tsx
'use client';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 99,
  disabled,
}: QuantitySelectorProps) {
  const decrease = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center border rounded-lg">
      <button
        onClick={decrease}
        disabled={disabled || quantity <= min}
        className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className="w-12 text-center border-0 focus:ring-0"
      />
      <button
        onClick={increase}
        disabled={disabled || quantity >= max}
        className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
```

```tsx
// src/components/cart/CartSummary.tsx
'use client';

import { Cart } from '@/types/cart';
import { formatCurrency, calculateTotalSavings } from '@/lib/cart/calculations';

interface CartSummaryProps {
  cart: Cart;
  showShipping?: boolean;
}

export function CartSummary({ cart, showShipping = false }: CartSummaryProps) {
  const totalSavings = calculateTotalSavings(cart.items, cart.discount);
  const freeShippingThreshold = parseFloat(
    process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || '50'
  );
  const amountToFreeShipping = freeShippingThreshold - cart.subtotal;

  return (
    <div className="space-y-3">
      {/* Free Shipping Progress */}
      {amountToFreeShipping > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            Add {formatCurrency(amountToFreeShipping)} more for free shipping!
          </p>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${Math.min((cart.subtotal / freeShippingThreshold) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatCurrency(cart.subtotal)}</span>
        </div>

        {cart.discount && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({cart.discount.code})</span>
            <span>-{formatCurrency(cart.discount.appliedAmount)}</span>
          </div>
        )}

        {showShipping && cart.shipping && (
          <div className="flex justify-between">
            <span className="text-gray-600">{cart.shipping.name}</span>
            <span>
              {cart.shipping.price === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatCurrency(cart.shipping.price)
              )}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>{formatCurrency(cart.tax)}</span>
        </div>

        {totalSavings > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Total Savings</span>
            <span>{formatCurrency(totalSavings)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total</span>
          <span>{formatCurrency(cart.total)}</span>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/cart/DiscountCode.tsx
'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/cart/store';

export function DiscountCode() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { cart, applyDiscount, removeDiscount, error } = useCartStore();

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    await applyDiscount(code.trim());
    setIsLoading(false);
    setCode('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  if (cart?.discount) {
    return (
      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
        <div>
          <p className="text-sm font-medium text-green-700">
            {cart.discount.code}
          </p>
          <p className="text-xs text-green-600">{cart.discount.description}</p>
        </div>
        <button
          onClick={removeDiscount}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Discount code"
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleApply}
          disabled={isLoading || !code.trim()}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {isLoading ? '...' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
```

```tsx
// src/components/cart/CartIcon.tsx
'use client';

import { useCartStore } from '@/lib/cart/store';

export function CartIcon() {
  const { cart, toggleCart } = useCartStore();
  const itemCount = cart?.itemCount || 0;

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 hover:bg-gray-100 rounded-full"
      aria-label="Open cart"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
```

## useCart Hook

```typescript
// src/hooks/useCart.ts
import { useCartStore } from '@/lib/cart/store';
import { useCallback } from 'react';
import { AddToCartParams } from '@/types/cart';

export function useCart() {
  const store = useCartStore();

  const addToCart = useCallback(
    async (params: AddToCartParams) => {
      await store.addItem(params);
    },
    [store.addItem]
  );

  const isInCart = useCallback(
    (productId: string, variantId?: string) => {
      return store.cart?.items.some(
        (item) =>
          item.productId === productId &&
          (variantId ? item.variantId === variantId : true)
      );
    },
    [store.cart?.items]
  );

  const getCartItem = useCallback(
    (productId: string, variantId?: string) => {
      return store.cart?.items.find(
        (item) =>
          item.productId === productId &&
          (variantId ? item.variantId === variantId : true)
      );
    },
    [store.cart?.items]
  );

  return {
    cart: store.cart,
    items: store.cart?.items || [],
    itemCount: store.cart?.itemCount || 0,
    subtotal: store.cart?.subtotal || 0,
    total: store.cart?.total || 0,
    isLoading: store.isLoading,
    isOpen: store.isOpen,
    error: store.error,

    addToCart,
    updateItem: store.updateItem,
    removeItem: store.removeItem,
    clearCart: store.clearCart,

    applyDiscount: store.applyDiscount,
    removeDiscount: store.removeDiscount,

    setShipping: store.setShipping,

    openCart: store.openCart,
    closeCart: store.closeCart,
    toggleCart: store.toggleCart,

    isInCart,
    getCartItem,
  };
}
```

## Server Actions

```typescript
// src/app/actions/cart-actions.ts
'use server';

import { cookies } from 'next/headers';
import { Cart, DiscountInfo } from '@/types/cart';

// Save cart to server (for logged-in users)
export async function saveCart(cart: Cart, userId: string) {
  // Save to database
  // await db.cart.upsert({
  //   where: { userId },
  //   create: { userId, data: cart },
  //   update: { data: cart },
  // });

  return { success: true };
}

// Load cart from server
export async function loadCart(userId: string): Promise<Cart | null> {
  // Load from database
  // const result = await db.cart.findUnique({ where: { userId } });
  // return result?.data;

  return null;
}

// Merge guest cart with user cart on login
export async function mergeGuestCart(
  guestCart: Cart,
  userCart: Cart | null
): Promise<Cart> {
  if (!userCart) {
    return guestCart;
  }

  // Merge items (user cart takes priority for duplicates)
  const mergedItems = [...userCart.items];

  for (const guestItem of guestCart.items) {
    const existingIndex = mergedItems.findIndex(
      (item) =>
        item.productId === guestItem.productId &&
        item.variantId === guestItem.variantId
    );

    if (existingIndex === -1) {
      mergedItems.push(guestItem);
    }
  }

  return {
    ...userCart,
    items: mergedItems,
    updatedAt: new Date(),
  };
}

// Validate discount code server-side
export async function validateDiscountCode(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; discount?: DiscountInfo; error?: string }> {
  // Validate against database
  // const discount = await db.discount.findUnique({
  //   where: { code: code.toUpperCase(), active: true },
  // });

  // Mock validation
  const discounts: Record<string, Omit<DiscountInfo, 'appliedAmount'>> = {
    SAVE10: { code: 'SAVE10', type: 'percentage', value: 10, minPurchase: 25 },
    FLAT20: { code: 'FLAT20', type: 'fixed', value: 20, minPurchase: 50 },
  };

  const discount = discounts[code.toUpperCase()];

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' };
  }

  if (discount.minPurchase && subtotal < discount.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase of $${discount.minPurchase} required`,
    };
  }

  const appliedAmount =
    discount.type === 'percentage'
      ? subtotal * (discount.value / 100)
      : Math.min(discount.value, subtotal);

  return {
    valid: true,
    discount: { ...discount, appliedAmount },
  };
}

// Get shipping rates
export async function getShippingRates(
  cartTotal: number,
  destination?: { country: string; postalCode?: string }
) {
  const freeShippingThreshold = 50;
  const eligibleForFreeShipping = cartTotal >= freeShippingThreshold;

  return [
    {
      id: 'standard',
      name: 'Standard Shipping',
      price: eligibleForFreeShipping ? 0 : 5.99,
      estimatedDays: '5-7 business days',
    },
    {
      id: 'express',
      name: 'Express Shipping',
      price: 14.99,
      estimatedDays: '2-3 business days',
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      price: 29.99,
      estimatedDays: '1 business day',
    },
  ];
}
```

## Testing

```typescript
// __tests__/cart.test.ts
import { calculateCartTotals } from '@/lib/cart/calculations';
import { validateCartItem } from '@/lib/cart/validation';

describe('Cart Calculations', () => {
  it('should calculate subtotal correctly', () => {
    const items = [
      { id: '1', productId: 'p1', name: 'Item 1', price: 10, quantity: 2 },
      { id: '2', productId: 'p2', name: 'Item 2', price: 15, quantity: 1 },
    ];

    const totals = calculateCartTotals(items as any, null, null);
    expect(totals.subtotal).toBe(35);
  });

  it('should apply percentage discount', () => {
    const items = [{ id: '1', productId: 'p1', name: 'Item 1', price: 100, quantity: 1 }];
    const discount = { code: 'SAVE10', type: 'percentage' as const, value: 10, appliedAmount: 10 };

    const totals = calculateCartTotals(items as any, discount, null);
    expect(totals.discount).toBe(10);
  });

  it('should apply fixed discount', () => {
    const items = [{ id: '1', productId: 'p1', name: 'Item 1', price: 100, quantity: 1 }];
    const discount = { code: 'FLAT20', type: 'fixed' as const, value: 20, appliedAmount: 20 };

    const totals = calculateCartTotals(items as any, discount, null);
    expect(totals.discount).toBe(20);
  });
});

describe('Cart Validation', () => {
  it('should validate valid cart item', () => {
    const result = validateCartItem({
      productId: 'p1',
      name: 'Test Product',
      price: 29.99,
      quantity: 1,
    });

    expect(result.valid).toBe(true);
  });

  it('should reject invalid quantity', () => {
    const result = validateCartItem({
      productId: 'p1',
      name: 'Test Product',
      price: 29.99,
      quantity: 0,
    });

    expect(result.valid).toBe(false);
  });
});
```

## CLAUDE.md Integration

```markdown
# Shopping Cart

## State Management
- Uses Zustand with persistence to localStorage
- Cart state syncs across browser tabs
- Server sync for logged-in users

## Cart Flow
1. Add item -> Update store -> Open drawer
2. Edit quantity -> Recalculate totals
3. Apply discount -> Validate -> Update totals
4. Checkout -> Pass cart to checkout flow

## Key Files
- `src/lib/cart/store.ts` - Zustand store with actions
- `src/lib/cart/calculations.ts` - Price calculations
- `src/components/cart/` - Cart UI components

## Discount Types
- percentage: X% off subtotal
- fixed: $X off subtotal
- shipping: Free shipping

## Testing
- Add to cart: Check quantity limits
- Discounts: Verify min purchase requirements
- Calculations: Test tax and shipping
```

## AI Suggestions

1. **Add abandoned cart recovery** - Email reminders for abandoned carts
2. **Implement cart expiration** - Auto-clear carts after 30 days
3. **Add saved for later** - Move items between cart and wishlist
4. **Implement cart sharing** - Generate shareable cart links
5. **Add bulk operations** - Clear all, select multiple for removal
6. **Implement inventory validation** - Check stock before checkout
7. **Add cart recommendations** - Suggest related products
8. **Implement price alerts** - Notify when cart items go on sale
9. **Add cart comparison** - Save multiple cart configurations
10. **Implement multi-currency** - Support international shoppers
