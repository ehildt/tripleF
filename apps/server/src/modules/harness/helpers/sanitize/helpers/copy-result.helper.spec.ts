import { describe, expect, it } from 'vitest';

import { copyResult } from './copy-result.helper.js';

describe('copyResult', () => {
  it('shallow-copies a result item', () => {
    const item = { a: 1, b: { c: 2 } };
    const copy = copyResult(item);
    expect(copy).toEqual(item);
    expect(copy).not.toBe(item);
  });
});
