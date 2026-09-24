import type { BodySection } from '@/types/harness-response-data.model';

export interface MergeBodySectionProps {
  /** One per-topic block of the merged narrative. */
  section: BodySection;
}
