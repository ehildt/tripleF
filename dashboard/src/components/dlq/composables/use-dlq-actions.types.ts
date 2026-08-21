import type { UseMutationReturnType } from '@tanstack/vue-query';

import type { DlqEntry } from '@/types/dlq-entry.model';

import type { useDlqStore } from '../../../stores/dlq';
import type { DlqRetrySessionSocket } from './use-dlq-retry-session.types';

export interface DlqActionsOptions {
  dlqStore: ReturnType<typeof useDlqStore>;
  socketStore: DlqRetrySessionSocket;
  retryMutation: UseMutationReturnType<
    { restored: number; ids: string[] },
    Error,
    string,
    unknown
  >;
  deleteMutation: UseMutationReturnType<void, Error, string, unknown>;
  updateMutation: UseMutationReturnType<
    DlqEntry,
    Error,
    { id: string; data: Record<string, unknown> },
    unknown
  >;
  guardedRefetch: () => void;
}
