import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    let htmlContent = "";

    // Cek di style_config_json dulu
    if (template.style_config_json && typeof template.style_config_json === "object") {
      const config = template.style_config_json as any;
      if (config.htmlContent) {
        htmlContent = config.htmlContent;
      }
    }

    // Jika tidak ada, coba load dari file
    if (!htmlContent && template.ejs_file_path) {
      let filePath = template.ejs_file_path;
      
      // Jika path relatif, buat absolute
      if (filePath.startsWith("/")) {
        filePath = path.join(process.cwd(), "public", filePath);
      } else {
        filePath = path.join(
          process.cwd(),
          "public",
          "templates",
          template.name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          "index.html"
        );
      }

      if (fs.existsSync(filePath)) {
        htmlContent = fs.readFileSync(filePath, "utf-8");
      }
    }

    return NextResponse.json(
      { htmlContent: htmlContent || "" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching template HTML:", error);
    return NextResponse.json(
      { error: "Failed to fetch template HTML" },
      { status: 500 }
    );
  }
}

