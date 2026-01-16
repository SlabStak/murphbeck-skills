import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  Banner,
  Badge,
  InlineStack,
  ProgressBar,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getShop } from "../db.server";
import { syncProducts, syncOrders, getSyncStatus } from "../services/sync.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getShop(session.shop);

  if (!shop) {
    throw new Error("Shop not found");
  }

  const syncStatus = await getSyncStatus(shop.id);

  return json({
    shopId: shop.id,
    ...syncStatus,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getShop(session.shop);

  if (!shop) {
    throw new Error("Shop not found");
  }

  const formData = await request.formData();
  const syncType = formData.get("type") as string;

  let result;

  switch (syncType) {
    case "products":
      result = await syncProducts(admin, shop.id);
      break;
    case "orders":
      result = await syncOrders(admin, shop.id);
      break;
    default:
      return json({ error: "Invalid sync type" }, { status: 400 });
  }

  return json({ result });
};

export default function Sync() {
  const { isRunning, currentSync, recentSyncs } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const handleSync = (type: string) => {
    const formData = new FormData();
    formData.append("type", type);
    submit(formData, { method: "post" });
  };

  return (
    <Page title="Data Sync" backAction={{ content: "Dashboard", url: "/app" }}>
      <BlockStack gap="500">
        {isRunning && currentSync && (
          <Banner tone="info">
            <BlockStack gap="200">
              <Text as="p">
                Syncing {currentSync.type}... ({currentSync.itemsSynced} items)
              </Text>
              {currentSync.itemsTotal > 0 && (
                <ProgressBar
                  progress={
                    (currentSync.itemsSynced / currentSync.itemsTotal) * 100
                  }
                />
              )}
            </BlockStack>
          </Banner>
        )}

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Products
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Sync your product catalog from Shopify
                  </Text>
                </BlockStack>
                <Button
                  onClick={() => handleSync("products")}
                  loading={isSubmitting}
                  disabled={isRunning}
                >
                  Sync Products
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Orders
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Sync your order history from Shopify
                  </Text>
                </BlockStack>
                <Button
                  onClick={() => handleSync("orders")}
                  loading={isSubmitting}
                  disabled={isRunning}
                >
                  Sync Orders
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Sync History */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Recent Syncs
            </Text>
            <Divider />

            {recentSyncs.length === 0 ? (
              <Text as="p" variant="bodyMd" tone="subdued">
                No syncs yet. Start by syncing your products or orders.
              </Text>
            ) : (
              <BlockStack gap="300">
                {recentSyncs.map((sync: any) => (
                  <InlineStack
                    key={sync.id}
                    align="space-between"
                    blockAlign="center"
                  >
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {sync.type.charAt(0).toUpperCase() + sync.type.slice(1)}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {new Date(sync.startedAt).toLocaleString()}
                      </Text>
                    </BlockStack>
                    <InlineStack gap="200">
                      <Text as="span" variant="bodySm">
                        {sync.itemsSynced} items
                      </Text>
                      <Badge
                        tone={
                          sync.status === "completed"
                            ? "success"
                            : sync.status === "failed"
                              ? "critical"
                              : "info"
                        }
                      >
                        {sync.status}
                      </Badge>
                    </InlineStack>
                  </InlineStack>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
