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
