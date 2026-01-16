import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { pricingPlans } from "@/config/pricing";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/stripe";

export default async function BillingPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const currentPlan = pricingPlans.find(
    (plan) => plan.name.toLowerCase() === user.plan
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{" "}
            <span className="font-semibold">{currentPlan?.name}</span> plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${currentPlan?.price || 0}</span>
            {(currentPlan?.price || 0) > 0 && (
              <span className="text-muted-foreground">/month</span>
            )}
          </div>

          {user.subscription && (
            <div className="text-sm text-muted-foreground">
              {user.subscription.status === "active" ? (
                <span>
                  Your subscription renews on{" "}
                  {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-yellow-600">
                  Subscription status: {user.subscription.status}
                </span>
              )}
            </div>
          )}

          {user.stripeCustomerId && (
            <form action={createBillingPortalSession}>
              <input type="hidden" name="customerId" value={user.stripeCustomerId} />
              <Button type="submit" variant="outline">
                Manage Subscription
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => {
            const isCurrent = plan.name.toLowerCase() === user.plan;
            const isUpgrade =
              pricingPlans.indexOf(plan) >
              pricingPlans.findIndex((p) => p.name.toLowerCase() === user.plan);

            return (
              <Card
                key={plan.name}
                className={isCurrent ? "border-primary" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrent && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && plan.stripePriceId && (
                    <form action={createCheckoutSession}>
                      <input type="hidden" name="priceId" value={plan.stripePriceId} />
                      <input type="hidden" name="userId" value={user.id} />
                      <Button type="submit" className="w-full">
                        {isUpgrade ? "Upgrade" : "Downgrade"}
                      </Button>
                    </form>
                  )}

                  {isCurrent && (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  )}

                  {!isCurrent && !plan.stripePriceId && (
                    <Button disabled className="w-full" variant="outline">
                      Free Forever
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payment history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.stripeCustomerId ? (
            <form action={createBillingPortalSession}>
              <input type="hidden" name="customerId" value={user.stripeCustomerId} />
              <Button type="submit" variant="outline">
                View Invoices
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              No billing history available. Upgrade to a paid plan to see your invoices.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
