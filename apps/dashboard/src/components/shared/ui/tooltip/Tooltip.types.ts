export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TooltipProps {
  /** Text shown inside the glassy panel. */
  text: string;
  /**
   * Allowed sides, in priority order. The first side with room in the
   * viewport is used; if none fit, the first entry is used anyway.
   */
  positions?: TooltipPosition[];
  /** When true, no panel is rendered. */
  disabled?: boolean;
  /**
   * When set, the panel wraps at this max width (with word-break) instead
   * of staying a single nowrap line — for long titles and descriptions.
   */
  maxWidth?: string;
  /**
   * How long the pointer or focus must dwell on the trigger before the
   * panel fades in, as a CSS time value (e.g. '1s', '500ms'). Leaving the
   * trigger before the delay elapses cancels the reveal, so the tooltip
   * only appears on a deliberate hover. The delay is a pure CSS
   * transition-delay on the panel — there is no timer in script.
   */
  showDelay?: string;
}
