import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineStack,
  Badge,
  Button,
  Box,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getShop } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Fetch shop data from database
  const shop = await getShop(session.shop);

  // Fetch some stats from Shopify
  const response = await admin.graphql(`
    query {
      shop {
        name
        plan {
          displayName
        }
      }
      productsCount {
        count
      }
      ordersCount: orders(first: 1) {
        totalCount
      }
    }
  `);

  const { data } = await response.json();

  return json({
    shopName: data.shop.name,
    shopPlan: data.shop.plan.displayName,
    productCount: data.productsCount.count,
    orderCount: data.ordersCount.totalCount,
    appPlan: shop?.plan || "free",
    billingStatus: shop?.billingStatus || "pending",
  });
};

export default function Index() {
  const {
    shopName,
    shopPlan,
    productCount,
    orderCount,
    appPlan,
    billingStatus,
  } = useLoaderData<typeof loader>();

  return (
    <Page title="Dashboard">
      <BlockStack gap="500">
        {/* Welcome Banner */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  Welcome, {shopName}!
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Your Shopify plan: {shopPlan}
                </Text>
              </BlockStack>
              <Badge tone={appPlan === "pro" ? "success" : "info"}>
                {appPlan.toUpperCase()} Plan
              </Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Stats Grid */}
        <Layout>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Products
                </Text>
                <Text as="p" variant="headingXl">
                  {productCount.toLocaleString()}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Orders
                </Text>
                <Text as="p" variant="headingXl">
                  {orderCount.toLocaleString()}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Status
                </Text>
                <Badge
                  tone={billingStatus === "active" ? "success" : "warning"}
                >
                  {billingStatus}
                </Badge>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Quick Actions */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Quick Actions
            </Text>
            <Divider />
            <InlineStack gap="300">
              <Button url="/app/settings">Settings</Button>
              <Button url="/app/products">View Products</Button>
              <Button variant="primary" url="/app/sync">
                Sync Data
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Getting Started */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Getting Started
            </Text>
            <Divider />
            <BlockStack gap="300">
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">
                      1. Configure your settings
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Set up your app preferences and integrations
                    </Text>
                  </BlockStack>
                  <Button url="/app/settings" size="slim">
                    Configure
                  </Button>
                </InlineStack>
              </Box>

              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">
                      2. Sync your products
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Import your product catalog for processing
                    </Text>
                  </BlockStack>
                  <Button url="/app/sync" size="slim">
                    Start Sync
                  </Button>
                </InlineStack>
              </Box>

              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">
                      3. Upgrade your plan
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Unlock premium features with a Pro subscription
                    </Text>
                  </BlockStack>
                  <Button url="/app/billing" size="slim" variant="primary">
                    Upgrade
                  </Button>
                </InlineStack>
              </Box>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
