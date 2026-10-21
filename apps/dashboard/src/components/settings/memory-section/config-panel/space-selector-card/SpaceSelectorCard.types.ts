import type { LucideIcon } from '@lucide/vue';

export interface SpaceSelectorCardProps {
  /** Icon rendered in the tile at the start of the card. */
  icon: LucideIcon;
  /** Short mono label identifying the setting. */
  label: string;
  /** One-line explanation rendered under the label, truncated with a tooltip. */
  description?: string;
  /** Previously used space ids, most-recent-first. */
  spaces: string[];
  /** The active space id; empty string = the default (partition) space. */
  activeSpace: string;
  /** Called when an existing space is picked ('' restores the default). */
  onSelect: (space: string) => void;
  /** Called when a new space id is typed and confirmed (selection = creation). */
  onCreate: (space: string) => void;
  /** Called when a space id is dropped from the history list. */
  onRemove: (space: string) => void;
}
