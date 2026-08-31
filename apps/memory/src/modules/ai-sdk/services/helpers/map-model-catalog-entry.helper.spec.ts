import { describe, expect, it } from 'vitest';

import { mapModelCatalogEntry } from './map-model-catalog-entry.helper.js';

describe('mapModelCatalogEntry', () => {
  it('builds a catalog entry from a tagged model and show payload', () => {
    expect(
      mapModelCatalogEntry(
        { name: 'llama3', origin: 'local', details: { family: 'llama' } },
        {
          capabilities: ['vision'],
          model_info: { 'llama.context_length': 8192 },
          details: { parameter_size: '8B', quantization_level: 'Q4_0' },
        },
        8192,
      ),
    ).toEqual({
      model: 'llama3',
      origin: 'local',
      parameter_size: '8B',
      quantization_level: 'Q4_0',
      family: 'llama',
      capabilities: ['vision'],
      context_length: 8192,
    });
  });

  it('falls back to the show payload when the tag details are empty', () => {
    expect(
      mapModelCatalogEntry(
        { name: 'llama3', origin: 'cloud', details: {} },
        { details: { parameter_size: '8B' } },
        undefined,
      ),
    ).toMatchObject({
      parameter_size: '8B',
      quantization_level: undefined,
      capabilities: [],
      context_length: undefined,
    });
  });
});
