import type { LucideIcon } from '@lucide/vue';

/**
 * Props for the stream settings text field. The field's value is the
 * component's `v-model` (declared with `defineModel` in the component), so it
 * is not part of this interface.
 */
export interface StreamTextInputProps {
  /** Input name (used by forms/testing). */
  name: string;
  /** Placeholder text (already translated by the caller). */
  placeholder: string;
  /** Leading icon (a lucide component). */
  icon: LucideIcon;
}
