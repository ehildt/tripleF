import type { LucideIcon } from '@lucide/vue';

export interface SpaceHeaderProps {
  /** Header icon tile glyph. */
  icon: LucideIcon;
  /** Header label (the space name). */
  label: string;
  /** Header description (what this space stores). */
  description: string;
}
