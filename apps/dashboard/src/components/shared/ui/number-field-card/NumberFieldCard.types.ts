import type { LucideIcon } from '@lucide/vue';

export interface NumberFieldCardProps {
  /** Icon rendered in the tile at the start of the card. */
  icon?: LucideIcon;
  /** Short mono label identifying the setting. */
  label: string;
  /** One-line explanation rendered under the label, truncated with a tooltip. */
  description?: string;
  /**
   * Checked state of the on/off checkbox. Omit (undefined) to render no
   * checkbox at all — a toggleless row.
   */
  checked?: boolean;
  /**
   * Render the checkbox button (default true). Hide it to keep the checked
   * styling (accent border/background) without the box.
   */
  showCheckbox?: boolean;
  /**
   * Current number shown in the inline stepper. Omit (undefined) to render
   * no number field — a label/checkbox-only row.
   */
  numberValue?: number;
  /** Step amount of the inline stepper. */
  numberStep?: number | string;
  /** Placeholder shown when the stepper has no value. */
  numberPlaceholder?: string;
  /** Minimum accepted by the inline stepper. */
  numberMin?: number | string;
  /** Maximum accepted by the inline stepper. */
  numberMax?: number | string;
  /**
   * Disable only the inline number field — the checkbox stays clickable.
   * Unlike `disabled`, this does not dim the card or block the toggle.
   */
  numberDisabled?: boolean;
  /** Dims the whole card and blocks every interaction. */
  disabled?: boolean;
  /** Pulses the card accent to draw attention (e.g. modified values). */
  highlighted?: boolean;
  /** Accent source: the app accent or the preprocessing accent. */
  tone?: 'accent' | 'preprocessing';
}
