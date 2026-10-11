import type { KeyFinding } from '@/types/harness-response-data.model';

/** Props for `EvaluationListSection`, a titled list of strengths, weaknesses, or recommendations. */
export interface EvaluationListSectionProps {
  /** Heading shown above the list. */
  title: string;
  /** The entries to list. */
  items?: KeyFinding[];
  /** Which assessment list this is; drives the icon and tint. */
  variant?: 'strength' | 'weakness' | 'recommendation';
}
