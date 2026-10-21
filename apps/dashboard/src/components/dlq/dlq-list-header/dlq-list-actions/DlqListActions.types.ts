export interface DlqListActionsProps {
  /** Active status filter ('' = all statuses). */
  filterStatus: string;
  /** Active search filter ('' = no search). */
  filterSearch: string;
  /** Whether read entries are hidden from the list. */
  hideRead: boolean;
  /** Whether the list is reloading (spinner inside the reload button). */
  showLoading: boolean;
}

export interface DlqListActionsEmits {
  /** Reload the list. */
  (e: 'reload'): void;
  /** Status filter picked ('' clears it). */
  (e: 'update:filterStatus', value: string): void;
  /** Search filter committed ('' clears it). */
  (e: 'update:filterSearch', value: string): void;
  /** Read-visibility toggled. */
  (e: 'update:hideRead', value: boolean): void;
}
