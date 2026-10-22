import { describe, expect, it } from 'vitest';

import { EncyclopediaConfigSchema } from './encyclopedia-config.schema.js';

describe('EncyclopediaConfigSchema', () => {
  it('accepts an empty config (all knobs optional)', () => {
    expect(EncyclopediaConfigSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a fully populated config', () => {
    const result = EncyclopediaConfigSchema.safeParse({
      selectEnabled: true,
      budgetChars: 48000,
      chunkChars: 1600,
      chunkOverlapSentences: 1,
      chunkByHeadings: false,
      maxHeadingDepth: 3,
      scoreThreshold: 0.25,
      maxChunks: 400,
      persistEnabled: true,
      ingestTriageEnabled: true,
      probeLimit: 3,
      neighborExpansion: 1,
      maxDocumentChars: 4_000_000,
      consolidateThreshold: 5,
      classifyModel: 'qwen3:4b',
      classifyThreshold: 3,
      hybridEnabled: true,
      hybridFusion: 'rrf',
      hybridDenseWeight: 1,
      hybridSparseWeight: 0.7,
      hybridSparseLimit: 200,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-boolean switch', () => {
    const result = EncyclopediaConfigSchema.safeParse({ selectEnabled: 'yes' });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes('selectEnabled')),
    ).toBe(true);
  });

  it.each([
    ['budgetChars', 999],
    ['budgetChars', 500_001],
    ['chunkChars', 199],
    ['chunkChars', 8001],
    ['chunkOverlapSentences', -1],
    ['chunkOverlapSentences', 4],
    ['maxHeadingDepth', 0],
    ['maxHeadingDepth', 7],
    ['scoreThreshold', -0.1],
    ['scoreThreshold', 1.1],
    ['maxChunks', 15],
    ['maxChunks', 4001],
    ['probeLimit', 0],
    ['probeLimit', 21],
    ['neighborExpansion', -1],
    ['neighborExpansion', 4],
    ['maxDocumentChars', 99_999],
    ['consolidateThreshold', 0],
    ['hybridSparseLimit', 0],
    ['hybridSparseLimit', 1001],
  ])('rejects %s %s (out of bounds)', (field, value) => {
    const result = EncyclopediaConfigSchema.safeParse({ [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes(field))).toBe(true);
  });

  it('rejects an unknown hybrid fusion method', () => {
    const result = EncyclopediaConfigSchema.safeParse({
      hybridFusion: 'weighted',
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes('hybridFusion')),
    ).toBe(true);
  });

  it('accepts the fuse list bounds', () => {
    const boundsResult = EncyclopediaConfigSchema.safeParse({
      budgetChars: 1000,
      chunkChars: 8000,
      chunkOverlapSentences: 3,
      maxHeadingDepth: 6,
      scoreThreshold: 1,
      maxChunks: 4000,
      probeLimit: 20,
      neighborExpansion: 3,
      maxDocumentChars: 100_000,
      consolidateThreshold: 1,
      hybridSparseLimit: 1000,
      hybridFusion: 'dbsf',
    });
    expect(boundsResult.success).toBe(true);
  });
});
