import { z } from 'zod';

export const memoryPartitionDeleteSchema = z.object({
  text: z
    .string()
    .min(3)
    .max(2000)
    .describe(
      'The exact stored statement to delete, quoted verbatim from a memory-partition-recall result. Record texts are the record identity — no ids needed. Never paraphrase: recall first, then delete the exact text.',
    ),
});

export type MemoryPartitionDeleteInput = z.infer<typeof memoryPartitionDeleteSchema>;
