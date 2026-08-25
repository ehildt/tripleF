import type { IntentResult } from '@triplef/agent/schemas';
import type { InputMessage } from '@triplef/ai-sdk';

import type { SourcesConfig } from '../../../provider-overrides/configs/sources-config.adapter.js';

export type BuildExecutionMessagesParams = {
  requestId: string;
  intent: IntentResult;
  messages: InputMessage[];
  availableImages?: Array<Record<string, unknown>>;
  /**
   * Cloud reference images ingested during sanitize, in the exact order of
   * their availableImages entries — attached visually so the model can
   * verify each candidate against the uploaded user image(s).
   */
  cloudReferenceImages?: Array<{
    imageUrl: string;
    title?: string;
    buffer: Buffer;
  }>;
  sources: SourcesConfig;
  /** ISO-639-1 code of the active UI locale, used as fallback when the intent classifier left the language unset. */
  language?: string;
};
