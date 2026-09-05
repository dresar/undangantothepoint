/**
 * HTML Beautifier - Format HTML dengan indentation yang rapi
 */

export interface BeautifyOptions {
  indentSize?: number;
  indentChar?: string;
  wrapLineLength?: number;
  preserveNewlines?: boolean;
  indentScripts?: boolean;
  indentStyles?: boolean;
}

export function beautifyHtml(html: string, options: BeautifyOptions = {}): string {
  const {
    indentSize = 2,
    indentChar = ' ',
    wrapLineLength = 120,
    preserveNewlines = false,
    indentScripts = true,
    indentStyles = true,
  } = options;

  let beautified = html;

  // Normalize whitespace first
  if (!preserveNewlines) {
    beautified = beautified.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // Remove extra whitespace
  beautified = beautified.replace(/\s+/g, ' ');

  // Split into lines and process
  const lines: string[] = [];
  let indentLevel = 0;
  let inScript = false;
  let inStyle = false;
  let scriptContent = '';
  let styleContent = '';

  const tokens = beautified.match(/<[^>]+>|[^<]+/g) || [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.startsWith('<script')) {
      inScript = true;
      scriptContent = token;
      if (indentScripts) {
        lines.push(indentChar.repeat(indentLevel * indentSize) + token);
        indentLevel++;
      } else {
        lines.push(indentChar.repeat(indentLevel * indentSize) + token);
      }
    } else if (token.startsWith('</script>')) {
      if (indentScripts && scriptContent) {
        lines.push(scriptContent);
      }
      inScript = false;
      if (indentScripts) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      lines.push(indentChar.repeat(indentLevel * indentSize) + token);
      scriptContent = '';
    } else if (token.startsWith('<style')) {
      inStyle = true;
      styleContent = token;
      if (indentStyles) {
        lines.push(indentChar.repeat(indentLevel * indentSize) + token);
        indentLevel++;
      } else {
        lines.push(indentChar.repeat(indentLevel * indentSize) + token);
      }
    } else if (token.startsWith('</style>')) {
      if (indentStyles && styleContent) {
        lines.push(styleContent);
      }
      inStyle = false;
      if (indentStyles) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      lines.push(indentChar.repeat(indentLevel * indentSize) + token);
      styleContent = '';
    } else if (inScript || inStyle) {
      if (inScript) {
        scriptContent += token;
      } else {
        styleContent += token;
      }
    } else if (token.startsWith('</')) {
      // Closing tag
      indentLevel = Math.max(0, indentLevel - 1);
      lines.push(indentChar.repeat(indentLevel * indentSize) + token);
    } else if (token.startsWith('<')) {
      // Opening tag
      const isSelfClosing = token.endsWith('/>') || /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i.test(token);
      lines.push(indentChar.repeat(indentLevel * indentSize) + token);
      if (!isSelfClosing && !token.match(/<(script|style|textarea)/i)) {
        indentLevel++;
      }
    } else {
      // Text content
      const text = token.trim();
      if (text) {
        lines.push(indentChar.repeat(indentLevel * indentSize) + text);
      }
    }
  }

  return lines.join('\n');
}

