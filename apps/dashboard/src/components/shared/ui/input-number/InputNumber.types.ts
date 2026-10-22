export interface InputNumberProps {
  /** The numeric value (v-model). */
  modelValue: number;
  /** Placeholder text. */
  placeholder?: string;
  /** Disable the input. */
  disabled?: boolean;
  /** Native step attribute. */
  step?: number | string;
  /** Native min attribute. */
  min?: number | string;
  /** Native max attribute. */
  max?: number | string;
  /** Stable id for the field. Auto-generated if omitted. */
  id?: string;
  /** Name attribute, aids browser autofill. */
  name?: string;
}

export interface InputNumberEmits {
  /** The numeric value (v-model update). */
  'update:modelValue': [value: number];
}
