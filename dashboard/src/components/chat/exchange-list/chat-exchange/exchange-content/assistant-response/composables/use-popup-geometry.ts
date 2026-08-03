import { computed } from 'vue';

import { clampRectToViewport } from './helpers/clamp-rect-to-viewport.helper';
import { trackPointerGesture } from './helpers/track-pointer-gesture.helper';
import {
  floatingPopupRect,
  type PopoutAnchor,
  popoutAnchor,
  rememberFloatingPopupRect,
} from './popout-settings.state';
import { floatingPopupOpacity } from './video-playback.state';

/** Edges and corners the popup can be resized from. */
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_POPUP_WIDTH_PX = 240;
const MIN_POPUP_HEIGHT_PX = 160;
const VIEWPORT_MARGIN_PX = 16;
const OPACITY_SNAP_STEP_PERCENT = 25;
const OPACITY_SNAP_THRESHOLD_PERCENT = 3;

/**
 * Symmetric popout edge inset (rem) for anchored positions: a corner popout
 * sits the same distance from its two adjacent screen edges (e.g. top-left
 * is 3rem down AND 3rem in). Centered anchors use the same inset along the
 * offset axis. The transform drops away as soon as a remembered rect
 * replaces the anchor styles.
 */
const EDGE_INSET_REM = 3;

const INSET = `${EDGE_INSET_REM}rem`;

/**
 * CSS anchoring per configured initial popout position, with equal distance
 * to the adjacent screen edges for symmetry. Centered anchors use translate
 * offsets.
 */
export const ANCHOR_STYLES: Record<PopoutAnchor, Record<string, string>> = {
  'top-left': { left: INSET, top: INSET },
  'top-center': { left: '50%', top: INSET, transform: 'translateX(-50%)' },
  'top-right': { right: INSET, top: INSET },
  'middle-left': { left: INSET, top: '50%', transform: 'translateY(-50%)' },
  'middle-center': {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  'middle-right': { right: INSET, top: '50%', transform: 'translateY(-50%)' },
  'bottom-left': { left: INSET, bottom: INSET },
  'bottom-center': {
    left: '50%',
    bottom: INSET,
    transform: 'translateX(-50%)',
  },
  'bottom-right': { right: INSET, bottom: INSET },
};

/**
 * Shared geometry for the floating video popup: anchored at the configured
 * corner (SysCtl → Popout) until the user moves it. While position memory is
 * on, the geometry persists across players, conversations, and app reloads;
 * otherwise every popout opens at the initial anchor. Dragging keeps the
 * position, resizing keeps the aspect ratio.
 */
export function usePopupGeometry() {
  const popupStyle = computed(() => {
    const style: Record<string, string> = {
      opacity: String(floatingPopupOpacity.value),
      ...(floatingPopupRect.value
        ? {
            left: `${floatingPopupRect.value.x}px`,
            top: `${floatingPopupRect.value.y}px`,
            width: `${floatingPopupRect.value.width}px`,
            height: `${floatingPopupRect.value.height}px`,
          }
        : ANCHOR_STYLES[popoutAnchor.value]),
    };

    return style;
  });

  /** Snapshot the popup's current box into the shared geometry state. */
  function capturePopupRect(popup: HTMLElement) {
    const rect = popup.getBoundingClientRect();
    floatingPopupRect.value = {
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
    const startRect = { ...floatingPopupRect.value! };
    const offsetX = event.clientX - startRect.x;
    const offsetY = event.clientY - startRect.y;

    trackPointerGesture(
      bar,
      event,
      (move) => {
        floatingPopupRect.value = clampRectToViewport({
          ...startRect,
          x: move.clientX - offsetX,
          y: move.clientY - offsetY,
        });
      },
      rememberFloatingPopupRect,
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
    const start = { ...floatingPopupRect.value! };
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

        floatingPopupRect.value = clampRectToViewport({
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
      rememberFloatingPopupRect,
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
    floatingPopupOpacity.value = (withinSnapZone ? snapped : percent) / 100;
  }

  return { popupStyle, startDrag, startResize, setOpacity };
}
