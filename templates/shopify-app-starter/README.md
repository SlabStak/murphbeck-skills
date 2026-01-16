# Shopify App Starter Template

A production-ready Shopify app template built with Remix, Prisma, and Polaris.

## Features

- **Remix Framework** - Modern React framework with server-side rendering
- **Shopify App Bridge** - Seamless embedded app experience
- **Polaris UI** - Official Shopify design system
- **Prisma ORM** - Type-safe database access
- **Session Management** - Secure OAuth token storage
- **Webhook Handling** - HMAC-validated webhook processing
- **App Proxy** - Storefront integration support
- **Billing API** - Subscription and usage-based billing

## Tech Stack

- **Framework**: Remix v2
- **UI**: Shopify Polaris
- **Database**: PostgreSQL + Prisma
- **Auth**: Shopify OAuth 2.0
- **Language**: TypeScript
- **Styling**: CSS Modules + Polaris tokens

## Quick Start

### 1. Clone and Install

```bash
# Clone this template
npx degit murphbeck/templates/shopify-app-starter my-shopify-app
cd my-shopify-app

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

Update `.env` with your Shopify app credentials from the Partner Dashboard.

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 4. Start Development

```bash
# Start the dev server
npm run dev

# In another terminal, start the Shopify CLI tunnel
npm run shopify app dev
```

## Project Structure

```
shopify-app-starter/
├── app/
│   ├── components/          # React components
│   ├── routes/              # Remix routes
│   │   ├── app._index.tsx   # Main app dashboard
│   │   ├── app.settings.tsx # App settings page
│   │   ├── auth.$.tsx       # OAuth callback handler
│   │   └── webhooks.tsx     # Webhook endpoint
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   └── shopify.server.ts    # Shopify API configuration
├── prisma/
│   └── schema.prisma        # Database schema
├── extensions/              # Shopify extensions
│   ├── theme-extension/     # Theme app extension
│   └── checkout-ui/         # Checkout UI extension
├── public/                  # Static assets
└── shopify.app.toml         # Shopify app configuration
```

## Key Files

### `app/shopify.server.ts`
Central Shopify configuration including API version, scopes, and webhook subscriptions.

### `app/routes/app._index.tsx`
Main dashboard that loads when merchants open your app.

### `app/routes/webhooks.tsx`
Processes incoming webhooks with HMAC validation.

### `prisma/schema.prisma`
Database schema for sessions, shops, and app-specific data.

## Configuration

### Shopify Partner Dashboard Setup

1. Create a new app in your [Partner Dashboard](https://partners.shopify.com)
2. Set the App URL to your ngrok/cloudflare tunnel URL
3. Configure OAuth redirect URLs
4. Note your API key and secret

### Required Scopes

Update `shopify.app.toml` with the scopes your app needs:

```toml
[access_scopes]
scopes = "read_products,write_products,read_orders"
```

### Webhook Subscriptions

Register webhooks in `app/shopify.server.ts`:

```typescript
webhooks: {
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks",
  },
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks",
  },
},
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Fly.io

```bash
# Install Fly CLI and login
flyctl launch

# Deploy
flyctl deploy
```

### Railway

Connect your GitHub repo to Railway for automatic deployments.

## Billing Integration

The template includes a billing service for handling app charges:

```typescript
import { billingService } from "~/services/billing.server";

// Create a subscription
const confirmationUrl = await billingService.createSubscription(
  admin,
  "Pro Plan",
  9.99
);

// Create a usage charge
await billingService.createUsageCharge(admin, "API Calls", 0.01, 1000);
```

## App Proxy

For storefront integrations, configure an app proxy in your Partner Dashboard:

- **Subpath prefix**: `apps`
- **Subpath**: `your-app`
- **Proxy URL**: `https://your-app.com/proxy`

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Common Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run shopify       # Run Shopify CLI commands
npm run prisma:studio # Open Prisma Studio
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript checks
```

## Resources

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Remix Documentation](https://remix.run/docs)
- [Polaris Components](https://polaris.shopify.com/components)
- [Shopify API Reference](https://shopify.dev/docs/api)

## License

MIT
