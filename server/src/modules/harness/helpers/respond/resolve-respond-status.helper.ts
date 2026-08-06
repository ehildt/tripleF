type ResolveRespondStatusContext = {
  processedMeta: unknown[];
};

/**
 * Only announce preparation when there are images to gather — statting the
 * storage objects below is the visible work of this step. Without images
 * the step goes straight to the model, whose reasoning stream announces
 * itself ("Consolidating everything.."), so a status here would just be a
 * redundant "getting ready" beat between the previous step and the thinking.
 */
export function resolveRespondStatus(
  ctx: ResolveRespondStatusContext,
): string | undefined {
  if (ctx.processedMeta.length > 0) return 'Gathering the images…';
  return undefined;
}
