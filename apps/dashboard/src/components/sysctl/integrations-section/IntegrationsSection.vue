<script setup lang="ts">
/**
 * The SysCtl "Integrations" tab: a grid of provider tiles (Serper,
 * Bright Data, YouTube, EODHD) plus the sources list. Each tile shows a
 * quick enable/disable switch top-right and a credential status badge;
 * clicking the tile body opens a slide-over drawer with the provider's
 * full configuration (API key, endpoint toggles, result limits, account
 * capabilities). Enabling an integration without credentials opens its
 * drawer instead of flipping the switch.
 */
import SlideOver from '@/components/shared/ui/slide-over/SlideOver.vue';

import { useSysctlConfig } from '../composables/use-sysctl-config';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import BrightDataSection from './bright-data-section/BrightDataSection.vue';
import { useIntegrationsDrawer } from './composables/use-integrations-drawer';
import EodhdSection from './eodhd-section/EodhdSection.vue';
import IntegrationTile from './integration-tile/IntegrationTile.vue';
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

const {
  tiles,
  drawerIntegration,
  drawerOpen,
  drawerTitle,
  openIntegration,
  closeIntegration,
  onDrawerClosed,
  toggleIntegration,
} = useIntegrationsDrawer(config, toggleProviderEnabled);

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
    <div class="integrations-section__grid">
      <IntegrationTile
        v-for="tile in tiles"
        :key="tile.meta.id"
        :icon="tile.meta.icon"
        :name="tile.name"
        :description="tile.description"
        :enabled="tile.enabled"
        :configured="tile.configured"
        :toggle-title="tile.toggleTitle"
        :open-label="tile.openLabel"
        @open="openIntegration(tile.meta.id)"
        @toggle="toggleIntegration(tile.meta.id)"
      />
    </div>

    <SlideOver
      :open="drawerOpen"
      :title="drawerTitle"
      :close-title="$t('common.close')"
      @close="closeIntegration"
      @closed="onDrawerClosed"
    >
      <SerperSection
        v-if="config && drawerIntegration === 'serper'"
        :config="config.serper"
        :update-api-key="(k) => updateApiKey('serper', k)"
        @toggle-endpoint="toggleEndpoint('serper', $event)"
        @update-results="handleUpdateResults('serper', 200, $event)"
        @reset="resetProvider('serper')"
      />

      <BrightDataSection
        v-else-if="config && drawerIntegration === 'brightData'"
        :config="config.brightData"
        :update-api-key="(k) => updateApiKey('brightData', k)"
        @toggle-endpoint="toggleEndpoint('brightData', $event)"
        @update-results="handleUpdateResults('brightData', 200, $event)"
        @reset="resetProvider('brightData')"
        @zone-change="handleZoneChange($event.zone, $event.value)"
      />

      <YoutubeSection
        v-else-if="config && drawerIntegration === 'youtube'"
        :config="config.youtube"
        :update-api-key="(k) => updateApiKey('youtube', k)"
        @toggle-endpoint="toggleEndpoint('youtube', $event)"
        @update-results="handleUpdateResults('youtube', 200, $event)"
        @reset="resetProvider('youtube')"
      />

      <EodhdSection
        v-else-if="config && drawerIntegration === 'eodhd'"
        :config="config.eodhd"
        :update-api-key="(k) => updateApiKey('eodhd', k)"
        @toggle-endpoint="toggleEndpoint('eodhd', $event)"
        @update-results="handleUpdateResults('eodhd', 1000, $event)"
        @reset="resetProvider('eodhd')"
      />

      <!-- Preferred / blocked content domains (dynamic source config) -->
      <SourcesPanel
        v-else-if="config && drawerIntegration === 'sources'"
        :sources="config.sources"
        @patch="handleSourcesPatch($event)"
        @reset="handleSourcesReset($event)"
      />
    </SlideOver>
  </SysCtlSection>
</template>

<style scoped>
.integrations-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--spacing-3);
  padding: var(--spacing-1);
}
</style>
