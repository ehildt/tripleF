import type { LucideIcon } from '@lucide/vue';

export interface FilterMenuTriggerProps {
  /** Whether the floating filter panel is open. */
  isOpen: boolean;
  /** Whether a non-default filter is applied. */
  isActive: boolean;
  /** Accessible trigger label and tooltip. */
  title: string;
  /** Explicit width of the floating filter panel. */
  width: string;
  /** Lucide glyph rendered inside the trigger. */
  icon: LucideIcon;
}

export interface FilterMenuTriggerEmits {
  /** The trigger was clicked. */
  (event: 'toggle'): void;
  /** The transparent outside-click backdrop was clicked. */
  (event: 'close'): void;
}
