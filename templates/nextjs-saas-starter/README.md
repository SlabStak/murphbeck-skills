# Next.js SaaS Starter Template

A production-ready SaaS boilerplate with authentication, payments, database, and admin dashboard.

## Features

- ⚡ **Next.js 14** with App Router
- 🔐 **Authentication** via Clerk (Google, GitHub, Email)
- 💳 **Payments** via Stripe (subscriptions, one-time)
- 🗄️ **Database** via Supabase (PostgreSQL)
- 📧 **Email** via Resend
- 🎨 **UI** via shadcn/ui + Tailwind CSS
- 📊 **Analytics** via PostHog
- 🚀 **Deploy** via Vercel

## Quick Start

```bash
# Clone template
npx degit murphbeck/templates/nextjs-saas-starter my-saas

# Install dependencies
cd my-saas && npm install

# Set up environment
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── settings/
│   │   └── billing/
│   ├── (marketing)/
│   │   ├── page.tsx          # Landing page
│   │   ├── pricing/
│   │   └── blog/
│   ├── api/
│   │   ├── webhooks/stripe/
│   │   └── trpc/
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn components
│   ├── dashboard/
│   ├── marketing/
│   └── shared/
├── lib/
│   ├── db.ts                 # Supabase client
│   ├── stripe.ts             # Stripe client
│   ├── email.ts              # Resend client
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── config/
    ├── site.ts
    ├── pricing.ts
    └── navigation.ts
```

## Pricing Configuration

Edit `config/pricing.ts` to customize your plans:

```typescript
export const pricingPlans = [
  {
    name: "Free",
    price: 0,
    features: ["5 projects", "Basic analytics", "Community support"],
    stripePriceId: null,
  },
  {
    name: "Pro",
    price: 29,
    features: ["Unlimited projects", "Advanced analytics", "Priority support"],
    stripePriceId: "price_xxx",
  },
  {
    name: "Enterprise",
    price: 99,
    features: ["Everything in Pro", "Custom integrations", "Dedicated support"],
    stripePriceId: "price_xxx",
  },
];
```

## Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique
  email         String    @unique
  name          String?
  plan          String    @default("free")
  stripeCustomerId String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  projects      Project[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Subscription {
  id                 String   @id @default(cuid())
  userId             String   @unique
  stripeSubscriptionId String @unique
  stripePriceId      String
  status             String
  currentPeriodEnd   DateTime
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
npm run stripe:listen # Listen for Stripe webhooks locally
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm run start
```

## License

MIT - Use freely for commercial projects.

---

*Built by Murphbeck Technologies*
