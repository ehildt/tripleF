import type { DebugResultFilter } from '../../../helpers/build-filtered-debug-results.helper.types';

export interface HeaderMenuProps {
  filter: DebugResultFilter;
  search: string;
  allCount: number;
  httpCount: number;
  socketCount: number;
  hideRead?: boolean;
}
