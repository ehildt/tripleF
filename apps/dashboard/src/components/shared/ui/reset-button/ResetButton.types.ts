export interface ResetButtonProps {
  /** Tooltip/a11y label (default 'Reset to defaults'). */
  title?: string;
  /** Disable the button. */
  disabled?: boolean;
}

export interface ResetButtonEmits {
  /** The reset action was clicked. */
  click: [];
}
