import type {
  SelectStepHistoryParams,
  StepHistorySelection,
} from './select-step-history.helper.types.js';

/**
 * Templates that recap the prior conversation by definition — they receive
 * the full transcript no matter what.
 */
const FULL_HISTORY_TEMPLATES = new Set(['summary', 'evaluation']);

/** Short conversations never need filtering: there is nothing to lose. */
const PASSTHROUGH_MAX_MESSAGES = 6;

/**
 * Select which conversation history a downstream step (execute/respond)
 * sees. The interpret step already derived a query-focused contextSummary
 * from the full transcript, so downstream steps only need the raw
 * conversation when it is short, when the template recaps it, or — for
 * free-form chat — the last exchange to keep the tone. Everything else is
 * replaced by the contextSummary carried in the step's system prompt.
 */
export function selectStepHistory(
  params: SelectStepHistoryParams,
): StepHistorySelection {
  const { messages, template } = params;

  if (
    messages.length <= PASSTHROUGH_MAX_MESSAGES ||
    (template != null && FULL_HISTORY_TEMPLATES.has(template))
  ) {
    return { messages, mode: 'full' };
  }

  const latestUser = messages.findLast((m) => m.role === 'user');
  if (!latestUser) return { messages: [], mode: 'derived' };

  if (template === 'text') {
    const lastAssistant = messages.findLast((m) => m.role === 'assistant');
    return {
      messages: lastAssistant ? [lastAssistant, latestUser] : [latestUser],
      mode: 'derived',
    };
  }

  return { messages: [latestUser], mode: 'derived' };
}
