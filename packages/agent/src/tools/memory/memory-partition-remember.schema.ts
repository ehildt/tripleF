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
    .describe(
      'One broad lowercase PLURAL category the fact belongs to, e.g. "stocks", "games", "pets", "work" — the CLUSTER tier: a family noun, never a specific entity/product/company/game name ("amd" → "stocks"; "stellar blade" → "games"). Persona/roleplay or fictional content classifies by its real-world medium (a TV persona’s biography → "shows"), never by in-universe domains ("family", "education", "business" describe reality, not an invented life). Always include it.',
    ),
  community: z
    .string()
    .min(1)
    .max(60)
    .describe(
      'One lowercase PLURAL sub-family narrowing the category, e.g. "survival games" under "games", "tv shows" under "shows" — the COMMUNITY tier, one level below the cluster (a genre, project family, or domain branch). Always present; never a specific entity, product, or title — a show/work title like "breaking-bad" is a hub, never a community.',
    ),
  subject: z
    .string()
    .min(1)
    .max(40)
    .describe(
      'The lowercase SINGULAR entity the fact is about — the HUB tier, e.g. "project zomboid", "amd", "sam". Name it whenever the fact is about a specific entity; never a plural family label.',
    ),
  node: z
    .string()
    .min(1)
    .max(120)
    .describe(
      'The lowercase SINGULAR aspect the fact addresses under its hub — the NODE tier, e.g. "base building" under "project zomboid", "ryzen 9950x3d" under "amd". Reuse existing labels whenever they fit; never pluralized, never a sentence.',
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
