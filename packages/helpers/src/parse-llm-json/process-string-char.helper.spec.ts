import { processStringChar } from './process-string-char.helper.ts';

describe('processStringChar', () => {
  it('escapes newline', () => {
    expect(processStringChar('\n', 0x0a)).toBe('\\n');
  });

  it('escapes carriage return', () => {
    expect(processStringChar('\r', 0x0d)).toBe('\\r');
  });

  it('escapes tab', () => {
    expect(processStringChar('\t', 0x09)).toBe('\\t');
  });

  it('escapes other control characters as unicode', () => {
    expect(processStringChar('\u0007', 0x07)).toBe('\\u0007');
  });

  it('passes through normal characters', () => {
    expect(processStringChar('a', 0x61)).toBe('a');
  });
});
