import { computed } from 'vue';

import type {
  EvaluationCriterion,
  EvaluationSubject,
  HarnessResponseData,
} from '@/types/harness-response-data.model';

import { useHarnessMediaPriority } from '../../../shared/composables/use-harness-media-priority.composable';
import type { EvaluationResponseProps } from '../EvaluationResponse.types';
import { formatEvaluationScore } from '../helpers/format-evaluation-score.helper';
import type {
  EvaluationComparisonColumn,
  EvaluationComparisonRow,
  EvaluationComparisonSectionProps,
} from '../sections/evaluation-comparison-section/EvaluationComparisonSection.types';
import type { EvaluationSubjectProfileProps } from '../sections/evaluation-subject-profile/EvaluationSubjectProfile.types';

/**
 * Derives the evaluation template's display values from the raw response:
 * the media ordering, the per-subject profile blocks, and the closing
 * comparison view — with legacy single-subject responses (verdict spine +
 * reasoning + assessment lists) reshaped into the same view model so old
 * conversations render unchanged.
 */
export function useEvaluationResponseData(props: EvaluationResponseProps) {
  const { heroUrl, videosFirst } = useHarnessMediaPriority(props.data);

  /** Per-subject profiles, or the legacy verdict spine reshaped as one. */
  const subjectProfiles = computed<EvaluationSubjectProfileProps[]>(() => {
    const profiles = (props.data.subjects ?? [])
      .map(toSubjectProfile)
      .filter(
        (profile): profile is EvaluationSubjectProfileProps => profile !== null,
      );
    if (profiles.length > 0) return profiles;
    return legacySubjectProfile(props.data);
  });

  /** Multi-subject evaluations compare; single-subject critiques verdict. */
  const isMultiSubject = computed(() => subjectProfiles.value.length > 1);

  /**
   * The comparison section's props (minus its title, which the orchestrator
   * localizes): the emitted comparison block, or the legacy verdict reshaped.
   */
  const comparisonView = computed<
    Omit<EvaluationComparisonSectionProps, 'title'> | undefined
  >(() => {
    const raw = props.data.comparison;
    const verdict = raw ? raw.verdict : props.data.verdict;
    const winnerName = raw?.winner?.trim() || undefined;
    const columns = buildComparisonColumns(
      subjectProfiles.value,
      raw?.criteria,
      winnerName,
    );
    const rows = buildComparisonRows(
      raw?.criteria,
      columns.map((column) => column.name),
      winnerName,
    );
    if (!raw?.summary && !verdict && rows.length === 0) return undefined;
    return {
      summary: raw?.summary,
      verdict,
      winner: winnerName,
      columns,
      rows,
    };
  });

  const hasAnyContent = computed(() =>
    Boolean(
      props.data.category ||
      props.data.title ||
      props.data.subtitle ||
      props.data.introduction ||
      props.data.subject ||
      props.data.verdict ||
      props.data.score !== undefined ||
      props.data.reasoning ||
      props.data.strengths?.length ||
      props.data.weaknesses?.length ||
      props.data.recommendations?.length ||
      props.data.subjects?.length ||
      props.data.comparison ||
      props.data.sources?.length ||
      heroUrl.value ||
      props.data.videoGalleryItems?.length ||
      props.data.galleryItems?.length,
    ),
  );

  return {
    videosFirst,
    subjectProfiles,
    isMultiSubject,
    comparisonView,
    hasAnyContent,
  };
}

function toSubjectProfile(
  subject: EvaluationSubject,
): EvaluationSubjectProfileProps | null {
  const name = subject.name?.trim();
  if (!name) return null;
  return {
    name,
    description: subject.description,
    strengths: subject.strengths,
    weaknesses: subject.weaknesses,
    scoreText: formatEvaluationScore(subject.score, subject.scoreLabel),
  };
}

/** Legacy single-subject critiques carry subject/verdict/score, not subjects[]. */
function legacySubjectProfile(
  data: HarnessResponseData,
): EvaluationSubjectProfileProps[] {
  const name = data.subject?.trim();
  if (!name) return [];
  return [
    {
      name,
      description: data.reasoning,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      scoreText: formatEvaluationScore(data.score, data.scoreLabel),
    },
  ];
}

/** Matrix columns: the profile names plus any criterion-only subjects. */
function buildComparisonColumns(
  profiles: EvaluationSubjectProfileProps[],
  criteria: EvaluationCriterion[] | undefined,
  winnerName: string | undefined,
): EvaluationComparisonColumn[] {
  const names: string[] = [];
  const push = (name?: string) => {
    const trimmed = name?.trim();
    if (trimmed && !names.includes(trimmed)) names.push(trimmed);
  };
  profiles.forEach((profile) => push(profile.name));
  criteria?.forEach((criterion) =>
    criterion.scores?.forEach((score) => push(score.subject)),
  );
  return names.map((name) => ({ name, winner: name === winnerName }));
}

/** Matrix rows: one criterion per row, one formatted cell per column. */
function buildComparisonRows(
  criteria: EvaluationCriterion[] | undefined,
  columnNames: string[],
  winnerName: string | undefined,
): EvaluationComparisonRow[] {
  const rows: EvaluationComparisonRow[] = [];
  for (const criterion of criteria ?? []) {
    const name = criterion.name?.trim();
    if (!name) continue;
    const scores = new Map<string, number>();
    for (const scoreEntry of criterion.scores ?? []) {
      const subject = scoreEntry.subject?.trim();
      if (subject && scoreEntry.score !== undefined) {
        scores.set(subject, scoreEntry.score);
      }
    }
    if (scores.size === 0) continue;
    rows.push({
      name,
      cells: columnNames.map((column) => {
        const score = scores.get(column);
        return {
          column,
          text: score !== undefined ? String(score) : '—',
          winner: column === winnerName,
        };
      }),
    });
  }
  return rows;
}
