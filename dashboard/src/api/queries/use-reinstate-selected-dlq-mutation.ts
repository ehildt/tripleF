import { useMutation, type UseMutationReturnType } from '@tanstack/vue-query';

import { getApiUrl } from '../api-url';

export function useReinstateSelectedDlqMutation(): UseMutationReturnType<
  { restored: number; requestIds: string[] },
  Error,
  string[],
  unknown
> {
  return useMutation<
    { restored: number; requestIds: string[] },
    Error,
    string[]
  >({
    mutationFn: async (requestIds: string[]) => {
      const res = await fetch(getApiUrl('/api/v1/dlq/reinstate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds }),
      });
      if (!res.ok) throw new Error('Reinstate selected failed');
      return res.json() as Promise<{
        restored: number;
        requestIds: string[];
      }>;
    },
  });
}
