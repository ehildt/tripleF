import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

import type { HarnessResponseState } from './create-harness-response-state.helper';
import { extractHarnessText } from './extract-harness-text.helper';
import { normalizeHarnessResponseData } from './normalize-harness-response-data.helper';
import { parsePartialJson } from './parse-partial-json.helper';
import { stripMarkdownFences } from './strip-markdown-fences.helper';

export function processHarnessResponseEvent(
  state: HarnessResponseState,
  event: HarnessStreamEvent,
): HarnessResponseState {
  const delta = event.delta ?? '';
  const template = (event.template ?? state.template ?? 'text') as string;
  const isTextTemplate = template === 'text';

  let accumulatedDelta = state.accumulatedDelta;
  let lastValidData = state.lastValidData;
  let text = state.text;

  if (delta) {
    accumulatedDelta += delta;
  }

  // The done event's validated server data is authoritative — when the
  // streamed deltas failed validation and were regenerated via retries,
  // this is the only channel the corrected payload reaches the client on.
  // Never re-parse the (possibly invalid) raw deltas over it.
  const doneDataNormalized =
    event.done && event.data != null && typeof event.data === 'object'
      ? normalizeHarnessResponseData(event.data, event, template)
      : null;

  if (doneDataNormalized) {
    lastValidData = doneDataNormalized;
  } else if (isTextTemplate) {
    text = extractHarnessText(accumulatedDelta);
  } else {
    const parsed = parsePartialJson(stripMarkdownFences(accumulatedDelta));
    const normalized =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? normalizeHarnessResponseData(parsed, event, template)
        : null;
    if (normalized) {
      lastValidData = normalized;
    }
  }

  return {
    ...state,
    template,
    accumulatedDelta,
    lastValidData,
    text,
    status: event.status ?? state.status,
    done: event.done === true,
  };
}
