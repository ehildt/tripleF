import type { CSSProperties, Ref } from 'vue';

import type { TooltipProps } from '../Tooltip.types';

/** Tooltip props after the component's position and disabled defaults apply. */
export type TooltipBehaviorProps = TooltipProps &
  Required<Pick<TooltipProps, 'disabled' | 'positions'>>;

/** State and actions rendered by one tooltip component instance. */
export interface TooltipBehavior {
  /** Whether hover or focus has requested the visible panel state. */
  isVisible: Ref<boolean>;
  /** Fixed viewport coordinates applied to the tooltip panel. */
  panelStyle: Ref<CSSProperties>;
  /** Reveal the tooltip unless disabled and measure its current position. */
  showTooltip: () => void;
  /** Hide the tooltip after pointer or focus leaves the trigger. */
  hideTooltip: () => void;
}
