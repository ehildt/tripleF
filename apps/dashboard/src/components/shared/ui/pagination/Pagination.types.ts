export interface PaginationProps {
  /** The active page (1-based). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total number of items across all pages. */
  total: number;
  /** Page size. */
  limit: number;
  /** Offset of the first item on the current page. */
  offset: number;
}

export interface PaginationEmits {
  /** Go to the previous page. */
  prev: [];
  /** Go to the next page. */
  next: [];
  /** Jump to the first page. */
  first: [];
  /** Jump to the last page. */
  last: [];
  /** Jump to an exact page number. */
  page: [page: number];
  /** Change the page size. */
  setPageSize: [size: number];
}
