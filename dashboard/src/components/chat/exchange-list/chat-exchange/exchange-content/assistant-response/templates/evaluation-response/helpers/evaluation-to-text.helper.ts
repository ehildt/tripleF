import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { buildSourceLine } from '../../../composables/helpers/build-source-line.helper';

function appendList(
  parts: string[],
  title: string,
  items?: Array<{ text?: string }>,
): void {
  if (!items?.length) return;
  parts.push(title);
  for (const item of items) {
    const text = item.text?.trim();
    if (text) parts.push(`- ${text}`);
  }
}

/**
 * Convert an evaluation response into plain text for the model history.
 * Media galleries are omitted — follow-ups need the verdict, the reasoning,
 * and the weighed pros and cons.
 */
export function evaluationToText(data: HarnessResponseData): string {
  const parts: string[] = [];

  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
    ['Subject', data.subject],
    ['Verdict', data.verdict],
  ];
  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  if (data.score !== undefined) {
    const label = data.scoreLabel ? ` (${data.scoreLabel})` : '';
    parts.push(`Score: ${data.score}${label}`);
  }

  const reasoning = data.reasoning?.trim();
  if (reasoning) parts.push(`Reasoning: ${reasoning}`);

  appendList(parts, 'Strengths:', data.strengths);
  appendList(parts, 'Weaknesses:', data.weaknesses);
  appendList(parts, 'Recommendations:', data.recommendations);

  if (data.sources?.length) {
    parts.push('Sources:');
    for (const source of data.sources) parts.push(buildSourceLine(source));
  }

  return parts.join('\n\n');
}
