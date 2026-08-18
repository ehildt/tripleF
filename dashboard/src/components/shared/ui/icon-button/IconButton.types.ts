import type { TooltipPosition } from '../tooltip/Tooltip.types';

export interface IconButtonProps {
  /** Tooltip text shown on hover/focus. Also the aria-label fallback. */
  title?: string;
  /** Explicit aria-label; overrides the `title` fallback. */
  ariaLabel?: string;
  /** Accent highlight (menu open, toggle on). */
  active?: boolean;
  /** Blocks interaction, dims the button, and suppresses the tooltip. */
  disabled?: boolean;
  /** Destructive hover tint (e.g. delete/clear actions). */
  danger?: boolean;
  /** Destructive confirm state: pulsing red until the second click. */
  armed?: boolean;
  /** Attention cue: pulsing accent ring until the state clears. */
  blinking?: boolean;
  /** Toggle semantics for the accessibility tree (`aria-pressed`). */
  ariaPressed?: boolean;
  /**
   * Icon/padding scale: 'md' (default) for toolbars and headers, 'sm' for
   * compact row actions (list items, toasts, menu rows).
   */
  size?: 'sm' | 'md';
  /** Tooltip sides in priority order; forwarded to the Tooltip (default: top). */
  tooltipPositions?: TooltipPosition[];
}
