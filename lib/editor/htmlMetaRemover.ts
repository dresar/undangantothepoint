/**
 * HTML Meta Remover - Hapus meta tags dari HTML (untuk disimpan di database)
 */

export function removeMetaTagsFromHtml(html: string): string {
  let cleaned = html;

  // Remove title tag (akan di-generate dari SEO config)
  cleaned = cleaned.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');

  // Remove meta description
  cleaned = cleaned.replace(/<meta\s+name\s*=\s*["']description["'][^>]*>/gi, '');

  // Remove meta keywords
  cleaned = cleaned.replace(/<meta\s+name\s*=\s*["']keywords["'][^>]*>/gi, '');

  // Remove Open Graph tags
  cleaned = cleaned.replace(/<meta\s+property\s*=\s*["']og:[^"']+["'][^>]*>/gi, '');

  // Remove itemprop tags
  cleaned = cleaned.replace(/<meta\s+itemprop\s*=\s*["'][^"']+["'][^>]*>/gi, '');

  // Remove meta title
  cleaned = cleaned.replace(/<meta\s+name\s*=\s*["']title["'][^>]*>/gi, '');

  return cleaned;
}

