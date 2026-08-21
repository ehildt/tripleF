import { z } from 'zod';

export const memoryDeleteSchema = z.object({
  text: z
    .string()
    .min(3)
    .max(2000)
    .optional()
    .describe(
      'The exact stored statement to delete, quoted verbatim from a memoryRecall result. Record texts are the record identity — no ids needed. Never paraphrase: recall first, then delete the exact text.',
    ),
  cognition: z
    .boolean()
    .optional()
    .describe(
      'Set true ONLY when the user asks you to forget your accumulated understanding of them (the cognition profile — your derived model of their traits, likes and dislikes) or to start over entirely. Cannot be combined with text.',
    ),
});

export type MemoryDeleteInput = z.infer<typeof memoryDeleteSchema>;
