import { computed } from 'vue';

import { useHealthReady } from '../../../api/queries/use-health-ready.query';

const TRACKED_KEYS = [
  'disk',
  'ollama',
  'memory_heap',
  'memory_rss',
  'postgres',
  'minio',
] as const;

export interface HealthTileViewModel {
  key: string;
  status: string;
  loading: boolean;
  error: boolean;
}

export function useSysctlHealthTiles() {
  const {
    data: readyData,
    isLoading: readyLoading,
    isError: readyError,
  } = useHealthReady();

  const tiles = computed<HealthTileViewModel[]>(() => {
    const result: HealthTileViewModel[] = [];

    if (readyLoading.value) {
      TRACKED_KEYS.forEach((key) =>
        result.push({ key, status: 'loading', loading: true, error: false }),
      );
    } else if (readyError.value) {
      TRACKED_KEYS.forEach((key) =>
        result.push({ key, status: 'unknown', loading: false, error: true }),
      );
    } else {
      const info = readyData.value?.info ?? {};
      const details = readyData.value?.details ?? {};
      const errors = readyData.value?.error ?? {};
      const errorKeys = new Set(Object.keys(errors));
      Object.entries(info).forEach(([key, val]) => {
        const detailStatus = (details[key] as { status?: string } | undefined)
          ?.status;
        const infoStatus = (val as { status?: string } | undefined)?.status;
        result.push({
          key,
          status: detailStatus ?? infoStatus ?? 'unknown',
          loading: false,
          error: errorKeys.has(key),
        });
      });
    }

    return result;
  });

  return { tiles };
}
