import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { templateId, htmlContent } = await request.json();

    if (!templateId || !htmlContent) {
      return NextResponse.json(
        { error: "Template ID dan HTML content diperlukan" },
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

    // Find all SVG elements - improved regex to handle all cases including nested
    // Use non-greedy match with proper boundary detection
    const svgRegex = /<svg\b[^>]*>[\s\S]*?<\/svg>/gi;
    const svgMatches: Array<{ content: string; index: number; length: number }> = [];
    const processedContents = new Set<string>(); // Track processed content to avoid duplicates
    
    // Reset regex lastIndex to ensure we start from beginning
    svgRegex.lastIndex = 0;
    let match;
    let attemptCount = 0;
    const maxAttempts = 1000; // Safety limit

    while ((match = svgRegex.exec(htmlContent)) !== null && attemptCount < maxAttempts) {
      attemptCount++;
      const matchIndex = match.index;
      const svgContent = match[0];
      
      // Avoid duplicate matches (same content)
      if (!processedContents.has(svgContent)) {
        // Verify it's a valid SVG by checking for closing tag
        if (svgContent.includes('</svg>')) {
          // Count opening and closing tags to ensure it's balanced
          const openTags = (svgContent.match(/<svg\b/gi) || []).length;
          const closeTags = (svgContent.match(/<\/svg>/gi) || []).length;
          
          // Additional validation: ensure SVG doesn't contain broken tags
          if (openTags === closeTags && !svgContent.includes('<img')) {
            svgMatches.push({
              content: svgContent,
              index: matchIndex,
              length: svgContent.length,
            });
            processedContents.add(svgContent);
            console.log(`[Extract SVGs] Found SVG at index ${matchIndex}, length ${svgContent.length}`);
          } else {
            console.warn(`[Extract SVGs] Skipped invalid SVG at index ${matchIndex} (unbalanced tags or contains <img>)`);
          }
        }
      }
    }
    
    // Sort by index descending for safe replacement (process from end to start)
    svgMatches.sort((a, b) => b.index - a.index);
    
    console.log(`[Extract SVGs] Total SVGs found: ${svgMatches.length}`);

    if (svgMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada SVG ditemukan",
        htmlContent: htmlContent,
        extractedCount: 0,
        replacements: [],
      });
    }

    // MASS EXTRACTION - Process all SVGs in batch
    console.log(`[Extract SVGs] Starting MASS extraction of ${svgMatches.length} SVGs`);
    
    // Step 1: Prepare all SVG data (filenames, replacements) - NO FILE WRITES YET
    const svgData: Array<{
      content: string;
      index: number;
      length: number;
      filename: string;
      replacement: string;
      url: string;
    }> = [];
    
    let svgCounter = 1;
    const usedFilenames = new Set<string>();

    for (let i = 0; i < svgMatches.length; i++) {
      const svgMatch = svgMatches[i];
      const svgContent = svgMatch.content;

      // Extract SVG attributes for filename generation
      const svgTagMatch = svgContent.match(/<svg[^>]*>/i);
      let filename = `icon-${svgCounter}.svg`;

      if (svgTagMatch) {
        // Try to get meaningful name from attributes
        const widthMatch = svgTagMatch[0].match(/width=["'](\d+)["']/i);
        const heightMatch = svgTagMatch[0].match(/height=["'](\d+)["']/i);
        const classMatch = svgTagMatch[0].match(/class=["']([^"']+)["']/i);
        const idMatch = svgTagMatch[0].match(/id=["']([^"']+)["']/i);

        if (idMatch) {
          filename = `${idMatch[1].replace(/[^a-z0-9-]/gi, "-")}.svg`;
        } else if (classMatch) {
          const className = classMatch[1].split(/\s+/)[0].replace(/[^a-z0-9-]/gi, "-");
          if (className) {
            filename = `${className}.svg`;
          }
        } else if (widthMatch && heightMatch) {
          filename = `icon-${widthMatch[1]}x${heightMatch[1]}.svg`;
        }
      }

      // Sanitize filename
      filename = filename
        .replace(/[^a-z0-9.-]/gi, "-")
        .toLowerCase()
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure .svg extension
      if (!filename.endsWith(".svg")) {
        filename += ".svg";
      }

      // Handle duplicate filenames
      let finalFilename = filename;
      let counter = 1;
      while (usedFilenames.has(finalFilename)) {
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        finalFilename = `${base}-${counter}${ext}`;
        counter++;
      }
      usedFilenames.add(finalFilename);
      filename = finalFilename;

      // Generate replacement
      const widthMatch = svgContent.match(/width=["']([^"']+)["']/i);
      const heightMatch = svgContent.match(/height=["']([^"']+)["']/i);
      const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);

      let imgAttributes = `src="media/${filename}" alt=""`;
      
      if (widthMatch) {
        imgAttributes += ` width="${widthMatch[1]}"`;
      }
      if (heightMatch) {
        imgAttributes += ` height="${heightMatch[1]}"`;
      }
      if (!widthMatch && !heightMatch && viewBoxMatch) {
        const viewBoxValues = viewBoxMatch[1].split(/\s+/);
        if (viewBoxValues.length >= 4) {
          imgAttributes += ` width="${viewBoxValues[2]}" height="${viewBoxValues[3]}"`;
        }
      }

      const replacement = `<img ${imgAttributes} style="width: inherit; height: inherit;">`;
      const shortUrl = `media/${filename}`;

      svgData.push({
        content: svgContent,
        index: svgMatch.index,
        length: svgMatch.length,
        filename: filename,
        replacement: replacement,
        url: shortUrl,
      });

      svgCounter++;
    }

    // Step 2: MASS SAVE - Save all SVG files at once (batch write)
    console.log(`[Extract SVGs] Saving ${svgData.length} SVG files in batch...`);
    const savePromises = svgData.map((data, idx) => {
      const filePath = path.join(mediaDir, data.filename);
      try {
        fs.writeFileSync(filePath, data.content, "utf-8");
        console.log(`[Extract SVGs] ✓ Saved: ${data.filename} (${idx + 1}/${svgData.length})`);
        return { success: true, filename: data.filename };
      } catch (error: any) {
        console.error(`[Extract SVGs] ✗ Failed to save ${data.filename}:`, error);
        return { success: false, filename: data.filename, error: error.message };
      }
    });

    const saveResults = savePromises;
    const successfulSaves = saveResults.filter(r => r.success).length;
    console.log(`[Extract SVGs] Batch save complete: ${successfulSaves}/${svgData.length} files saved`);

    // Step 3: MASS REPLACE - Replace all SVGs in HTML using exact string match
    let updatedHtml = htmlContent;
    const replacements: Array<{ original: string; filename: string; url: string }> = [];

    console.log(`[Extract SVGs] Replacing all SVGs in HTML using exact string match...`);
    
    // Process in reverse order (from end to start) to avoid index shifting issues
    // Use exact string replacement instead of index-based replacement
    for (let i = svgData.length - 1; i >= 0; i--) {
      const data = svgData[i];
      const originalSvg = data.content;
      
      // Validate SVG is still intact (not partially replaced)
      if (!originalSvg.includes('<img') && originalSvg.startsWith('<svg') && originalSvg.endsWith('</svg>')) {
        // Use exact string replacement - replace first occurrence only
        if (updatedHtml.includes(originalSvg)) {
          // Double-check the SVG is still valid before replacement
          const svgIndex = updatedHtml.indexOf(originalSvg);
          if (svgIndex !== -1) {
            // Verify the match is a complete SVG (not part of another tag)
            // Simple validation: check if SVG starts with <svg and ends with </svg>
            const svgStart = updatedHtml.substring(svgIndex, svgIndex + 4);
            const svgEnd = updatedHtml.substring(svgIndex + originalSvg.length - 6, svgIndex + originalSvg.length);
            
            if (svgStart === '<svg' && svgEnd === '</svg>') {
              // Safe replacement using substring
              updatedHtml = updatedHtml.substring(0, svgIndex) + data.replacement + updatedHtml.substring(svgIndex + originalSvg.length);
              
              replacements.push({
                original: originalSvg,
                filename: data.filename,
                url: data.url,
              });

              console.log(`[Extract SVGs] ✓ Replaced SVG #${i + 1} (${data.filename})`);
            } else {
              console.warn(`[Extract SVGs] ⚠ SVG #${i + 1} validation failed (start: ${svgStart}, end: ${svgEnd}), skipping`);
            }
          } else {
            console.warn(`[Extract SVGs] ⚠ SVG #${i + 1} not found at expected position`);
          }
        } else {
          console.warn(`[Extract SVGs] ⚠ SVG #${i + 1} not found in HTML (may have been replaced already)`);
        }
      } else {
        console.warn(`[Extract SVGs] ⚠ SVG #${i + 1} is invalid or already partially replaced, skipping`);
      }
    }

    console.log(`[Extract SVGs] All ${replacements.length} SVGs replaced in HTML`);

    // Step 4: Verify all SVGs are replaced and no broken SVG tags remain
    const remainingSvgRegex = /<svg\b[^>]*>[\s\S]*?<\/svg>/gi;
    const remainingSvgs = updatedHtml.match(remainingSvgRegex);
    
    // Also check for broken SVG tags (SVG that contains <img> inside)
    const brokenSvgRegex = /<svg\b[^>]*>[\s\S]*?<img[\s\S]*?<\/svg>/gi;
    const brokenSvgs = updatedHtml.match(brokenSvgRegex);
    
    if (brokenSvgs && brokenSvgs.length > 0) {
      console.error(`[Extract SVGs] ERROR: ${brokenSvgs.length} SVG rusak ditemukan (mengandung <img> di dalamnya)!`);
      console.error(`[Extract SVGs] Broken SVGs:`, brokenSvgs);
    }
    
    if (remainingSvgs && remainingSvgs.length > 0) {
      // Filter out broken SVGs from count
      const validRemaining = remainingSvgs.filter(svg => !svg.includes('<img'));
      console.warn(`[Extract SVGs] WARNING: ${validRemaining.length} SVG masih tersisa setelah replacement!`);
      if (validRemaining.length > 0) {
        console.warn(`[Extract SVGs] Remaining SVGs:`, validRemaining.map((svg, idx) => `SVG ${idx + 1}: ${svg.substring(0, 100)}...`));
      }
    } else {
      console.log(`[Extract SVGs] ✓ VERIFIED: Semua SVG berhasil diganti (0 SVG tersisa)`);
    }

    console.log(`[Extract SVGs] ===== MASS EXTRACTION COMPLETE =====`);
    console.log(`[Extract SVGs] Total processed: ${svgMatches.length}`);
    console.log(`[Extract SVGs] Files saved: ${successfulSaves}`);
    console.log(`[Extract SVGs] Replacements made: ${replacements.length}`);
    console.log(`[Extract SVGs] Remaining SVGs: ${remainingSvgs ? remainingSvgs.length : 0}`);

    return NextResponse.json({
      success: true,
      message: `${replacements.length} SVG berhasil diekstrak dan diganti secara massal`,
      htmlContent: updatedHtml,
      extractedCount: replacements.length,
      filesSaved: successfulSaves,
      replacements: replacements.map(r => ({
        filename: r.filename,
        url: r.url,
      })),
      originalSvgCount: svgMatches.length,
      remainingSvgCount: remainingSvgs ? remainingSvgs.length : 0,
    });
  } catch (error: any) {
    console.error("Error extracting SVGs:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengekstrak SVG" },
      { status: 500 }
    );
  }
}

