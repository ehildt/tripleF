import { computed, type Ref } from 'vue';

import { clampRectToViewport } from '@/composables/helpers/clamp-rect-to-viewport.helper';
import { trackPointerGesture } from '@/composables/helpers/track-pointer-gesture.helper';
import { usePopoutSettingsStore } from '@/stores/popout-settings/popout-settings.store';
import type { ResizeDirection } from '@/types/resize-direction.model';

import { POPUP_ANCHOR_STYLES } from '../../popup-anchor-styles.constant';
import {
  FLOATING_MEDIA_BAR_HEIGHT_PX,
  MIN_PLAYER_MEDIA_HEIGHT_PX,
  MIN_PLAYER_MEDIA_WIDTH_PX,
} from './player-media-floor.constant';

/** Smallest popup: the media box keeps ≥360×200px (YouTube's hard floor for
 * players showing controls) even with the media bar visible on top. */
const MIN_POPUP_WIDTH_PX = MIN_PLAYER_MEDIA_WIDTH_PX;
const MIN_POPUP_HEIGHT_PX =
  MIN_PLAYER_MEDIA_HEIGHT_PX + FLOATING_MEDIA_BAR_HEIGHT_PX;
const VIEWPORT_MARGIN_PX = 16;
const OPACITY_SNAP_STEP_PERCENT = 25;
const OPACITY_SNAP_THRESHOLD_PERCENT = 3;

/**
 * Shared geometry for the floating video popup: anchored at the configured
 * corner (Settings → Popout) until the user moves it. While position memory is
 * on, the geometry persists across players, conversations, and app reloads;
 * otherwise every popout opens at the initial anchor. Dragging keeps the
 * position, resizing keeps the aspect ratio.
 */
export function usePopupGeometry(
  floatingPopupOpacity: Ref<number>,
  setFloatingPopupOpacity: (opacity: number) => void,
) {
  const popoutSettingsStore = usePopoutSettingsStore();

  const popupStyle = computed(() => {
    const style: Record<string, string> = {
      opacity: String(floatingPopupOpacity.value),
      ...(popoutSettingsStore.floatingPopupRect
        ? {
            left: `${popoutSettingsStore.floatingPopupRect.x}px`,
            top: `${popoutSettingsStore.floatingPopupRect.y}px`,
            width: `${popoutSettingsStore.floatingPopupRect.width}px`,
            height: `${popoutSettingsStore.floatingPopupRect.height}px`,
          }
        : POPUP_ANCHOR_STYLES[popoutSettingsStore.popoutAnchor]),
    };

    return style;
  });

  /** Snapshot the popup's current box into the shared geometry state. */
  function capturePopupRect(popup: HTMLElement) {
    const rect = popup.getBoundingClientRect();
    popoutSettingsStore.floatingPopupRect = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  function startDrag(event: PointerEvent) {
    const bar = event.currentTarget as HTMLElement | null;
    const popup = bar?.parentElement;
    if (!popup || !bar) return;

    capturePopupRect(popup);
    const startRect = { ...popoutSettingsStore.floatingPopupRect! };
    const offsetX = event.clientX - startRect.x;
    const offsetY = event.clientY - startRect.y;

    trackPointerGesture(
      bar,
      event,
      (move) => {
        popoutSettingsStore.floatingPopupRect = clampRectToViewport({
          ...startRect,
          x: move.clientX - offsetX,
          y: move.clientY - offsetY,
        });
      },
      popoutSettingsStore.rememberFloatingPopupRect,
    );
  }

  /**
   * Resize from any edge or corner while keeping the popup's aspect ratio.
   * The opposite side stays anchored; the dominant pointer axis drives the
   * scale so diagonal corner drags feel natural.
   */
  function startResize(direction: ResizeDirection, event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget as HTMLElement | null;
    const popup = handle?.parentElement;
    if (!popup || !handle) return;

    capturePopupRect(popup);
    const start = { ...popoutSettingsStore.floatingPopupRect! };
    const ratio = start.width / start.height;
    const startClientX = event.clientX;
    const startClientY = event.clientY;

    trackPointerGesture(
      handle,
      event,
      (move) => {
        const dx = move.clientX - startClientX;
        const dy = move.clientY - startClientY;

        let scale: number;
        if (direction === 'e') scale = (start.width + dx) / start.width;
        else if (direction === 'w') scale = (start.width - dx) / start.width;
        else if (direction === 's') scale = (start.height + dy) / start.height;
        else if (direction === 'n') scale = (start.height - dy) / start.height;
        else {
          const scaleX =
            (direction.includes('e') ? start.width + dx : start.width - dx) /
            start.width;
          const scaleY =
            (direction.includes('s') ? start.height + dy : start.height - dy) /
            start.height;
          scale = Math.max(scaleX, scaleY);
        }

        const maxWidth = Math.min(
          window.innerWidth - VIEWPORT_MARGIN_PX,
          (window.innerHeight - VIEWPORT_MARGIN_PX) * ratio,
        );
        const width = Math.min(
          Math.max(MIN_POPUP_WIDTH_PX, start.width * scale),
          maxWidth,
        );
        const height = Math.max(MIN_POPUP_HEIGHT_PX, width / ratio);

        popoutSettingsStore.floatingPopupRect = clampRectToViewport({
          x: direction.includes('w')
            ? start.x + (start.width - width)
            : start.x,
          y: direction.includes('n')
            ? start.y + (start.height - height)
            : start.y,
          width,
          height,
        });
      },
      popoutSettingsStore.rememberFloatingPopupRect,
    );
  }

  /**
   * Set the popup opacity in percent (25–100). Values near a 25% step snap
   * to it; everything in between adjusts finely.
   */
  function setOpacity(percent: number) {
    const snapped =
      Math.round(percent / OPACITY_SNAP_STEP_PERCENT) *
      OPACITY_SNAP_STEP_PERCENT;
    const withinSnapZone =
      Math.abs(percent - snapped) <= OPACITY_SNAP_THRESHOLD_PERCENT;
    setFloatingPopupOpacity((withinSnapZone ? snapped : percent) / 100);
  }

  return { popupStyle, startDrag, startResize, setOpacity };
}
