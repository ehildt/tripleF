import { z } from 'zod';

export const EncyclopediaConfigSchema = z.strictObject({
  selectEnabled: z.boolean().optional(),
  budgetChars: z.number().int().min(1000).max(500_000).optional(),
  chunkChars: z.number().int().min(200).max(8000).optional(),
  chunkOverlapSentences: z.number().int().min(0).max(3).optional(),
  chunkByHeadings: z.boolean().optional(),
  maxHeadingDepth: z.number().int().min(1).max(6).optional(),
  scoreThreshold: z.number().min(0).max(1).optional(),
  maxChunks: z.number().int().min(16).max(4000).optional(),
  persistEnabled: z.boolean().optional(),
  ingestTriageEnabled: z.boolean().optional(),
  probeLimit: z.number().int().min(1).max(20).optional(),
  neighborExpansion: z.number().int().min(0).max(3).optional(),
  maxDocumentChars: z.number().int().min(100_000).max(16_000_000).optional(),
  consolidateThreshold: z.number().int().min(1).optional(),
  classifyModel: z.string().optional(),
  classifyThreshold: z.number().int().min(1).optional(),
  // Hybrid retrieval (dense + sparse fused): enable switch, fusion method,
  // RRF leg weights, and the sparse prefetch depth.
  hybridEnabled: z.boolean().optional(),
  hybridFusion: z.enum(['rrf', 'dbsf']).optional(),
  hybridDenseWeight: z.number().min(0).optional(),
  hybridSparseWeight: z.number().min(0).optional(),
  hybridSparseLimit: z.number().int().min(1).max(1000).optional(),
});
