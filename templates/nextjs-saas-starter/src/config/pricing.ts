export interface PricingPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  stripePriceId: string | null;
  popular?: boolean;
  limits: {
    projects: number;
    teamMembers: number;
    storage: string;
    apiCalls: number;
  };
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1GB storage",
      "1,000 API calls/month",
    ],
    stripePriceId: null,
    limits: {
      projects: 3,
      teamMembers: 1,
      storage: "1GB",
      apiCalls: 1000,
    },
  },
  {
    name: "Pro",
    price: 29,
    description: "For professionals and growing teams",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "10GB storage",
      "50,000 API calls/month",
      "Team collaboration (5 members)",
      "Custom integrations",
      "Export data",
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro",
    popular: true,
    limits: {
      projects: -1, // unlimited
      teamMembers: 5,
      storage: "10GB",
      apiCalls: 50000,
    },
  },
  {
    name: "Enterprise",
    price: 99,
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "100GB storage",
      "Unlimited API calls",
      "SSO/SAML",
      "Dedicated support",
      "Custom contracts",
      "SLA guarantee",
      "On-premise option",
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    limits: {
      projects: -1,
      teamMembers: -1,
      storage: "100GB",
      apiCalls: -1,
    },
  },
];

export function getPlanByName(name: string): PricingPlan | undefined {
  return pricingPlans.find(
    (plan) => plan.name.toLowerCase() === name.toLowerCase()
  );
}

export function getPlanByPriceId(priceId: string): PricingPlan | undefined {
  return pricingPlans.find((plan) => plan.stripePriceId === priceId);
}

export function canAccessFeature(
  userPlan: string,
  requiredPlan: string
): boolean {
  const planOrder = ["free", "pro", "enterprise"];
  const userPlanIndex = planOrder.indexOf(userPlan.toLowerCase());
  const requiredPlanIndex = planOrder.indexOf(requiredPlan.toLowerCase());
  return userPlanIndex >= requiredPlanIndex;
}

export function isWithinPlanLimits(
  userPlan: string,
  resource: keyof PricingPlan["limits"],
  currentUsage: number
): boolean {
  const plan = getPlanByName(userPlan);
  if (!plan) return false;

  const limit = plan.limits[resource];
  if (typeof limit === "number" && limit === -1) return true; // unlimited
  if (typeof limit === "number") return currentUsage < limit;
  return true;
}
