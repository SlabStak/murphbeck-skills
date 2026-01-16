import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";

function generateApiKey(): string {
  const prefix = "sk_live_";
  const randomPart = randomBytes(24).toString("base64url");
  return `${prefix}${randomPart}`;
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Generate the API key
    const apiKey = generateApiKey();
    const hashedKey = hashApiKey(apiKey);

    // Store the hashed key in database
    await db.apiKey.create({
      data: {
        name,
        key: hashedKey,
        userId: user.id,
      },
    });

    // Return the unhashed key only once
    return NextResponse.json({
      key: apiKey,
      message: "Store this key securely - you won't be able to see it again",
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            lastUsedAt: true,
            expiresAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user.apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
