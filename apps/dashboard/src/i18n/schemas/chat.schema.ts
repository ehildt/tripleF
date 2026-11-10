import { z } from 'zod';

export const chatSchema = z.object({
  noConversationTitle: z.string(),
  selectModelFirst: z.string(),
  selectModelPlaceholder: z.string(),
  createOrPickChat: z.string(),
  startTalking: z.string(),
});

export type ChatMessages = z.infer<typeof chatSchema>;
