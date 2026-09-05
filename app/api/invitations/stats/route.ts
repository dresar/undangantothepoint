import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const demoUser = await prisma.user.findFirst({
      where: { email: "demo@example.com" },
    });

    if (!demoUser) {
      return NextResponse.json({ total: 0, active: 0, draft: 0 });
    }

    const total = await prisma.invitation.count({
      where: { user_id: demoUser.id },
    });

    const active = await prisma.invitation.count({
      where: { user_id: demoUser.id, is_active: true },
    });

    const draft = total - active;

    return NextResponse.json({ total, active, draft });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

