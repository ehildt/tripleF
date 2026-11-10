import { z } from 'zod';

import { commonChatSchema } from './common/chat.schema';
import { commonDebugSchema } from './common/debug.schema';
import { commonDlqSchema } from './common/dlq.schema';
import { commonMediaSchema } from './common/media.schema';
import { commonMemorySchema } from './common/memory.schema';
import { commonSettingsSchema } from './common/settings.schema';
import { commonSharedSchema } from './common/shared.schema';

export const commonSchema = z.object({
  ...commonSharedSchema.shape,
  ...commonChatSchema.shape,
  ...commonDebugSchema.shape,
  ...commonDlqSchema.shape,
  ...commonMediaSchema.shape,
  ...commonMemorySchema.shape,
  ...commonSettingsSchema.shape,
});

export type CommonMessages = z.infer<typeof commonSchema>;
