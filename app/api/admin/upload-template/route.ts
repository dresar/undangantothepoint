import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const templateName = (formData.get("templateName") as string) || "template";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "File harus berupa .zip" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);

    const timestamp = Date.now();
    const tempDir = path.join(process.cwd(), "public", "uploads", "temp", timestamp.toString());
    const tempBaseDir = path.join(process.cwd(), "public", "uploads", "temp");
    if (!fs.existsSync(tempBaseDir)) {
      fs.mkdirSync(tempBaseDir, { recursive: true });
    }

    zip.extractAllTo(tempDir, true);

    const normalizedTemplateName = templateName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const templateDir = path.join(process.cwd(), "public", "templates", normalizedTemplateName);
    
    if (fs.existsSync(templateDir)) {
      fs.rmSync(templateDir, { recursive: true, force: true });
    }
    fs.mkdirSync(templateDir, { recursive: true });

    function copyRecursive(src: string, dest: string) {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats?.isDirectory();

      if (isDirectory) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
          copyRecursive(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          );
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    copyRecursive(tempDir, templateDir);

    let htmlContent = "";
    const htmlFilePath = path.join(templateDir, "index.html");
    if (fs.existsSync(htmlFilePath)) {
      htmlContent = fs.readFileSync(htmlFilePath, "utf-8");
    } else {
      function findHtmlFile(dir: string): string | null {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            const found = findHtmlFile(filePath);
            if (found) return found;
          } else if (file.toLowerCase() === "index.html" || file.endsWith(".html")) {
            return filePath;
          }
        }
        return null;
      }
      const foundHtml = findHtmlFile(templateDir);
      if (foundHtml) {
        htmlContent = fs.readFileSync(foundHtml, "utf-8");
      }
    }

    const ejsFilePath = `/templates/${normalizedTemplateName}/index.html`;
    const thumbnailUrl = "/placeholder-thumbnail.jpg";

    const styleConfig = {
      htmlContent: htmlContent,
    };

    let savedTemplate;
    try {
      const existingTemplate = await prisma.themeTemplate.findUnique({
        where: { name: templateName },
      });

      if (existingTemplate) {
        savedTemplate = await prisma.themeTemplate.update({
          where: { id: existingTemplate.id },
          data: {
            description: `Template ${templateName}`,
            thumbnail_url: thumbnailUrl,
            ejs_file_path: ejsFilePath,
            style_config_json: styleConfig as any,
            is_active: true,
          },
        });
      } else {
        savedTemplate = await prisma.themeTemplate.create({
          data: {
            name: templateName,
            description: `Template ${templateName}`,
            thumbnail_url: thumbnailUrl,
            ejs_file_path: ejsFilePath,
            style_config_json: styleConfig as any,
            is_active: true,
          },
        });
      }
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      if (dbError.code === "P2002") {
        const uniqueName = `${templateName}-${Date.now()}`;
        savedTemplate = await prisma.themeTemplate.create({
          data: {
            name: uniqueName,
            description: `Template ${templateName}`,
            thumbnail_url: thumbnailUrl,
            ejs_file_path: ejsFilePath,
            style_config_json: styleConfig as any,
            is_active: true,
          },
        });
      }
    }

    fs.rmSync(tempDir, { recursive: true, force: true });

    if (!htmlContent) {
      return NextResponse.json({ error: "File index.html tidak ditemukan dalam ZIP" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      htmlContent,
      templateName: normalizedTemplateName,
      originalTemplateName: templateName,
      templateId: savedTemplate?.id || null,
      template: savedTemplate || null,
      message: savedTemplate ? `Template "${templateName}" berhasil disimpan` : `Template "${templateName}" berhasil diupload`,
    });
  } catch (error: any) {
    console.error("Error processing template:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses template" }, { status: 500 });
  }
}
