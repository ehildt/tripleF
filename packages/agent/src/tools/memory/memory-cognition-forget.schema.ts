import { z } from 'zod';

/**
 * The forget tool carries no arguments: invoking it IS the instruction to
 * wipe the cognition space. The intent classifier gates when it is offered.
 */
export const memoryCognitionForgetSchema = z.object({});

export type MemoryCognitionForgetInput = z.infer<typeof memoryCognitionForgetSchema>;
