import { describe, expect, it } from 'vitest';

import { buildCollectionName } from './collection-name.helper.js';

describe('buildCollectionName', () => {
  it('namespaces the base with the model slug', () => {
    expect(
      buildCollectionName('harness_memory', 'nomic-embed-text-v2-moe'),
    ).toBe('harness_memory_nomic-embed-text-v2-moe');
  });

  it('sanitizes characters Qdrant forbids', () => {
    expect(
      buildCollectionName(
        'harness_memory',
        'toshk0/nomic-embed-text-v2-moe:Q6_K',
      ),
    ).toBe('harness_memory_toshk0_nomic-embed-text-v2-moe_q6_k');
  });

  it('keeps allowed separators and lowercases the model', () => {
    expect(buildCollectionName('mem', 'Nomic-Embed-Text')).toBe(
      'mem_nomic-embed-text',
    );
  });

  it('caps the slug length', () => {
    const long = buildCollectionName('mem', 'a'.repeat(200));
    expect(long.length).toBeLessThanOrEqual('mem_'.length + 60);
  });

  it('falls back to the base when the model is empty', () => {
    expect(buildCollectionName('harness_memory', '')).toBe('harness_memory');
    expect(buildCollectionName('harness_memory', '///')).toBe('harness_memory');
  });
});
