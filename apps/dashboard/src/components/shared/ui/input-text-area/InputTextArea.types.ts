export interface InputTextAreaProps {
  /** The textarea value (v-model). */
  modelValue: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Disable the textarea. */
  disabled?: boolean;
  /** Native rows attribute. */
  rows?: number;
  /** Stable id for the field. Auto-generated if omitted. */
  id?: string;
  /** Name attribute, aids browser autofill. */
  name?: string;
}

export interface InputTextAreaEmits {
  /** The textarea value (v-model update). */
  'update:modelValue': [value: string];
  /** Native keydown (Enter-without-Shift commits in some consumers). */
  keydown: [event: KeyboardEvent];
}
