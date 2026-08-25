import { z } from 'zod';

export const memoryCognitionRememberSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      'The derived insight to store, as one self-contained third-person sentence, e.g. "The user prefers single-line if statements".',
    ),
  path: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe(
      'Optional profile facet this insight deepens, e.g. "likes.cars" — only when it deepens a stored profile value.',
    ),
});

export type MemoryCognitionRememberInput = z.infer<typeof memoryCognitionRememberSchema>;
