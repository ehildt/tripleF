import type {
  EvaluationCriterion,
  EvaluationSubject,
  HarnessResponseData,
} from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/sources/append-labeled-fields.helper';
import { appendList } from '../../../composables/helpers/sources/append-list.helper';
import { buildSourcesLines } from '../../../composables/helpers/sources/build-sources-lines.helper';
import { formatEvaluationScore } from './format-evaluation-score.helper';

/** Description with the strengths/weaknesses indented beneath it. */
function appendSubjectDetails(
  parts: string[],
  subject: EvaluationSubject,
): void {
  const description = subject.description?.trim();
  if (description) parts.push(`  ${description}`);
  for (const strength of subject.strengths ?? []) {
    const text = strength.text?.trim();
    if (text) parts.push(`  + ${text}`);
  }
  for (const weakness of subject.weaknesses ?? []) {
    const text = weakness.text?.trim();
    if (text) parts.push(`  − ${text}`);
  }
}

/** Per-subject profile blocks: name and score first, then the details. */
function appendSubjects(parts: string[], data: HarnessResponseData): void {
  if (!data.subjects?.length) return;
  parts.push('Subjects:');
  for (const subject of data.subjects) {
    const name = subject.name?.trim();
    if (!name) continue;
    const scoreText = formatEvaluationScore(subject.score, subject.scoreLabel);
    const scoreSuffix = scoreText ? ` — ${scoreText}` : '';
    parts.push(`- ${name}${scoreSuffix}`);
    appendSubjectDetails(parts, subject);
  }
}

/** One criteria-matrix row: the criterion name plus each subject's score. */
function buildCriterionLine(
  criterion: EvaluationCriterion,
): string | undefined {
  const name = criterion.name?.trim();
  if (!name) return undefined;
  const scores = (criterion.scores ?? [])
    .map((scoreEntry) => {
      const subjectName = scoreEntry.subject?.trim();
      if (!subjectName || scoreEntry.score === undefined) return undefined;
      return `${subjectName}: ${scoreEntry.score}`;
    })
    .filter((line): line is string => line !== undefined)
    .join(', ');
  const scoresSuffix = scores ? ` (${scores})` : '';
  return `- ${name}${scoresSuffix}`;
}

/** The closing comparison block: summary, winner, verdict, criteria matrix. */
function appendComparison(parts: string[], data: HarnessResponseData): void {
  const comparison = data.comparison;
  if (!comparison) return;
  const summary = comparison.summary?.trim();
  if (summary) parts.push(`Comparison: ${summary}`);
  const winner = comparison.winner?.trim();
  if (winner) parts.push(`Winner: ${winner}`);
  const verdict = comparison.verdict?.trim();
  if (verdict) parts.push(`Comparison verdict: ${verdict}`);
  const criteria = (comparison.criteria ?? [])
    .map(buildCriterionLine)
    .filter((line): line is string => line !== undefined);
  if (criteria.length === 0) return;
  parts.push('Comparison criteria:');
  parts.push(...criteria);
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
  appendLabeledFields(parts, fields);

  if (data.score !== undefined) {
    const label = data.scoreLabel ? ` (${data.scoreLabel})` : '';
    parts.push(`Score: ${data.score}${label}`);
  }

  const reasoning = data.reasoning?.trim();
  if (reasoning) parts.push(`Reasoning: ${reasoning}`);

  const introduction = data.introduction?.trim();
  if (introduction) parts.push(`Introduction: ${introduction}`);

  appendSubjects(parts, data);
  appendComparison(parts, data);

  appendList(parts, 'Strengths:', data.strengths);
  appendList(parts, 'Weaknesses:', data.weaknesses);
  appendList(parts, 'Recommendations:', data.recommendations);

  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}
