import { describe, expect, it } from 'vitest';

import { resolveNumCtxForModel } from './resolve-num-ctx-for-model.helper';

describe('resolveNumCtxForModel', () => {
  it('clamps a value above the context window to the max option', () => {
    expect(resolveNumCtxForModel(9000, 8192, '8192')).toEqual({
      numCtx: '8192',
      wasClamped: true,
    });
  });

  it('applies the max option when the value fits', () => {
    expect(resolveNumCtxForModel(4096, 8192, '8192')).toEqual({
      numCtx: '8192',
      wasClamped: false,
    });
  });

  it('leaves the value untouched when there is no max option', () => {
    expect(resolveNumCtxForModel(4096, 8192, '')).toEqual({
      numCtx: null,
      wasClamped: false,
    });
  });
});
