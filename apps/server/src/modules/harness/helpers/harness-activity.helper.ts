import type { HarnessContext } from '../services/harness-context.type.js';

/** Stable activity keys shared with the client's `activity.*` translations. */
export const HARNESS_ACTIVITY_KEYS = {
  understanding: 'activity.understanding',
  searching: 'activity.searching',
  analyzingImages: 'activity.analyzingImages',
  verifying: 'activity.verifying',
  gatheringImages: 'activity.gatheringImages',
  refining: 'activity.refining',
} as const;

/**
 * The language the model chose to respond in. Resolved from the intent once
 * interpret has run; before that (e.g. the "understanding" opener) it falls
 * back to the UI locale passed by the client. The client localizes activity
 * labels in this language rather than the active UI locale.
 */
export function resolveHarnessActivityLanguage(
  ctx: HarnessContext,
): string | undefined {
  return ctx.outputs.intent?.language ?? ctx.filters.language;
}
