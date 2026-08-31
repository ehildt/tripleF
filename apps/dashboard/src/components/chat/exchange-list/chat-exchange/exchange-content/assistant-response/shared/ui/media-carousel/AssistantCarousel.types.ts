import type { MediaItem } from '@/types/harness-response-data.model';

export interface AssistantCarouselProps {
  items: MediaItem[];
  /** Optional heading shown in the carousel header row (left of the dots). */
  title?: string;
  /** Anchor id for the rendered title (aria-labelledby wiring). */
  titleId?: string;
  /** Parent-managed slides (e.g. the attachments gallery) show a per-slide
   * remove action instead of add-to-files. */
  removable?: boolean;
}
