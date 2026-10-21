import type { Component } from 'vue';

export interface DlqActionIconButtonProps {
  /** Lucide (or any) component rendered as the button's icon. */
  icon: Component;
  /** Blend between rest and accent color, 0 (rest) to 1 (full accent). */
  tint: number;
  /** Whether the button is rendered at all — action availability is parent-driven. */
  visible: boolean;
  /** Armed state for two-click destructive actions: first click arms, second executes. */
  armed?: boolean;
  /** Tooltip text and aria-label for the action. */
  title?: string;
}
