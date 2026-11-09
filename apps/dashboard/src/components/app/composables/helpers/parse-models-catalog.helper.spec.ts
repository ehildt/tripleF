import { describe, expect, it } from 'vitest';

import { parseModelsCatalog } from './parse-models-catalog.helper';

describe('parseModelsCatalog', () => {
  it('returns a validated catalog', () => {
    const catalog = parseModelsCatalog({
      models: [
        {
          model: 'llama',
          origin: 'local',
          capabilities: ['completion'],
          context_length: 4096,
        },
      ],
      numCtxOptions: [2048, 4096],
    });

    expect(catalog.models[0]).toMatchObject({
      model: 'llama',
      context_length: 4096,
    });
    expect(catalog.numCtxOptions).toEqual([2048, 4096]);
  });

  it('preserves missing-list defaults', () => {
    expect(parseModelsCatalog({})).toEqual({ models: [], numCtxOptions: [] });
  });

  it.each([null, [], 'invalid'])('rejects invalid payload %s', (payload) => {
    expect(() => parseModelsCatalog(payload)).toThrow(
      'Invalid models catalog payload',
    );
  });

  it.each([
    { models: [{ model: 42 }] },
    { models: [{ model: 'llama', origin: 'invalid' }] },
    { models: [{ model: 'llama', capabilities: 'completion' }] },
    { numCtxOptions: [Number.POSITIVE_INFINITY] },
  ])('rejects malformed catalog fields', (payload) => {
    expect(() => parseModelsCatalog(payload)).toThrow(
      'Invalid models catalog payload',
    );
  });
});
