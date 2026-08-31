import type { IntentResult } from '@triplef/agent/schemas';
import type { InputMessage } from '@triplef/ai-sdk';

import type { SourcesConfig } from '../../../provider-overrides/configs/sources-config.adapter.js';

export type BuildExecutionMessagesParams = {
  requestId: string;
  intent: IntentResult;
  messages: InputMessage[];
  availableImages?: Array<Record<string, unknown>>;
  sources: SourcesConfig;
  /** ISO-639-1 code of the active UI locale, used as fallback when the intent classifier left the language unset. */
  language?: string;
};
