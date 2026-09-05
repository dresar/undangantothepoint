import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Support both GET (for backward compatibility) and POST (for large HTML)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const htmlContentBase64 = searchParams.get("html");
    const templateId = searchParams.get("templateId");

    // If only templateId is provided, try to get from database first, then file
    if (!htmlContentBase64 && templateId) {
      let htmlContent = "";

      // Try to get from database first (most up-to-date)
      try {
        const template = await prisma.themeTemplate.findFirst({
          where: {
            OR: [
              { id: templateId },
              { name: templateId },
            ],
          },
        });

        if (template) {
          // Prioritize htmlContent from style_config_json (most recent)
          if (template.style_config_json && typeof template.style_config_json === "object") {
            const config = template.style_config_json as any;
            if (config.htmlContent) {
              htmlContent = config.htmlContent;
              console.log(`[Preview] Using HTML from database (style_config_json)`);
            }
          }

          // Fallback to file if not in database
          if (!htmlContent) {
            const templatePath = path.join(
              process.cwd(),
              "public",
              "templates",
              templateId,
              "index.html"
            );

            if (fs.existsSync(templatePath)) {
              htmlContent = fs.readFileSync(templatePath, "utf-8");
              console.log(`[Preview] Using HTML from file`);
            }
          }
        } else {
          // Template not in DB, try file directly
          const templatePath = path.join(
            process.cwd(),
            "public",
            "templates",
            templateId,
            "index.html"
          );

          if (fs.existsSync(templatePath)) {
            htmlContent = fs.readFileSync(templatePath, "utf-8");
            console.log(`[Preview] Using HTML from file (template not in DB)`);
          }
        }
      } catch (dbError) {
        console.error("[Preview] Database error, falling back to file:", dbError);
        // Fallback to file
        const templatePath = path.join(
          process.cwd(),
          "public",
          "templates",
          templateId,
          "index.html"
        );

        if (fs.existsSync(templatePath)) {
          htmlContent = fs.readFileSync(templatePath, "utf-8");
        }
      }

      if (htmlContent) {
        return generatePreviewResponse(htmlContent, templateId, request);
      } else {
        return new NextResponse("Template file not found", { status: 404 });
      }
    }

    if (!htmlContentBase64) {
      return new NextResponse("No HTML content provided", { status: 400 });
    }

    // Decode base64 HTML content
    const htmlContent = decodeURIComponent(escape(atob(htmlContentBase64)));
    return generatePreviewResponse(htmlContent, templateId, request);
  } catch (error: any) {
    console.error("Error generating preview:", error);
    return new NextResponse("Failed to generate preview", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const htmlContent = body.htmlContent || "";
    const templateId = body.templateId || "";

    if (!htmlContent) {
      return new NextResponse("No HTML content provided", { status: 400 });
    }

    return generatePreviewResponse(htmlContent, templateId, request);
  } catch (error: any) {
    console.error("Error generating preview:", error);
    return new NextResponse("Failed to generate preview", { status: 500 });
  }
}

function generatePreviewResponse(htmlContent: string, templateId: string | null, request: NextRequest) {
  let fullHtml = htmlContent || "";

  // Get origin from request to create absolute base href
  const origin = request.headers.get("origin") || 
                 request.headers.get("host") ? 
                   `${request.nextUrl.protocol}//${request.headers.get("host")}` : 
                   "http://localhost:3000";
  
  // Inject base tag dengan template path - HARUS di awal <head>
  // Use absolute URL for blob URLs to work correctly
  const basePath = templateId ? `/templates/${templateId}/` : "/";
  const baseHref = basePath.startsWith("http") ? basePath : `${origin}${basePath}`;
  const baseTag = `<base href="${baseHref}">`;
  
  // Hapus base tag yang sudah ada jika ada
  fullHtml = fullHtml.replace(/<base[^>]*>/gi, "");
  
  // Inject base tag tepat setelah <head> (sebelum tag lain)
  // Cari posisi <head> dengan regex yang lebih fleksibel
  const headRegex = /<head(\s[^>]*)?>/i;
  const headMatch = fullHtml.match(headRegex);
  
  if (headMatch && headMatch.index !== undefined) {
    // Inject base tag tepat setelah <head>
    const insertPos = headMatch.index + headMatch[0].length;
    fullHtml = fullHtml.substring(0, insertPos) + 
               `\n    ${baseTag}` + 
               fullHtml.substring(insertPos);
  } else if (fullHtml.includes("</head>")) {
    // Jika ada </head> tapi tidak ada <head>, inject sebelum </head>
    fullHtml = fullHtml.replace("</head>", `    ${baseTag}\n</head>`);
  } else if (fullHtml.includes("<html")) {
    // Jika ada <html> tapi tidak ada <head>, buat <head> dengan base tag
    fullHtml = fullHtml.replace(/<html(\s[^>]*)?>/i, `<html$1>\n<head>\n    ${baseTag}\n</head>`);
  } else {
    // Jika tidak ada struktur HTML sama sekali, tambahkan di awal
    fullHtml = `<head>\n    ${baseTag}\n</head>\n${fullHtml}`;
  }
  
  // Debug: log base href untuk verifikasi
  console.log("Preview base href:", baseHref, "templateId:", templateId);

  return new NextResponse(fullHtml, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
