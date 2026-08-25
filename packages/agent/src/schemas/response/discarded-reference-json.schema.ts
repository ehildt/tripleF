import { z } from 'zod';

/**
 * A retrieved reference the model examined but discarded because it did not
 * match the uploaded image(s) — cloud reference images from imageSearch or
 * links that failed to corroborate. Rendered as an aside so the user can see
 * what was excluded and why.
 */
export const discardedReferenceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    imageUrl: z.string().min(1),
    title: z.string(),
    reason: z.string().min(1, { message: 'reason must not be empty' }),
  }),
  z.object({
    type: z.literal('link'),
    url: z.string().min(1),
    title: z.string(),
    reason: z.string().min(1, { message: 'reason must not be empty' }),
  }),
]);
