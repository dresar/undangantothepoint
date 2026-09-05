/**
 * HTML Meta Cleaner - Bersihkan meta tags external dan ganti dengan default
 */

export interface MetaCleanOptions {
  removeExternalUrls?: boolean;
  defaultDomain?: string;
  removeOgTags?: boolean;
  removeItemprop?: boolean;
}

export function cleanMetaTags(html: string, options: MetaCleanOptions = {}): string {
  const {
    removeExternalUrls = true,
    defaultDomain = '',
    removeOgTags = false,
    removeItemprop = false,
  } = options;

  let cleaned = html;

  // Remove external URLs from meta tags
  if (removeExternalUrls) {
    // Remove og:url with external domains
    cleaned = cleaned.replace(
      /<meta\s+property\s*=\s*["']og:url["']\s+content\s*=\s*["']https?:\/\/[^"']+["'][^>]*>/gi,
      defaultDomain ? `<meta property="og:url" content="${defaultDomain}">` : ''
    );

    // Remove itemprop with external domains
    if (removeItemprop) {
      cleaned = cleaned.replace(
        /<meta\s+itemprop\s*=\s*["']image["']\s+content\s*=\s*["']https?:\/\/[^"']+["'][^>]*>/gi,
        ''
      );
    } else {
      // Replace external URLs with relative paths
      cleaned = cleaned.replace(
        /<meta\s+itemprop\s*=\s*["']image["']\s+content\s*=\s*["']https?:\/\/[^"']+\/([^"']+)["'][^>]*>/gi,
        (match, path) => {
          return `<meta itemprop="image" content="/${path}">`;
        }
      );
    }

    // Remove or replace external og:image
    cleaned = cleaned.replace(
      /<meta\s+property\s*=\s*["']og:image["']\s+content\s*=\s*["']https?:\/\/[^"']+\/([^"']+)["'][^>]*>/gi,
      (match, path) => {
        return `<meta property="og:image" content="/${path}">`;
      }
    );
  }

  // Remove all og tags if needed
  if (removeOgTags) {
    cleaned = cleaned.replace(/<meta\s+property\s*=\s*["']og:[^"']+["'][^>]*>/gi, '');
  }

  return cleaned;
}

