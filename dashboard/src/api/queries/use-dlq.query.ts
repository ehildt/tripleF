import {
  useMutation,
  type UseMutationReturnType,
  useQuery,
  type UseQueryReturnType,
} from '@tanstack/vue-query';

import type {
  DlqListResponse,
  DlqQueryParams,
  VisionDlq,
} from '../../types/vision-dlq.model';
import { getApiUrl } from '../api-url';

function buildQueryString(params: DlqQueryParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.queueName) search.set('queueName', params.queueName);
  if (params.requestId) search.set('requestId', params.requestId);
  if (params.search) search.set('search', params.search);
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.offset !== undefined) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function useDlqQuery(
  params: () => DlqQueryParams,
): UseQueryReturnType<DlqListResponse, Error> {
  return useQuery<DlqListResponse, Error>({
    queryKey: ['dlq', params],
    queryFn: async () => {
      const res = await fetch(
        getApiUrl(`/api/v1/jobs/failed${buildQueryString(params())}`),
      );
      if (!res.ok) throw new Error('Failed to fetch DLQ entries');
      return res.json() as Promise<DlqListResponse>;
    },
  });
}

export function useRetryDlqMutation(): UseMutationReturnType<
  { restored: number; requestIds: string[] },
  Error,
  string,
  unknown
> {
  return useMutation<{ restored: number; requestIds: string[] }, Error, string>(
    {
      mutationFn: async (requestId: string) => {
        const res = await fetch(getApiUrl('/api/v1/jobs/failed/reinstate'), {
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
      const res = await fetch(getApiUrl('/api/v1/jobs/failed/reinstate'), {
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

export function useDeleteDlqMutation(): UseMutationReturnType<
  void,
  Error,
  string,
  unknown
> {
  return useMutation<void, Error, string>({
    mutationFn: async (requestId: string) => {
      const res = await fetch(getApiUrl(`/api/v1/jobs/failed/${requestId}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
    },
  });
}

export function useUpdateDlqMutation(): UseMutationReturnType<
  VisionDlq,
  Error,
  { requestId: string; data: Record<string, unknown> },
  unknown
> {
  return useMutation<
    VisionDlq,
    Error,
    { requestId: string; data: Record<string, unknown> }
  >({
    mutationFn: async ({ requestId, data }) => {
      const res = await fetch(getApiUrl(`/api/v1/jobs/failed/${requestId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json() as Promise<VisionDlq>;
    },
  });
}
