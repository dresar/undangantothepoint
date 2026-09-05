/**
 * HTML Sanitizer - Bersihkan HTML dari konten berbahaya
 */

export interface SanitizeOptions {
  removeScripts?: boolean;
  removeStyles?: boolean;
  removeEventHandlers?: boolean;
  removeDataAttributes?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

const DEFAULT_ALLOWED_TAGS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
  'form', 'input', 'button', 'textarea', 'select', 'option',
  'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 's',
  'article', 'section', 'header', 'footer', 'nav', 'aside',
  'main', 'figure', 'figcaption', 'blockquote', 'pre', 'code',
];

export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  const {
    removeScripts = true,
    removeStyles = false,
    removeEventHandlers = true,
    removeDataAttributes = false,
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = {},
  } = options;

  let sanitized = html;

  // Remove scripts
  if (removeScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
  }

  // Remove styles
  if (removeStyles) {
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  }

  // Remove event handlers
  if (removeEventHandlers) {
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  // Remove data attributes
  if (removeDataAttributes) {
    sanitized = sanitized.replace(/\s+data-[^=]*=["'][^"']*["']/gi, '');
  }

  // Filter allowed tags (basic implementation)
  // This is a simplified version - for production, use a library like DOMPurify

  return sanitized;
}

