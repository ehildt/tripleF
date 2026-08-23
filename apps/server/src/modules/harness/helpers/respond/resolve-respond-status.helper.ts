import { HARNESS_ACTIVITY_KEYS } from '../harness-activity.helper.js';

import type { ResolveRespondStatusContext } from './resolve-respond-status.helper.types.js';

/**
 * Only announce preparation when there are images to gather — statting the
 * storage objects below is the visible work of this step. Without images
 * the step goes straight to the model, whose reasoning stream announces
 * itself (the client shows "consolidating" while thinking), so a status here
 * would just be a redundant "getting ready" beat between the previous step
 * and the thinking.
 */
export function resolveRespondStatus(
  ctx: ResolveRespondStatusContext,
): string | undefined {
  if (ctx.processedMeta.length > 0)
    return HARNESS_ACTIVITY_KEYS.gatheringImages;
  return undefined;
}
