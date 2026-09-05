import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Disable cache dengan timestamp
    const templates = await prisma.themeTemplate.findMany({
      orderBy: { created_at: "desc" },
    });
    
    return NextResponse.json(templates, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Last-Modified": new Date().toUTCString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const template = await prisma.themeTemplate.create({
      data: {
        name: data.templateName || data.name,
        description: data.description || null,
        category: data.category || null,
        thumbnail_url: data.thumbnail_url || "/placeholder-thumbnail.jpg",
        ejs_file_path: data.ejs_file_path || "",
        style_config_json: data.style_config_json || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        price: data.price ? parseFloat(data.price) : null,
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}

