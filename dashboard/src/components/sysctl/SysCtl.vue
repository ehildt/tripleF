<script setup lang="ts">
import { computed } from 'vue';

import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import { useSysctlConfig } from './composables/use-sysctl-config';
import { useSysctlHealthTiles } from './composables/use-sysctl-health-tiles';
import { useSysctlProviderSelection } from './composables/use-sysctl-provider-selection';
import { useSysctlTabVisibility } from './composables/use-sysctl-tab-visibility';
import ProviderSection from './provider-section/ProviderSection.vue';
import ProviderSelector from './provider-selector/ProviderSelector.vue';
import SearXngSection from './searxng-section/SearXngSection.vue';
import SystemHealthSection from './system-health-section/SystemHealthSection.vue';
import TabVisibilitySection from './tab-visibility-section/TabVisibilitySection.vue';

const {
  config,
  isLoading,
  hasError,
  toggleProviderEnabled,
  toggleEndpoint,
  updateEndpointResults,
} = useSysctlConfig();
const { tiles } = useSysctlHealthTiles();
const { isTabVisible, toggleTab, showCounters, toggleShowCounters } =
  useSysctlTabVisibility();

const isConfigured = computed(() => ({
  serper: !!config.value?.serper.apiKey,
  brave: !!config.value?.brave.apiKey,
  searxng: true,
  browserBase: !!config.value?.browserBase.apiKey,
}));

const isEnabled = computed(() => ({
  serper: config.value?.serper.enabled ?? false,
  brave: config.value?.brave.enabled ?? false,
  searxng: config.value?.searxng.enabled ?? false,
  browserBase: config.value?.browserBase.enabled ?? false,
}));

const { selectedProvider, selectProvider } = useSysctlProviderSelection(
  () => isConfigured.value,
);

const selectedProviderName = computed(
  () =>
    (
      ({
        serper: 'Serper',
        brave: 'Brave',
        searxng: 'SearXNG',
        browserBase: 'Browserbase',
      }) as const
    )[selectedProvider.value],
);

const serperConfigured = computed(() => isConfigured.value.serper);
const braveConfigured = computed(() => isConfigured.value.brave);
const browserbaseConfigured = computed(() => isConfigured.value.browserBase);

const serperDescriptions: Record<string, string> = {
  web: 'Google search results, knowledge graph',
  images: 'Image results with dimensions',
  news: 'News articles with source and date',
  places: 'Local businesses, rating, address',
  shopping: 'Products with price and seller',
  reviews: 'Place reviews and ratings',
  videos: 'Video results from YouTube and more',
  webpageFetch: 'Full page content scraping',
};

const braveDescriptions: Record<string, string> = {
  web: 'General web from independent index',
  images: 'Image search with metadata',
  news: 'News from trusted sources',
  video: 'Video content across the web',
};

const browserbaseDescriptions: Record<string, string> = {
  search: 'Web search with rendered content',
};

const browserbaseEndpointMaxResults: Record<string, number> = {
  search: 25,
};

function handleUpdateResults(
  provider: 'serper' | 'brave' | 'browserBase',
  { name, value }: { name: string; value: string },
) {
  const maxResults = browserbaseEndpointMaxResults[name];
  updateEndpointResults(provider, name, value, maxResults);
}

function handleSearxngUpdateResults(value: string) {
  updateEndpointResults('searxng', 'results', value, 200);
}
</script>

<template>
  <div class="sysctl-panels">
    <PanelLayout class="sysctl">
      <PanelHeader>
        <PanelHeaderTitle :label="`Search Engine :: ${selectedProviderName}`" />
        <ProviderSelector
          :selected-provider="selectedProvider"
          :configured-providers="isConfigured"
          :enabled-providers="isEnabled"
          @select-provider="selectProvider"
        />
      </PanelHeader>

      <div v-if="isLoading" class="sysctl__state">Loading…</div>

      <div
        v-else-if="hasError || !config"
        class="sysctl__state sysctl__state--error"
      >
        Failed to load config.
      </div>

      <div v-else class="sysctl__sections">
        <ProviderSection
          v-if="selectedProvider === 'serper'"
          provider-name="Serper"
          provider-description="Search API"
          :config="config.serper"
          :descriptions="serperDescriptions"
          :configured="serperConfigured"
          @toggle-master="toggleProviderEnabled('serper')"
          @toggle-endpoint="toggleEndpoint('serper', $event)"
          @update-results="handleUpdateResults('serper', $event)"
        />

        <ProviderSection
          v-if="selectedProvider === 'brave'"
          provider-name="Brave"
          provider-description="Search API"
          :config="config.brave"
          :descriptions="braveDescriptions"
          :configured="braveConfigured"
          @toggle-master="toggleProviderEnabled('brave')"
          @toggle-endpoint="toggleEndpoint('brave', $event)"
          @update-results="handleUpdateResults('brave', $event)"
        />

        <SearXngSection
          v-if="selectedProvider === 'searxng'"
          :config="config.searxng"
          @toggle-enabled="toggleProviderEnabled('searxng')"
          @update-results="handleSearxngUpdateResults($event)"
        />

        <ProviderSection
          v-if="selectedProvider === 'browserBase'"
          provider-name="Browserbase"
          provider-description="Search API"
          :config="config.browserBase"
          :descriptions="browserbaseDescriptions"
          :configured="browserbaseConfigured"
          :endpoint-max-results="browserbaseEndpointMaxResults"
          @toggle-master="toggleProviderEnabled('browserBase')"
          @toggle-endpoint="toggleEndpoint('browserBase', $event)"
          @update-results="handleUpdateResults('browserBase', $event)"
        />
      </div>
    </PanelLayout>

    <PanelLayout class="sysctl-tabs">
      <PanelHeader>
        <PanelHeaderTitle label="Tab Visibility" />
      </PanelHeader>
      <TabVisibilitySection
        :is-preprocessing-visible="isTabVisible('preprocessing')"
        :is-debug-visible="isTabVisible('debug')"
        :is-dlq-visible="isTabVisible('dlq')"
        :show-counters="showCounters"
        @toggle-preprocessing="toggleTab('preprocessing')"
        @toggle-debug="toggleTab('debug')"
        @toggle-dlq="toggleTab('dlq')"
        @toggle-counters="toggleShowCounters"
      />
    </PanelLayout>

    <PanelLayout class="sysctl-health">
      <PanelHeader>
        <PanelHeaderTitle label="System Health" />
      </PanelHeader>
      <SystemHealthSection :tiles="tiles" />
    </PanelLayout>
  </div>
</template>

<style scoped>
.sysctl-panels {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.sysctl {
  display: flex;
  flex-direction: column;
}

.sysctl__state {
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.sysctl__state--error {
  color: var(--color-status-error);
}

.sysctl__sections {
  display: flex;
  flex-direction: column;
}
</style>
