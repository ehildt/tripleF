export interface DlqListHeaderProps {
  /** Whether the reload spinner is currently showing. */
  showLoading: boolean;
  /** Active status filter ('' for unfiltered). */
  filterStatus: string;
  /** Active free-text search filter ('' for unfiltered). */
  filterSearch: string;
  /** Whether already-read entries are currently hidden from the list. */
  hideRead: boolean;
  /** Total number of entries matching the current filters. */
  total: number;
  /** Current 1-based page number. */
  currentPage: number;
  /** Total number of pages for the current filters and page size. */
  totalPages: number;
  /** Page size (entries per page). */
  limit: number;
  /** Offset of the first entry on the current page. */
  offset: number;
}
