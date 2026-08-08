import type { InputMessage } from '../../../ai-sdk/types/ai-sdk-messages.types.js';
import type { LayoutsConfig } from '../../../provider-overrides/configs/layouts-config.adapter.js';
import type { SourcesConfig } from '../../../provider-overrides/configs/sources-config.adapter.js';
import type { HarnessStepLogger } from '../../services/harness-step-logger.service.js';
import type { IntentResult } from '../../templates/intent.schema.js';

export type BuildExecutionMessagesParams = {
  requestId: string;
  intent: IntentResult;
  messages: InputMessage[];
  availableImages?: Array<Record<string, unknown>>;
  sources: SourcesConfig;
  stepLogger: HarnessStepLogger;
  /** Layouts the user config enables; snippet templates choose from presets ∩ these. */
  allowedLayouts?: LayoutsConfig;
  /** ISO-639-1 code of the active UI locale, used as fallback when the intent classifier left the language unset. */
  language?: string;
};
