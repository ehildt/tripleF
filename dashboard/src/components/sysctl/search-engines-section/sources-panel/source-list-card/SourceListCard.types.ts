import type { LucideIcon } from '@lucide/vue';

export interface SourceListCardProps {
  /** Source entries (hostnames, *.globs, or /regex/ patterns) — one per line. */
  list: readonly string[];
  /** Icon glyph in the header tile. */
  icon: LucideIcon;
  /** Header label, e.g. "Preferred sources". */
  label: string;
  /** One-line hint under the label. */
  description: string;
  /** Reset-button tooltip (also its a11y label). */
  resetTitle: string;
  /** Textarea placeholder: example entries, one per line. */
  placeholder: string;
}

export interface SourceListCardEmits {
  /** Parsed source list, committed on the textarea change event. */
  change: [list: string[]];
  reset: [];
}
