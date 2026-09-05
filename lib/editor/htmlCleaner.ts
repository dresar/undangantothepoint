/**
 * HTML Cleaner - Bersihkan HTML dari elemen yang tidak perlu
 */

export interface CleanOptions {
  removeComments?: boolean;
  removeEmptyAttributes?: boolean;
  removeStyleAttributes?: boolean;
  removeScripts?: boolean;
  removeInlineStyles?: boolean;
  removeDataAttributes?: boolean;
  removeEventHandlers?: boolean;
  minify?: boolean;
  fixBrokenTags?: boolean;
}

export function cleanHtml(html: string, options: CleanOptions = {}): string {
  const {
    removeComments = true,
    removeEmptyAttributes = true,
    removeStyleAttributes = false,
    removeScripts = false,
    removeInlineStyles = false, // JANGAN hapus inline styles - ini penting untuk desain!
    removeDataAttributes = false, // JANGAN hapus data attributes - mungkin digunakan untuk JS
    removeEventHandlers = false, // JANGAN hapus event handlers - penting untuk interaktivitas
    minify = false,
    fixBrokenTags = false, // DISABLED - bisa merusak struktur yang sudah benar
  } = options;

  let cleaned = html;

  // Preserve content inside script, style, and conditional comments first
  const scriptPlaceholders: Array<{ content: string; placeholder: string }> = [];
  const stylePlaceholders: Array<{ content: string; placeholder: string }> = [];
  const conditionalCommentPlaceholders: Array<{ content: string; placeholder: string }> = [];
  
  // Extract script tags (proteksi dari perubahan)
  cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => {
    const placeholder = `__SCRIPT_PLACEHOLDER_${scriptPlaceholders.length}__`;
    scriptPlaceholders.push({ content: match, placeholder });
    return placeholder;
  });
  
  // Extract style tags (proteksi dari perubahan)
  cleaned = cleaned.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (match) => {
    const placeholder = `__STYLE_PLACEHOLDER_${stylePlaceholders.length}__`;
    stylePlaceholders.push({ content: match, placeholder });
    return placeholder;
  });
  
  // Extract conditional comments (IE conditional comments - jangan hapus, tapi proteksi dulu)
  cleaned = cleaned.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, (match) => {
    const placeholder = `__CONDITIONAL_COMMENT_${conditionalCommentPlaceholders.length}__`;
    conditionalCommentPlaceholders.push({ content: match, placeholder });
    return placeholder;
  });

  // Remove comments (selalu hapus komentar HTML biasa)
  if (removeComments) {
    // Hapus komentar HTML (<!-- ... -->) dengan regex yang lebih aman
    // Hanya hapus komentar yang tidak di dalam string attribute
    cleaned = cleaned.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
  }

  // Remove scripts (hanya jika diminta)
  if (removeScripts) {
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  // JANGAN hapus inline styles - ini penting untuk desain!
  // if (removeInlineStyles) {
  //   cleaned = cleaned.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '');
  // }

  // JANGAN hapus data attributes - mungkin digunakan untuk JS
  // if (removeDataAttributes) {
  //   cleaned = cleaned.replace(/\s+data-[^=]*=["'][^"']*["']/gi, '');
  // }

  // JANGAN hapus event handlers - penting untuk interaktivitas
  // if (removeEventHandlers) {
  //   cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  // }

  // Remove empty attributes (hanya yang benar-benar kosong)
  if (removeEmptyAttributes) {
    cleaned = cleaned.replace(/\s+(\w+)\s*=\s*["']\s*["']/g, '');
  }

  // JANGAN fix broken tags - bisa merusak struktur yang sudah benar
  // if (fixBrokenTags) {
  //   // Fix unclosed tags
  //   cleaned = cleaned.replace(/<(\w+)([^>]*?)(?<!\s\/)>/g, (match, tag, attrs) => {
  //     const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  //     if (selfClosingTags.includes(tag.toLowerCase())) {
  //       return `<${tag}${attrs} />`;
  //     }
  //     return match;
  //   });
  // }

  // Compact whitespace (hapus spasi berlebihan, tapi tetap jaga struktur)
  // Ini akan membuat kode lebih rapat tanpa merusak struktur HTML
  // Proteksi atribut dengan nilai yang mengandung spasi penting
  const protectedAttributes: Array<{ original: string; placeholder: string }> = [];
  let attrIndex = 0;
  
  // Proteksi atribut yang mungkin mengandung spasi penting (seperti style dengan multiple values)
  cleaned = cleaned.replace(/(\w+)\s*=\s*(["'])([^"']{50,})\2/gi, (match, attr, quote, value) => {
    // Proteksi atribut panjang yang mungkin mengandung spasi penting
    if (value.length > 50 && (value.includes(';') || value.includes(':'))) {
      const placeholder = `__PROTECTED_ATTR_${attrIndex}__`;
      protectedAttributes.push({ original: match, placeholder });
      attrIndex++;
      return placeholder;
    }
    return match;
  });
  
  // Compact whitespace dengan sangat hati-hati
  cleaned = cleaned
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Hapus spasi di awal baris (tapi jangan di dalam tag)
    .replace(/^[ \t]+/gm, '')
    // Hapus spasi di akhir baris
    .replace(/[ \t]+$/gm, '')
    // Hapus baris kosong berlebihan (maksimal 2 baris kosong berturut-turut)
    .replace(/\n{4,}/g, '\n\n\n')
    // Compact spasi di antara tag (tapi jaga minimal 1 newline)
    .replace(/>\s{3,}</g, '>\n<')
    // Compact multiple spaces menjadi single space (tapi jangan di dalam tag)
    // Hanya compact spasi yang tidak di antara > dan <
    .replace(/([^>])\s{2,}([^<])/g, '$1 $2')
    .trim();
  
  // Restore protected attributes
  protectedAttributes.forEach(({ original, placeholder }) => {
    cleaned = cleaned.replace(placeholder, original);
  });
  
  // Restore conditional comments
  conditionalCommentPlaceholders.forEach(({ content, placeholder }) => {
    cleaned = cleaned.replace(placeholder, content);
  });
  
  // Restore script and style tags
  scriptPlaceholders.forEach(({ content, placeholder }) => {
    cleaned = cleaned.replace(placeholder, content);
  });
  
  stylePlaceholders.forEach(({ content, placeholder }) => {
    cleaned = cleaned.replace(placeholder, content);
  });

  // Minify (jika diminta - ini akan membuat sangat compact)
  if (minify) {
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  }

  return cleaned;
}

