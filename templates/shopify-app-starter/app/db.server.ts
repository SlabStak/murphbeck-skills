import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
}

export { prisma };

// Helper functions

export async function getShop(shopDomain: string) {
  return prisma.shop.findUnique({
    where: { shopDomain },
  });
}

export async function updateShopSettings(
  shopDomain: string,
  settings: Record<string, unknown>
) {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  const currentSettings =
    typeof shop?.settings === "object" ? shop.settings : {};

  return prisma.shop.update({
    where: { shopDomain },
    data: {
      settings: {
        ...currentSettings,
        ...settings,
      },
    },
  });
}

export async function markShopUninstalled(shopDomain: string) {
  return prisma.shop.update({
    where: { shopDomain },
    data: {
      uninstalledAt: new Date(),
      accessToken: null,
    },
  });
}

export async function logWebhook(
  shopDomain: string,
  topic: string,
  payload: unknown,
  error?: string
) {
  return prisma.webhookLog.create({
    data: {
      shopDomain,
      topic,
      payload: payload as object,
      processedAt: error ? null : new Date(),
      error,
    },
  });
}

export async function createSyncLog(
  shopId: string,
  type: string,
  itemsTotal: number
) {
  return prisma.syncLog.create({
    data: {
      shopId,
      type,
      status: "running",
      itemsTotal,
    },
  });
}

export async function updateSyncLog(
  id: string,
  data: {
    status?: string;
    itemsSynced?: number;
    error?: string;
    completedAt?: Date;
  }
) {
  return prisma.syncLog.update({
    where: { id },
    data,
  });
}
