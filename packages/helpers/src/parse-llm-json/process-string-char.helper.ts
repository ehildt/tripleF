/**
 * Process a single character inside a JSON string literal.
 * Returns the escaped form if it is a control character, otherwise char itself.
 */
export function processStringChar(ch: string, code: number): string {
  switch (ch) {
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\t':
      return '\\t';
    default:
      if (code < 0x20) {
        return `\\u${code.toString(16).padStart(4, '0')}`;
      }
      return ch;
  }
}
