import type { LucideIcon } from '@lucide/vue';

/** Props for `ChartToggle`, a single icon button in a chart toggle group. */
export interface ChartToggleProps {
  /** Whether the toggle is in its active (pressed) state. */
  active?: boolean;
  /** Disables the toggle (e.g. heatmap variants while volume is histogram). */
  disabled?: boolean;
  /** Tooltip and accessible name for the toggle. */
  label: string;
  /** Icon rendered inside the toggle. */
  icon: LucideIcon;
}
