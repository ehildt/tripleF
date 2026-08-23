<script setup lang="ts">
/**
 * The SysCtl "Search Engines" tab: one panel per provider (Serper,
 * Bright Data, YouTube, EODHD) with its master switch, API key, endpoint
 * toggles and result limits — plus the sources panel for preferred/blocked
 * domains.
 */
import { ref } from 'vue';

import { useSysctlConfig } from '../composables/use-sysctl-config';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import BrightDataSection from './bright-data-section/BrightDataSection.vue';
import EodhdSection from './eodhd-section/EodhdSection.vue';
import type { SearchEngineId } from './search-engines-menu/SearchEnginesMenu.types';
import SearchEnginesMenu from './search-engines-menu/SearchEnginesMenu.vue';
import SerperSection from './serper-section/SerperSection.vue';
import SourcesPanel from './sources-panel/SourcesPanel.vue';
import YoutubeSection from './youtube-section/YoutubeSection.vue';

const {
  config,
  isLoading,
  hasError,
  resetProvider,
  patchConfig,
  toggleProviderEnabled,
  toggleEndpoint,
  updateEndpointResults,
  updateApiKey,
} = useSysctlConfig();

/** Which engine's panel is shown in the search-engines submenu. */
const activeEngine = ref<SearchEngineId>('serper');

function handleUpdateResults(
  provider: 'serper' | 'brightData' | 'youtube' | 'eodhd',
  maxResults: number,
  { name, value }: { name: string; value: string },
) {
  updateEndpointResults(provider, name, value, maxResults);
}

function handleZoneChange(zone: 'serpZone' | 'unlockerZone', value: string) {
  if (!config.value) return;
  // Optimistic local echo — the session-overrides merge keeps it on refresh.
  config.value.brightData[zone] = value;
  patchConfig('brightData', zone, value);
}

function handleSourcesPatch({
  key,
  value,
}: {
  key: string;
  value: string[] | number;
}) {
  // Optimistic local echo — the session-overrides merge keeps it on refresh.
  if (config.value?.sources && (key === 'preferred' || key === 'blocked')) {
    config.value.sources[key] = value as string[];
  }
  if (config.value?.sources && key === 'imageTaskReferenceCount') {
    config.value.sources.imageTaskReferenceCount = value as number;
  }
  patchConfig('sources', key, value);
}

/** Reset just one source list (preferred or blocked) to empty. */
function handleSourcesReset(key: 'preferred' | 'blocked') {
  if (config.value?.sources) {
    config.value.sources[key] = [];
  }
  patchConfig('sources', key, []);
}
</script>

<template>
  <SysCtlSection :loading="isLoading" :error="hasError || !config">
    <SearchEnginesMenu
      :active-engine="activeEngine"
      @select-engine="activeEngine = $event"
    />

    <SerperSection
      v-if="config && activeEngine === 'serper'"
      :config="config.serper"
      :update-api-key="(k) => updateApiKey('serper', k)"
      @toggle-endpoint="toggleEndpoint('serper', $event)"
      @update-results="handleUpdateResults('serper', 200, $event)"
      @reset="resetProvider('serper')"
      @toggle-enabled="toggleProviderEnabled('serper')"
    />

    <BrightDataSection
      v-if="config && activeEngine === 'brightData'"
      :config="config.brightData"
      :update-api-key="(k) => updateApiKey('brightData', k)"
      @toggle-endpoint="toggleEndpoint('brightData', $event)"
      @update-results="handleUpdateResults('brightData', 200, $event)"
      @reset="resetProvider('brightData')"
      @toggle-enabled="toggleProviderEnabled('brightData')"
      @zone-change="handleZoneChange($event.zone, $event.value)"
    />

    <YoutubeSection
      v-if="config && activeEngine === 'youtube'"
      :config="config.youtube"
      :update-api-key="(k) => updateApiKey('youtube', k)"
      @toggle-endpoint="toggleEndpoint('youtube', $event)"
      @update-results="handleUpdateResults('youtube', 200, $event)"
      @reset="resetProvider('youtube')"
      @toggle-enabled="toggleProviderEnabled('youtube')"
    />

    <EodhdSection
      v-if="config && activeEngine === 'eodhd'"
      :config="config.eodhd"
      :update-api-key="(k) => updateApiKey('eodhd', k)"
      @toggle-endpoint="toggleEndpoint('eodhd', $event)"
      @update-results="handleUpdateResults('eodhd', 1000, $event)"
      @reset="resetProvider('eodhd')"
      @toggle-enabled="toggleProviderEnabled('eodhd')"
    />

    <!-- Preferred / blocked content domains (dynamic source config) -->
    <SourcesPanel
      v-if="config && activeEngine === 'sources'"
      :sources="config.sources"
      @patch="handleSourcesPatch($event)"
      @reset="handleSourcesReset($event)"
    />
  </SysCtlSection>
</template>
