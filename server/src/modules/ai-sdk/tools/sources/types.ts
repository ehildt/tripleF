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
}
