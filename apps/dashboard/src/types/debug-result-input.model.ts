import type { DebugResult } from './debug.model';

export type DebugResultInput = Omit<DebugResult, 'id' | 'epoch' | 'direction'> &
  Partial<Pick<DebugResult, 'direction'>>;
