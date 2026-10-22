import type { DiscardedReference } from '@/types/assistant-response-data.model';

export interface DiscardedReferencesSectionProps {
  /**
   * Online references (cloud images/links) the model examined on an image
   * task but discarded because they did not match the uploaded image(s).
   */
  items?: DiscardedReference[];
}
