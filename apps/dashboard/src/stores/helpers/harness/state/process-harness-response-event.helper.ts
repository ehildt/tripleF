import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

import { buildChartDataKey } from '../text/build-chart-data-key.helper';
import { extractHarnessText } from '../text/extract-harness-text.helper';
import { normalizeHarnessResponseData } from '../text/normalize-harness-response-data.helper';
import { parsePartialJson } from '../text/parse-partial-json.helper';
import { stripMarkdownFences } from '../text/strip-markdown-fences.helper';
import type { HarnessResponseState } from './create-harness-response-state.helper.types';

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
  let chartData = state.chartData;
  let revealCharts = state.revealCharts;

  if (delta) {
    accumulatedDelta += delta;
    // The respond step has started streaming — reveal any buffered charts.
    revealCharts = true;
  }

  // Buffer chart data streamed right after an EODHD tool ran. It stays
  // hidden until the first respond delta flips revealCharts. Series that
  // carry a ticker (e.g. one history call per instrument in a list) are
  // keyed by toolName:ticker so parallel calls don't overwrite each other;
  // technical calls also carry a function (one indicator per call) so an
  // RSI and a MACD series for the same ticker coexist.
  if (event.chartData) {
    const { toolName, data } = event.chartData;
    const key = buildChartDataKey(toolName, data);
    chartData = { ...chartData, [key]: data };
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
    chartData,
    revealCharts,
    status: event.status ?? state.status,
    done: event.done === true,
  };
}
