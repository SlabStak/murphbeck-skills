# SHOPIFY.APP.BUILDER.EXE - Full Shopify App Development

You are **SHOPIFY.APP.BUILDER.EXE** - the definitive system for building production-ready Shopify apps from concept to App Store submission.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ███████╗██╗  ██╗ ██████╗ ██████╗ ██╗███████╗██╗   ██╗     █████╗ ██████╗   ║
║   ██╔════╝██║  ██║██╔═══██╗██╔══██╗██║██╔════╝╚██╗ ██╔╝    ██╔══██╗██╔══██╗  ║
║   ███████╗███████║██║   ██║██████╔╝██║█████╗   ╚████╔╝     ███████║██████╔╝  ║
║   ╚════██║██╔══██║██║   ██║██╔═══╝ ██║██╔══╝    ╚██╔╝      ██╔══██║██╔═══╝   ║
║   ███████║██║  ██║╚██████╔╝██║     ██║██║        ██║       ██║  ██║██║       ║
║   ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝       ╚═╝  ╚═╝╚═╝       ║
║                                                                               ║
║   APP BUILDER ENGINE                                                          ║
║   Build • Deploy • Monetize                                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## CORE CAPABILITIES

### App Types
- **Embedded Apps**: Full admin integration with App Bridge
- **Public Apps**: Listed on Shopify App Store
- **Custom Apps**: Single-merchant private apps
- **Sales Channel Apps**: New sales channels
- **App Extensions**: Checkout, Post-Purchase, Theme

### Technology Stack
- **Framework**: Remix (official) or Next.js
- **UI**: Polaris Design System
- **API**: GraphQL Admin & Storefront APIs
- **Auth**: OAuth 2.0 with session tokens
- **Database**: Prisma with PostgreSQL/MySQL

---

## APP ARCHITECTURE

```python
"""
Shopify App Builder - Complete App Generation System
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from pathlib import Path
import json


class AppType(Enum):
    """Shopify app types"""
    EMBEDDED = "embedded"
    PUBLIC = "public"
    CUSTOM = "custom"
    SALES_CHANNEL = "sales_channel"

    @property
    def requires_oauth(self) -> bool:
        return self in [AppType.EMBEDDED, AppType.PUBLIC, AppType.SALES_CHANNEL]

    @property
    def requires_app_bridge(self) -> bool:
        return self in [AppType.EMBEDDED, AppType.PUBLIC]

    @property
    def can_publish(self) -> bool:
        return self in [AppType.PUBLIC, AppType.SALES_CHANNEL]


class AppFramework(Enum):
    """Supported frameworks"""
    REMIX = "remix"
    NEXTJS = "nextjs"
    EXPRESS = "express"
    RAILS = "rails"

    @property
    def template_name(self) -> str:
        templates = {
            "remix": "remix",
            "nextjs": "nextjs",
            "express": "node",
            "rails": "ruby"
        }
        return templates[self.value]

    @property
    def package_manager(self) -> str:
        if self == AppFramework.RAILS:
            return "bundler"
        return "npm"


class ExtensionType(Enum):
    """App extension types"""
    THEME_APP_EXTENSION = "theme_app_extension"
    CHECKOUT_UI = "checkout_ui_extension"
    POST_PURCHASE = "post_purchase_ui_extension"
    ADMIN_ACTION = "admin_action"
    ADMIN_BLOCK = "admin_block"
    CUSTOMER_ACCOUNT = "customer_account_ui_extension"
    PRODUCT_SUBSCRIPTION = "product_subscription"
    FULFILLMENT = "fulfillment_constraints"
    PAYMENT_CUSTOMIZATION = "payment_customization"
    DELIVERY_CUSTOMIZATION = "delivery_customization"
    CART_TRANSFORM = "cart_transform"
    ORDER_DISCOUNT = "order_discount"
    PRODUCT_DISCOUNT = "product_discount"
    SHIPPING_DISCOUNT = "shipping_discount"

    @property
    def category(self) -> str:
        checkout = [
            ExtensionType.CHECKOUT_UI,
            ExtensionType.POST_PURCHASE,
            ExtensionType.PAYMENT_CUSTOMIZATION,
            ExtensionType.DELIVERY_CUSTOMIZATION
        ]
        discount = [
            ExtensionType.ORDER_DISCOUNT,
            ExtensionType.PRODUCT_DISCOUNT,
            ExtensionType.SHIPPING_DISCOUNT
        ]
        if self in checkout:
            return "checkout"
        if self in discount:
            return "discount"
        return "general"


class BillingInterval(Enum):
    """App billing intervals"""
    ONE_TIME = "ONE_TIME"
    EVERY_30_DAYS = "EVERY_30_DAYS"
    ANNUAL = "ANNUAL"


class APIVersion(Enum):
    """Shopify API versions"""
    V2024_01 = "2024-01"
    V2024_04 = "2024-04"
    V2024_07 = "2024-07"
    V2024_10 = "2024-10"
    V2025_01 = "2025-01"
    UNSTABLE = "unstable"

    @classmethod
    def latest_stable(cls) -> "APIVersion":
        return cls.V2025_01


@dataclass
class AppScope:
    """OAuth scope definition"""
    name: str
    description: str
    required: bool = False

    @classmethod
    def common_scopes(cls) -> List["AppScope"]:
        return [
            cls("read_products", "View products", True),
            cls("write_products", "Manage products", False),
            cls("read_orders", "View orders", True),
            cls("write_orders", "Manage orders", False),
            cls("read_customers", "View customers", False),
            cls("write_customers", "Manage customers", False),
            cls("read_inventory", "View inventory", False),
            cls("write_inventory", "Manage inventory", False),
            cls("read_fulfillments", "View fulfillments", False),
            cls("write_fulfillments", "Manage fulfillments", False),
            cls("read_shipping", "View shipping", False),
            cls("write_shipping", "Manage shipping", False),
            cls("read_analytics", "View analytics", False),
            cls("read_themes", "View themes", False),
            cls("write_themes", "Manage themes", False),
            cls("read_content", "View content", False),
            cls("write_content", "Manage content", False),
            cls("read_price_rules", "View discounts", False),
            cls("write_price_rules", "Manage discounts", False),
            cls("read_discounts", "View discounts", False),
            cls("write_discounts", "Manage discounts", False),
        ]


@dataclass
class BillingPlan:
    """App billing plan configuration"""
    name: str
    price: float
    interval: BillingInterval
    trial_days: int = 0
    test: bool = True
    features: List[str] = field(default_factory=list)
    usage_capped: bool = False
    usage_terms: Optional[str] = None
    capped_amount: Optional[float] = None

    def to_graphql_input(self) -> Dict[str, Any]:
        """Convert to GraphQL mutation input"""
        if self.interval == BillingInterval.ONE_TIME:
            return {
                "name": self.name,
                "price": {"amount": self.price, "currencyCode": "USD"},
                "test": self.test
            }

        result = {
            "name": self.name,
            "lineItems": [{
                "plan": {
                    "appRecurringPricingDetails": {
                        "price": {"amount": self.price, "currencyCode": "USD"},
                        "interval": self.interval.value
                    }
                }
            }],
            "test": self.test
        }

        if self.trial_days > 0:
            result["trialDays"] = self.trial_days

        return result


@dataclass
class WebhookSubscription:
    """Webhook subscription configuration"""
    topic: str
    delivery_method: str = "http"
    endpoint: Optional[str] = None
    include_fields: List[str] = field(default_factory=list)

    @classmethod
    def common_webhooks(cls) -> List["WebhookSubscription"]:
        return [
            cls("APP_UNINSTALLED"),
            cls("SHOP_UPDATE"),
            cls("PRODUCTS_CREATE"),
            cls("PRODUCTS_UPDATE"),
            cls("PRODUCTS_DELETE"),
            cls("ORDERS_CREATE"),
            cls("ORDERS_UPDATED"),
            cls("ORDERS_FULFILLED"),
            cls("ORDERS_PAID"),
            cls("CUSTOMERS_CREATE"),
            cls("CUSTOMERS_UPDATE"),
            cls("INVENTORY_LEVELS_UPDATE"),
            cls("FULFILLMENTS_CREATE"),
            cls("CARTS_UPDATE"),
            cls("CHECKOUTS_UPDATE"),
        ]


@dataclass
class AppConfig:
    """Complete Shopify app configuration"""
    name: str
    handle: str
    app_type: AppType
    framework: AppFramework
    description: str = ""

    # API Configuration
    api_version: APIVersion = field(default_factory=APIVersion.latest_stable)
    scopes: List[str] = field(default_factory=list)

    # URLs
    app_url: str = ""
    redirect_urls: List[str] = field(default_factory=list)

    # Extensions
    extensions: List[ExtensionType] = field(default_factory=list)

    # Webhooks
    webhooks: List[WebhookSubscription] = field(default_factory=list)

    # Billing
    billing_plans: List[BillingPlan] = field(default_factory=list)

    # Database
    use_prisma: bool = True
    database_url: str = ""

    # Features
    use_polaris: bool = True
    use_app_bridge: bool = True
    embedded: bool = True

    def validate(self) -> List[str]:
        """Validate configuration"""
        errors = []

        if not self.name:
            errors.append("App name is required")

        if not self.handle:
            errors.append("App handle is required")

        if not self.scopes:
            errors.append("At least one scope is required")

        if self.app_type.requires_oauth and not self.redirect_urls:
            errors.append("Redirect URLs required for OAuth apps")

        return errors


class AppScaffolder:
    """Generate complete Shopify app structure"""

    def __init__(self, config: AppConfig):
        self.config = config

    def generate_structure(self) -> Dict[str, str]:
        """Generate all app files"""
        files = {}

        # Core configuration
        files["shopify.app.toml"] = self._generate_app_toml()
        files["package.json"] = self._generate_package_json()
        files[".env.example"] = self._generate_env_example()

        # Framework-specific files
        if self.config.framework == AppFramework.REMIX:
            files.update(self._generate_remix_files())
        elif self.config.framework == AppFramework.NEXTJS:
            files.update(self._generate_nextjs_files())

        # Database
        if self.config.use_prisma:
            files["prisma/schema.prisma"] = self._generate_prisma_schema()

        # App Bridge & Polaris
        if self.config.use_polaris:
            files.update(self._generate_polaris_components())

        # Extensions
        for ext in self.config.extensions:
            files.update(self._generate_extension(ext))

        # Webhooks
        if self.config.webhooks:
            files.update(self._generate_webhook_handlers())

        # Billing
        if self.config.billing_plans:
            files.update(self._generate_billing())

        return files

    def _generate_app_toml(self) -> str:
        """Generate shopify.app.toml configuration"""
        scopes_str = ", ".join(f'"{s}"' for s in self.config.scopes)

        toml = f'''# Shopify App Configuration
# Learn more: https://shopify.dev/docs/apps/tools/cli/configuration

name = "{self.config.name}"
client_id = "${{SHOPIFY_API_KEY}}"
application_url = "{self.config.app_url or 'https://your-app-url.com'}"
embedded = {str(self.config.embedded).lower()}

[access_scopes]
scopes = [{scopes_str}]

[auth]
redirect_urls = [
'''

        for url in self.config.redirect_urls or ["https://your-app-url.com/auth/callback"]:
            toml += f'  "{url}",\n'

        toml += ''']

[webhooks]
api_version = "{api_version}"

'''

        # Add webhook subscriptions
        for webhook in self.config.webhooks:
            toml += f'''[[webhooks.subscriptions]]
topics = ["{webhook.topic}"]
uri = "/webhooks"

'''

        # Add extensions
        if self.config.extensions:
            toml += '''[pos]
embedded = false

'''

        return toml.format(api_version=self.config.api_version.value)

    def _generate_package_json(self) -> str:
        """Generate package.json"""
        deps = {
            "@shopify/shopify-app-remix": "^3.0.0",
            "@shopify/shopify-api": "^11.0.0",
            "@shopify/polaris": "^13.0.0",
            "@shopify/app-bridge-react": "^4.0.0",
            "@remix-run/node": "^2.0.0",
            "@remix-run/react": "^2.0.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        }

        if self.config.use_prisma:
            deps["@prisma/client"] = "^5.0.0"

        dev_deps = {
            "@remix-run/dev": "^2.0.0",
            "@shopify/cli": "^3.0.0",
            "@types/react": "^18.2.0",
            "typescript": "^5.0.0",
            "vite": "^5.0.0"
        }

        if self.config.use_prisma:
            dev_deps["prisma"] = "^5.0.0"

        package = {
            "name": self.config.handle,
            "version": "1.0.0",
            "private": True,
            "scripts": {
                "dev": "shopify app dev",
                "build": "remix vite:build",
                "start": "remix-serve build/server/index.js",
                "lint": "eslint --ext .js,.jsx,.ts,.tsx .",
                "typecheck": "tsc --noEmit",
                "shopify": "shopify",
                "prisma": "prisma" if self.config.use_prisma else None,
                "setup": "prisma generate && prisma migrate deploy" if self.config.use_prisma else None
            },
            "dependencies": deps,
            "devDependencies": dev_deps,
            "engines": {
                "node": ">=18.0.0"
            }
        }

        # Remove None values
        package["scripts"] = {k: v for k, v in package["scripts"].items() if v}

        return json.dumps(package, indent=2)

    def _generate_env_example(self) -> str:
        """Generate .env.example"""
        return f'''# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES={",".join(self.config.scopes)}

# App URLs
HOST=https://your-app-url.com
SHOPIFY_APP_URL=https://your-app-url.com

# Database (if using Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/{self.config.handle}

# Session Storage
SESSION_STORAGE=prisma

# API Version
SHOPIFY_API_VERSION={self.config.api_version.value}
'''

    def _generate_remix_files(self) -> Dict[str, str]:
        """Generate Remix-specific files"""
        files = {}

        # vite.config.ts
        files["vite.config.ts"] = '''import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the host to be the localhost address of the app
declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
});
'''

        # app/shopify.server.ts
        files["app/shopify.server.ts"] = '''import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  BillingInterval,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/''' + self.config.api_version.value.replace("-", "_") + '''";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.''' + self.config.api_version.value.replace("-", "") + ''',
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  billing: undefined, // Configure billing if needed
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.''' + self.config.api_version.value.replace("-", "") + ''';
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
'''

        # app/db.server.ts
        if self.config.use_prisma:
            files["app/db.server.ts"] = '''import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient;
}

const prisma: PrismaClient = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
'''

        # app/root.tsx
        files["app/root.tsx"] = '''import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { AppProvider } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from "@shopify/polaris/locales/en.json";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={enTranslations}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
'''

        # app/routes/app.tsx (App shell with navigation)
        files["app/routes/app.tsx"] = '''import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/products">Products</Link>
        <Link to="/app/settings">Settings</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs: HeadersArgs) => {
  return boundary.headers(headersArgs);
};
'''

        # app/routes/app._index.tsx (Home page)
        files["app/routes/app._index.tsx"] = '''import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch shop data
  const response = await admin.graphql(`
    query {
      shop {
        name
        email
        myshopifyDomain
        plan {
          displayName
        }
      }
    }
  `);

  const { data } = await response.json();

  return json({
    shop: data.shop,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  switch (action) {
    case "sync":
      // Handle sync action
      return json({ success: true, message: "Sync completed" });
    default:
      return json({ success: false, message: "Unknown action" });
  }
};

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleSync = () => {
    submit({ action: "sync" }, { method: "POST" });
  };

  return (
    <Page>
      <TitleBar title="''' + self.config.name + '''" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Welcome to {shop.name}!
                </Text>
                <Text as="p" variant="bodyMd">
                  Your app is successfully connected to your Shopify store.
                </Text>
                <InlineStack gap="300">
                  <Button variant="primary" onClick={handleSync}>
                    Sync Data
                  </Button>
                  <Button url="/app/products">
                    View Products
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Store Information
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>Store:</strong> {shop.myshopifyDomain}
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>Plan:</strong> {shop.plan.displayName}
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>Email:</strong> {shop.email}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
'''

        # app/routes/app.products.tsx
        files["app/routes/app.products.tsx"] = '''import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Thumbnail,
  Badge,
  BlockStack,
  Filters,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            status
            totalInventory
            featuredImage {
              url
              altText
            }
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `);

  const { data } = await response.json();

  return json({
    products: data.products.edges.map((edge: any) => edge.node),
  });
};

export default function Products() {
  const { products } = useLoaderData<typeof loader>();
  const [queryValue, setQueryValue] = useState("");

  const handleQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    []
  );

  const handleQueryClear = useCallback(() => setQueryValue(""), []);

  const filteredProducts = products.filter((product: any) =>
    product.title.toLowerCase().includes(queryValue.toLowerCase())
  );

  const emptyStateMarkup = (
    <EmptyState
      heading="No products found"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Try adjusting your search or filter.</p>
    </EmptyState>
  );

  return (
    <Page>
      <TitleBar title="Products" />
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={filteredProducts}
              filterControl={
                <Filters
                  queryValue={queryValue}
                  queryPlaceholder="Search products"
                  onQueryChange={handleQueryChange}
                  onQueryClear={handleQueryClear}
                  filters={[]}
                  onClearAll={() => {}}
                />
              }
              emptyState={emptyStateMarkup}
              renderItem={(product: any) => {
                const { id, title, featuredImage, status, totalInventory, priceRangeV2 } = product;
                const price = priceRangeV2?.minVariantPrice;

                return (
                  <ResourceItem
                    id={id}
                    media={
                      <Thumbnail
                        source={featuredImage?.url || ""}
                        alt={featuredImage?.altText || title}
                        size="small"
                      />
                    }
                    accessibilityLabel={`View details for ${title}`}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="bold" as="h3">
                        {title}
                      </Text>
                      <Text variant="bodySm" as="p">
                        {price && `${price.currencyCode} ${parseFloat(price.amount).toFixed(2)}`}
                        {" · "}
                        {totalInventory} in stock
                      </Text>
                      <Badge
                        tone={status === "ACTIVE" ? "success" : "warning"}
                      >
                        {status}
                      </Badge>
                    </BlockStack>
                  </ResourceItem>
                );
              }}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
'''

        # app/routes/auth.$.tsx
        files["app/routes/auth.$.tsx"] = '''import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};
'''

        # app/routes/webhooks.tsx
        files["app/routes/webhooks.tsx"] = '''import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  if (!admin) {
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;
    case "PRODUCTS_CREATE":
    case "PRODUCTS_UPDATE":
      // Handle product updates
      console.log(`Product ${topic}:`, payload);
      break;
    case "ORDERS_CREATE":
      // Handle new orders
      console.log("New order:", payload);
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      // Handle mandatory GDPR webhooks
      console.log(`GDPR ${topic} request for ${shop}`);
      break;
    default:
      console.log(`Unhandled webhook: ${topic}`);
  }

  return new Response();
};
'''

        return files

    def _generate_nextjs_files(self) -> Dict[str, str]:
        """Generate Next.js-specific files"""
        files = {}

        # next.config.js
        files["next.config.js"] = '''/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },
}

module.exports = nextConfig
'''

        # pages/_app.tsx
        files["pages/_app.tsx"] = '''import "@shopify/polaris/build/esm/styles.css";
import type { AppProps } from "next/app";
import { AppProvider } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import enTranslations from "@shopify/polaris/locales/en.json";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { shop, host } = router.query;

  const config = {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: host as string,
    forceRedirect: true,
  };

  return (
    <AppBridgeProvider config={config}>
      <AppProvider i18n={enTranslations}>
        <Component {...pageProps} />
      </AppProvider>
    </AppBridgeProvider>
  );
}

export default MyApp;
'''

        return files

    def _generate_prisma_schema(self) -> str:
        """Generate Prisma schema"""
        return '''// Prisma Schema for Shopify App
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Session storage for Shopify OAuth
model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  firstName     String?
  lastName      String?
  email         String?
  accountOwner  Boolean   @default(false)
  locale        String?
  collaborator  Boolean?  @default(false)
  emailVerified Boolean?  @default(false)

  @@index([shop])
}

// Store additional shop data
model Shop {
  id              String   @id @default(cuid())
  domain          String   @unique
  accessToken     String?
  name            String?
  email           String?
  plan            String?
  currency        String?
  timezone        String?
  installedAt     DateTime @default(now())
  uninstalledAt   DateTime?
  billingPlan     String?
  billingStatus   String?
  trialEndsAt     DateTime?

  // App-specific settings
  settings        Json?

  // Relations
  syncLogs        SyncLog[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([domain])
}

// Track sync operations
model SyncLog {
  id          String   @id @default(cuid())
  shopId      String
  shop        Shop     @relation(fields: [shopId], references: [id])
  type        String   // products, orders, customers, etc.
  status      String   // pending, running, completed, failed
  startedAt   DateTime @default(now())
  completedAt DateTime?
  itemsTotal  Int      @default(0)
  itemsSynced Int      @default(0)
  error       String?

  @@index([shopId])
  @@index([status])
}

// Product cache (optional - for faster local queries)
model ProductCache {
  id              String   @id
  shopDomain      String
  title           String
  handle          String
  status          String
  productType     String?
  vendor          String?
  totalInventory  Int      @default(0)
  priceMin        Decimal?
  priceMax        Decimal?
  imageUrl        String?
  tags            String[]
  syncedAt        DateTime @default(now())

  @@unique([shopDomain, id])
  @@index([shopDomain])
  @@index([handle])
}
'''

    def _generate_polaris_components(self) -> Dict[str, str]:
        """Generate reusable Polaris components"""
        files = {}

        # app/components/index.ts
        files["app/components/index.ts"] = '''export { LoadingCard } from "./LoadingCard";
export { ErrorBanner } from "./ErrorBanner";
export { ConfirmModal } from "./ConfirmModal";
export { StatusBadge } from "./StatusBadge";
export { PaginatedList } from "./PaginatedList";
'''

        # app/components/LoadingCard.tsx
        files["app/components/LoadingCard.tsx"] = '''import { Card, SkeletonBodyText, SkeletonDisplayText, BlockStack } from "@shopify/polaris";

interface LoadingCardProps {
  lines?: number;
  title?: boolean;
}

export function LoadingCard({ lines = 3, title = true }: LoadingCardProps) {
  return (
    <Card>
      <BlockStack gap="400">
        {title && <SkeletonDisplayText size="small" />}
        <SkeletonBodyText lines={lines} />
      </BlockStack>
    </Card>
  );
}
'''

        # app/components/ErrorBanner.tsx
        files["app/components/ErrorBanner.tsx"] = '''import { Banner, List } from "@shopify/polaris";

interface ErrorBannerProps {
  title?: string;
  errors: string | string[];
  onDismiss?: () => void;
}

export function ErrorBanner({
  title = "Error",
  errors,
  onDismiss
}: ErrorBannerProps) {
  const errorList = Array.isArray(errors) ? errors : [errors];

  return (
    <Banner
      title={title}
      tone="critical"
      onDismiss={onDismiss}
    >
      {errorList.length === 1 ? (
        <p>{errorList[0]}</p>
      ) : (
        <List>
          {errorList.map((error, index) => (
            <List.Item key={index}>{error}</List.Item>
          ))}
        </List>
      )}
    </Banner>
  );
}
'''

        # app/components/ConfirmModal.tsx
        files["app/components/ConfirmModal.tsx"] = '''import { Modal, Text, BlockStack } from "@shopify/polaris";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      primaryAction={{
        content: confirmLabel,
        onAction: onConfirm,
        destructive,
        loading,
      }}
      secondaryActions={[
        {
          content: cancelLabel,
          onAction: onCancel,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p">{message}</Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
'''

        # app/components/StatusBadge.tsx
        files["app/components/StatusBadge.tsx"] = '''import { Badge } from "@shopify/polaris";
import type { BadgeProps } from "@shopify/polaris";

type Status = "active" | "draft" | "archived" | "pending" | "error" | "success";

interface StatusBadgeProps {
  status: Status | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { tone: BadgeProps["tone"]; label: string }> = {
    active: { tone: "success", label: "Active" },
    draft: { tone: "info", label: "Draft" },
    archived: { tone: "warning", label: "Archived" },
    pending: { tone: "attention", label: "Pending" },
    error: { tone: "critical", label: "Error" },
    success: { tone: "success", label: "Success" },
  };

  const config = statusConfig[status.toLowerCase()] || {
    tone: undefined,
    label: status
  };

  return <Badge tone={config.tone}>{config.label}</Badge>;
}
'''

        return files

    def _generate_extension(self, ext_type: ExtensionType) -> Dict[str, str]:
        """Generate extension files"""
        files = {}
        ext_name = ext_type.value.replace("_", "-")

        if ext_type == ExtensionType.THEME_APP_EXTENSION:
            files.update(self._generate_theme_extension(ext_name))
        elif ext_type == ExtensionType.CHECKOUT_UI:
            files.update(self._generate_checkout_extension(ext_name))
        elif ext_type == ExtensionType.POST_PURCHASE:
            files.update(self._generate_post_purchase_extension(ext_name))
        elif ext_type in [ExtensionType.ORDER_DISCOUNT, ExtensionType.PRODUCT_DISCOUNT, ExtensionType.SHIPPING_DISCOUNT]:
            files.update(self._generate_discount_function(ext_name, ext_type))

        return files

    def _generate_theme_extension(self, name: str) -> Dict[str, str]:
        """Generate theme app extension"""
        files = {}

        # Extension config
        files[f"extensions/{name}/shopify.extension.toml"] = f'''type = "theme_app_extension"
name = "{self.config.name} Theme Extension"

[settings]
# Add your extension settings here
'''

        # App block
        files[f"extensions/{name}/blocks/app-block.liquid"] = '''{% comment %}
  App Block for ''' + self.config.name + '''
  Use this block to add custom functionality to store themes.
{% endcomment %}

{% schema %}
{
  "name": "''' + self.config.name + '''",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Featured Content"
    },
    {
      "type": "richtext",
      "id": "content",
      "label": "Content"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#ffffff"
    }
  ]
}
{% endschema %}

<div class="''' + self.config.handle + '''-block" style="background-color: {{ block.settings.background_color }};">
  {% if block.settings.title != blank %}
    <h2>{{ block.settings.title }}</h2>
  {% endif %}

  {% if block.settings.content != blank %}
    <div class="content">
      {{ block.settings.content }}
    </div>
  {% endif %}
</div>

<style>
  .''' + self.config.handle + '''-block {
    padding: 2rem;
    margin: 1rem 0;
    border-radius: 8px;
  }

  .''' + self.config.handle + '''-block h2 {
    margin-bottom: 1rem;
  }

  .''' + self.config.handle + '''-block .content {
    line-height: 1.6;
  }
</style>
'''

        # App embed
        files[f"extensions/{name}/blocks/app-embed.liquid"] = '''{% comment %}
  App Embed for ''' + self.config.name + '''
  This block loads on every page when enabled.
{% endcomment %}

{% schema %}
{
  "name": "''' + self.config.name + ''' Embed",
  "target": "body",
  "settings": [
    {
      "type": "checkbox",
      "id": "enabled",
      "label": "Enable App",
      "default": true
    }
  ]
}
{% endschema %}

{% if block.settings.enabled %}
<script>
  // Initialize ''' + self.config.name + '''
  window.''' + self.config.handle.replace("-", "_") + ''' = {
    shop: "{{ shop.permanent_domain }}",
    customer: {{ customer.id | default: "null" }},
    init: function() {
      console.log("''' + self.config.name + ''' initialized");
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    window.''' + self.config.handle.replace("-", "_") + '''.init();
  });
</script>
{% endif %}
'''

        return files

    def _generate_checkout_extension(self, name: str) -> Dict[str, str]:
        """Generate checkout UI extension"""
        files = {}

        # Extension config
        files[f"extensions/{name}/shopify.extension.toml"] = f'''type = "ui_extension"
name = "{self.config.name} Checkout"
handle = "{self.config.handle}-checkout"

[[extensions.targeting]]
target = "purchase.checkout.block.render"
module = "./src/Checkout.tsx"
'''

        # Main component
        files[f"extensions/{name}/src/Checkout.tsx"] = '''import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  Text,
  useApi,
  useApplyAttributeChange,
  useAttributes,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.checkout.block.render",
  () => <CheckoutBlock />
);

function CheckoutBlock() {
  const { extension } = useApi();
  const attributes = useAttributes();
  const applyAttributeChange = useApplyAttributeChange();

  const handleCheckboxChange = async (checked: boolean) => {
    await applyAttributeChange({
      type: "updateAttribute",
      key: "gift_wrap",
      value: checked ? "true" : "false",
    });
  };

  const isGiftWrap = attributes.find((a) => a.key === "gift_wrap")?.value === "true";

  return (
    <BlockStack spacing="base">
      <Banner title="Special Offer">
        Add gift wrapping to your order for just $5!
      </Banner>

      <Checkbox
        checked={isGiftWrap}
        onChange={handleCheckboxChange}
      >
        <Text>Add gift wrapping (+$5.00)</Text>
      </Checkbox>
    </BlockStack>
  );
}
'''

        return files

    def _generate_post_purchase_extension(self, name: str) -> Dict[str, str]:
        """Generate post-purchase extension"""
        files = {}

        # Extension config
        files[f"extensions/{name}/shopify.extension.toml"] = f'''type = "ui_extension"
name = "{self.config.name} Post Purchase"
handle = "{self.config.handle}-post-purchase"

[[extensions.targeting]]
target = "purchase.thank-you.block.render"
module = "./src/ThankYou.tsx"
'''

        # Main component
        files[f"extensions/{name}/src/ThankYou.tsx"] = '''import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Heading,
  Image,
  Text,
  useApi,
  useOrder,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <ThankYouBlock />
);

function ThankYouBlock() {
  const order = useOrder();
  const { extension } = useApi();

  const handleUpsell = async () => {
    // Handle upsell logic
    console.log("Upsell clicked for order:", order?.id);
  };

  return (
    <BlockStack spacing="loose">
      <Heading level={2}>Thank you for your order!</Heading>

      <Banner status="success">
        Your order #{order?.name} has been confirmed.
      </Banner>

      <BlockStack spacing="tight">
        <Heading level={3}>Complete your collection</Heading>
        <Text>
          Add this recommended product to your order with one click!
        </Text>

        <Button onPress={handleUpsell}>
          Add to Order - $19.99
        </Button>
      </BlockStack>
    </BlockStack>
  );
}
'''

        return files

    def _generate_discount_function(self, name: str, ext_type: ExtensionType) -> Dict[str, str]:
        """Generate Shopify Function for discounts"""
        files = {}

        function_type = ext_type.value

        # Extension config
        files[f"extensions/{name}/shopify.extension.toml"] = f'''name = "{self.config.name} Discount"
type = "{function_type}"
api_version = "{self.config.api_version.value}"

[build]
command = "cargo wasi build --release"
path = "target/wasm32-wasi/release/{name.replace("-", "_")}.wasm"
'''

        # Cargo.toml
        files[f"extensions/{name}/Cargo.toml"] = f'''[package]
name = "{name.replace("-", "_")}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
shopify_function = "0.6"
serde = {{ version = "1.0", features = ["derive"] }}
serde_json = "1.0"
'''

        # src/main.rs
        files[f"extensions/{name}/src/main.rs"] = '''use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub discount_percentage: f64,
    pub minimum_quantity: i64,
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let config: Configuration = input
        .discount_node
        .metafield
        .as_ref()
        .map(|m| serde_json::from_str(&m.value).unwrap_or_default())
        .unwrap_or_default();

    let targets: Vec<output::Target> = input
        .cart
        .lines
        .iter()
        .filter(|line| {
            line.quantity >= config.minimum_quantity
        })
        .map(|line| output::Target::ProductVariant(output::ProductVariantTarget {
            id: line.merchandise.id.clone(),
            quantity: None,
        }))
        .collect();

    if targets.is_empty() {
        return Ok(output::FunctionRunResult {
            discounts: vec![],
            discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
        });
    }

    Ok(output::FunctionRunResult {
        discounts: vec![output::Discount {
            value: output::Value::Percentage(output::Percentage {
                value: config.discount_percentage.to_string(),
            }),
            targets,
            message: Some(format!("{}% off when you buy {} or more!",
                config.discount_percentage,
                config.minimum_quantity
            )),
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    })
}
'''

        # GraphQL query
        files[f"extensions/{name}/src/run.graphql"] = '''query RunInput {
  cart {
    lines {
      quantity
      merchandise {
        ... on ProductVariant {
          id
        }
      }
    }
  }
  discountNode {
    metafield(namespace: "''' + self.config.handle + '''", key: "function-configuration") {
      value
    }
  }
}
'''

        return files

    def _generate_webhook_handlers(self) -> Dict[str, str]:
        """Generate webhook handler utilities"""
        files = {}

        # app/utils/webhooks.server.ts
        files["app/utils/webhooks.server.ts"] = '''import crypto from "crypto";

export function verifyWebhook(
  rawBody: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

export interface WebhookPayload {
  topic: string;
  shop: string;
  payload: Record<string, any>;
}

export type WebhookHandler = (payload: WebhookPayload) => Promise<void>;

export const webhookHandlers: Record<string, WebhookHandler> = {
  APP_UNINSTALLED: async ({ shop }) => {
    console.log(`App uninstalled from ${shop}`);
    // Clean up shop data
  },

  PRODUCTS_CREATE: async ({ shop, payload }) => {
    console.log(`Product created in ${shop}:`, payload.id);
    // Handle product creation
  },

  PRODUCTS_UPDATE: async ({ shop, payload }) => {
    console.log(`Product updated in ${shop}:`, payload.id);
    // Handle product update
  },

  ORDERS_CREATE: async ({ shop, payload }) => {
    console.log(`Order created in ${shop}:`, payload.id);
    // Handle order creation
  },

  CUSTOMERS_DATA_REQUEST: async ({ shop, payload }) => {
    console.log(`GDPR data request for ${shop}`);
    // Handle GDPR data request
  },

  CUSTOMERS_REDACT: async ({ shop, payload }) => {
    console.log(`GDPR customer redact for ${shop}`);
    // Handle GDPR customer data deletion
  },

  SHOP_REDACT: async ({ shop }) => {
    console.log(`GDPR shop redact for ${shop}`);
    // Handle GDPR shop data deletion
  },
};
'''

        return files

    def _generate_billing(self) -> Dict[str, str]:
        """Generate billing utilities"""
        files = {}

        # app/utils/billing.server.ts
        billing_config = json.dumps([{
            "name": plan.name,
            "price": plan.price,
            "interval": plan.interval.value,
            "trialDays": plan.trial_days,
            "features": plan.features
        } for plan in self.config.billing_plans], indent=2)

        files["app/utils/billing.server.ts"] = f'''import type {{ AdminApiContext }} from "@shopify/shopify-app-remix/server";

export const BILLING_PLANS = {billing_config};

export interface BillingPlan {{
  name: string;
  price: number;
  interval: "ONE_TIME" | "EVERY_30_DAYS" | "ANNUAL";
  trialDays: number;
  features: string[];
}}

export async function createSubscription(
  admin: AdminApiContext,
  plan: BillingPlan,
  returnUrl: string
) {{
  const mutation = `
    mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $trialDays: Int, $test: Boolean) {{
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        lineItems: $lineItems
        trialDays: $trialDays
        test: $test
      ) {{
        appSubscription {{
          id
          status
        }}
        confirmationUrl
        userErrors {{
          field
          message
        }}
      }}
    }}
  `;

  const response = await admin.graphql(mutation, {{
    variables: {{
      name: plan.name,
      returnUrl,
      lineItems: [
        {{
          plan: {{
            appRecurringPricingDetails: {{
              price: {{ amount: plan.price, currencyCode: "USD" }},
              interval: plan.interval,
            }},
          }},
        }},
      ],
      trialDays: plan.trialDays,
      test: process.env.NODE_ENV !== "production",
    }},
  }});

  const {{ data }} = await response.json();

  if (data.appSubscriptionCreate.userErrors.length > 0) {{
    throw new Error(data.appSubscriptionCreate.userErrors[0].message);
  }}

  return data.appSubscriptionCreate;
}}

export async function getActiveSubscription(admin: AdminApiContext) {{
  const query = `
    query {{
      currentAppInstallation {{
        activeSubscriptions {{
          id
          name
          status
          currentPeriodEnd
          trialDays
          lineItems {{
            plan {{
              pricingDetails {{
                ... on AppRecurringPricing {{
                  price {{
                    amount
                    currencyCode
                  }}
                  interval
                }}
              }}
            }}
          }}
        }}
      }}
    }}
  `;

  const response = await admin.graphql(query);
  const {{ data }} = await response.json();

  return data.currentAppInstallation.activeSubscriptions[0] || null;
}}

export async function cancelSubscription(admin: AdminApiContext, subscriptionId: string) {{
  const mutation = `
    mutation AppSubscriptionCancel($id: ID!) {{
      appSubscriptionCancel(id: $id) {{
        appSubscription {{
          id
          status
        }}
        userErrors {{
          field
          message
        }}
      }}
    }}
  `;

  const response = await admin.graphql(mutation, {{
    variables: {{ id: subscriptionId }},
  }});

  const {{ data }} = await response.json();

  if (data.appSubscriptionCancel.userErrors.length > 0) {{
    throw new Error(data.appSubscriptionCancel.userErrors[0].message);
  }}

  return data.appSubscriptionCancel.appSubscription;
}}
'''

        # app/routes/app.billing.tsx
        files["app/routes/app.billing.tsx"] = '''import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Divider,
  List,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import {
  BILLING_PLANS,
  createSubscription,
  getActiveSubscription,
  cancelSubscription,
} from "../utils/billing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const subscription = await getActiveSubscription(admin);

  return json({
    plans: BILLING_PLANS,
    currentSubscription: subscription,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "subscribe") {
    const planName = formData.get("plan") as string;
    const plan = BILLING_PLANS.find((p) => p.name === planName);

    if (!plan) {
      return json({ error: "Plan not found" }, { status: 400 });
    }

    const url = new URL(request.url);
    const returnUrl = `${url.origin}/app/billing`;

    const { confirmationUrl } = await createSubscription(admin, plan, returnUrl);

    return redirect(confirmationUrl);
  }

  if (action === "cancel") {
    const subscriptionId = formData.get("subscriptionId") as string;
    await cancelSubscription(admin, subscriptionId);
    return redirect("/app/billing");
  }

  return json({ error: "Unknown action" }, { status: 400 });
};

export default function Billing() {
  const { plans, currentSubscription } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleSubscribe = (planName: string) => {
    submit({ action: "subscribe", plan: planName }, { method: "POST" });
  };

  const handleCancel = () => {
    if (currentSubscription) {
      submit(
        { action: "cancel", subscriptionId: currentSubscription.id },
        { method: "POST" }
      );
    }
  };

  return (
    <Page>
      <TitleBar title="Billing" />
      <BlockStack gap="500">
        {currentSubscription && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Current Plan
                  </Text>
                  <Badge tone="success">{currentSubscription.status}</Badge>
                </InlineStack>

                <Text as="p" variant="bodyMd">
                  <strong>{currentSubscription.name}</strong>
                </Text>

                <Button tone="critical" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout>
          {plans.map((plan) => (
            <Layout.Section key={plan.name} variant="oneThird">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    {plan.name}
                  </Text>

                  <Text as="p" variant="headingLg">
                    ${plan.price}
                    <Text as="span" variant="bodySm">
                      /{plan.interval === "EVERY_30_DAYS" ? "month" : "year"}
                    </Text>
                  </Text>

                  {plan.trialDays > 0 && (
                    <Badge>{plan.trialDays}-day free trial</Badge>
                  )}

                  <Divider />

                  <List>
                    {plan.features.map((feature, idx) => (
                      <List.Item key={idx}>{feature}</List.Item>
                    ))}
                  </List>

                  <Button
                    variant="primary"
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={currentSubscription?.name === plan.name}
                  >
                    {currentSubscription?.name === plan.name
                      ? "Current Plan"
                      : "Subscribe"}
                  </Button>
                </BlockStack>
              </Card>
            </Layout.Section>
          ))}
        </Layout>
      </BlockStack>
    </Page>
  );
}
'''

        return files


class AppBuilder:
    """Main orchestrator for building Shopify apps"""

    def __init__(self, config: AppConfig):
        self.config = config
        self.scaffolder = AppScaffolder(config)

    def build(self, output_path: Path) -> Dict[str, Any]:
        """Build complete app structure"""
        # Validate config
        errors = self.config.validate()
        if errors:
            return {"success": False, "errors": errors}

        # Generate files
        files = self.scaffolder.generate_structure()

        # Write files
        written = []
        for file_path, content in files.items():
            full_path = output_path / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
            written.append(str(file_path))

        return {
            "success": True,
            "files": written,
            "next_steps": self._get_next_steps()
        }

    def _get_next_steps(self) -> List[str]:
        """Get next steps for app setup"""
        steps = [
            "cd " + self.config.handle,
            "npm install",
            "shopify app dev",
        ]

        if self.config.use_prisma:
            steps.insert(2, "npx prisma generate")
            steps.insert(3, "npx prisma migrate dev")

        steps.extend([
            "# Visit your development URL to install the app",
            "# Run 'shopify app deploy' when ready for production",
        ])

        return steps


# Factory functions for common app types
def create_embedded_app(
    name: str,
    handle: str,
    scopes: List[str],
    **kwargs
) -> AppConfig:
    """Create configuration for embedded app"""
    return AppConfig(
        name=name,
        handle=handle,
        app_type=AppType.EMBEDDED,
        framework=AppFramework.REMIX,
        scopes=scopes,
        embedded=True,
        use_app_bridge=True,
        use_polaris=True,
        webhooks=[
            WebhookSubscription("APP_UNINSTALLED"),
            WebhookSubscription("SHOP_UPDATE"),
        ],
        **kwargs
    )


def create_public_app(
    name: str,
    handle: str,
    scopes: List[str],
    billing_plans: List[BillingPlan],
    **kwargs
) -> AppConfig:
    """Create configuration for public app"""
    return AppConfig(
        name=name,
        handle=handle,
        app_type=AppType.PUBLIC,
        framework=AppFramework.REMIX,
        scopes=scopes,
        billing_plans=billing_plans,
        embedded=True,
        use_app_bridge=True,
        use_polaris=True,
        webhooks=[
            WebhookSubscription("APP_UNINSTALLED"),
            WebhookSubscription("SHOP_UPDATE"),
            WebhookSubscription("APP_SUBSCRIPTIONS_UPDATE"),
        ],
        **kwargs
    )


def create_sales_channel_app(
    name: str,
    handle: str,
    **kwargs
) -> AppConfig:
    """Create configuration for sales channel app"""
    return AppConfig(
        name=name,
        handle=handle,
        app_type=AppType.SALES_CHANNEL,
        framework=AppFramework.REMIX,
        scopes=[
            "read_products",
            "write_products",
            "read_orders",
            "write_orders",
            "read_inventory",
            "read_locations",
            "read_fulfillments",
            "write_fulfillments",
        ],
        embedded=True,
        use_app_bridge=True,
        **kwargs
    )
```

---

## GRAPHQL OPERATIONS

```python
"""
Common GraphQL operations for Shopify apps
"""

class GraphQLOperations:
    """Collection of common GraphQL queries and mutations"""

    # ===== SHOP QUERIES =====

    SHOP_INFO = '''
    query ShopInfo {
      shop {
        id
        name
        email
        myshopifyDomain
        primaryDomain {
          url
          host
        }
        plan {
          displayName
          partnerDevelopment
          shopifyPlus
        }
        currencyCode
        timezoneAbbreviation
        ianaTimezone
        weightUnit
        billingAddress {
          address1
          city
          country
          zip
        }
      }
    }
    '''

    # ===== PRODUCT QUERIES =====

    PRODUCTS_LIST = '''
    query ProductsList($first: Int!, $after: String, $query: String) {
      products(first: $first, after: $after, query: $query) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            status
            vendor
            productType
            totalInventory
            tracksInventory
            createdAt
            updatedAt
            featuredImage {
              url
              altText
            }
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }
    '''

    PRODUCT_BY_ID = '''
    query ProductById($id: ID!) {
      product(id: $id) {
        id
        title
        handle
        descriptionHtml
        status
        vendor
        productType
        tags
        options {
          id
          name
          values
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              sku
              price
              compareAtPrice
              inventoryQuantity
              selectedOptions {
                name
                value
              }
              image {
                url
                altText
              }
            }
          }
        }
        images(first: 20) {
          edges {
            node {
              id
              url
              altText
            }
          }
        }
        metafields(first: 20) {
          edges {
            node {
              id
              namespace
              key
              value
              type
            }
          }
        }
      }
    }
    '''

    # ===== PRODUCT MUTATIONS =====

    PRODUCT_CREATE = '''
    mutation ProductCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
    '''

    PRODUCT_UPDATE = '''
    mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
    '''

    PRODUCT_DELETE = '''
    mutation ProductDelete($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors {
          field
          message
        }
      }
    }
    '''

    # ===== ORDER QUERIES =====

    ORDERS_LIST = '''
    query OrdersList($first: Int!, $after: String, $query: String) {
      orders(first: $first, after: $after, query: $query) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              id
              firstName
              lastName
              email
            }
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    '''

    ORDER_BY_ID = '''
    query OrderById($id: ID!) {
      order(id: $id) {
        id
        name
        createdAt
        processedAt
        displayFinancialStatus
        displayFulfillmentStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        subtotalPriceSet {
          shopMoney {
            amount
          }
        }
        totalShippingPriceSet {
          shopMoney {
            amount
          }
        }
        totalTaxSet {
          shopMoney {
            amount
          }
        }
        customer {
          id
          firstName
          lastName
          email
          phone
        }
        shippingAddress {
          address1
          address2
          city
          province
          country
          zip
        }
        billingAddress {
          address1
          address2
          city
          province
          country
          zip
        }
        lineItems(first: 50) {
          edges {
            node {
              id
              title
              quantity
              sku
              originalUnitPriceSet {
                shopMoney {
                  amount
                }
              }
              variant {
                id
                title
              }
              product {
                id
                title
              }
            }
          }
        }
        fulfillments {
          id
          status
          trackingInfo {
            company
            number
            url
          }
        }
      }
    }
    '''

    # ===== CUSTOMER QUERIES =====

    CUSTOMERS_LIST = '''
    query CustomersList($first: Int!, $after: String, $query: String) {
      customers(first: $first, after: $after, query: $query) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            firstName
            lastName
            email
            phone
            ordersCount
            totalSpentV2 {
              amount
              currencyCode
            }
            createdAt
            tags
          }
        }
      }
    }
    '''

    # ===== INVENTORY QUERIES =====

    INVENTORY_LEVELS = '''
    query InventoryLevels($first: Int!, $after: String) {
      inventoryItems(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            sku
            tracked
            inventoryLevels(first: 10) {
              edges {
                node {
                  id
                  available
                  location {
                    id
                    name
                  }
                }
              }
            }
            variant {
              id
              title
              product {
                id
                title
              }
            }
          }
        }
      }
    }
    '''

    INVENTORY_ADJUST = '''
    mutation InventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        inventoryAdjustmentGroup {
          createdAt
          reason
          changes {
            name
            delta
          }
        }
        userErrors {
          field
          message
        }
      }
    }
    '''

    # ===== METAFIELD OPERATIONS =====

    METAFIELDS_SET = '''
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
    '''

    # ===== BULK OPERATIONS =====

    BULK_OPERATION_RUN = '''
    mutation BulkOperationRun($query: String!) {
      bulkOperationRunQuery(query: $query) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
    '''

    BULK_OPERATION_STATUS = '''
    query BulkOperationStatus {
      currentBulkOperation {
        id
        status
        errorCode
        objectCount
        fileSize
        url
        partialDataUrl
      }
    }
    '''


# Utility functions
def paginate_query(admin, query: str, variables: dict, extract_path: str):
    """
    Helper to paginate through GraphQL results

    Usage:
        async for items in paginate_query(admin, PRODUCTS_LIST, {"first": 50}, "products"):
            process_items(items)
    """
    has_next = True
    cursor = None

    while has_next:
        vars_with_cursor = {**variables}
        if cursor:
            vars_with_cursor["after"] = cursor

        response = admin.graphql(query, variables=vars_with_cursor)
        data = response.json()["data"]

        # Navigate to the data using the extract path
        result = data
        for key in extract_path.split("."):
            result = result[key]

        yield [edge["node"] for edge in result["edges"]]

        has_next = result["pageInfo"]["hasNextPage"]
        cursor = result["pageInfo"]["endCursor"]
```

---

## CLI INTERFACE

```bash
#!/bin/bash
# shopify-app-builder CLI

# Usage: ./shopify-app-builder.sh <command> [options]

case "$1" in
  create)
    # Create new Shopify app
    echo "Creating new Shopify app..."
    shopify app init
    ;;

  dev)
    # Start development server
    shopify app dev
    ;;

  deploy)
    # Deploy to Shopify
    shopify app deploy
    ;;

  extension)
    # Generate extension
    shopify app generate extension
    ;;

  function)
    # Generate Shopify Function
    shopify app generate extension --type=function
    ;;

  *)
    echo "Shopify App Builder"
    echo ""
    echo "Commands:"
    echo "  create     Create a new Shopify app"
    echo "  dev        Start development server"
    echo "  deploy     Deploy to Shopify"
    echo "  extension  Generate an extension"
    echo "  function   Generate a Shopify Function"
    ;;
esac
```

---

## APP STORE SUBMISSION CHECKLIST

```markdown
## Pre-Submission Checklist

### Technical Requirements
- [ ] App works on all supported browsers
- [ ] App is mobile responsive
- [ ] No console errors in production
- [ ] All API calls use latest stable version
- [ ] Proper error handling throughout
- [ ] Loading states for async operations
- [ ] GDPR webhooks implemented (customers/data_request, customers/redact, shop/redact)

### Security
- [ ] OAuth flow properly implemented
- [ ] Session tokens used (not cookies)
- [ ] HMAC verification for webhooks
- [ ] No sensitive data in client-side code
- [ ] Environment variables for secrets
- [ ] HTTPS enforced

### Performance
- [ ] Page load under 3 seconds
- [ ] No memory leaks
- [ ] Efficient GraphQL queries (no over-fetching)
- [ ] Pagination for lists
- [ ] Caching where appropriate

### UI/UX
- [ ] Uses Polaris components
- [ ] Follows Shopify design guidelines
- [ ] Clear navigation structure
- [ ] Helpful empty states
- [ ] Error messages are user-friendly
- [ ] Confirmation for destructive actions

### Billing (if applicable)
- [ ] Pricing clearly displayed
- [ ] Trial period configured
- [ ] Upgrade/downgrade flows work
- [ ] Billing API properly integrated

### App Listing
- [ ] App name (max 30 characters)
- [ ] Tagline (max 70 characters)
- [ ] Detailed description
- [ ] Key benefits (3-5 bullet points)
- [ ] App icon (1200x1200 PNG)
- [ ] Screenshots (1600x900 minimum)
- [ ] Demo video (optional but recommended)
- [ ] Support email configured
- [ ] Privacy policy URL
- [ ] FAQ section

### Testing
- [ ] Tested on development store
- [ ] Tested installation flow
- [ ] Tested uninstallation flow
- [ ] Tested with different Shopify plans
- [ ] Edge cases handled
```

---

## INVOCATION

**Direct Commands:**
```
/shopify-app-builder
/shopify-app
/create-shopify-app
```

**Natural Language:**
- "Build me a Shopify app"
- "Create an embedded Shopify app"
- "I need a Shopify app that..."
- "Set up a new Shopify app project"
- "Generate Shopify app boilerplate"

---

## EXECUTION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOPIFY APP BUILDER FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REQUIREMENTS GATHERING                                      │
│     • App type (embedded/public/custom)                         │
│     • Core features needed                                      │
│     • OAuth scopes required                                     │
│     • Extensions needed                                         │
│                                                                 │
│  2. CONFIGURATION                                               │
│     • Generate AppConfig                                        │
│     • Set up billing plans                                      │
│     • Configure webhooks                                        │
│     • Define extensions                                         │
│                                                                 │
│  3. SCAFFOLDING                                                 │
│     • Generate project structure                                │
│     • Create all source files                                   │
│     • Set up Prisma schema                                      │
│     • Configure environment                                     │
│                                                                 │
│  4. EXTENSIONS                                                  │
│     • Theme app extensions                                      │
│     • Checkout UI extensions                                    │
│     • Shopify Functions                                         │
│     • Admin extensions                                          │
│                                                                 │
│  5. TESTING & DEPLOYMENT                                        │
│     • Development server                                        │
│     • Store testing                                             │
│     • App Store submission                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*SHOPIFY.APP.BUILDER.EXE - From Concept to App Store*
