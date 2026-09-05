/**
 * Asset Detector - Deteksi semua asset dalam HTML
 */

export interface DetectedAsset {
  type: 'image' | 'css' | 'js' | 'font' | 'video' | 'audio' | 'other';
  url: string;
  tag: string;
  attributes: Record<string, string>;
  line?: number;
}

export function detectAssets(html: string): DetectedAsset[] {
  const assets: DetectedAsset[] = [];

  // Detect images
  const imgRegex = /<img\b[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const srcMatch = match[0].match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      assets.push({
        type: 'image',
        url: srcMatch[1],
        tag: match[0],
        attributes: parseAttributes(match[0]),
        line: getLineNumber(html, match.index),
      });
    }
  }

  // Detect CSS
  const cssRegex = /<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi;
  while ((match = cssRegex.exec(html)) !== null) {
    const hrefMatch = match[0].match(/href\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch) {
      assets.push({
        type: 'css',
        url: hrefMatch[1],
        tag: match[0],
        attributes: parseAttributes(match[0]),
        line: getLineNumber(html, match.index),
      });
    }
  }

  // Detect JS
  const jsRegex = /<script\b[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((match = jsRegex.exec(html)) !== null) {
    const srcMatch = match[0].match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      assets.push({
        type: 'js',
        url: srcMatch[1],
        tag: match[0],
        attributes: parseAttributes(match[0]),
        line: getLineNumber(html, match.index),
      });
    }
  }

  // Detect fonts
  const fontRegex = /@font-face[\s\S]*?url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi;
  while ((match = fontRegex.exec(html)) !== null) {
    assets.push({
      type: 'font',
      url: match[1],
      tag: match[0],
      attributes: {},
      line: getLineNumber(html, match.index),
    });
  }

  // Detect videos
  const videoRegex = /<video\b[^>]*>/gi;
  while ((match = videoRegex.exec(html)) !== null) {
    const srcMatch = match[0].match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      assets.push({
        type: 'video',
        url: srcMatch[1],
        tag: match[0],
        attributes: parseAttributes(match[0]),
        line: getLineNumber(html, match.index),
      });
    }
  }

  // Detect audio
  const audioRegex = /<audio\b[^>]*>/gi;
  while ((match = audioRegex.exec(html)) !== null) {
    const srcMatch = match[0].match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      assets.push({
        type: 'audio',
        url: srcMatch[1],
        tag: match[0],
        attributes: parseAttributes(match[0]),
        line: getLineNumber(html, match.index),
      });
    }
  }

  return assets;
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = attrRegex.exec(tag)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function getLineNumber(html: string, index: number): number {
  return html.substring(0, index).split('\n').length;
}

