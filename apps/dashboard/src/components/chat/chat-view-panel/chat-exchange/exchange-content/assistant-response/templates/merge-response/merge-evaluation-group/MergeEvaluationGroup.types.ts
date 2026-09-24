import type { MergedEvaluationGroup } from '@/types/harness-response-data.model';

export interface MergeEvaluationGroupProps {
  /** One merged comparison or critique block from the merge response. */
  evaluation: MergedEvaluationGroup;
}
