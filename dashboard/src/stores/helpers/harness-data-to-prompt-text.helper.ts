import type {
  HarnessResponseData,
  Source,
} from '@/types/harness-response-data.model';

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

function buildScoreLine(score: number, scoreLabel?: string): string {
  const label = scoreLabel ? ` (${scoreLabel})` : '';
  return `Score: ${score}${label}`;
}

function buildSourceLine(source: Source): string {
  const label = [source.title, source.sourceName].filter(Boolean).join(' — ');
  const urlPart = source.url ? ` (${source.url})` : '';
  return `- ${label}${urlPart}`;
}

function appendSources(parts: string[], data: HarnessResponseData): void {
  const sources = data.sources;
  if (!sources?.length) return;
  parts.push('Sources:');
  for (const source of sources) {
    parts.push(buildSourceLine(source));
  }
}

function appendHeaderFields(parts: string[], data: HarnessResponseData): void {
  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
    ['Headline', data.headline],
    ['Deck', data.deck],
    ['Lead', data.lead],
    ['Subject', data.subject],
    ['Verdict', data.verdict],
  ];

  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  if (data.score !== undefined)
    parts.push(buildScoreLine(data.score, data.scoreLabel));
}

function appendBodyFields(parts: string[], data: HarnessResponseData): void {
  if (data.summary?.trim()) parts.push(data.summary.trim());
  if (data.sectionTitle?.trim())
    parts.push(`Section: ${data.sectionTitle.trim()}`);
  if (data.sectionContent?.trim()) parts.push(data.sectionContent.trim());
  if (data.reasoning?.trim()) parts.push(`Reasoning: ${data.reasoning.trim()}`);
}

function appendListFields(parts: string[], data: HarnessResponseData): void {
  appendList(parts, 'Key findings:', data.keyFindings);
  appendList(parts, 'Key points:', data.keyPoints);
  appendList(parts, 'Strengths:', data.strengths);
  appendList(parts, 'Weaknesses:', data.weaknesses);
  appendList(parts, 'Recommendations:', data.recommendations);
  appendSources(parts, data);
}

/**
 * Convert a structured assistant response into a plain-text representation
 * that can be fed back into the LLM as conversation history.
 *
 * Empty or missing fields are skipped so the result stays compact.
 */
export function harnessDataToPromptText(data: HarnessResponseData): string {
  const parts: string[] = [];

  appendHeaderFields(parts, data);
  appendBodyFields(parts, data);
  appendListFields(parts, data);

  if (data.conclusion?.trim())
    parts.push(`Conclusion: ${data.conclusion.trim()}`);

  return parts.join('\n\n');
}
