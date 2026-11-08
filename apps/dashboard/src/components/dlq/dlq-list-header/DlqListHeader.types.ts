import type { DlqStatusFilter } from '@/types/dlq-status.model';

export interface DlqListHeaderProps {
  /** Whether the reload icon is currently pulsing. */
  showLoading: boolean;
  /** Active status filter ('' for unfiltered). */
  filterStatus: DlqStatusFilter;
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
