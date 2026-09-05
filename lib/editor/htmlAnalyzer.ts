/**
 * HTML Analyzer - Analisis struktur dan statistik HTML
 */

export interface HtmlStats {
  totalTags: number;
  totalElements: number;
  totalText: number;
  totalComments: number;
  totalAttributes: number;
  tagCounts: Record<string, number>;
  attributeCounts: Record<string, number>;
  depth: number;
  hasDoctype: boolean;
  hasHtmlTag: boolean;
  hasHeadTag: boolean;
  hasBodyTag: boolean;
}

export function analyzeHtml(html: string): HtmlStats {
  const stats: HtmlStats = {
    totalTags: 0,
    totalElements: 0,
    totalText: 0,
    totalComments: 0,
    totalAttributes: 0,
    tagCounts: {},
    attributeCounts: {},
    depth: 0,
    hasDoctype: false,
    hasHtmlTag: false,
    hasHeadTag: false,
    hasBodyTag: false,
  };

  // Check for doctype
  stats.hasDoctype = /<!DOCTYPE/i.test(html);

  // Check for main tags
  stats.hasHtmlTag = /<html\b/i.test(html);
  stats.hasHeadTag = /<head\b/i.test(html);
  stats.hasBodyTag = /<body\b/i.test(html);

  // Count comments
  const commentMatches = html.match(/<!--[\s\S]*?-->/g);
  stats.totalComments = commentMatches ? commentMatches.length : 0;

  // Count tags
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  let match;
  let currentDepth = 0;
  let maxDepth = 0;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const isClosing = match[0].startsWith('</');
    const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

    stats.totalTags++;

    if (!isClosing && !selfClosing.includes(tag)) {
      stats.totalElements++;
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (isClosing) {
      currentDepth = Math.max(0, currentDepth - 1);
    }

    // Count tag occurrences
    stats.tagCounts[tag] = (stats.tagCounts[tag] || 0) + 1;

    // Count attributes
    const attrRegex = /(\w+)\s*=\s*["'][^"']*["']/gi;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(match[0])) !== null) {
      stats.totalAttributes++;
      const attrName = attrMatch[1].toLowerCase();
      stats.attributeCounts[attrName] = (stats.attributeCounts[attrName] || 0) + 1;
    }
  }

  // Count text content (approximate)
  const textContent = html.replace(/<[^>]+>/g, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  stats.totalText = textContent.length;

  stats.depth = maxDepth;

  return stats;
}

