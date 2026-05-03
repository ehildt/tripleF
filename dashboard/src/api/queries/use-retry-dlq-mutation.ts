import { useMutation, type UseMutationReturnType } from '@tanstack/vue-query';

import { getApiUrl } from '../api-url';

export function useRetryDlqMutation(): UseMutationReturnType<
  { restored: number; requestIds: string[] },
  Error,
  string,
  unknown
> {
  return useMutation<{ restored: number; requestIds: string[] }, Error, string>(
    {
      mutationFn: async (requestId: string) => {
        const res = await fetch(getApiUrl('/api/v1/dlq/reinstate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestIds: [requestId] }),
        });
        if (!res.ok) throw new Error('Retry failed');
        return res.json() as Promise<{
          restored: number;
          requestIds: string[];
        }>;
      },
    },
  );
}
