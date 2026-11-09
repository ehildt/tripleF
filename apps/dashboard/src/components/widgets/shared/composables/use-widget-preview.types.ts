import type { ComputedRef, Ref } from 'vue';

export type WidgetPreview = 'playlist' | 'popout';

export interface WidgetPreviewControls {
  /** The one visible Settings widget preview, or no preview. */
  activeWidgetPreview: Readonly<Ref<WidgetPreview | null>>;
  /** Whether the floating playlist example is visible. */
  playlistPreviewVisible: ComputedRef<boolean>;
  /** Whether the floating popout example is visible. */
  popoutPreviewVisible: ComputedRef<boolean>;
  /** Show one preview, hide the other, or close an already-active preview. */
  toggleWidgetPreview: (preview: WidgetPreview) => void;
  /** Dismiss whichever widget preview is active. */
  hideWidgetPreview: () => void;
}
