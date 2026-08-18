import type { MediaItem } from '@/types/harness-response-data.model';

export interface AssistantCarouselProps {
  items: MediaItem[];
  /** Optional heading shown in the carousel header row (left of the dots). */
  title?: string;
  /** Anchor id for the rendered title (aria-labelledby wiring). */
  titleId?: string;
}
