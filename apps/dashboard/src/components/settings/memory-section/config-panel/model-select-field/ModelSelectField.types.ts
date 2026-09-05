export interface ModelSelectFieldProps {
  /**
   * Current model override; an empty value stands for the env baseline and
   * renders as the "Default" option. Defaults to ''.
   */
  modelValue?: string;
  /** Catalog model names offered as options (below the default). */
  options: readonly string[];
}

export interface ModelSelectFieldEmits {
  /**
   * Emitted with the picked model name, or '' when the user picks the
   * env-baseline default (the override is cleared).
   */
  (e: 'update:modelValue', value: string): void;
}
