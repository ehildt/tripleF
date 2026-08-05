import type { HarnessContext } from '../../services/harness-context.type.js';

/**
 * Extract a fallback search query from the context.
 *
 * A short follow-up message ("what do the reviews say?", "more media")
 * carries no searchable subject on its own, so the intent step's
 * contextSummary — which names the established entities verbatim — leads
 * the query, with the user's wording appended for the actual request.
 */
export function extractQuery(
  ctx: HarnessContext,
  intent: NonNullable<HarnessContext['outputs']['intent']>,
): string {
  const lastUser = [...ctx.request.messages]
    .reverse()
    .find((m) => m.role === 'user');
  const rawQuery = (lastUser?.content ?? ctx.lastUserPrompt)?.trim() ?? '';

  const contextSummary = intent.contextSummary?.trim() ?? '';
  if (!contextSummary) return rawQuery.slice(0, 300);

  const words = rawQuery.split(/\s+/).filter(Boolean);
  const hasDependentReference =
    /\b(this|that|these|those|it|its|he|she|they|them|sie|dies|das|den|dem|dazu|search\s+online|online\s+search)\b/i.test(
      rawQuery,
    );
  const isShortFollowUp = words.length > 0 && words.length < 8;

  if (!isShortFollowUp && !hasDependentReference) return rawQuery.slice(0, 300);

  const subject = contextSummary.replace(/\s+/g, ' ').trim().slice(0, 250);
  return (rawQuery ? `${subject} — ${rawQuery}` : subject).slice(0, 300);
}
