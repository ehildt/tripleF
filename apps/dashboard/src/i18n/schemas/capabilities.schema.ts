import { z } from 'zod';

export const capabilitiesSchema = z.object({
  vision: z.string(),
  audio: z.string(),
  tools: z.string(),
  thinking: z.string(),
  completion: z.string(),
  embedding: z.string(),
});

export type CapabilitiesMessages = z.infer<typeof capabilitiesSchema>;
