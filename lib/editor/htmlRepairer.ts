/**
 * HTML Repairer - Perbaiki HTML yang rusak menggunakan DOMParser (Browser API)
 */

export interface RepairOptions {
  fixUnclosedTags?: boolean;
  fixNestedTags?: boolean;
  fixQuotes?: boolean;
  fixAttributes?: boolean;
  removeInvalidTags?: boolean;
  useDOMParser?: boolean; // Gunakan DOMParser untuk perbaikan yang lebih akurat
  debug?: boolean;
}

export function repairHtml(html: string, options: RepairOptions = {}): string {
  const {
    fixUnclosedTags = true,
    fixNestedTags = false,
    fixQuotes = true,
    fixAttributes = false,
    removeInvalidTags = false,
    useDOMParser = true, // Default: gunakan DOMParser untuk akurasi lebih baik
    debug = false,
  } = options;

  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`[HTML Repair] ${message}`, data || '');
    }
  };

  log('=== MULAI PERBAIKAN HTML ===');
  log('Panjang HTML awal:', html.length);
  log('Menggunakan DOMParser:', useDOMParser);
  
  // Jika di browser dan useDOMParser aktif, gunakan DOMParser
  if (typeof window !== 'undefined' && useDOMParser) {
    try {
      log('Menggunakan DOMParser untuk perbaikan...');
      const domResult = repairHtmlWithDOMParser(html, options);
      
      // Validasi: jika DOMParser tidak mengubah apapun, gunakan metode regex
      if (domResult === html && fixUnclosedTags) {
        log('DOMParser tidak mengubah HTML, menggunakan metode regex sebagai tambahan...');
        // Tetap gunakan hasil DOMParser, tapi tambahkan perbaikan regex
      } else {
        log('DOMParser berhasil mengubah HTML');
        return domResult;
      }
    } catch (error: any) {
      log('DOMParser gagal, fallback ke metode regex:', error.message);
      console.error('[HTML Repair] DOMParser error:', error);
      // Fallback ke metode regex
    }
  }
  
  let repaired = html;

  // Fix unclosed quotes in attributes (HATI-HATI: hanya untuk atribut yang jelas tidak ada quote)
  if (fixQuotes) {
    log('Memperbaiki quote di atribut...');
    const beforeQuotes = repaired;
    // Hanya perbaiki jika benar-benar tidak ada quote dan tidak ada karakter khusus
    repaired = repaired.replace(/(\w+)\s*=\s*([^"'\s>\/]+)(?=\s|>|\/)/g, (match, attr, value) => {
      // Skip jika value sudah ada quote, atau jika value mengandung karakter yang tidak valid
      if (value.startsWith('"') || value.startsWith("'") || value.includes('=') || value.includes('<')) {
        return match;
      }
      // Hanya perbaiki jika value adalah alphanumeric atau path sederhana
      if (/^[a-zA-Z0-9\/\._-]+$/.test(value)) {
        log(`  Memperbaiki: ${attr}=${value} -> ${attr}="${value}"`);
        return `${attr}="${value}"`;
      }
      return match;
    });
    if (beforeQuotes !== repaired) {
      log('  Quote diperbaiki');
    } else {
      log('  Tidak ada quote yang perlu diperbaiki');
    }
  }

  // Fix unclosed tags (HATI-HATI: hanya tutup tag yang benar-benar tidak tertutup)
  if (fixUnclosedTags) {
    log('Memperbaiki tag yang tidak tertutup...');
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    const tags: Array<{ type: 'open' | 'close'; tag: string; name: string; index: number; fullMatch: string }> = [];
    let match;
    let tagCount = 0;

    // Reset regex
    tagRegex.lastIndex = 0;
    while ((match = tagRegex.exec(html)) !== null) {
      tagCount++;
      const tagName = match[1].toLowerCase();
      const isClosing = match[0].startsWith('</');
      const isSelfClosing = match[0].endsWith('/>') || match[0].match(/\/\s*>$/);
      const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

      // Skip self-closing tags
      if (selfClosingTags.includes(tagName) || isSelfClosing) {
        log(`  Skip self-closing tag: ${match[0]}`);
        continue;
      }

      if (isClosing) {
        tags.push({ type: 'close', tag: match[0], name: tagName, index: match.index, fullMatch: match[0] });
        log(`  Found closing tag: </${tagName}> at index ${match.index}`);
      } else {
        tags.push({ type: 'open', tag: match[0], name: tagName, index: match.index, fullMatch: match[0] });
        log(`  Found opening tag: <${tagName}> at index ${match.index}`);
      }
    }

    log(`Total tags ditemukan: ${tagCount}, Tags untuk diproses: ${tags.length}`);

    // Find unclosed tags and close them
    const stack: Array<{ name: string; index: number }> = [];
    const unclosedTags: string[] = [];
    
    for (const tag of tags) {
      if (tag.type === 'open') {
        stack.push({ name: tag.name, index: tag.index });
        log(`  Push to stack: <${tag.name}> (stack size: ${stack.length})`);
      } else {
        if (stack.length === 0) {
          log(`  WARNING: Closing tag </${tag.name}> ditemukan tanpa opening tag`);
          // Mungkin ada opening tag yang hilang, tapi kita skip untuk aman
          continue;
        }
        
        const lastOpen = stack.pop();
        if (lastOpen && lastOpen.name !== tag.name) {
          log(`  WARNING: Tag mismatch! Expected </${lastOpen.name}>, found </${tag.name}>`);
          // Coba cari tag yang cocok di stack
          const index = stack.findIndex(t => t.name === tag.name);
          if (index !== -1) {
            // Ada tag yang cocok di stack, hapus yang salah
            stack.splice(index, 1);
            log(`  Fixed: Removed mismatched <${lastOpen.name}> from stack`);
          } else {
            // Tidak ada yang cocok, kembalikan ke stack
            stack.push(lastOpen);
            log(`  Cannot fix mismatch, keeping <${lastOpen.name}> in stack`);
          }
        } else if (lastOpen) {
          log(`  ✓ Matched: <${lastOpen.name}> ... </${tag.name}>`);
        }
      }
    }

    // Close remaining open tags (dari belakang ke depan untuk menjaga urutan)
    if (stack.length > 0) {
      log(`  Found ${stack.length} unclosed tags:`, stack.map(t => t.name));
      const closingTags: string[] = [];
      while (stack.length > 0) {
        const tag = stack.pop()!;
        closingTags.push(`</${tag.name}>`);
        log(`  Will close: </${tag.name}>`);
      }
      repaired += '\n' + closingTags.join('\n');
      log(`  Added closing tags: ${closingTags.join(', ')}`);
    } else {
      log('  ✓ Semua tag sudah tertutup dengan benar');
    }
  }

  // Fix nested tags (DISABLED by default - terlalu agresif dan bisa merusak)
  if (fixNestedTags) {
    log('Memperbaiki nested tags...');
    const beforeNested = repaired;
    // Hanya hapus jika benar-benar duplicate (tag yang sama langsung diikuti closing)
    repaired = repaired.replace(/<(\w+)[^>]*>\s*<\/\1>/g, (match) => {
      log(`  Removed empty tag pair: ${match}`);
      return '';
    });
    if (beforeNested !== repaired) {
      log('  Nested tags diperbaiki');
    } else {
      log('  Tidak ada nested tags yang perlu diperbaiki');
    }
  }

  // Fix attributes (DISABLED by default - bisa merusak atribut yang kompleks)
  if (fixAttributes) {
    log('Memperbaiki atribut duplikat...');
    const beforeAttrs = repaired;
    // Hanya hapus atribut yang benar-benar duplikat (nama dan value sama)
    repaired = repaired.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
      const seen = new Map<string, string>();
      const fixedAttrs = attrs.replace(/(\w+)\s*=\s*(["'][^"']*["'])/g, (attrMatch, attrName, attrValue) => {
        const key = attrName.toLowerCase();
        if (seen.has(key) && seen.get(key) === attrValue) {
          log(`  Removed duplicate attribute: ${attrName}=${attrValue}`);
          return '';
        }
        seen.set(key, attrValue);
        return attrMatch;
      });
      if (attrs !== fixedAttrs) {
        return `<${tag}${fixedAttrs}>`;
      }
      return match;
    });
    if (beforeAttrs !== repaired) {
      log('  Atribut duplikat diperbaiki');
    } else {
      log('  Tidak ada atribut duplikat yang perlu diperbaiki');
    }
  }

  // Remove invalid tags (DISABLED by default)
  if (removeInvalidTags) {
    log('Menghapus tag tidak valid...');
    const beforeInvalid = repaired;
    repaired = repaired.replace(/<\/?[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+[^>]*>/g, (match) => {
      log(`  Removed invalid tag: ${match}`);
      return '';
    });
    if (beforeInvalid !== repaired) {
      log('  Tag tidak valid dihapus');
    } else {
      log('  Tidak ada tag tidak valid');
    }
  }

  log('=== SELESAI PERBAIKAN HTML ===');
  log('Panjang HTML akhir:', repaired.length);
  log('Perubahan:', repaired.length - html.length, 'karakter');
  
  return repaired;
}

/**
 * Perbaiki HTML menggunakan DOMParser (lebih akurat)
 * DOMParser akan otomatis memperbaiki tag yang tidak tertutup dan struktur HTML
 */
function repairHtmlWithDOMParser(html: string, options: RepairOptions): string {
  const { debug = false, fixQuotes = true } = options;
  
  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`[HTML Repair DOMParser] ${message}`, data || '');
    }
  };

  log('=== MULAI PERBAIKAN DENGAN DOMParser ===');
  log('HTML input panjang:', html.length);
  
  try {
    // STEP 1: Perbaiki tag <style> dan <script> yang tidak tertutup SEBELUM DOMParser
    log('STEP 1: Memperbaiki tag <style> dan <script> yang tidak tertutup...');
    let preRepaired = html;
    let fixCount = 0;
    
    // Fungsi helper untuk menutup tag yang tidak tertutup
    const closeUnclosedTags = (tagName: string, regex: RegExp) => {
      const fixes: Array<{ index: number; insertAfter: number; closingTag: string }> = [];
      let match;
      const tagRegex = new RegExp(regex);
      tagRegex.lastIndex = 0; // Reset regex
      
      while ((match = tagRegex.exec(preRepaired)) !== null) {
        const openTagMatch = match[0];
        const matchIndex = match.index;
        const afterOpenTag = preRepaired.substring(matchIndex + openTagMatch.length);
        
        // Cek apakah ada closing tag setelah ini
        const closingTagRegex = new RegExp(`</${tagName}>`, 'i');
        closingTagRegex.lastIndex = 0;
        const nextClosingTag = closingTagRegex.exec(afterOpenTag);
        
        // Cek apakah ada tag struktur HTML (head, body, html) sebelum closing tag
        const structureTagRegex = /<\/?(head|body|html)\b/i;
        structureTagRegex.lastIndex = 0;
        const structureTagMatch = structureTagRegex.exec(afterOpenTag);
        
        // Jika tidak ada closing tag, atau ada tag struktur sebelum closing tag
        const needsClosing = !nextClosingTag || (structureTagMatch && structureTagMatch.index! < (nextClosingTag.index || Infinity));
        
        if (needsClosing) {
          // Tentukan posisi untuk menutup tag
          let insertPosition: number;
          
          if (structureTagMatch) {
            // Tutup tag SEBELUM tag struktur HTML
            insertPosition = matchIndex + openTagMatch.length + structureTagMatch.index!;
            log(`  Found unclosed <${tagName}> at index ${matchIndex}, structure tag found at ${structureTagMatch.index}, will close before it`);
          } else {
            // Tidak ada tag struktur, tutup di akhir content (cari tag berikutnya atau akhir)
            const nextTagMatch = afterOpenTag.match(/<\/?[a-z]/i);
            if (nextTagMatch) {
              insertPosition = matchIndex + openTagMatch.length + nextTagMatch.index!;
            } else {
              // Tidak ada tag berikutnya, tutup di akhir
              insertPosition = matchIndex + openTagMatch.length;
            }
            log(`  Found unclosed <${tagName}> at index ${matchIndex}, will close at ${insertPosition}`);
          }
          
          fixes.push({
            index: matchIndex,
            insertAfter: insertPosition,
            closingTag: `</${tagName}>`
          });
        }
      }
      
      // Apply fixes dari belakang ke depan untuk menjaga index
      fixes.sort((a, b) => b.insertAfter - a.insertAfter).forEach(fix => {
        preRepaired = preRepaired.substring(0, fix.insertAfter) + fix.closingTag + preRepaired.substring(fix.insertAfter);
        fixCount++;
        log(`  Applied fix: closed <${tagName}> at position ${fix.insertAfter}`);
      });
    };
    
    // Perbaiki <style> tags
    closeUnclosedTags('style', /<style\b[^>]*>/gi);
    
    // Perbaiki <script> tags
    closeUnclosedTags('script', /<script\b[^>]*>/gi);
    
    if (fixCount > 0) {
      log(`  Fixed ${fixCount} unclosed tags before DOMParser`);
    } else {
      log('  No unclosed <style> or <script> tags found');
    }
    
    // STEP 2: Gunakan DOMParser untuk perbaikan struktur
    log('STEP 2: Menggunakan DOMParser untuk perbaikan struktur...');
    const parser = new DOMParser();
    const doc = parser.parseFromString(preRepaired, 'text/html');
    
    log('DOMParser berhasil memparse HTML');
    
    // Cek apakah ada error parsing
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      const errorText = parserError.textContent || '';
      log('WARNING: DOMParser menemukan error:', errorText);
    } else {
      log('✓ DOMParser tidak menemukan error parsing');
    }
    
    // Deteksi struktur HTML asli
    const hasDoctype = /<!DOCTYPE/i.test(html);
    const hasHtmlTag = /<html\b/i.test(html);
    const hasHeadTag = /<head\b/i.test(html);
    const hasBodyTag = /<body\b/i.test(html);
    
    log('Struktur HTML asli:', { hasDoctype, hasHtmlTag, hasHeadTag, hasBodyTag });
    
    // Ambil content dari parsed document
    const headContent = doc.head.innerHTML;
    const bodyContent = doc.body.innerHTML;
    
    log('Head content panjang:', headContent.length);
    log('Body content panjang:', bodyContent.length);
    
    let repaired = '';
    
    // Rebuild HTML berdasarkan struktur asli
    if (hasDoctype || hasHtmlTag) {
      const doctype = hasDoctype ? (html.match(/<!DOCTYPE[^>]*>/i)?.[0] || '<!DOCTYPE html>') : '<!DOCTYPE html>';
      const htmlAttrs = html.match(/<html\b[^>]*>/i)?.[0]?.replace(/<html\s*/i, '') || '';
      const langAttr = htmlAttrs.match(/lang\s*=\s*["'][^"']*["']/i)?.[0] || '';
      
      repaired = `${doctype}\n<html${langAttr ? ' ' + langAttr : ''}>\n`;
      
      if (hasHeadTag || headContent.trim()) {
        repaired += `<head>${headContent}</head>\n`;
      }
      
      repaired += `<body>${bodyContent}</body>\n</html>`;
      
      log('Rebuilt HTML lengkap dengan struktur');
    } else {
      repaired = bodyContent;
      log('Menggunakan body content saja (fragment HTML)');
    }
    
    // STEP 3: Perbaikan tambahan untuk quote
    if (fixQuotes) {
      log('STEP 3: Memperbaiki quote di atribut...');
      const beforeQuotes = repaired;
      repaired = repaired.replace(/(\w+)\s*=\s*([^"'\s>\/=]+)(?=\s|>|\/)/g, (match, attr, value) => {
        if (value.startsWith('"') || value.startsWith("'") || value.includes('=') || value.includes('<') || value.includes('>')) {
          return match;
        }
        if (/^[a-zA-Z0-9\/\._-]+$/.test(value)) {
          return `${attr}="${value}"`;
        }
        return match;
      });
      if (beforeQuotes !== repaired) {
        log('  Quote tambahan diperbaiki');
      }
    }
    
    log('=== SELESAI PERBAIKAN DENGAN DOMParser ===');
    log('Panjang HTML akhir:', repaired.length);
    log('Perubahan:', repaired.length - html.length, 'karakter');
    log('HTML berubah:', repaired !== html);
    
    if (repaired === html) {
      log('⚠ WARNING: HTML tidak berubah setelah DOMParser!');
    } else {
      log('✓ HTML berhasil diubah oleh DOMParser');
    }
    
    return repaired;
  } catch (error: any) {
    log('ERROR di DOMParser:', error.message);
    console.error('[HTML Repair DOMParser] Error:', error);
    console.error('[HTML Repair DOMParser] Stack:', error.stack);
    throw error;
  }
}

