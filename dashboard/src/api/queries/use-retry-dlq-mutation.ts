import { useMutation, type UseMutationReturnType } from '@tanstack/vue-query';

import { getApiUrl } from '../api-url';

export function useRetryDlqMutation(): UseMutationReturnType<
  { restored: number; ids: string[] },
  Error,
  string,
  unknown
> {
  return useMutation<{ restored: number; ids: string[] }, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl('/api/v1/dlq/reinstate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error('Retry failed');
      return res.json() as Promise<{ restored: number; ids: string[] }>;
    },
  });
}
