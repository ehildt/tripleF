import type { ResizeDirection } from '@/types/resize-direction.model';

export interface ResizeHandleGridProps {
  /** Which edges/corners show a resize handle (defaults to all eight). */
  directions?: ResizeDirection[];
}

export interface ResizeHandleGridEmits {
  /** A handle drag started — the container's geometry takes over. */
  resize: [direction: ResizeDirection, event: PointerEvent];
}
