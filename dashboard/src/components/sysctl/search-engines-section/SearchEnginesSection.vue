<script setup lang="ts">
/**
 * The SysCtl "Search Engines" tab: the Serper provider's master switch,
 * endpoint toggles, and result limits.
 */
import {
  Clapperboard,
  FileText,
  Globe,
  Image,
  KeyRound,
  MapPin,
  Newspaper,
  ShoppingCart,
  Star,
} from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import { useApiKeyForm } from '../composables/use-api-key-form';
import { useSysctlConfig } from '../composables/use-sysctl-config';
import ProviderSection from '../provider-section/ProviderSection.vue';
import SourcesPanel from './sources-panel/SourcesPanel.vue';

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

const isSerperConfigured = computed(() => !!config.value?.serper.apiKey);

const maskedSerperApiKey = computed(() => config.value?.serper.apiKey ?? '');

const isYoutubeConfigured = computed(() => !!config.value?.youtube.apiKey);

const maskedYoutubeApiKey = computed(() => config.value?.youtube.apiKey ?? '');

const {
  draft: apiKeyDraft,
  selectAllText: selectApiKeyText,
  submit: submitApiKey,
} = useApiKeyForm(
  (apiKey) => updateApiKey('serper', apiKey),
  maskedSerperApiKey,
);

const {
  draft: youtubeApiKeyDraft,
  selectAllText: selectYoutubeApiKeyText,
  submit: submitYoutubeApiKey,
} = useApiKeyForm(
  (apiKey) => updateApiKey('youtube', apiKey),
  maskedYoutubeApiKey,
);

const youtubeDescriptions: Record<string, string> = {
  videos: 'YouTube videos with views and duration',
};

const youtubeIcons = {
  videos: Clapperboard,
};

const serperDescriptions: Record<string, string> = {
  web: 'Google search results, knowledge graph',
  images: 'Image results with dimensions',
  news: 'News articles with source and date',
  places: 'Local businesses, rating, address',
  shopping: 'Products with price and seller',
  reviews: 'Place reviews and ratings',
  videos: 'Video results from YouTube and more',
  scrape: 'Full page content scraping',
};

const serperIcons = {
  web: Globe,
  images: Image,
  news: Newspaper,
  places: MapPin,
  shopping: ShoppingCart,
  reviews: Star,
  videos: Clapperboard,
  scrape: FileText,
};

function handleUpdateResults({ name, value }: { name: string; value: string }) {
  updateEndpointResults('serper', name, value);
}

function handleYoutubeUpdateResults({
  name,
  value,
}: {
  name: string;
  value: string;
}) {
  updateEndpointResults('youtube', name, value);
}

function handleSourcesPatch({ key, value }: { key: string; value: string[] }) {
  // Optimistic local echo — the session-overrides merge keeps it on refresh.
  if (config.value?.sources && (key === 'preferred' || key === 'blocked')) {
    config.value.sources[key] = value;
  }
  patchConfig('sources', key, value);
}
</script>

<template>
  <div class="search-engines-section">
    <div v-if="isLoading" class="search-engines-section__state">Loading…</div>

    <div
      v-else-if="hasError || !config"
      class="search-engines-section__state search-engines-section__state--error"
    >
      Failed to load config.
    </div>

    <div v-else class="search-engines-section__panels">
      <div class="search-engines-section__panel panel-glow">
        <PanelTitleBar title="Serper API">
          <template #actions>
            <ResetButton
              title="Reset Serper to defaults"
              @click="resetProvider('serper')"
            />
            <PowerToggle
              :enabled="config.serper.enabled"
              :disabled="!isSerperConfigured"
              title="Enable Serper"
              @toggle="toggleProviderEnabled('serper')"
            />
          </template>
        </PanelTitleBar>

        <ProviderSection
          provider-name="Serper"
          provider-description="Search API"
          :config="config.serper"
          :descriptions="serperDescriptions"
          :icons="serperIcons"
          :configured="isSerperConfigured"
          @toggle-endpoint="toggleEndpoint('serper', $event)"
          @update-results="handleUpdateResults($event)"
        >
          <!-- API key field first in the grid: displays the masked key
               (****************), patches on change.
               The real key never reaches the client. -->
          <template #prepend>
            <FieldCard
              :icon="KeyRound"
              label="API key"
              description="serper.dev access key"
            >
              <template #field>
                <input
                  v-model="apiKeyDraft"
                  type="text"
                  class="search-engines-section__api-key-input"
                  autocomplete="off"
                  spellcheck="false"
                  @focus="selectApiKeyText"
                  @change="submitApiKey"
                />
              </template>
            </FieldCard>
          </template>
        </ProviderSection>
      </div>

      <div class="search-engines-section__panel panel-glow">
        <PanelTitleBar title="YouTube API">
          <template #actions>
            <ResetButton
              title="Reset YouTube to defaults"
              @click="resetProvider('youtube')"
            />
            <PowerToggle
              :enabled="config.youtube.enabled"
              :disabled="!isYoutubeConfigured"
              title="Enable YouTube"
              @toggle="toggleProviderEnabled('youtube')"
            />
          </template>
        </PanelTitleBar>

        <ProviderSection
          provider-name="YouTube"
          provider-description="Video search API"
          :config="config.youtube"
          :descriptions="youtubeDescriptions"
          :icons="youtubeIcons"
          :configured="isYoutubeConfigured"
          @toggle-endpoint="toggleEndpoint('youtube', $event)"
          @update-results="handleYoutubeUpdateResults($event)"
        >
          <template #prepend>
            <FieldCard
              :icon="KeyRound"
              label="API key"
              description="Google Cloud YouTube Data API key"
            >
              <template #field>
                <input
                  v-model="youtubeApiKeyDraft"
                  type="text"
                  class="search-engines-section__api-key-input"
                  autocomplete="off"
                  spellcheck="false"
                  @focus="selectYoutubeApiKeyText"
                  @change="submitYoutubeApiKey"
                />
              </template>
            </FieldCard>
          </template>
        </ProviderSection>
      </div>

      <!-- Preferred / blocked content domains (dynamic source config) -->
      <div class="search-engines-section__panel panel-glow">
        <PanelTitleBar title="Sources">
          <template #actions>
            <ResetButton
              title="Reset sources to defaults"
              @click="resetProvider('sources')"
            />
          </template>
        </PanelTitleBar>

        <SourcesPanel
          :sources="config.sources"
          @patch="handleSourcesPatch($event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-engines-section {
  display: flex;
  flex-direction: column;
}

.search-engines-section__api-key-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-align: center;
  outline: none;
}

.search-engines-section__panels {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}

.search-engines-section__panel {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.search-engines-section__state {
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.search-engines-section__state--error {
  color: var(--color-status-error);
}
</style>
