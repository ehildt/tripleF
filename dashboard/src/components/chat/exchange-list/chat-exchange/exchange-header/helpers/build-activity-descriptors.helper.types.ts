import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import type { ActiveToolCall } from '../../exchange-content/exchange-activity/helpers/build-tool-activity-descriptors.helper.types';

export type BuildActivityDescriptorsParams = {
  reasoning?: string;
  toolCalls?: ActiveToolCall[];
  activity?: HarnessActivityDescriptor;
};
