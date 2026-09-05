import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const themes = await prisma.themeTemplate.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(themes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 }
    );
  }
}

