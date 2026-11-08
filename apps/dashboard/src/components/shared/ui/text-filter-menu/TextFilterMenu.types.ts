import type { LucideIcon } from '@lucide/vue';

export interface TextFilterMenuProps {
  /** Whether the floating search panel is open. */
  isOpen: boolean;
  /** Whether a non-empty search filter is applied. */
  isActive: boolean;
  /** Accessible trigger label, tooltip, and input placeholder. */
  title: string;
  /** Explicit width of the floating search panel. */
  width: string;
  /** Lucide glyph rendered inside the trigger. */
  icon: LucideIcon;
}

export interface TextFilterMenuEmits {
  /** The trigger toggled the search panel. */
  (event: 'toggle'): void;
  /** The search panel requested closure. */
  (event: 'close'): void;
}
