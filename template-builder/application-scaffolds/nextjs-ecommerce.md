# Next.js E-Commerce Template

## Overview
Full-featured e-commerce application with product catalog, cart, checkout, inventory management, and payment processing.

## Quick Start

```bash
# Create project
npx create-next-app@latest my-store --typescript --tailwind --eslint --app --src-dir

cd my-store

# Install dependencies
npm install @stripe/stripe-js stripe @prisma/client next-auth @tanstack/react-query
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast
npm install zustand zod react-hook-form @hookform/resolvers
npm install lucide-react clsx tailwind-merge class-variance-authority
npm install sharp @vercel/analytics

# Dev dependencies
npm install -D prisma @types/node tsx
```

## Project Structure

```
src/
├── app/
│   ├── (shop)/
│   │   ├── page.tsx                    # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx                # Product listing
│   │   │   └── [slug]/page.tsx         # Product detail
│   │   ├── categories/
│   │   │   └── [slug]/page.tsx         # Category page
│   │   ├── cart/page.tsx               # Shopping cart
│   │   ├── checkout/
│   │   │   ├── page.tsx                # Checkout flow
│   │   │   └── success/page.tsx        # Order confirmation
│   │   └── search/page.tsx             # Search results
│   ├── (account)/
│   │   ├── account/page.tsx            # Account dashboard
│   │   ├── orders/page.tsx             # Order history
│   │   └── wishlist/page.tsx           # Saved items
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx                # Admin dashboard
│   │       ├── products/page.tsx       # Product management
│   │       ├── orders/page.tsx         # Order management
│   │       └── inventory/page.tsx      # Inventory management
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── products/route.ts
│   │   ├── cart/route.ts
│   │   ├── checkout/route.ts
│   │   ├── orders/route.ts
│   │   └── webhooks/stripe/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # Shared UI components
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── ProductVariants.tsx
│   │   └── ProductReviews.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── checkout/
│   │   ├── CheckoutForm.tsx
│   │   ├── AddressForm.tsx
│   │   └── PaymentForm.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── lib/
│   ├── prisma.ts                       # Prisma client
│   ├── stripe.ts                       # Stripe client
│   ├── auth.ts                         # NextAuth config
│   ├── utils.ts                        # Utilities
│   └── validations/                    # Zod schemas
├── hooks/
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── useCheckout.ts
├── stores/
│   └── cart-store.ts                   # Zustand cart store
└── types/
    └── index.ts
```

## Environment Variables

```bash
# .env.local
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage (optional)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-app-id"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourstore.com"
```

## Database Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(CUSTOMER)
  accounts      Account[]
  sessions      Session[]
  orders        Order[]
  reviews       Review[]
  wishlist      WishlistItem[]
  addresses     Address[]
  cart          Cart?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  CUSTOMER
  ADMIN
  MANAGER
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  image       String?
  parentId    String?
  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")
  products    Product[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Product {
  id            String         @id @default(cuid())
  name          String
  slug          String         @unique
  description   String?        @db.Text
  price         Decimal        @db.Decimal(10, 2)
  comparePrice  Decimal?       @db.Decimal(10, 2)
  costPrice     Decimal?       @db.Decimal(10, 2)
  sku           String?        @unique
  barcode       String?
  trackQuantity Boolean        @default(true)
  quantity      Int            @default(0)
  weight        Decimal?       @db.Decimal(10, 2)
  status        ProductStatus  @default(DRAFT)
  featured      Boolean        @default(false)
  categoryId    String?
  category      Category?      @relation(fields: [categoryId], references: [id])
  images        ProductImage[]
  variants      Variant[]
  reviews       Review[]
  orderItems    OrderItem[]
  cartItems     CartItem[]
  wishlistItems WishlistItem[]
  tags          Tag[]
  metadata      Json?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([categoryId])
  @@index([status])
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  position  Int      @default(0)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Variant {
  id         String      @id @default(cuid())
  name       String
  sku        String?     @unique
  price      Decimal?    @db.Decimal(10, 2)
  quantity   Int         @default(0)
  productId  String
  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  options    VariantOption[]
  orderItems OrderItem[]
  cartItems  CartItem[]
}

model VariantOption {
  id        String  @id @default(cuid())
  name      String  // e.g., "Color", "Size"
  value     String  // e.g., "Red", "XL"
  variantId String
  variant   Variant @relation(fields: [variantId], references: [id], onDelete: Cascade)
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
}

model Cart {
  id        String     @id @default(cuid())
  userId    String?    @unique
  user      User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId String?    @unique
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(cuid())
  quantity  Int      @default(1)
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  variantId String?
  variant   Variant? @relation(fields: [variantId], references: [id])

  @@unique([cartId, productId, variantId])
}

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique
  userId          String?
  user            User?         @relation(fields: [userId], references: [id])
  email           String
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentIntentId String?
  subtotal        Decimal       @db.Decimal(10, 2)
  discount        Decimal       @default(0) @db.Decimal(10, 2)
  shipping        Decimal       @default(0) @db.Decimal(10, 2)
  tax             Decimal       @default(0) @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  items           OrderItem[]
  shippingAddress Address?      @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  shippingAddressId String?
  billingAddress  Address?      @relation("BillingAddress", fields: [billingAddressId], references: [id])
  billingAddressId String?
  notes           String?
  metadata        Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model OrderItem {
  id        String   @id @default(cuid())
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  total     Decimal  @db.Decimal(10, 2)
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  variantId String?
  variant   Variant? @relation(fields: [variantId], references: [id])
}

model Address {
  id             String  @id @default(cuid())
  firstName      String
  lastName       String
  company        String?
  address1       String
  address2       String?
  city           String
  state          String
  postalCode     String
  country        String
  phone          String?
  isDefault      Boolean @default(false)
  userId         String?
  user           User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  shippingOrders Order[] @relation("ShippingAddress")
  billingOrders  Order[] @relation("BillingAddress")
}

model Review {
  id        String   @id @default(cuid())
  rating    Int
  title     String?
  content   String?  @db.Text
  verified  Boolean  @default(false)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([productId, userId])
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}

model Coupon {
  id            String       @id @default(cuid())
  code          String       @unique
  type          CouponType
  value         Decimal      @db.Decimal(10, 2)
  minPurchase   Decimal?     @db.Decimal(10, 2)
  maxDiscount   Decimal?     @db.Decimal(10, 2)
  usageLimit    Int?
  usageCount    Int          @default(0)
  startsAt      DateTime?
  expiresAt     DateTime?
  active        Boolean      @default(true)
  createdAt     DateTime     @default(now())
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}
```

## Core Components

### Cart Store (Zustand)
```typescript
// src/stores/cart-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: {
    name: string;
    options: Record<string, string>;
  };
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
          set({ items: newItems, isOpen: true });
        } else {
          const id = `${item.productId}-${item.variantId || 'default'}-${Date.now()}`;
          set({ items: [...items, { ...item, id }], isOpen: true });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      itemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

### Product Card Component
```tsx
// src/components/product/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    images: { url: string; alt?: string }[];
    category?: { name: string; slug: string };
  };
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const primaryImage = product.images[0];
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: primaryImage?.url,
    });
  };

  return (
    <div className={cn('group relative', className)}>
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
          {primaryImage && (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          )}

          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
              -{discount}%
            </span>
          )}

          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                // Add to wishlist logic
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              className="w-full"
              size="sm"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {product.category && (
            <p className="text-xs text-muted-foreground">{product.category.name}</p>
          )}
          <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatCurrency(product.price)}</span>
            {product.comparePrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
```

### Cart Drawer Component
```tsx
// src/components/cart/CartDrawer.tsx
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } =
    useCartStore();

  // Close cart on route change
  useEffect(() => {
    return () => closeCart();
  }, [closeCart]);

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button asChild onClick={closeCart}>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.id} className="py-4 flex gap-4">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-gray-100">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{item.name}</h4>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">
                          {Object.values(item.variant.options).join(' / ')}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-1">
                        {formatCurrency(item.price)}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal())}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout" onClick={closeCart}>
                  Proceed to Checkout
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={closeCart}
                asChild
              >
                <Link href="/cart">View Cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### Checkout API Route
```typescript
// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().min(1),
    })
  ),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
  }),
  billingAddress: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      address1: z.string(),
      address2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
  email: z.string().email(),
  couponCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // Fetch products and validate inventory
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true, images: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals
    let subtotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      let price = Number(product.price);
      let variantName = '';

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return NextResponse.json(
            { error: `Variant not found: ${item.variantId}` },
            { status: 400 }
          );
        }
        if (variant.price) {
          price = Number(variant.price);
        }
        variantName = ` (${variant.name})`;

        // Check variant inventory
        if (variant.quantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}${variantName}` },
            { status: 400 }
          );
        }
      } else {
        // Check product inventory
        if (product.trackQuantity && product.quantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}` },
            { status: 400 }
          );
        }
      }

      subtotal += price * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${product.name}${variantName}`,
            images: product.images[0] ? [product.images[0].url] : [],
            metadata: {
              productId: product.id,
              variantId: item.variantId || '',
            },
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: item.quantity,
      });
    }

    // Apply coupon if provided
    let discount = 0;
    let coupon = null;
    if (data.couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      });

      if (coupon && coupon.active) {
        const now = new Date();
        if (
          (!coupon.startsAt || coupon.startsAt <= now) &&
          (!coupon.expiresAt || coupon.expiresAt >= now) &&
          (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
          (!coupon.minPurchase || subtotal >= Number(coupon.minPurchase))
        ) {
          if (coupon.type === 'PERCENTAGE') {
            discount = subtotal * (Number(coupon.value) / 100);
          } else if (coupon.type === 'FIXED_AMOUNT') {
            discount = Number(coupon.value);
          }

          if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
            discount = Number(coupon.maxDiscount);
          }
        }
      }
    }

    // Calculate shipping (simplified)
    const shipping = subtotal >= 100 ? 0 : 9.99;

    // Calculate tax (simplified - 8%)
    const taxRate = 0.08;
    const tax = (subtotal - discount) * taxRate;

    // Create order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      customer_email: data.email,
      metadata: {
        orderNumber,
        userId: session?.user?.id || '',
        items: JSON.stringify(data.items),
        shippingAddress: JSON.stringify(data.shippingAddress),
        billingAddress: JSON.stringify(data.billingAddress || data.shippingAddress),
        couponCode: data.couponCode || '',
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shipping * 100),
              currency: 'usd',
            },
            display_name: shipping === 0 ? 'Free Shipping' : 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
      discounts: discount > 0 ? undefined : [], // Handle discounts via metadata
    });

    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
```

### Stripe Webhook Handler
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(paymentIntent);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const metadata = session.metadata!;

  const items = JSON.parse(metadata.items);
  const shippingAddress = JSON.parse(metadata.shippingAddress);
  const billingAddress = JSON.parse(metadata.billingAddress);

  // Fetch products
  const productIds = items.map((item: any) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Calculate totals
  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    let price = Number(product.price);

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant?.price) {
        price = Number(variant.price);
      }
    }

    const total = price * item.quantity;
    subtotal += total;

    orderItems.push({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      price,
      total,
    });
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: metadata.orderNumber,
      userId: metadata.userId || null,
      email: session.customer_email!,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentIntentId: session.payment_intent as string,
      subtotal,
      shipping: (session.shipping_cost?.amount_total || 0) / 100,
      tax: (session.total_details?.amount_tax || 0) / 100,
      total: session.amount_total! / 100,
      items: {
        create: orderItems,
      },
      shippingAddress: {
        create: shippingAddress,
      },
      billingAddress: {
        create: billingAddress,
      },
    },
  });

  // Update inventory
  for (const item of items) {
    if (item.variantId) {
      await prisma.variant.update({
        where: { id: item.variantId },
        data: { quantity: { decrement: item.quantity } },
      });
    } else {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }
  }

  // Update coupon usage if applicable
  if (metadata.couponCode) {
    await prisma.coupon.update({
      where: { code: metadata.couponCode },
      data: { usageCount: { increment: 1 } },
    });
  }

  // Send confirmation email
  // await sendOrderConfirmationEmail(order);

  console.log(`Order created: ${order.orderNumber}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  await prisma.order.updateMany({
    where: { paymentIntentId: paymentIntent.id },
    data: { paymentStatus: 'PAID' },
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await prisma.order.updateMany({
    where: { paymentIntentId: paymentIntent.id },
    data: { paymentStatus: 'FAILED' },
  });
}
```

## Search & Filtering

### Product Search API
```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');

  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
  };

  // Full-text search
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
    ];
  }

  // Category filter
  if (category) {
    where.category = { slug: category };
  }

  // Price range
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  // Sorting
  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  switch (sort) {
    case 'price':
      orderBy.price = order as 'asc' | 'desc';
      break;
    case 'name':
      orderBy.name = order as 'asc' | 'desc';
      break;
    case 'createdAt':
    default:
      orderBy.createdAt = order as 'asc' | 'desc';
      break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { take: 2, orderBy: { position: 'asc' } },
        category: { select: { name: true, slug: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

## Testing

```typescript
// __tests__/cart.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '@/stores/cart-store';

describe('Cart Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('should add items to cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({
        productId: 'product-1',
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Test Product');
  });

  it('should update quantity for existing items', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({
        productId: 'product-1',
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      });
    });

    act(() => {
      result.current.addItem({
        productId: 'product-1',
        name: 'Test Product',
        price: 29.99,
        quantity: 2,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
  });

  it('should calculate subtotal correctly', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({
        productId: 'product-1',
        name: 'Product 1',
        price: 10,
        quantity: 2,
      });
      result.current.addItem({
        productId: 'product-2',
        name: 'Product 2',
        price: 15,
        quantity: 1,
      });
    });

    expect(result.current.subtotal()).toBe(35);
  });

  it('should remove items', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({
        productId: 'product-1',
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      });
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.removeItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
  });
});
```

## CLAUDE.md Integration

```markdown
# E-Commerce Store

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Run migrations

## Product Management
- Products: `/admin/products`
- Create: POST `/api/products`
- Update: PATCH `/api/products/[id]`

## Order Flow
1. Add to cart (client-side)
2. POST `/api/checkout` - Create Stripe session
3. Redirect to Stripe checkout
4. Webhook processes payment
5. Order created and inventory updated

## Stripe Testing
- Card: 4242 4242 4242 4242
- 3D Secure: 4000 0027 6000 3184
- Decline: 4000 0000 0000 0002

## Important Files
- Cart store: `src/stores/cart-store.ts`
- Checkout: `src/app/api/checkout/route.ts`
- Webhook: `src/app/api/webhooks/stripe/route.ts`
```

## AI Suggestions

1. **Intelligent Product Recommendations** - Implement collaborative filtering based on user behavior and purchase history
2. **Dynamic Pricing Engine** - AI-powered pricing optimization based on demand, competition, and inventory levels
3. **Fraud Detection** - Real-time transaction scoring using ML models to prevent fraudulent orders
4. **Inventory Forecasting** - Predictive analytics for inventory replenishment based on sales trends
5. **Search Optimization** - Implement semantic search with vector embeddings for better product discovery
6. **Personalized Homepages** - User-specific product layouts based on browsing history and preferences
7. **Abandoned Cart Recovery** - AI-timed email sequences with personalized incentives
8. **Customer Segmentation** - Automatic customer clustering for targeted marketing campaigns
9. **Image Recognition** - Visual search allowing users to find products by uploading photos
10. **Chatbot Integration** - AI shopping assistant for product recommendations and order support
