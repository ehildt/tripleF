import { z } from 'zod';

export const memoryPartitionRememberSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(2000)
    .describe('The fact to remember, as a self-contained statement, e.g. "Sams phone number is 555-1234".'),
  category: z
    .string()
    .min(1)
    .max(40)
    .optional()
    .describe(
      'One broad lowercase PLURAL category the fact belongs to, e.g. "stocks", "games", "pets", "work" — a family noun, never a specific entity/product/company/game name ("amd" → "stocks"; "stellar blade" → "games"). Always include it.',
    ),
  tags: z
    .array(z.string().min(1).max(40))
    .max(8)
    .optional()
    .describe(
      'Optional topic labels (lowercase, reusable, NARROW — entity/product/game names) so future recall can filter by topic, e.g. ["contacts", "sam"], ["amd"], ["stellar blade"].',
    ),
});

export type MemoryPartitionRememberInput = z.infer<typeof memoryPartitionRememberSchema>;
