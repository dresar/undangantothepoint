/**
 * HTML Extractor - Ekstrak elemen tertentu dari HTML
 */

export interface ExtractOptions {
  extractText?: boolean;
  extractLinks?: boolean;
  extractImages?: boolean;
  extractHeadings?: boolean;
  extractMeta?: boolean;
}

export interface ExtractedData {
  text?: string[];
  links?: Array<{ url: string; text: string }>;
  images?: Array<{ src: string; alt: string }>;
  headings?: Array<{ level: number; text: string }>;
  meta?: Record<string, string>;
}

export function extractFromHtml(html: string, options: ExtractOptions = {}): ExtractedData {
  const {
    extractText = false,
    extractLinks = false,
    extractImages = false,
    extractHeadings = false,
    extractMeta = false,
  } = options;

  const extracted: ExtractedData = {};

  // Extract text
  if (extractText) {
    const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    extracted.text = textContent.split(/\s+/).filter(word => word.length > 0);
  }

  // Extract links
  if (extractLinks) {
    extracted.links = [];
    const linkRegex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      extracted.links.push({
        url: match[1],
        text: match[2].trim(),
      });
    }
  }

  // Extract images
  if (extractImages) {
    extracted.images = [];
    const imgRegex = /<img\b[^>]*>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const srcMatch = match[0].match(/src\s*=\s*["']([^"']+)["']/i);
      const altMatch = match[0].match(/alt\s*=\s*["']([^"']+)["']/i);
      if (srcMatch) {
        extracted.images.push({
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : '',
        });
      }
    }
  }

  // Extract headings
  if (extractHeadings) {
    extracted.headings = [];
    const headingRegex = /<h([1-6])\b[^>]*>([^<]+)<\/h[1-6]>/gi;
    while ((match = headingRegex.exec(html)) !== null) {
      extracted.headings.push({
        level: parseInt(match[1]),
        text: match[2].trim(),
      });
    }
  }

  // Extract meta tags
  if (extractMeta) {
    extracted.meta = {};
    const metaRegex = /<meta\b[^>]*>/gi;
    while ((match = metaRegex.exec(html)) !== null) {
      const nameMatch = match[0].match(/name\s*=\s*["']([^"']+)["']/i);
      const contentMatch = match[0].match(/content\s*=\s*["']([^"']+)["']/i);
      if (nameMatch && contentMatch) {
        extracted.meta[nameMatch[1]] = contentMatch[1];
      }
    }
  }

  return extracted;
}

