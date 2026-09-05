import { computed } from 'vue';

import { useHealthReady } from '../../../api/queries/use-health-ready.query';
import { buildHealthTiles } from '../helpers/build-health-tiles.helper';
import type { HealthTileViewModel } from '../types/health-tile-view-model.type';

const TRACKED_KEYS = [
  'disk',
  'ollama',
  'memory_heap',
  'memory_rss',
  'postgres',
  'minio',
] as const;

export function useSettingsHealthTiles() {
  const {
    data: readyData,
    isLoading: readyLoading,
    isError: readyError,
  } = useHealthReady();

  const tiles = computed<HealthTileViewModel[]>(() =>
    buildHealthTiles(
      readyData.value,
      readyLoading.value,
      readyError.value,
      TRACKED_KEYS,
    ),
  );

  return { tiles };
}
