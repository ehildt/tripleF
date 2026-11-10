import { z } from 'zod';

export const navSchema = z.object({
  chat: z.string(),
  memory: z.string(),
  dlq: z.string(),
  debug: z.string(),
  settings: z.string(),
});

export type NavMessages = z.infer<typeof navSchema>;
