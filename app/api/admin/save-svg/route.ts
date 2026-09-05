import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { templateId, svgContent, filename } = await request.json();

    if (!templateId || !svgContent) {
      return NextResponse.json(
        { error: "Template ID dan SVG content diperlukan" },
        { status: 400 }
      );
    }

    // Get template from database
    const template = await prisma.themeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template tidak ditemukan" },
        { status: 404 }
      );
    }

    // Normalize template name
    const normalizedName = template.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Determine media directory
    const mediaDir = path.join(process.cwd(), "public", "templates", normalizedName, "media");

    // Ensure media directory exists
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Generate filename
    let finalFilename = filename || `icon-${Date.now()}.svg`;
    if (!finalFilename.endsWith(".svg")) {
      finalFilename += ".svg";
    }

    // Sanitize filename
    finalFilename = finalFilename
      .replace(/[^a-z0-9.-]/gi, "-")
      .toLowerCase();

    // Check if file exists, add counter if needed
    let filePath = path.join(mediaDir, finalFilename);
    let counter = 1;
    while (fs.existsSync(filePath)) {
      const ext = path.extname(finalFilename);
      const base = path.basename(finalFilename, ext);
      finalFilename = `${base}-${counter}${ext}`;
      filePath = path.join(mediaDir, finalFilename);
      counter++;
    }

    // Save SVG file
    fs.writeFileSync(filePath, svgContent, "utf-8");

    // Generate URL path
    const urlPath = `/templates/${normalizedName}/media/${finalFilename}`;
    const shortUrl = `media/${finalFilename}`;

    return NextResponse.json({
      success: true,
      message: "SVG berhasil disimpan",
      filename: finalFilename,
      url: urlPath,
      shortUrl: shortUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("Error saving SVG:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan SVG" },
      { status: 500 }
    );
  }
}

