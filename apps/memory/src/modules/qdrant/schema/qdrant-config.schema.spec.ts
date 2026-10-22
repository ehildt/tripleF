import { describe, expect, it } from 'vitest';

import { QdrantConfigSchema } from './qdrant-config.schema.js';

describe('QdrantConfigSchema', () => {
  it('accepts an empty config (all knobs optional)', () => {
    expect(QdrantConfigSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a fully populated config', () => {
    const result = QdrantConfigSchema.safeParse({
      url: 'http://localhost:6333',
      apiKey: 'key',
      collection: 'memory',
      encyclopediaCollection: 'encyclopedia',
      vectorSize: 1024,
      embedModel: 'nomic-embed-text',
      scoreThreshold: 0.4,
      embedTimeoutMs: 60_000,
      enabled: true,
      cognitionLimit: 4000,
      constellationNodeLimit: 100,
      consolidateThreshold: 5,
      consolidateModel: 'qwen3:4b',
      reflectModel: 'qwen3:4b',
      reflectBatchLimit: 8,
      reflectMaxCandidates: 40,
      partitionReflectAutoEnabled: true,
      cognitionReflectAutoEnabled: true,
      encyclopediaReflectAutoEnabled: true,
      convictionModel: 'qwen3:4b',
      convictionBatchLimit: 8,
      convictionMaxPerCluster: 4,
      convictionAutoEnabled: true,
      clusterModel: 'qwen3:4b',
      clusterMinMembers: 2,
      clusterAutoEnabled: true,
      raptorEnabled: true,
      heatTrackingEnabled: true,
      raptorMaxDepth: 3,
      episodeRecencyWeight: 0.3,
      episodeRecencyScaleSeconds: 604800,
      episodeRecencyMidpoint: 0.4,
      episodeProbeLimit: 3,
      episodeScoreThreshold: 0.3,
      profilePayloadRatio: 0.3,
      profilePayloadChars: 12000,
      vectorizeTextRatio: 0.03,
      vectorizeTextChars: 3000,
      linkNeighbors: 3,
      linkScoreThreshold: 0.75,
      linkTopicalThreshold: 0.65,
      linkBackfillMaxPoints: 5000,
      linkReadMax: 500,
      hybridEnabled: true,
      hybridFusion: 'rrf',
      hybridDenseWeight: 1,
      hybridSparseWeight: 0.7,
      hybridSparseLimit: 200,
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['enabled', 'yes'],
    ['url', 'not a url'],
    ['vectorSize', 0],
    ['scoreThreshold', -0.1],
    ['scoreThreshold', 1.1],
    ['embedTimeoutMs', 999],
    ['hybridFusion', 'weighted'],
    ['hybridSparseLimit', 0],
    ['hybridSparseLimit', 1001],
    ['episodeScoreThreshold', 2],
    ['linkBackfillMaxPoints', 99],
    ['linkBackfillMaxPoints', 50_001],
    ['linkNeighbors', 11],
    ['linkReadMax', 99],
  ])('rejects %s %s', (field, value) => {
    const result = QdrantConfigSchema.safeParse({ [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes(field))).toBe(true);
  });
});
