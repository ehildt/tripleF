import type { LucideIcon } from '@lucide/vue';

/** One selectable option of a `ChartToggleGroup`. */
export interface ChartToggleOption<T extends string = string> {
  /** Stable id used as the v-model value. */
  id: T;
  /** i18n key for the toggle's tooltip and accessible name. */
  labelKey: string;
  /** Icon shown in the toggle. */
  icon: LucideIcon;
}

/** Props for `ChartToggleGroup`, a labelled row of related chart toggles. */
export interface ChartToggleGroupProps<T extends string = string> {
  /** Accessible name for the group (e.g. "Price style"). */
  groupLabel: string;
  /** Options rendered left to right. */
  options: ChartToggleOption<T>[];
  /** Disables every toggle in the group (and hides the active state). */
  disabled?: boolean;
}
