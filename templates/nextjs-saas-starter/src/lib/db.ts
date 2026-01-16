import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// Helper functions for common operations

export async function getUserByClerkId(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
    include: {
      subscription: true,
      projects: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string;
}) {
  return db.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
      plan: "free",
    },
  });
}

export async function updateUserPlan(userId: string, plan: string) {
  return db.user.update({
    where: { id: userId },
    data: { plan },
  });
}

export async function getProjectsByUserId(userId: string) {
  return db.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(data: {
  name: string;
  description?: string;
  userId: string;
}) {
  return db.project.create({
    data,
  });
}

export async function deleteProject(projectId: string) {
  return db.project.delete({
    where: { id: projectId },
  });
}
