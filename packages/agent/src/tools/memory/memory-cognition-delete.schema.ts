import { z } from 'zod';

/**
 * Targeted cognition delete — one verbatim insight record and/or one profile
 * routing topic. No `refine`: both-optional keeps the JSON-schema shape
 * simple, and the tool's execute answers the both-missing call with an
 * honest error envelope instead of throwing.
 */
export const memoryCognitionDeleteSchema = z.object({
  text: z
    .string()
    .min(3)
    .max(2000)
    .optional()
    .describe(
      'The exact stored insight to delete, quoted verbatim from your injected cognition context (the probed insights block). Record texts are the record identity — no ids needed. Never paraphrase.',
    ),
  path: z
    .string()
    .min(3)
    .max(200)
    .optional()
    .describe(
      'One profile routing path ("field.keyword", e.g. "likes.jazz") to prune a standing topic from the structured profile document. Array facets (likes, dislikes, interests, goals, expertise, convictions) drop the matching value; record facets (preferences, corrections) drop the matching key.',
    ),
});

export type MemoryCognitionDeleteInput = z.infer<typeof memoryCognitionDeleteSchema>;
