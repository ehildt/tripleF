import type { LucideIcon } from '@lucide/vue';

export interface CapabilityRow {
  icon?: LucideIcon;
  label: string;
  value: string;
  /** Tint the value with a status color (e.g. a billing warning). */
  tone?: 'warning';
}

export interface CapabilityStatus {
  icon?: LucideIcon;
  label: string;
  available: boolean;
}
