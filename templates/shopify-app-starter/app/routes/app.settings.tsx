import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  TextField,
  Checkbox,
  Button,
  Banner,
  Divider,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getShop, updateShopSettings } from "../db.server";

interface ShopSettings {
  enableNotifications: boolean;
  notificationEmail: string;
  autoSync: boolean;
  syncInterval: string;
  webhookUrl: string;
}

const defaultSettings: ShopSettings = {
  enableNotifications: true,
  notificationEmail: "",
  autoSync: false,
  syncInterval: "daily",
  webhookUrl: "",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getShop(session.shop);

  const settings = {
    ...defaultSettings,
    ...(typeof shop?.settings === "object" ? shop.settings : {}),
  } as ShopSettings;

  return json({ settings, shopDomain: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const settings: ShopSettings = {
    enableNotifications: formData.get("enableNotifications") === "true",
    notificationEmail: formData.get("notificationEmail") as string,
    autoSync: formData.get("autoSync") === "true",
    syncInterval: formData.get("syncInterval") as string,
    webhookUrl: formData.get("webhookUrl") as string,
  };

  await updateShopSettings(session.shop, settings);

  return json({ success: true });
};

export default function Settings() {
  const { settings: initialSettings, shopDomain } =
    useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [settings, setSettings] = useState<ShopSettings>(initialSettings);
  const [saved, setSaved] = useState(false);

  const isSubmitting = navigation.state === "submitting";

  const handleChange = useCallback(
    (field: keyof ShopSettings) => (value: string | boolean) => {
      setSettings((prev) => ({ ...prev, [field]: value }));
      setSaved(false);
    },
    []
  );

  const handleSave = useCallback(() => {
    const formData = new FormData();
    Object.entries(settings).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    submit(formData, { method: "post" });
    setSaved(true);
  }, [settings, submit]);

  return (
    <Page
      title="Settings"
      backAction={{ content: "Dashboard", url: "/app" }}
      primaryAction={{
        content: "Save",
        onAction: handleSave,
        loading: isSubmitting,
      }}
    >
      <BlockStack gap="500">
        {saved && !isSubmitting && (
          <Banner tone="success" onDismiss={() => setSaved(false)}>
            Settings saved successfully!
          </Banner>
        )}

        <Layout>
          <Layout.AnnotatedSection
            title="Notifications"
            description="Configure how you receive notifications from the app."
          >
            <Card>
              <BlockStack gap="400">
                <Checkbox
                  label="Enable email notifications"
                  checked={settings.enableNotifications}
                  onChange={handleChange("enableNotifications")}
                />
                <TextField
                  label="Notification email"
                  type="email"
                  value={settings.notificationEmail}
                  onChange={handleChange("notificationEmail")}
                  disabled={!settings.enableNotifications}
                  autoComplete="email"
                  helpText="We'll send important updates to this email"
                />
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title="Sync Settings"
            description="Configure automatic data synchronization."
          >
            <Card>
              <BlockStack gap="400">
                <Checkbox
                  label="Enable automatic sync"
                  checked={settings.autoSync}
                  onChange={handleChange("autoSync")}
                  helpText="Automatically sync your data at regular intervals"
                />
                <TextField
                  label="Sync interval"
                  value={settings.syncInterval}
                  onChange={handleChange("syncInterval")}
                  disabled={!settings.autoSync}
                  autoComplete="off"
                  helpText="Options: hourly, daily, weekly"
                />
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title="Integrations"
            description="Connect with external services."
          >
            <Card>
              <BlockStack gap="400">
                <TextField
                  label="Webhook URL"
                  type="url"
                  value={settings.webhookUrl}
                  onChange={handleChange("webhookUrl")}
                  autoComplete="url"
                  helpText="We'll send events to this URL"
                  placeholder="https://your-server.com/webhook"
                />
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title="Shop Information"
            description="Your connected Shopify store details."
          >
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd" tone="subdued">
                    Shop Domain
                  </Text>
                  <Text as="span" variant="bodyMd">
                    {shopDomain}
                  </Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>
        </Layout>
      </BlockStack>
    </Page>
  );
}
