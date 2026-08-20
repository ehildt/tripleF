import type { LucideIcon } from '@lucide/vue';

export interface SectionHeaderProps {
  /** The section icon (a lucide component). */
  icon: LucideIcon;
  /** The section title (already translated by the caller). */
  title: string;
}
