/**
 * HTML Minifier - Minify HTML untuk production
 */

export interface MinifyOptions {
  removeComments?: boolean;
  removeWhitespace?: boolean;
  collapseWhitespace?: boolean;
  removeOptionalTags?: boolean;
  removeEmptyAttributes?: boolean;
}

export function minifyHtml(html: string, options: MinifyOptions = {}): string {
  const {
    removeComments = true,
    removeWhitespace = true,
    collapseWhitespace = true,
    removeOptionalTags = false,
    removeEmptyAttributes = true,
  } = options;

  let minified = html;

  // Remove comments
  if (removeComments) {
    minified = minified.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Remove whitespace between tags
  if (removeWhitespace) {
    minified = minified.replace(/>\s+</g, '><');
  }

  // Collapse whitespace
  if (collapseWhitespace) {
    minified = minified.replace(/\s+/g, ' ');
    minified = minified.replace(/\s+>/g, '>');
    minified = minified.replace(/>\s+/g, '>');
  }

  // Remove empty attributes
  if (removeEmptyAttributes) {
    minified = minified.replace(/\s+(\w+)\s*=\s*["']\s*["']/g, '');
  }

  // Remove optional tags (careful with this)
  if (removeOptionalTags) {
    // Remove optional closing tags like </p>, </li>, etc.
    minified = minified.replace(/<\/?(p|li|dt|dd|rt|rp|optgroup|option|thead|tbody|tfoot|tr|td|th)\b[^>]*>/gi, '');
  }

  return minified.trim();
}

