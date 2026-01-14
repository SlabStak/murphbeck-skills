# Next.js SaaS Scaffold

Complete scaffold for a production-ready SaaS application with authentication, payments, and admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | Clerk or Auth.js |
| Database | PostgreSQL + Prisma |
| Payments | Stripe |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Email | Resend |
| Hosting | Vercel |

## Directory Structure

```
my-saas-app/
├── .claude/
│   ├── agents/
│   │   ├── build-validator.md
│   │   └── verify-app.md
│   └── settings.json
├── .mcp.json
├── CLAUDE.md
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── billing/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (marketing)/
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/
│   │   │   │       └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── auth/
│   │   │   └── user-button.tsx
│   │   ├── billing/
│   │   │   └── pricing-cards.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   ├── lib/
│   │   ├── db.ts                  # Prisma client
│   │   ├── auth.ts                # Auth helpers
│   │   ├── stripe.ts              # Stripe client
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-user.ts
│   │   └── use-subscription.ts
│   └── types/
│       └── index.ts
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Key Files

### CLAUDE.md

```markdown
# Development Workflow

**Always use `bun`, not `npm`.**

## Commands

```sh
# Development
bun run dev              # Start dev server (port 3000)

# Database
bun run db:push          # Push schema to database
bun run db:generate      # Generate Prisma client
bun run db:studio        # Open Prisma Studio
bun run db:seed          # Seed database

# Quality
bun run typecheck
bun run lint
bun run test

# Stripe
bun run stripe:listen    # Start webhook listener
```

## Code Style
- Prefer `type` over `interface`
- **Never use `enum`**
- Use server components by default
- Add `'use client'` only when needed

## Routes
- `(auth)/*` - Auth pages (login, signup)
- `(dashboard)/*` - Protected pages
- `(marketing)/*` - Public pages
- `api/webhooks/*` - Webhook handlers

## Environment Variables
All secrets in `.env.local`, never commit.
```

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?

  // Auth
  clerkId       String?   @unique

  // Billing
  stripeCustomerId    String?   @unique
  stripePriceId       String?
  stripeSubscriptionId String?  @unique
  stripeCurrentPeriodEnd DateTime?

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  projects      Project[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

### src/lib/db.ts

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

### src/lib/stripe.ts

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['5 projects', 'Basic support'],
  },
  pro: {
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: ['Unlimited projects', 'Priority support', 'API access'],
  },
} as const

export type Plan = keyof typeof PLANS
```

### src/app/api/webhooks/stripe/route.ts

```typescript
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await db.user.update({
        where: { stripeCustomerId: session.customer as string },
        data: {
          stripePriceId: session.metadata?.priceId,
          stripeSubscriptionId: session.subscription as string,
        },
      })
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await db.user.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          stripePriceId: subscription.status === 'active'
            ? subscription.items.data[0].price.id
            : null,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })
      break
    }
  }

  return new NextResponse(null, { status: 200 })
}
```

### .env.example

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:file": "eslint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  }
}
```

### .claude/settings.json

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bun run format || true"
        }
      ]
    },
    {
      "matcher": "Write|Edit",
      "filePattern": "prisma/schema.prisma",
      "hooks": [
        {
          "type": "command",
          "command": "bunx prisma format && bunx prisma generate"
        }
      ]
    }
  ]
}
```

### .mcp.json

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://github.mcp.anthropic.com/mcp"
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

## Setup Commands

```bash
# Create project
bunx create-next-app@latest my-saas-app --typescript --tailwind --eslint --app --src-dir

cd my-saas-app

# Add dependencies
bun add @prisma/client stripe @clerk/nextjs resend
bun add -D prisma @types/node tsx vitest

# Setup Prisma
bunx prisma init

# Setup shadcn/ui
bunx shadcn-ui@latest init
bunx shadcn-ui@latest add button card input label

# Create Claude config
mkdir -p .claude/agents
# (Copy files from above)

# Setup database
bunx prisma db push
bunx prisma generate

# Start development
bun run dev
```

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database provisioned (Neon, Supabase, Railway)
- [ ] Stripe webhook endpoint configured
- [ ] Clerk webhook endpoint configured
- [ ] Domain configured
- [ ] Build passes locally
- [ ] All tests pass
