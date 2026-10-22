export interface PowerToggleProps {
  /** The on/off state the toggle shows. */
  enabled: boolean;
  /** Disable the toggle control. */
  disabled?: boolean;
  /** Tooltip/a11y label (default 'Toggle enabled'). */
  title?: string;
  /** Accent tone of the enabled state (default 'accent'). */
  tone?: 'accent' | 'preprocessing';
}

export interface PowerToggleEmits {
  /** The user flipped the toggle. */
  toggle: [];
}
