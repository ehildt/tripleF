import { computed, ref } from 'vue';

import type {
  WidgetPreview,
  WidgetPreviewControls,
} from './use-widget-preview.types';

// Module-scope singleton: Settings controls, both previews, navigation, and
// section changes coordinate one persistent preview. Reset it between tests.
const activeWidgetPreview = ref<WidgetPreview | null>(null);
const playlistPreviewVisible = computed(
  () => activeWidgetPreview.value === 'playlist',
);
const popoutPreviewVisible = computed(
  () => activeWidgetPreview.value === 'popout',
);

/** Coordinate mutually exclusive Settings previews without store coupling. */
export function useWidgetPreview(): WidgetPreviewControls {
  function toggleWidgetPreview(preview: WidgetPreview): void {
    activeWidgetPreview.value =
      activeWidgetPreview.value === preview ? null : preview;
  }

  function hideWidgetPreview(): void {
    activeWidgetPreview.value = null;
  }

  return {
    activeWidgetPreview,
    playlistPreviewVisible,
    popoutPreviewVisible,
    toggleWidgetPreview,
    hideWidgetPreview,
  };
}
