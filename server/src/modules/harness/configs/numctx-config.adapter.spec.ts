import { describe, expect, it } from 'vitest';

import { NumCtxConfigAdapter } from './numctx-config.adapter.js';

describe('NumCtxConfigAdapter', () => {
  it('returns the default ladder when NUM_CTX is unset', () => {
    expect(NumCtxConfigAdapter({})).toEqual([
      32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 5242880,
    ]);
  });

  it('parses a comma-separated list', () => {
    expect(NumCtxConfigAdapter({ NUM_CTX: '4096, 8192, 16384' })).toEqual([
      4096, 8192, 16384,
    ]);
  });

  it('filters out invalid and non-positive values', () => {
    expect(NumCtxConfigAdapter({ NUM_CTX: '4096,abc,0,-5,8192' })).toEqual([
      4096, 8192,
    ]);
  });
});
