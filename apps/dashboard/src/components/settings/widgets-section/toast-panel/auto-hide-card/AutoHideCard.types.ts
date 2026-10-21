import type { LucideIcon } from '@lucide/vue';

export interface AutoHideCardProps {
  /** Icon rendered in the tile at the start of the card. */
  icon: LucideIcon;
  /** Short mono label identifying the setting. */
  label: string;
  /** One-line explanation rendered under the label, truncated with a tooltip. */
  description?: string;
  /** Whether auto-hide is on (the leading checkbox). */
  checked: boolean;
  /** Accessible label of the leading checkbox. */
  checkboxAriaLabel: string;
  /** Seconds a toast stays visible before hiding (the trailing stepper). */
  seconds: number;
  /** Master switch off — dims the whole card and blocks every interaction. */
  disabled?: boolean;
}

export interface AutoHideCardEmits {
  /** Leading checkbox clicked. */
  (e: 'toggle'): void;
  /** Duration stepper committed a new seconds value. */
  (e: 'update:seconds', value: number): void;
}
