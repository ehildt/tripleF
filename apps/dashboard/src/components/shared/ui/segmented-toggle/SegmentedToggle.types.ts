import type { LucideIcon } from '@lucide/vue';

export interface SegmentedToggleOption {
  /** The option's submitted value. */
  value: string;
  /** Icon glyph for the segment button. */
  icon: LucideIcon;
  /** Tooltip text for the segment button. */
  tooltip: string;
}

export interface SegmentedToggleProps {
  /** The segments, exactly one active at a time. */
  options: readonly SegmentedToggleOption[];
  /** The active segment's value (v-model). */
  modelValue: string;
  /** Accessible label for the toggle group. */
  ariaLabel?: string;
}

export interface SegmentedToggleEmits {
  /** Segment value change (v-model). */
  'update:modelValue': [value: string];
}
