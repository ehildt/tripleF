import { useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

import type { DlqListResponse } from '../../types/dlq-list-response.model';
import type { DlqQueryParams } from '../../types/dlq-query-params.model';
import { getApiUrl } from '../api-url';
import { buildDlqQueryString } from './helpers/build-dlq-query-string.helper';

export function useDlqQuery(
  params: () => DlqQueryParams,
): UseQueryReturnType<DlqListResponse, Error> {
  return useQuery<DlqListResponse, Error>({
    queryKey: ['dlq', params],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        getApiUrl(`/api/v1/dlq${buildDlqQueryString(params())}`),
        { signal },
      );
      if (!res.ok) throw new Error('Failed to fetch DLQ entries');
      return res.json() as Promise<DlqListResponse>;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
