import { useMutation, type UseMutationReturnType } from '@tanstack/vue-query';

import { getApiUrl } from '../api-url';

export function useDeleteDlqMutation(): UseMutationReturnType<
  void,
  Error,
  string,
  unknown
> {
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/api/v1/dlq/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
    },
  });
}
