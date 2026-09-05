import { z } from 'zod';

export const encyclopediaSearchSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(1000)
    .describe(
      'What to look up in the knowledge base, as a natural-language question or keywords, e.g. "receipt hardware store march" or "graphrag retriever patterns".',
    ),
  topK: z.number().int().min(1).max(10).optional().describe('Maximum number of passages to return (default 5).'),
  url: z
    .string()
    .min(1)
    .max(2000)
    .optional()
    .describe(
      'Restrict the search to ONE document — pass the exact url of a previous knowledge-base result to search only within that document\u2019s embeddings.',
    ),
  domain: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe('Restrict the search to one source domain, e.g. "reddit.com".'),
});

export type EncyclopediaSearchToolInput = z.infer<typeof encyclopediaSearchSchema>;
