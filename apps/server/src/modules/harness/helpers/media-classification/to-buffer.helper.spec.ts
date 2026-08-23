import { describe, expect, it } from 'vitest';

import { toBuffer } from './to-buffer.helper.js';

describe('toBuffer', () => {
  it('returns a Buffer unchanged', () => {
    const buf = Buffer.from('hi');
    expect(toBuffer(buf)).toBe(buf);
  });

  it('converts an ArrayBuffer', () => {
    const ab = new TextEncoder().encode('hi').buffer;
    expect(toBuffer(ab)).toEqual(Buffer.from('hi'));
  });

  it('converts a typed array view', () => {
    const view = new Uint8Array([1, 2, 3]);
    expect(toBuffer(view)).toEqual(Buffer.from([1, 2, 3]));
  });

  it('converts a string', () => {
    expect(toBuffer('hello')).toEqual(Buffer.from('hello'));
  });

  it('returns undefined for unsupported data', () => {
    expect(toBuffer(123)).toBe(undefined);
    expect(toBuffer(null)).toBe(undefined);
  });
});
