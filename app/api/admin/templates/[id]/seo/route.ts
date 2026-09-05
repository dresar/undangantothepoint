import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET SEO config
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.themeTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const seoConfig = template.seo_config_json || {
      title: "",
      description: "",
      keywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogUrl: "",
      ogType: "website",
    };

    return NextResponse.json({ seoConfig });
  } catch (error: any) {
    console.error("Error fetching SEO config:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch SEO config" },
      { status: 500 }
    );
  }
}

// UPDATE SEO config
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { seoConfig } = body;

    const template = await prisma.themeTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.themeTemplate.update({
      where: { id: params.id },
      data: {
        seo_config_json: seoConfig as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: "SEO config updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating SEO config:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update SEO config" },
      { status: 500 }
    );
  }
}

