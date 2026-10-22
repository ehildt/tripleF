import { z } from 'zod';

/**
 * Web-search result count for the research provider. Capped at the top 3:
 * ranking quality decays sharply past the top 3 and deeper SERP links can
 * arrive as unresolved google.com/goto wrappers.
 */
const providerEndpointSchema = z
  .strictObject({
    enabled: z.boolean().optional(),
    results: z.number().int().min(1).max(3).optional(),
  })
  .optional();

export const ResearchConfigSchema = z.strictObject({
  enabled: z.boolean().optional(),
  searchEnabled: z.boolean().optional(),
  provider: z.enum(['serper', 'bright-data']).optional(),
  model: z.string().optional(),
  gapLimit: z.number().int().min(1).max(50).optional(),
  maxDepth: z.number().int().min(1).max(3).optional(),
  fetchBudget: z.number().int().min(1).max(20).optional(),
  frictionLimit: z.number().int().min(1).max(20).optional(),
  serper: z
    .strictObject({
      enabled: z.boolean().optional(),
      apiKey: z.string().optional(),
      web: providerEndpointSchema,
    })
    .optional(),
  brightData: z
    .strictObject({
      enabled: z.boolean().optional(),
      apiKey: z.string().optional(),
      serpZone: z.string().optional(),
      web: providerEndpointSchema,
    })
    .optional(),
});
