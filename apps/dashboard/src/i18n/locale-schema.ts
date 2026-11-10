import { z } from 'zod';

import { activitySchema } from './schemas/activity.schema';
import { appSchema } from './schemas/app.schema';
import { capabilitiesSchema } from './schemas/capabilities.schema';
import { chatSchema } from './schemas/chat.schema';
import { commonSchema } from './schemas/common.schema';
import { navSchema } from './schemas/nav.schema';
import { toastSchema } from './schemas/toast.schema';

/**
 * Zod schema for all translation keys. Every locale is validated against this
 * at import time (locale-registry) and by the en-first test.
 */
export const localeSchema = z.object({
  languageCode: z.string(),
  countryCode: z.string(),
  app: appSchema,
  nav: navSchema,
  common: commonSchema,
  capabilities: capabilitiesSchema.optional(),
  chat: chatSchema,
  toast: toastSchema.optional(),
  activity: activitySchema,
});

export type LocaleMessages = z.infer<typeof localeSchema>;
