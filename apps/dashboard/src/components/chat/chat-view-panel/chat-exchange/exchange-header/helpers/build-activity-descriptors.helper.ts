import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import { buildToolActivityDescriptors } from '../../exchange-content/exchange-activity/helpers/build-tool-activity-descriptors.helper';
import type { BuildActivityDescriptorsParams } from './build-activity-descriptors.helper.types';

/**
 * Resolve the activity descriptors shown while an assistant exchange is
 * pending. Thinking takes precedence: once the model streams reasoning, only
 * the "consolidating" descriptor remains. Otherwise parallel tool calls each
 * yield their own descriptor (one per category — the client cycles through
 * them), falling back to the current pipeline step descriptor sent by the
 * server.
 */
export function buildActivityDescriptors(
  params: BuildActivityDescriptorsParams,
): HarnessActivityDescriptor[] {
  if (params.reasoning?.trim()) return [{ key: 'activity.consolidating' }];

  const toolDescriptors = buildToolActivityDescriptors(params.toolCalls ?? []);
  if (toolDescriptors.length) return toolDescriptors;

  return params.activity ? [params.activity] : [];
}
