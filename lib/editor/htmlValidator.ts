/**
 * HTML Validator - Validasi dan deteksi masalah HTML
 */

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export function validateHtml(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for unclosed tags
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const isClosing = match[0].startsWith('</');
    const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

    if (selfClosing.includes(tag)) {
      continue;
    }

    if (isClosing) {
      const lastOpen = openTags.pop();
      if (lastOpen !== tag) {
        issues.push({
          type: 'error',
          message: `Tag penutup tidak cocok: </${tag}> ditemukan, tetapi tag terakhir yang dibuka adalah <${lastOpen}>`,
          line: getLineNumber(html, match.index),
        });
      }
    } else {
      openTags.push(tag);
    }
  }

  // Check for unclosed tags
  if (openTags.length > 0) {
    openTags.forEach(tag => {
      issues.push({
        type: 'error',
        message: `Tag <${tag}> tidak ditutup`,
      });
    });
  }

  // Check for duplicate IDs
  const idRegex = /id\s*=\s*["']([^"']+)["']/gi;
  const ids = new Map<string, number>();
  while ((match = idRegex.exec(html)) !== null) {
    const id = match[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }

  ids.forEach((count, id) => {
    if (count > 1) {
      issues.push({
        type: 'warning',
        message: `ID "${id}" digunakan ${count} kali (harus unik)`,
      });
    }
  });

  // Check for images without alt
  const imgRegex = /<img\b[^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    if (!match[0].includes('alt=')) {
      issues.push({
        type: 'warning',
        message: 'Gambar tanpa atribut alt ditemukan',
        line: getLineNumber(html, match.index),
        suggestion: 'Tambahkan alt="deskripsi gambar"',
      });
    }
  }

  // Check for links without href
  const linkRegex = /<a\b[^>]*>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    if (!match[0].includes('href=')) {
      issues.push({
        type: 'warning',
        message: 'Link tanpa atribut href ditemukan',
        line: getLineNumber(html, match.index),
      });
    }
  }

  return issues;
}

function getLineNumber(html: string, index: number): number {
  return html.substring(0, index).split('\n').length;
}

