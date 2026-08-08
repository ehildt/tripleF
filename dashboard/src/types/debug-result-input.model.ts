import type { DebugResult } from './debug.model';

export type DebugResultInput = Omit<
  DebugResult,
  'id' | 'timestamp' | 'direction'
>;
