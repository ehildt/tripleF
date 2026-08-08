import { z } from 'zod';

/**
 * The `{ text }` array entry shared by key-points/key-findings/strengths/
 * weaknesses/recommendations. The field name lands in the error message so
 * the model can pinpoint the broken array on a validation retry.
 */
export function createTextItemSchema(fieldName: string) {
  return z.object(
    {
      text: z.string().min(1, {
        message: `${fieldName} entries must have a non-empty text field`,
      }),
    },
    { message: `${fieldName} entries must be objects with text` },
  );
}
