import type { DlqStatusFilter } from '@/types/dlq-status.model';

export interface DlqListActionsProps {
  /** Active status filter ('' = all statuses). */
  filterStatus: DlqStatusFilter;
  /** Whether read entries are hidden from the list. */
  hideRead: boolean;
  /** Whether the list is reloading (pulses the reload icon). */
  showLoading: boolean;
}

export interface DlqListActionsEmits {
  /** Reload the list. */
  (e: 'reload'): void;
  /** Status filter picked ('' clears it). */
  (e: 'update:filterStatus', value: DlqStatusFilter): void;
  /** Read-visibility toggled. */
  (e: 'update:hideRead', value: boolean): void;
}
