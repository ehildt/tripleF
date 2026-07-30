import type { Logger } from '@nestjs/common';

import type { ProviderOverridesSnapshot } from '../../../provider-overrides/services/provider-overrides.service.js';

export interface ToolDependencies {
  getLiveConfig: () => ProviderOverridesSnapshot;
  logger: Logger;
  compactContent: (
    content: string,
    opts?: { model?: string; notify?: (event: string, data?: unknown) => void },
  ) => Promise<{ text: string }>;
  model?: string;
  notify?: (event: string, data?: unknown) => void;
  /**
   * Fallback locale (two-letter code of the detected user language) applied
   * when the model omits a tool's lang input. Threaded from the intent
   * classifier; nothing is hardcoded.
   */
  defaultLang?: string;
}
