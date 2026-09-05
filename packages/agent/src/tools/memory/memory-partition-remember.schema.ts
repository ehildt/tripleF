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
      'One broad lowercase PLURAL category the fact belongs to, e.g. "stocks", "games", "pets", "work" — the CLUSTER tier: a family noun, never a specific entity/product/company/game name ("amd" → "stocks"; "stellar blade" → "games"). Always include it.',
    ),
  community: z
    .string()
    .min(1)
    .max(60)
    .optional()
    .describe(
      'One lowercase PLURAL sub-family narrowing the category, e.g. "survival games" under "games" — the COMMUNITY tier, one level below the cluster (a genre, project family, or domain branch). Omit it when no sub-family applies; never a specific entity, product, or title.',
    ),
  subject: z
    .string()
    .min(1)
    .max(40)
    .optional()
    .describe(
      'The lowercase SINGULAR entity the fact is about — the HUB tier, e.g. "project zomboid", "amd", "sam". Name it whenever the fact is about a specific entity; never a plural family label.',
    ),
  icon: z
    .string()
    .min(1)
    .max(64)
    .optional()
    .describe(
      'Lucide icon name for a label you are CREATING in this call (attached to the deepest NEW label: subject first, then community, then category). Only from the curated taxonomy icon set (e.g. "gamepad-2", "book-open", "paw-print"); omit entirely when you adopt existing labels or no icon fits.',
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
