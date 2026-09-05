import { z } from 'zod';

export const encyclopediaReadSchema = z.object({
  url: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      'The exact url of the document to read — taken from an encyclopedia-search result (uploaded documents included).',
    ),
  startChunk: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      'Chunk index to start reading from (default 0). To continue a previous read, pass the next chunk index named in its footer.',
    ),
  maxChars: z
    .number()
    .int()
    .min(1000)
    .max(48000)
    .optional()
    .describe('Maximum chars of content to return for this read (default 12000).'),
});

export type EncyclopediaReadToolInput = z.infer<typeof encyclopediaReadSchema>;
