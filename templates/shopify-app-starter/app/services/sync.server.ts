import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { prisma, createSyncLog, updateSyncLog } from "../db.server";

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  errors: string[];
}

export async function syncProducts(
  admin: AdminApiContext["admin"],
  shopId: string
): Promise<SyncResult> {
  const errors: string[] = [];
  let itemsSynced = 0;

  // Create sync log
  const syncLog = await createSyncLog(shopId, "products", 0);

  try {
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const response = await admin.graphql(`
        query getProducts($cursor: String) {
          products(first: 50, after: $cursor) {
            edges {
              cursor
              node {
                id
                title
                handle
                status
                totalInventory
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `, {
        variables: { cursor },
      });

      const { data } = await response.json();

      for (const edge of data.products.edges) {
        try {
          // Process each product
          // In a real app, you'd store this in your database
          console.log(`Synced product: ${edge.node.title}`);
          itemsSynced++;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to sync product ${edge.node.id}: ${message}`);
        }
      }

      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;

      // Update progress
      await updateSyncLog(syncLog.id, { itemsSynced });
    }

    // Mark sync as complete
    await updateSyncLog(syncLog.id, {
      status: "completed",
      itemsSynced,
      completedAt: new Date(),
    });

    return { success: true, itemsSynced, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await updateSyncLog(syncLog.id, {
      status: "failed",
      error: message,
      completedAt: new Date(),
    });

    return { success: false, itemsSynced, errors: [message, ...errors] };
  }
}

export async function syncOrders(
  admin: AdminApiContext["admin"],
  shopId: string,
  since?: Date
): Promise<SyncResult> {
  const errors: string[] = [];
  let itemsSynced = 0;

  const syncLog = await createSyncLog(shopId, "orders", 0);

  try {
    const query = since
      ? `created_at:>='${since.toISOString()}'`
      : "";

    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const response = await admin.graphql(`
        query getOrders($cursor: String, $query: String) {
          orders(first: 50, after: $cursor, query: $query) {
            edges {
              cursor
              node {
                id
                name
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                displayFinancialStatus
                displayFulfillmentStatus
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `, {
        variables: { cursor, query },
      });

      const { data } = await response.json();

      for (const edge of data.orders.edges) {
        try {
          console.log(`Synced order: ${edge.node.name}`);
          itemsSynced++;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to sync order ${edge.node.id}: ${message}`);
        }
      }

      hasNextPage = data.orders.pageInfo.hasNextPage;
      cursor = data.orders.pageInfo.endCursor;

      await updateSyncLog(syncLog.id, { itemsSynced });
    }

    await updateSyncLog(syncLog.id, {
      status: "completed",
      itemsSynced,
      completedAt: new Date(),
    });

    return { success: true, itemsSynced, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await updateSyncLog(syncLog.id, {
      status: "failed",
      error: message,
      completedAt: new Date(),
    });

    return { success: false, itemsSynced, errors: [message, ...errors] };
  }
}

export async function getSyncStatus(shopId: string) {
  const recentSyncs = await prisma.syncLog.findMany({
    where: { shopId },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  const runningSync = recentSyncs.find((s) => s.status === "running");

  return {
    isRunning: !!runningSync,
    currentSync: runningSync,
    recentSyncs,
  };
}
