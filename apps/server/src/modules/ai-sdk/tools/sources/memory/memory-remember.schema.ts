import { z } from 'zod';

export const memoryRememberSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      'The fact to remember, as a self-contained statement, e.g. "Sams phone number is 555-1234".',
    ),
  tags: z
    .array(z.string().min(1).max(40))
    .max(8)
    .optional()
    .describe(
      'Optional topic labels (lowercase, reusable) so future recall can filter by topic, e.g. ["contacts", "sam"].',
    ),
});

export type MemoryRememberInput = z.infer<typeof memoryRememberSchema>;
