import type { AssistantActivityDescriptor } from '@/types/activity.model';

import type { ActiveToolCall } from '../../exchange-content/exchange-activity/helpers/build-tool-activity-descriptors.helper.types';

export type BuildActivityDescriptorsParams = {
  toolCalls?: ActiveToolCall[];
  activity?: AssistantActivityDescriptor;
};
