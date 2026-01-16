import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { prisma } from "../db.server";

export interface BillingPlan {
  name: string;
  price: number;
  interval: "EVERY_30_DAYS" | "ANNUAL";
  trialDays?: number;
}

export const BILLING_PLANS: Record<string, BillingPlan> = {
  pro: {
    name: "Pro",
    price: 29,
    interval: "EVERY_30_DAYS",
    trialDays: 7,
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    interval: "EVERY_30_DAYS",
    trialDays: 14,
  },
};

export async function createSubscription(
  admin: AdminApiContext["admin"],
  shop: string,
  planKey: string,
  returnUrl: string
): Promise<string> {
  const plan = BILLING_PLANS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan: ${planKey}`);
  }

  const response = await admin.graphql(`
    mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean, $trialDays: Int) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        test: $test
        trialDays: $trialDays
        lineItems: $lineItems
      ) {
        appSubscription {
          id
          status
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      name: plan.name,
      returnUrl,
      test: process.env.NODE_ENV !== "production",
      trialDays: plan.trialDays || 0,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: plan.price,
                currencyCode: "USD",
              },
              interval: plan.interval,
            },
          },
        },
      ],
    },
  });

  const { data } = await response.json();

  if (data.appSubscriptionCreate.userErrors.length > 0) {
    throw new Error(data.appSubscriptionCreate.userErrors[0].message);
  }

  // Update shop billing status
  await prisma.shop.update({
    where: { shopDomain: shop },
    data: {
      plan: planKey,
      billingStatus: "pending",
      chargeId: data.appSubscriptionCreate.appSubscription.id,
    },
  });

  return data.appSubscriptionCreate.confirmationUrl;
}

export async function createUsageCharge(
  admin: AdminApiContext["admin"],
  shop: string,
  description: string,
  amount: number
): Promise<void> {
  const shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!shopData?.chargeId) {
    throw new Error("No active subscription found");
  }

  const response = await admin.graphql(`
    mutation appUsageRecordCreate($subscriptionLineItemId: ID!, $price: MoneyInput!, $description: String!) {
      appUsageRecordCreate(
        subscriptionLineItemId: $subscriptionLineItemId
        price: $price
        description: $description
      ) {
        appUsageRecord {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      subscriptionLineItemId: shopData.chargeId,
      price: {
        amount,
        currencyCode: "USD",
      },
      description,
    },
  });

  const { data } = await response.json();

  if (data.appUsageRecordCreate.userErrors.length > 0) {
    throw new Error(data.appUsageRecordCreate.userErrors[0].message);
  }
}

export async function cancelSubscription(
  admin: AdminApiContext["admin"],
  shop: string
): Promise<void> {
  const shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!shopData?.chargeId) {
    throw new Error("No active subscription found");
  }

  const response = await admin.graphql(`
    mutation appSubscriptionCancel($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      id: shopData.chargeId,
    },
  });

  const { data } = await response.json();

  if (data.appSubscriptionCancel.userErrors.length > 0) {
    throw new Error(data.appSubscriptionCancel.userErrors[0].message);
  }

  // Update shop billing status
  await prisma.shop.update({
    where: { shopDomain: shop },
    data: {
      plan: "free",
      billingStatus: "cancelled",
      chargeId: null,
    },
  });
}

export async function getActiveSubscription(
  admin: AdminApiContext["admin"]
): Promise<{
  id: string;
  name: string;
  status: string;
  currentPeriodEnd: string | null;
} | null> {
  const response = await admin.graphql(`
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          currentPeriodEnd
        }
      }
    }
  `);

  const { data } = await response.json();
  const subscriptions = data.currentAppInstallation.activeSubscriptions;

  return subscriptions.length > 0 ? subscriptions[0] : null;
}
