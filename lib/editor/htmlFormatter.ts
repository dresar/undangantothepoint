/**
 * HTML Formatter - Format dan rapikan HTML (IMPROVED - tidak merusak HTML)
 */

export interface FormatOptions {
  indentSize?: number;
  indentChar?: string;
  wrapAttributes?: boolean;
  maxLineLength?: number;
  preserveComments?: boolean;
  removeEmptyLines?: boolean;
  sortAttributes?: boolean;
  lowercaseTags?: boolean;
  lowercaseAttributes?: boolean;
}

export function formatHtml(html: string, options: FormatOptions = {}): string {
  const {
    indentSize = 2,
    indentChar = ' ',
    preserveComments = false,
    removeEmptyLines = true,
  } = options;

  let formatted = html;

  // Preserve script and style content - don't format inside them
  const scriptMatches: Array<{ content: string; placeholder: string }> = [];
  const styleMatches: Array<{ content: string; placeholder: string }> = [];
  
  // Extract script tags
  formatted = formatted.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
    const placeholder = `__SCRIPT_PLACEHOLDER_${scriptMatches.length}__`;
    scriptMatches.push({ content: match, placeholder });
    return placeholder;
  });

  // Extract style tags
  formatted = formatted.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, content) => {
    const placeholder = `__STYLE_PLACEHOLDER_${styleMatches.length}__`;
    styleMatches.push({ content: match, placeholder });
    return placeholder;
  });

  // Remove comments if needed
  if (!preserveComments) {
    formatted = formatted.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Normalize line breaks
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines and process
  const lines: string[] = [];
  let indentLevel = 0;
  const stack: string[] = [];

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!removeEmptyLines) {
        lines.push('');
      }
      return;
    }

    // Check for closing tags
    if (trimmed.startsWith('</')) {
      const tagMatch = trimmed.match(/<\/(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        // Find matching opening tag
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i] === tagName) {
            stack.splice(i, 1);
            break;
          }
        }
        indentLevel = Math.max(0, indentLevel - 1);
      }
      lines.push(indentChar.repeat(indentLevel * indentSize) + trimmed);
    } else if (trimmed.startsWith('<!')) {
      // DOCTYPE or other declarations
      lines.push(trimmed);
    } else if (trimmed.startsWith('<')) {
      // Opening tag
      const tagMatch = trimmed.match(/<(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        const noIndent = ['html', 'head', 'body', 'script', 'style'];
        
        lines.push(indentChar.repeat(indentLevel * indentSize) + trimmed);
        
        if (!selfClosing.includes(tagName) && !trimmed.endsWith('/>')) {
          if (!noIndent.includes(tagName)) {
            indentLevel++;
          }
          stack.push(tagName);
        }
      } else {
        lines.push(indentChar.repeat(indentLevel * indentSize) + trimmed);
      }
    } else {
      // Text content
      lines.push(indentChar.repeat(indentLevel * indentSize) + trimmed);
    }
  };

  // Split by lines and process
  const htmlLines = formatted.split('\n');
  for (const line of htmlLines) {
    processLine(line);
  }

  formatted = lines.join('\n');

  // Restore script tags
  scriptMatches.forEach(({ content, placeholder }) => {
    formatted = formatted.replace(placeholder, content);
  });

  // Restore style tags
  styleMatches.forEach(({ content, placeholder }) => {
    formatted = formatted.replace(placeholder, content);
  });

  return formatted;
}
