import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma, markShopUninstalled, logWebhook } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } =
    await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Log the webhook
  await logWebhook(shop, topic, payload);

  try {
    switch (topic) {
      case "APP_UNINSTALLED":
        // Clean up shop data
        await markShopUninstalled(shop);

        // Delete sessions
        if (session) {
          await prisma.session.deleteMany({
            where: { shop },
          });
        }
        break;

      case "SHOP_UPDATE":
        // Update shop metadata
        const shopData = payload as {
          name?: string;
          email?: string;
          currency?: string;
          timezone?: string;
        };

        await prisma.shop.update({
          where: { shopDomain: shop },
          data: {
            name: shopData.name,
            email: shopData.email,
            currency: shopData.currency,
            timezone: shopData.timezone,
          },
        });
        break;

      case "CUSTOMERS_DATA_REQUEST":
        // GDPR: Customer data request
        // Return customer data associated with their shop
        // In a real app, you would compile and send this data
        console.log(`Customer data request for shop: ${shop}`);
        break;

      case "CUSTOMERS_REDACT":
        // GDPR: Delete customer data
        // Remove any stored customer data for the given customer ID
        console.log(`Customer redact request for shop: ${shop}`);
        break;

      case "SHOP_REDACT":
        // GDPR: Delete shop data
        // Remove all data associated with this shop
        await prisma.shop.delete({
          where: { shopDomain: shop },
        });
        console.log(`Shop redact completed for: ${shop}`);
        break;

      case "ORDERS_CREATE":
        // Handle new order
        const order = payload as { id: number; name: string };
        console.log(`New order created: ${order.name}`);
        // Add your order processing logic here
        break;

      case "PRODUCTS_UPDATE":
        // Handle product update
        const product = payload as { id: number; title: string };
        console.log(`Product updated: ${product.title}`);
        // Add your product sync logic here
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    // Mark webhook as processed
    await prisma.webhookLog.updateMany({
      where: {
        shopDomain: shop,
        topic,
        processedAt: null,
      },
      data: {
        processedAt: new Date(),
      },
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`Error processing ${topic} webhook:`, error);

    // Log the error
    await logWebhook(
      shop,
      topic,
      payload,
      error instanceof Error ? error.message : "Unknown error"
    );

    return new Response("Error processing webhook", { status: 500 });
  }
};
