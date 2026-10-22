export interface InputSelectProps {
  /** The selected value (v-model). */
  modelValue: string;
  /** The selectable options. */
  options: string[];
  /** Placeholder when nothing is selected (default ''). */
  placeholder?: string;
  /** Disable the control. */
  disabled?: boolean;
  /** Pulse the trigger to invite a click (never while disabled). */
  blinking?: boolean;
  /** Show the error tone. */
  errored?: boolean;
  /** Whether the picked option is marked with a check icon (default true). */
  checkmark?: boolean;
  /** Optional transform applied to the displayed value and each option label. */
  formatValue?: (value: string) => string;
}

export interface InputSelectEmits {
  /** The picked value (v-model update). */
  'update:modelValue': [value: string];
}
