import type { DebugResult } from '../../types/debug.model';

export interface DebugProps {
  results: DebugResult[];
  selectedResult: DebugResult | null;
}
