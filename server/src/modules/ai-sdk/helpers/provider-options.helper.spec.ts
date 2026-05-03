import { describe, expect, it } from 'vitest';

import { buildProviderOptions } from './provider-options.helper.js';

describe('buildProviderOptions', () => {
  it('returns an empty object when no options are provided', () => {
    expect(buildProviderOptions()).toEqual({});
  });

  it('returns an empty object when all options are undefined', () => {
    expect(buildProviderOptions({})).toEqual({});
  });

  it('maps think false to boolean false', () => {
    expect(buildProviderOptions({ think: false })).toEqual({
      ollama: { think: false },
    });
  });

  it('maps any truthy think value to boolean true', () => {
    expect(buildProviderOptions({ think: true })).toEqual({
      ollama: { think: true },
    });
    expect(buildProviderOptions({ think: 'low' })).toEqual({
      ollama: { think: true },
    });
    expect(buildProviderOptions({ think: 'medium' })).toEqual({
      ollama: { think: true },
    });
    expect(buildProviderOptions({ think: 'high' })).toEqual({
      ollama: { think: true },
    });
  });

  it('includes num_ctx under the ollama options key', () => {
    expect(buildProviderOptions({ numCtx: 32000 })).toEqual({
      ollama: { options: { num_ctx: 32000 } },
    });
  });

  it('combines think and num_ctx', () => {
    expect(buildProviderOptions({ think: 'high', numCtx: 64000 })).toEqual({
      ollama: {
        think: true,
        options: { num_ctx: 64000 },
      },
    });
  });

  it('ignores keepAlive because it is not yet supported', () => {
    expect(buildProviderOptions({ keepAlive: '5m' })).toEqual({});
  });
});
