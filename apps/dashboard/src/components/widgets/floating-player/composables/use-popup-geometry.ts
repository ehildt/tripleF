import { computed } from 'vue';

import type { FloatingPopupRect } from '@/composables/create-playback-session/create-playback-session.types';
import { clampRectToViewport } from '@/composables/helpers/clamp-rect-to-viewport.helper';
import { trackPointerGesture } from '@/composables/helpers/track-pointer-gesture.helper';
import { usePlaybackSession } from '@/composables/use-playback-session/use-playback-session';
import { usePopoutSettingsStore } from '@/stores/widgets/popout-settings/popout-settings.store';
import type { ResizeDirection } from '@/types/resize-direction.model';

import { POPUP_ANCHOR_STYLES } from '../../popup-anchor-styles.constant';
import {
  FLOATING_MEDIA_BAR_HEIGHT_PX,
  MIN_PLAYER_MEDIA_HEIGHT_PX,
  MIN_PLAYER_MEDIA_WIDTH_PX,
} from './player-media-floor.constant';
import type { PopupGeometryControls } from './use-popup-geometry.types';

/** Smallest popup: media ≥360×200px even with the media bar visible. */
const MIN_POPUP_WIDTH_PX = MIN_PLAYER_MEDIA_WIDTH_PX;
const MIN_POPUP_HEIGHT_PX =
  MIN_PLAYER_MEDIA_HEIGHT_PX + FLOATING_MEDIA_BAR_HEIGHT_PX;
const VIEWPORT_MARGIN_PX = 16;
const OPACITY_SNAP_STEP_PERCENT = 25;
const OPACITY_SNAP_THRESHOLD_PERCENT = 3;

/**
 * Own popup DOM gestures while the playback session owns numeric geometry.
 * Pointer capture keeps drag/resize completion on the original target, and
 * gesture completion is the only point where geometry is persisted.
 */
export function usePopupGeometry(): PopupGeometryControls {
  const playback = usePlaybackSession();
  const popoutSettingsStore = usePopoutSettingsStore();

  const popupStyle = computed<Record<string, string>>(() => {
    const rect = playback.floatingPopupRect.value;
    return {
      opacity: String(playback.floatingPopupOpacity.value),
      ...(rect
        ? {
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }
        : POPUP_ANCHOR_STYLES[popoutSettingsStore.popoutAnchor]),
    };
  });

  /** Capture a DOM box as plain numeric playback data. */
  function capturePopupRect(popup: HTMLElement): FloatingPopupRect {
    const rect = popup.getBoundingClientRect();
    const captured = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    playback.setFloatingPopupRect(captured);
    return captured;
  }

  function startDrag(event: PointerEvent): void {
    const bar = event.currentTarget;
    if (!(bar instanceof HTMLElement)) return;
    const popup = bar.parentElement;
    if (!popup) return;

    const startRect = capturePopupRect(popup);
    const offsetX = event.clientX - startRect.x;
    const offsetY = event.clientY - startRect.y;

    trackPointerGesture(
      bar,
      event,
      (move) => {
        playback.setFloatingPopupRect(
          clampRectToViewport({
            ...startRect,
            x: move.clientX - offsetX,
            y: move.clientY - offsetY,
          }),
        );
      },
      playback.rememberFloatingPopupRect,
    );
  }

  /** Resize from any edge/corner while preserving the popup aspect ratio. */
  function startResize(direction: ResizeDirection, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    if (!(handle instanceof HTMLElement)) return;
    const popup = handle.parentElement;
    if (!popup) return;

    const start = capturePopupRect(popup);
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

        playback.setFloatingPopupRect(
          clampRectToViewport({
            x: direction.includes('w')
              ? start.x + (start.width - width)
              : start.x,
            y: direction.includes('n')
              ? start.y + (start.height - height)
              : start.y,
            width,
            height,
          }),
        );
      },
      playback.rememberFloatingPopupRect,
    );
  }

  /** Set opacity percent with snapping only near each quarter step. */
  function setOpacity(percent: number): void {
    const snapped =
      Math.round(percent / OPACITY_SNAP_STEP_PERCENT) *
      OPACITY_SNAP_STEP_PERCENT;
    const withinSnapZone =
      Math.abs(percent - snapped) <= OPACITY_SNAP_THRESHOLD_PERCENT;
    playback.setFloatingPopupOpacity(
      (withinSnapZone ? snapped : percent) / 100,
    );
  }

  return { popupStyle, startDrag, startResize, setOpacity };
}
