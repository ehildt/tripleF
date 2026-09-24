import type { KeyFinding } from '@/types/harness-response-data.model';

export interface EvaluationSubjectProfileProps {
  /** The evaluated subject's name. */
  name: string;
  /** What the subject is and how it performed. */
  description?: string;
  /** Positive points. */
  strengths?: KeyFinding[];
  /** Critical points. */
  weaknesses?: KeyFinding[];
  /** Display string for the 0-10 score (e.g. "8/10"). */
  scoreText?: string;
}
