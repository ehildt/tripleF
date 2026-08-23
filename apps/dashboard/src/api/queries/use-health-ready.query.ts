import { useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

import { getApiUrl } from '../api-url';
import type { HealthResponse } from './use-health-ready.query.type.ts';

export function useHealthReady(): UseQueryReturnType<HealthResponse, Error> {
  return useQuery<HealthResponse, Error>({
    queryKey: ['health', 'ready'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/v1/health/ready'));
      const data = (await res.json()) as HealthResponse;
      return data;
    },
  });
}
