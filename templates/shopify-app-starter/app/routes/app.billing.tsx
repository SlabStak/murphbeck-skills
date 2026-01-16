import {
  json,
  redirect,
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
  Badge,
  InlineStack,
  Divider,
  Box,
  List,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getShop, prisma } from "../db.server";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "Up to 100 products",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    features: [
      "Unlimited products",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom development",
      "SLA guarantee",
      "On-premise option",
    ],
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = await getShop(session.shop);

  // Check current subscription status
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: ["Pro", "Enterprise"],
    isTest: process.env.NODE_ENV !== "production",
  });

  return json({
    currentPlan: shop?.plan || "free",
    billingStatus: shop?.billingStatus || "pending",
    hasActivePayment,
    subscriptions: appSubscriptions,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const planId = formData.get("plan") as string;

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || plan.price === 0) {
    return json({ error: "Invalid plan" }, { status: 400 });
  }

  // Create subscription charge
  const response = await billing.request({
    plan: plan.name,
    isTest: process.env.NODE_ENV !== "production",
    returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/billing`,
  });

  // Update shop plan in database
  await prisma.shop.update({
    where: { shopDomain: session.shop },
    data: {
      plan: planId,
      billingStatus: "pending",
    },
  });

  // Redirect to Shopify payment confirmation
  return redirect(response.confirmationUrl);
};

export default function Billing() {
  const { currentPlan, billingStatus, hasActivePayment } =
    useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const handleUpgrade = (planId: string) => {
    const formData = new FormData();
    formData.append("plan", planId);
    submit(formData, { method: "post" });
  };

  return (
    <Page title="Billing" backAction={{ content: "Dashboard", url: "/app" }}>
      <BlockStack gap="500">
        {/* Current Plan Status */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Current Plan
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {PLANS.find((p) => p.id === currentPlan)?.name || "Free"} Plan
                </Text>
              </BlockStack>
              <InlineStack gap="200">
                <Badge
                  tone={billingStatus === "active" ? "success" : "warning"}
                >
                  {billingStatus}
                </Badge>
                {hasActivePayment && (
                  <Badge tone="success">Payment Active</Badge>
                )}
              </InlineStack>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Plan Options */}
        <Layout>
          {PLANS.map((plan) => (
            <Layout.Section key={plan.id} variant="oneThird">
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      {plan.name}
                    </Text>
                    <InlineStack gap="100" blockAlign="baseline">
                      <Text as="span" variant="heading2xl">
                        ${plan.price}
                      </Text>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        /month
                      </Text>
                    </InlineStack>
                  </BlockStack>

                  <Divider />

                  <List>
                    {plan.features.map((feature) => (
                      <List.Item key={feature}>{feature}</List.Item>
                    ))}
                  </List>

                  <Box paddingBlockStart="200">
                    {currentPlan === plan.id ? (
                      <Button disabled fullWidth>
                        Current Plan
                      </Button>
                    ) : plan.price === 0 ? (
                      <Button disabled fullWidth>
                        Free Tier
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => handleUpgrade(plan.id)}
                        loading={isSubmitting}
                      >
                        {currentPlan === "free" ? "Upgrade" : "Switch"} to{" "}
                        {plan.name}
                      </Button>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>
          ))}
        </Layout>

        {/* FAQ */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Frequently Asked Questions
            </Text>
            <Divider />
            <BlockStack gap="300">
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  Can I cancel anytime?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Yes, you can cancel your subscription at any time. Your plan
                  will remain active until the end of your billing period.
                </Text>
              </BlockStack>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  How does billing work?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Billing is handled through Shopify. Charges appear on your
                  regular Shopify invoice.
                </Text>
              </BlockStack>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  Can I switch plans?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Yes, you can upgrade or downgrade at any time. Changes take
                  effect immediately.
                </Text>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
