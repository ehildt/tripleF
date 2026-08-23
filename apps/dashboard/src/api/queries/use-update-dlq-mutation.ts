import { useMutation, type UseMutationReturnType } from '@tanstack/vue-query';

import type { DlqEntry } from '../../types/dlq-entry.model';
import { getApiUrl } from '../api-url';

export function useUpdateDlqMutation(): UseMutationReturnType<
  DlqEntry,
  Error,
  { id: string; data: Record<string, unknown> },
  unknown
> {
  return useMutation<
    DlqEntry,
    Error,
    { id: string; data: Record<string, unknown> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(getApiUrl(`/api/v1/dlq/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json() as Promise<DlqEntry>;
    },
  });
}
