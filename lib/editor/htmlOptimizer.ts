/**
 * HTML Optimizer - Optimasi HTML untuk performa
 */

export interface OptimizeOptions {
  removeUnusedAttributes?: boolean;
  removeComments?: boolean;
  minifyCss?: boolean;
  minifyJs?: boolean;
  optimizeImages?: boolean;
  deferScripts?: boolean;
  asyncScripts?: boolean;
}

export function optimizeHtml(html: string, options: OptimizeOptions = {}): string {
  const {
    removeUnusedAttributes = false,
    removeComments = true,
    minifyCss = false,
    minifyJs = false,
    optimizeImages = false,
    deferScripts = false,
    asyncScripts = false,
  } = options;

  let optimized = html;

  // Remove comments
  if (removeComments) {
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Remove unused attributes
  if (removeUnusedAttributes) {
    // Remove empty class attributes
    optimized = optimized.replace(/\s+class\s*=\s*["']\s*["']/g, '');
    // Remove empty id attributes
    optimized = optimized.replace(/\s+id\s*=\s*["']\s*["']/g, '');
  }

  // Defer scripts
  if (deferScripts) {
    optimized = optimized.replace(/<script\b([^>]*?)(?<!defer)(?<!async)([^>]*)>/gi, (match, before, after) => {
      if (!match.includes('defer') && !match.includes('async')) {
        return `<script${before} defer${after}>`;
      }
      return match;
    });
  }

  // Async scripts
  if (asyncScripts) {
    optimized = optimized.replace(/<script\b([^>]*?)(?<!async)([^>]*)>/gi, (match, before, after) => {
      if (!match.includes('async') && !match.includes('defer')) {
        return `<script${before} async${after}>`;
      }
      return match;
    });
  }

  // Optimize images (add loading="lazy")
  if (optimizeImages) {
    optimized = optimized.replace(/<img\b([^>]*?)(?<!loading)([^>]*)>/gi, (match, before, after) => {
      if (!match.includes('loading=')) {
        return `<img${before} loading="lazy"${after}>`;
      }
      return match;
    });
  }

  // Minify CSS (basic - remove extra whitespace)
  if (minifyCss) {
    optimized = optimized.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
      const minified = css.replace(/\s+/g, ' ').replace(/;\s*}/g, '}').trim();
      return match.replace(css, minified);
    });
  }

  // Minify JS (basic - remove comments and extra whitespace)
  if (minifyJs) {
    optimized = optimized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
      if (!match.includes('src=')) {
        const minified = js
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return match.replace(js, minified);
      }
      return match;
    });
  }

  return optimized;
}

