export interface InputTextProps {
  /** The input value (v-model). */
  modelValue: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Disable the input. */
  disabled?: boolean;
  /** Visual style: `boxed` renders the standalone framed input; `borderless`
   *  drops the frame because the surrounding field box (e.g. a
   *  TextFieldCard) IS the frame. */
  variant?: 'boxed' | 'borderless';
  /** Stable id for the field. Auto-generated if omitted. */
  id?: string;
  /** Name attribute, aids browser autofill. */
  name?: string;
  /** Native autocomplete attribute (e.g. 'off' for secrets). */
  autocomplete?: string;
  /** Native spellcheck attribute. */
  spellcheck?: boolean;
}

export interface InputTextEmits {
  /** The input value (v-model update). */
  'update:modelValue': [value: string];
  /** Native change (blur/Enter commit) — the settings fields patch on commit. */
  change: [event: Event];
  /** Native focus — secret fields select their masked text on focus. */
  focus: [event: FocusEvent];
}
