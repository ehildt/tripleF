<script setup lang="ts">
import { computed } from 'vue';

import useHealthLive from '../../api/queries/use-health-live.query';
import useHealthReady from '../../api/queries/use-health-ready.query';
import DebugPanelHeaderTitle from './DebugPanel.Header.Title.vue';
import DebugPanelHeader from './DebugPanel.Header.vue';
import HealthTile from './DebugPanel.Health.Tile.vue';
import DebugPanelLayout from './DebugPanel.Layout.vue';

const {
  data: readyData,
  isLoading: readyLoading,
  isError: readyError,
} = useHealthReady();
const {
  data: liveData,
  isLoading: liveLoading,
  isError: liveError,
} = useHealthLive();

interface HealthTileData {
  key: string;
  status: string;
  loading: boolean;
  error: boolean;
}

const tiles = computed<HealthTileData[]>(() => {
  const result: HealthTileData[] = [];

  if (readyLoading.value) {
    const keys = [
      'disk',
      'ollama',
      'memory_heap',
      'memory_rss',
      'postgres',
      'minio',
    ];
    keys.forEach((key) =>
      result.push({ key, status: 'loading', loading: true, error: false }),
    );
  } else if (readyError.value) {
    const keys = [
      'disk',
      'ollama',
      'memory_heap',
      'memory_rss',
      'postgres',
      'minio',
    ];
    keys.forEach((key) =>
      result.push({ key, status: 'unknown', loading: false, error: true }),
    );
  } else {
    const info = readyData.value?.info ?? {};
    const details = readyData.value?.details ?? {};
    Object.entries(info).forEach(([key, val]) => {
      const detailStatus = (details[key] as any)?.status;
      const infoStatus = (val as any)?.status;
      result.push({
        key,
        status: detailStatus ?? infoStatus ?? 'unknown',
        loading: false,
        error: false,
      });
    });
  }

  if (liveLoading.value) {
    result.push({
      key: 'service',
      status: 'loading',
      loading: true,
      error: false,
    });
  } else if (liveError.value) {
    result.push({
      key: 'service',
      status: 'unknown',
      loading: false,
      error: true,
    });
  } else {
    result.push({
      key: 'service',
      status: liveData.value?.status === 'ok' ? 'up' : 'down',
      loading: false,
      error: false,
    });
  }

  return result;
});
</script>

<template>
  <DebugPanelLayout>
    <DebugPanelHeader>
      <DebugPanelHeaderTitle label="System Health" />
    </DebugPanelHeader>
    <div class="p-4">
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3"
      >
        <HealthTile
          v-for="tile in tiles"
          :key="tile.key"
          :name="tile.key"
          :status="tile.status"
          :loading="tile.loading"
          :error="tile.error"
        />
      </div>
    </div>
  </DebugPanelLayout>
</template>
