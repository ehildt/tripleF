import { describe, expect, it } from 'vitest';

import { hashNodeId } from './hash-node-id.helper';

describe('hashNodeId', () => {
  it('returns a number for any string', () => {
    expect(typeof hashNodeId('abc')).toBe('number');
  });

  it('is deterministic for the same input', () => {
    expect(hashNodeId('fact-1')).toBe(hashNodeId('fact-1'));
  });

  it('returns 0 for the empty string', () => {
    expect(hashNodeId('')).toBe(0);
  });
});
