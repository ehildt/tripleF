import type { LucideIcon } from '@lucide/vue';

/**
 * The capability metadata rows (label/icon/value triples) and endpoint
 * statuses the panel lists.
 */
export interface CapabilitiesPanelProps {
  /** Metadata rows of the provider account (icon tile + label + value). */
  rows?: CapabilityRow[];
  /** Optional available/not-in-plan endpoint statuses. */
  statuses?: CapabilityStatus[];
}

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
