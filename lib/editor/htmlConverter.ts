/**
 * HTML Converter - Konversi format HTML
 */

export interface ConvertOptions {
  toXhtml?: boolean;
  toHtml5?: boolean;
  fixQuotes?: boolean;
  normalizeAttributes?: boolean;
}

export function convertHtml(html: string, options: ConvertOptions = {}): string {
  const {
    toXhtml = false,
    toHtml5 = true,
    fixQuotes = true,
    normalizeAttributes = true,
  } = options;

  let converted = html;

  // Convert to XHTML
  if (toXhtml) {
    // Self-close tags
    converted = converted.replace(/<(\w+)([^>]*?)(?<!\s\/)>/g, (match, tag, attrs) => {
      const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
      if (selfClosingTags.includes(tag.toLowerCase())) {
        return `<${tag}${attrs} />`;
      }
      return match;
    });

    // Lowercase tags
    converted = converted.replace(/<\/?(\w+)/g, (match, tag) => {
      return match.replace(tag, tag.toLowerCase());
    });
  }

  // Convert to HTML5
  if (toHtml5) {
    // Remove type="text/javascript" from script tags
    converted = converted.replace(/<script\b([^>]*)\s+type\s*=\s*["']text\/javascript["']([^>]*)>/gi, '<script$1$2>');

    // Remove type="text/css" from style tags
    converted = converted.replace(/<style\b([^>]*)\s+type\s*=\s*["']text\/css["']([^>]*)>/gi, '<style$1$2>');
  }

  // Fix quotes
  if (fixQuotes) {
    // Normalize quotes to double quotes
    converted = converted.replace(/(\w+)\s*=\s*[']([^']*)[']/g, '$1="$2"');
  }

  // Normalize attributes
  if (normalizeAttributes) {
    // Remove duplicate spaces in attributes
    converted = converted.replace(/<(\w+)([^>]*?)>/g, (match, tag, attrs) => {
      const normalized = attrs.replace(/\s+/g, ' ').trim();
      return `<${tag}${normalized ? ' ' + normalized : ''}>`;
    });
  }

  return converted;
}

