import type { LucideIcon } from '@lucide/vue';

export interface MenuButtonProps {
  /**
   * Accessible label of the button; also the tooltip text when `tooltip`
   * is omitted.
   */
  label: string;
  /**
   * Lucide icon rendered at 1rem inside the square. When omitted, the
   * label renders as inline mono text instead.
   */
  icon?: LucideIcon;
  /**
   * Tooltip text shown on hover. Defaults to the label — set it only when
   * the tooltip should say something more than the label.
   */
  tooltip?: string;
  /**
   * Engaged action state (aria-pressed): keeps accent color and the accent
   * underline.
   */
  active?: boolean;
  /**
   * Tab selection state (role="tab" + aria-selected): same accent look as
   * `active`. MenuTabs sets this for the selected tab.
   */
  selected?: boolean;
  /**
   * Renders the button grayed out (e.g. a feature whose backing engine is
   * disabled). The button stays clickable — muted is a hint, not a lock.
   */
  muted?: boolean;
  /** Disable the button. */
  disabled?: boolean;
}

export interface MenuButtonEmits {
  /** The button was clicked. */
  click: [];
}
