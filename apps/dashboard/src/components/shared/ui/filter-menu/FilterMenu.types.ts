import type { LucideIcon } from '@lucide/vue';

export interface FilterMenuOption {
  /** The option's submitted value. */
  value: string;
  /** The option's display label. */
  label: string;
}

export interface FilterMenuProps {
  /** Whether the dropdown is currently open. */
  isOpen: boolean;
  /** Whether a non-default filter is applied. */
  isActive: boolean;
  /** Accessible trigger label and tooltip. */
  title: string;
  /** Explicit width of the floating options panel. */
  width: string;
  /** Options available for selection. */
  options: readonly FilterMenuOption[];
  /** Currently selected option value. */
  selectedValue: string;
  /** Lucide glyph rendered inside the trigger. */
  icon: LucideIcon;
}

export interface FilterMenuEmits {
  /** The trigger toggled the dropdown. */
  (event: 'toggle'): void;
  /** The dropdown requested closure. */
  (event: 'close'): void;
  /** An option was selected. */
  (event: 'select', value: string): void;
}
