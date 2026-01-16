import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (!email || typeof email !== "string") {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse("Invalid email format", { status: 400 });
    }

    // Check if already on waitlist
    const existing = await db.waitlistEntry.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({
        message: "You're already on the waitlist!",
        alreadyExists: true,
      });
    }

    // Add to waitlist
    await db.waitlistEntry.create({
      data: {
        email,
        source: source || "website",
      },
    });

    return NextResponse.json({
      message: "Successfully joined the waitlist!",
      alreadyExists: false,
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminKey = searchParams.get("adminKey");

    // Simple admin key check - in production use proper auth
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const entries = await db.waitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
