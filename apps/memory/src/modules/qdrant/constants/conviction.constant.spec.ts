import { describe, expect, it } from 'vitest';

import {
  clampConvictionBatchLimit,
  clampConvictionMaxPerCluster,
} from './conviction.constant.js';

describe('conviction constants', () => {
  it('clamps the batch limit into 1–500', () => {
    expect(clampConvictionBatchLimit(0)).toBe(1);
    expect(clampConvictionBatchLimit(100)).toBe(100);
    expect(clampConvictionBatchLimit(10000)).toBe(500);
    expect(clampConvictionBatchLimit(Number.NaN)).toBe(100);
  });

  it('clamps the per-cluster cap into 1–1000', () => {
    expect(clampConvictionMaxPerCluster(0)).toBe(1);
    expect(clampConvictionMaxPerCluster(5)).toBe(5);
    expect(clampConvictionMaxPerCluster(1000)).toBe(1000);
    expect(clampConvictionMaxPerCluster(100000)).toBe(1000);
    expect(clampConvictionMaxPerCluster(Number.NaN)).toBe(5);
  });
});
