import {
  type CSSProperties,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
} from 'vue';

import type { TooltipPosition } from '../Tooltip.types';
import type {
  TooltipBehavior,
  TooltipBehaviorProps,
} from './use-tooltip.types';

const TOOLTIP_GAP = 6;
const TOOLTIP_VIEWPORT_MARGIN = 4;

interface TooltipCoordinates {
  /** Distance from the viewport's top edge, in CSS pixels. */
  top: number;
  /** Distance from the viewport's left edge, in CSS pixels. */
  left: number;
}

/** Own one tooltip instance's visibility and fixed-panel positioning. */
export function useTooltip(props: TooltipBehaviorProps): TooltipBehavior {
  const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef');
  const panelRef = useTemplateRef<HTMLElement>('panelRef');
  const isVisible = ref(false);
  const panelStyle = ref<CSSProperties>({});

  /** Return the first element child of the display-contents wrapper. */
  function getTriggerElement(): Element | null {
    const wrapper = wrapperRef.value;
    if (!wrapper) return null;
    const child = wrapper.firstElementChild;
    // Accept any Element, not just HTMLElement: lucide icons render an <svg>
    // (an SVGElement), which is not an HTMLElement — rejecting it left icon
    // tooltips unpositioned at the top-left corner.
    return child instanceof Element ? child : null;
  }

  /** Calculate the fixed panel coordinates for one allowed position. */
  function calcTooltipCoordinates(
    position: TooltipPosition,
    triggerBounds: DOMRect,
    panelBounds: DOMRect,
  ): TooltipCoordinates {
    let top = 0;
    let left = 0;
    switch (position) {
      case 'top':
        top = triggerBounds.top - panelBounds.height - TOOLTIP_GAP;
        left =
          triggerBounds.left + triggerBounds.width / 2 - panelBounds.width / 2;
        break;
      case 'bottom':
        top = triggerBounds.bottom + TOOLTIP_GAP;
        left =
          triggerBounds.left + triggerBounds.width / 2 - panelBounds.width / 2;
        break;
      case 'left':
        top =
          triggerBounds.top + triggerBounds.height / 2 - panelBounds.height / 2;
        left = triggerBounds.left - panelBounds.width - TOOLTIP_GAP;
        break;
      case 'right':
        top =
          triggerBounds.top + triggerBounds.height / 2 - panelBounds.height / 2;
        left = triggerBounds.right + TOOLTIP_GAP;
        break;
      case 'center':
        top =
          triggerBounds.top + triggerBounds.height / 2 - panelBounds.height / 2;
        left =
          triggerBounds.left + triggerBounds.width / 2 - panelBounds.width / 2;
        break;
    }
    return { top, left };
  }

  /** Whether the panel fits fully inside the viewport with a small margin. */
  function isTooltipWithinViewport(
    coordinates: TooltipCoordinates,
    panelBounds: DOMRect,
  ): boolean {
    return (
      coordinates.top >= TOOLTIP_VIEWPORT_MARGIN &&
      coordinates.left >= TOOLTIP_VIEWPORT_MARGIN &&
      coordinates.top + panelBounds.height <=
        window.innerHeight - TOOLTIP_VIEWPORT_MARGIN &&
      coordinates.left + panelBounds.width <=
        window.innerWidth - TOOLTIP_VIEWPORT_MARGIN
    );
  }

  /** Keep the panel inside the viewport when no allowed side has room. */
  function clampTooltipToViewport(
    coordinates: TooltipCoordinates,
    panelBounds: DOMRect,
  ): TooltipCoordinates {
    const maxTop =
      window.innerHeight - panelBounds.height - TOOLTIP_VIEWPORT_MARGIN;
    const maxLeft =
      window.innerWidth - panelBounds.width - TOOLTIP_VIEWPORT_MARGIN;
    return {
      top: Math.max(TOOLTIP_VIEWPORT_MARGIN, Math.min(coordinates.top, maxTop)),
      left: Math.max(
        TOOLTIP_VIEWPORT_MARGIN,
        Math.min(coordinates.left, maxLeft),
      ),
    };
  }

  function updatePanelStyle(): void {
    const trigger = getTriggerElement();
    const panel = panelRef.value;
    if (!trigger || !panel) return;
    const triggerBounds = trigger.getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();

    // Pick the first allowed side that has room; otherwise fall back to the
    // first allowed side. Either way, clamp so the panel never leaves the
    // viewport (e.g. a wide panel at the screen edge).
    let coordinates = calcTooltipCoordinates(
      props.positions[0],
      triggerBounds,
      panelBounds,
    );
    for (const candidate of props.positions) {
      const candidateCoordinates = calcTooltipCoordinates(
        candidate,
        triggerBounds,
        panelBounds,
      );
      if (isTooltipWithinViewport(candidateCoordinates, panelBounds)) {
        coordinates = candidateCoordinates;
        break;
      }
    }
    const clampedCoordinates = clampTooltipToViewport(coordinates, panelBounds);
    panelStyle.value = {
      top: `${clampedCoordinates.top}px`,
      left: `${clampedCoordinates.left}px`,
    };
  }

  function showTooltip(): void {
    if (props.disabled) return;
    isVisible.value = true;
    // Measure against the current layout immediately on show.
    updatePanelStyle();
  }

  function hideTooltip(): void {
    isVisible.value = false;
  }

  /** Keep a visible panel glued to its trigger across resize and scroll. */
  function repositionVisibleTooltip(): void {
    if (isVisible.value) updatePanelStyle();
  }

  onMounted(() => {
    window.addEventListener('resize', repositionVisibleTooltip);
    // Capture phase catches scrolls in any scrollable container, not just the
    // window, so the panel follows the trigger wherever it moves.
    window.addEventListener('scroll', repositionVisibleTooltip, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', repositionVisibleTooltip);
    window.removeEventListener('scroll', repositionVisibleTooltip, true);
  });

  return {
    isVisible,
    panelStyle,
    showTooltip,
    hideTooltip,
  };
}
