import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { detectCDNFromContent, isCDNLink, extractLibraryFromCDN } from "@/lib/cdnDetector";

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

    const styleConfig = template.style_config_json as any;
    const normalizedName = template.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const templateDir = path.join(process.cwd(), "public", "templates", normalizedName);

    const analysis = {
      css: [] as any[],
      js: [] as any[],
    };

    // Analyze CSS files
    if (styleConfig?.css) {
      for (const cssPath of styleConfig.css) {
        const fullPath = path.join(process.cwd(), "public", cssPath);
        
        let analysisResult: any = {
          path: cssPath,
          isCDN: isCDNLink(cssPath),
          detectedLibraries: [],
          fileSize: 0,
          exists: false,
        };

        if (isCDNLink(cssPath)) {
          const cdnInfo = extractLibraryFromCDN(cssPath);
          analysisResult.cdnInfo = cdnInfo;
        } else if (fs.existsSync(fullPath)) {
          analysisResult.exists = true;
          const stats = fs.statSync(fullPath);
          analysisResult.fileSize = stats.size;
          
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const detected = detectCDNFromContent(content, path.basename(cssPath));
            analysisResult.detectedLibraries = detected;
          } catch (error) {
            console.error(`Error reading CSS file ${cssPath}:`, error);
          }
        }

        analysis.css.push(analysisResult);
      }
    }

    // Analyze JS files
    if (styleConfig?.js) {
      for (const jsPath of styleConfig.js) {
        const fullPath = path.join(process.cwd(), "public", jsPath);
        
        let analysisResult: any = {
          path: jsPath,
          isCDN: isCDNLink(jsPath),
          detectedLibraries: [],
          fileSize: 0,
          exists: false,
        };

        if (isCDNLink(jsPath)) {
          const cdnInfo = extractLibraryFromCDN(jsPath);
          analysisResult.cdnInfo = cdnInfo;
        } else if (fs.existsSync(fullPath)) {
          analysisResult.exists = true;
          const stats = fs.statSync(fullPath);
          analysisResult.fileSize = stats.size;
          
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const detected = detectCDNFromContent(content, path.basename(jsPath));
            analysisResult.detectedLibraries = detected;
          } catch (error) {
            console.error(`Error reading JS file ${jsPath}:`, error);
          }
        }

        analysis.js.push(analysisResult);
      }
    }

    return NextResponse.json(analysis, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Error analyzing assets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze assets" },
      { status: 500 }
    );
  }
}

