import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const music = await prisma.musicLibrary.findMany({
      where: { is_active: true },
      orderBy: { title: "asc" },
    });
    return NextResponse.json(music);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch music" },
      { status: 500 }
    );
  }
}

