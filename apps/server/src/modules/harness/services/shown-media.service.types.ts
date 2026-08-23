import type { ShownMediaKeySourceOptions } from '../helpers/media/extract-shown-media-keys.types.js';

export type RecordShownMediaParams = {
  sessionId: string | undefined;
  conversationId: string | undefined;
  requestId: string;
  data: Record<string, unknown> | undefined;
  sources: ShownMediaKeySourceOptions;
};
