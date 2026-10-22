export interface CollapsiblePanelProps {
  /** The panel header title. */
  title: string;
  /** Optional item count badge next to the title. */
  count?: number;
  /** Expanded state on first mount, before any persisted choice (default true). */
  defaultExpanded?: boolean;
  /** Unique id used to persist the expanded/collapsed state (localStorage). */
  id?: string;
}
