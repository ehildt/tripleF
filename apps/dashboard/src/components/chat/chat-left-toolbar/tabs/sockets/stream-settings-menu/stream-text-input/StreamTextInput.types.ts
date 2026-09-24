import type { LucideIcon } from '@lucide/vue';

export interface StreamTextInputProps {
  /** The field's current value. */
  modelValue: string;
  /** Input name (used by forms/testing). */
  name: string;
  /** Placeholder text (already translated by the caller). */
  placeholder: string;
  /** Leading icon (a lucide component). */
  icon: LucideIcon;
}
