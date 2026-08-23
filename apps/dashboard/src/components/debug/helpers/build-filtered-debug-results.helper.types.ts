export type DebugResultFilter = 'all' | 'http' | 'socket';

export interface BuildFilteredDebugResultsOptions {
  filter: DebugResultFilter;
  hideRead: boolean;
  search: string;
  isRead: (id: string) => boolean;
}
