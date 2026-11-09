import type { ComputedRef } from 'vue';

import type { ResizeDirection } from '@/types/resize-direction.model';

export interface PopupGeometryControls {
  /** Current fixed/anchored popup CSS and media opacity. */
  popupStyle: ComputedRef<Record<string, string>>;
  /** Begin a pointer-captured popup drag. */
  startDrag: (event: PointerEvent) => void;
  /** Begin an aspect-preserving resize from the supplied edge/corner. */
  startResize: (direction: ResizeDirection, event: PointerEvent) => void;
  /** Apply fine opacity adjustment with nearby quarter-step snapping. */
  setOpacity: (percent: number) => void;
}
