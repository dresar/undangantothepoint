import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { removeMetaTagsFromHtml } from "@/lib/editor/htmlMetaRemover";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { templateId, htmlContent, ejsFilePath } = await request.json();

    if (!templateId || !htmlContent) {
      return NextResponse.json(
        { error: "Template ID and HTML content are required" },
        { status: 400 }
      );
    }

    // Get template from database
    const template = await prisma.themeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Determine file path
    let filePath = ejsFilePath || template.ejs_file_path;
    
    // If path is relative, make it absolute
    if (filePath.startsWith("/")) {
      filePath = path.join(process.cwd(), "public", filePath);
    } else {
      filePath = path.join(process.cwd(), "public", "templates", template.name.toLowerCase().replace(/[^a-z0-9-]/g, "-"), "index.html");
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Remove meta tags from HTML before saving (meta tags stored in database)
    const cleanedHtml = removeMetaTagsFromHtml(htmlContent);

    // Save HTML content (without meta tags)
    fs.writeFileSync(filePath, cleanedHtml, "utf-8");

    // Update database with new HTML content in style_config_json (without meta tags)
    // IMPORTANT: Save to database FIRST before returning, so preview can read it immediately
    const styleConfig = template.style_config_json || {};
    const updatedStyleConfig = {
      ...styleConfig,
      htmlContent: cleanedHtml, // Save cleaned HTML without meta tags
    };

    await prisma.themeTemplate.update({
      where: { id: templateId },
      data: {
        style_config_json: updatedStyleConfig as any,
      },
    });

    console.log(`[Save HTML] Saved HTML to database (length: ${cleanedHtml.length})`);

    return NextResponse.json({
      success: true,
      message: "Template HTML saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving template HTML:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save template HTML" },
      { status: 500 }
    );
  }
}

