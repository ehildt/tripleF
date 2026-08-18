import { harnessDataToPromptText } from '@/stores/helpers/messages/harness-data-to-prompt-text.helper';
import type {
  EvaluationCriterion,
  EvaluationCriterionScore,
  EvaluationSubject,
  HarnessResponseData,
  MergedEvaluationGroup,
} from '@/types/harness-response-data.model';

import { appendList } from '../../../composables/helpers/sources/append-list.helper';
import { evaluationToText } from '../../evaluation-response/helpers/evaluation-to-text.helper';
import { formatEvaluationScore } from '../../evaluation-response/helpers/format-evaluation-score.helper';

/** One matrix cell as text: "Subject name: 8.5". */
function buildScoreEntryText(
  entry: EvaluationCriterionScore,
): string | undefined {
  const subject = entry.subject?.trim();
  if (!subject || entry.score === undefined) return undefined;
  return `${subject}: ${entry.score}`;
}

/** One criteria-matrix row: the criterion name plus each subject's score. */
function buildCriterionLine(
  criterion: EvaluationCriterion,
): string | undefined {
  const name = criterion.name?.trim();
  if (!name) return undefined;
  const scores = (criterion.scores ?? [])
    .map(buildScoreEntryText)
    .filter((line): line is string => line !== undefined)
    .join(', ');
  const scoresSuffix = scores ? ` (${scores})` : '';
  return `- ${name}${scoresSuffix}`;
}

/** One subject's header line plus its description and pro/con points. */
function appendGroupSubject(parts: string[], subject: EvaluationSubject): void {
  const name = subject.name?.trim();
  if (!name) return;
  const scoreText = formatEvaluationScore(subject.score, subject.scoreLabel);
  const scoreSuffix = scoreText ? ` — ${scoreText}` : '';
  parts.push(`- ${name}${scoreSuffix}`);
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

/** A group's per-subject profile lines, mirroring the evaluation transform. */
function appendGroupSubjects(
  parts: string[],
  subjects?: EvaluationSubject[],
): void {
  if (!subjects?.length) return;
  parts.push('Subjects:');
  for (const subject of subjects) appendGroupSubject(parts, subject);
}

/** One merged comparison block: summary, winner, verdict, criteria matrix. */
function appendGroupComparison(
  parts: string[],
  group: MergedEvaluationGroup,
): void {
  const comparison = group.comparison;
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
  if (criteria.length) parts.push('Comparison criteria:', ...criteria);
}

/** One merged evaluation group as a labeled block. */
function groupToText(group: MergedEvaluationGroup): string {
  const parts: string[] = [];
  const title = group.title?.trim();
  if (title) parts.push(`Merged evaluation — ${title}`);
  const note = group.relationNote?.trim();
  if (note) parts.push(`Note: ${note}`);
  const introduction = group.introduction?.trim();
  if (introduction) parts.push(`Introduction: ${introduction}`);
  appendGroupSubjects(parts, group.subjects);
  appendGroupComparison(parts, group);
  const reasoning = group.reasoning?.trim();
  if (reasoning) parts.push(`Reasoning: ${reasoning}`);
  appendList(parts, 'Recommendations:', group.recommendations);
  return parts.join('\n\n');
}

/**
 * Convert a merge response into plain text for the model history. Each
 * merged evaluation block is serialized first (the verdicts and scores
 * follow-ups reference), then the shared fields (lead, key findings, media,
 * sources) via the generic flattener. Merges without evaluation groups fall
 * back by shape: legacy evaluation merges use the evaluation transform,
 * non-evaluation merges the generic flattener.
 */
export function mergeToText(data: HarnessResponseData): string {
  const groups = data.mergedEvaluations ?? [];
  if (!groups.length) {
    // Pre-group (legacy) evaluation merges keep the evaluation transform;
    // non-evaluation merges use the generic flattener, which covers body
    // sections, key findings, and media that the evaluation transform drops.
    const hasEvaluationFields = Boolean(
      data.subjects?.length || data.comparison || data.verdict || data.subject,
    );
    return hasEvaluationFields
      ? evaluationToText(data)
      : harnessDataToPromptText(data);
  }

  const groupText = groups
    .map(groupToText)
    .filter((text) => text.trim())
    .join('\n\n');

  const rest: HarnessResponseData = { ...data };
  delete rest.mergedEvaluations;
  const restText = harnessDataToPromptText(rest);

  return [groupText, restText].filter((part) => part.trim()).join('\n\n');
}
