import { describe, expect, it } from 'vitest';

import { extractPlaces } from './extract-places.helper.js';

const tool = (toolName: string, results: unknown[]) => ({
  toolName,
  result: { results },
});

describe('extractPlaces', () => {
  it('extracts places from PlacesSearch results', () => {
    const result = extractPlaces([
      tool('serperPlacesSearch', [
        { title: 'Cafe', address: 'Main St', rating: 4 },
      ]),
    ]);
    expect(result).toEqual([{ title: 'Cafe', address: 'Main St', rating: 4 }]);
  });

  it('ignores non-places tools', () => {
    const result = extractPlaces([
      tool('serperWebSearch', [{ title: 'Cafe', address: 'Main St' }]),
    ]);
    expect(result).toEqual([]);
  });

  it('dedupes by title and address', () => {
    const result = extractPlaces([
      tool('serperPlacesSearch', [
        { title: 'Cafe', address: 'Main St' },
        { title: 'Cafe', address: 'Main St' },
      ]),
    ]);
    expect(result).toHaveLength(1);
  });

  it('drops places without a title', () => {
    const result = extractPlaces([
      tool('serperPlacesSearch', [{ address: 'Main St' }]),
    ]);
    expect(result).toEqual([]);
  });
});
