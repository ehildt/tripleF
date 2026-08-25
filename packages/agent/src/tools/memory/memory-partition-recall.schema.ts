import { z } from 'zod';

export const memoryPartitionRecallSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(1000)
    .describe('What to recall as a natural-language question, e.g. "What is Sams phone number?"'),
  tags: z
    .array(z.string().min(1).max(40))
    .max(8)
    .optional()
    .describe('Restrict to records tagged with ANY of these topics, e.g. ["work"].'),
  contains: z
    .string()
    .max(200)
    .optional()
    .describe('Restrict to records whose text contains this exact phrase, e.g. "phone number".'),
  topK: z.number().int().min(1).max(10).optional().describe('Maximum number of results to return (default 5).'),
});

export type MemoryPartitionRecallInput = z.infer<typeof memoryPartitionRecallSchema>;
