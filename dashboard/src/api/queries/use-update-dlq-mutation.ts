import { useMutation, type UseMutationReturnType } from '@tanstack/vue-query';

import type { DlqEntry } from '../../types/dlq-entry.model';
import { getApiUrl } from '../api-url';

export function useUpdateDlqMutation(): UseMutationReturnType<
  DlqEntry,
  Error,
  { requestId: string; data: Record<string, unknown> },
  unknown
> {
  return useMutation<
    DlqEntry,
    Error,
    { requestId: string; data: Record<string, unknown> }
  >({
    mutationFn: async ({ requestId, data }) => {
      const res = await fetch(getApiUrl(`/api/v1/dlq/${requestId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json() as Promise<DlqEntry>;
    },
  });
}
