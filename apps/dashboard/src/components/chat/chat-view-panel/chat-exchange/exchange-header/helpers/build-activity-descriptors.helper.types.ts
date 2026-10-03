import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import type { ActiveToolCall } from '../../exchange-content/exchange-activity/helpers/build-tool-activity-descriptors.helper.types';

export type BuildActivityDescriptorsParams = {
  toolCalls?: ActiveToolCall[];
  activity?: HarnessActivityDescriptor;
};
