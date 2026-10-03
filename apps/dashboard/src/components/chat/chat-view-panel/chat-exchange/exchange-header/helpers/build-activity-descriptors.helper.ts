import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import { buildToolActivityDescriptors } from '../../exchange-content/exchange-activity/helpers/build-tool-activity-descriptors.helper';
import type { BuildActivityDescriptorsParams } from './build-activity-descriptors.helper.types';

/**
 * Resolve the activity descriptors shown while an assistant exchange is
 * pending. Parallel tool calls each yield their own descriptor (one per
 * category — the client cycles through them), falling back to the current
 * pipeline step descriptor sent by the server. Reasoning never drives the
 * label: the thinking trace renders in the exchange's reasoning panel, so
 * the label keeps naming the step that is actually running.
 */
export function buildActivityDescriptors(
  params: BuildActivityDescriptorsParams,
): HarnessActivityDescriptor[] {
  const toolDescriptors = buildToolActivityDescriptors(params.toolCalls ?? []);
  if (toolDescriptors.length) return toolDescriptors;

  return params.activity ? [params.activity] : [];
}
