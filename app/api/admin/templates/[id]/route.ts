import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// GET single template
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

    return NextResponse.json(template, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// UPDATE template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const template = await prisma.themeTemplate.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        thumbnail_url: data.thumbnail_url || "/placeholder-thumbnail.jpg",
        ejs_file_path: data.ejs_file_path || "",
        style_config_json: data.style_config_json || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        price: data.price ? parseFloat(data.price) : null,
      },
    });

    return NextResponse.json(template, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Error updating template:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get template info sebelum dihapus untuk mendapatkan nama folder
    const template = await prisma.themeTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Hapus template dari database
    await prisma.themeTemplate.delete({
      where: { id: params.id },
    });

    // Hapus folder template beserta semua isinya
    // Normalize template name untuk path
    const normalizedTemplateName = template.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const templateDir = path.join(process.cwd(), "public", "templates", normalizedTemplateName);

    // Hapus folder template jika ada
    if (fs.existsSync(templateDir)) {
      try {
        fs.rmSync(templateDir, { recursive: true, force: true });
        console.log(`Deleted template folder: ${templateDir}`);
      } catch (deleteError: any) {
        console.error(`Error deleting template folder: ${deleteError.message}`);
        // Tetap lanjutkan meskipun ada error saat hapus folder
      }
    }

    return NextResponse.json(
      { success: true, message: "Template and all files deleted successfully" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Error deleting template:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}

