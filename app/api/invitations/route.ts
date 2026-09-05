import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const demoUser = await prisma.user.findFirst({
      where: { email: "demo@example.com" },
    });

    if (!demoUser) {
      return NextResponse.json([]);
    }

    const invitations = await prisma.invitation.findMany({
      where: { user_id: demoUser.id },
      include: {
        theme_template: {
          select: { name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

