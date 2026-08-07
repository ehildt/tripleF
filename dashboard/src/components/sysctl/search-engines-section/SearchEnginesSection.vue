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

import CollapsiblePanel from '@/components/shared/ui/collapsible-panel/CollapsiblePanel.vue';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../composables/use-api-key-form';
import { useSysctlConfig } from '../composables/use-sysctl-config';
import ProviderSection from '../provider-section/ProviderSection.vue';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
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

const isBrightDataConfigured = computed(
  () => !!config.value?.brightData.apiKey,
);

const maskedBrightDataApiKey = computed(
  () => config.value?.brightData.apiKey ?? '',
);

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

const {
  draft: brightDataApiKeyDraft,
  selectAllText: selectBrightDataApiKeyText,
  submit: submitBrightDataApiKey,
} = useApiKeyForm(
  (apiKey) => updateApiKey('brightData', apiKey),
  maskedBrightDataApiKey,
);

const youtubeDescriptions: Record<string, string> = {
  videos: i18n.global.t('common.youtubeVideosWithViews'),
};

const youtubeIcons = {
  videos: Clapperboard,
};

const brightDataDescriptions: Record<string, string> = {
  web: i18n.global.t('common.searchCapWebBrightData'),
  images: i18n.global.t('common.searchCapImages'),
  news: i18n.global.t('common.searchCapNews'),
  places: i18n.global.t('common.searchCapPlaces'),
  shopping: i18n.global.t('common.searchCapShopping'),
  videos: i18n.global.t('common.searchCapVideos'),
  scrape: i18n.global.t('common.searchCapScrapeBrightData'),
};

const brightDataIcons = {
  web: Globe,
  images: Image,
  news: Newspaper,
  places: MapPin,
  shopping: ShoppingCart,
  videos: Clapperboard,
  scrape: FileText,
};

const serperDescriptions: Record<string, string> = {
  web: i18n.global.t('common.searchCapWebSerper'),
  images: i18n.global.t('common.searchCapImages'),
  news: i18n.global.t('common.searchCapNews'),
  places: i18n.global.t('common.searchCapPlaces'),
  shopping: i18n.global.t('common.searchCapShopping'),
  reviews: i18n.global.t('common.searchCapReviews'),
  videos: i18n.global.t('common.searchCapVideos'),
  scrape: i18n.global.t('common.searchCapScrapeSerper'),
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

function handleBrightDataUpdateResults({
  name,
  value,
}: {
  name: string;
  value: string;
}) {
  updateEndpointResults('brightData', name, value);
}

/** Patch a non-secret zone value and mirror it into the local config. */
function handleZoneChange(zone: 'serpZone' | 'unlockerZone', event: Event) {
  const next = (event.target as HTMLInputElement).value.trim();
  if (!config.value) return;
  config.value.brightData[zone] = next;
  patchConfig('brightData', zone, next);
}

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
  <SysCtlSection :loading="isLoading" :error="hasError || !config">
    <PanelLayout v-if="config">
      <CollapsiblePanel id="serper" :title="$t('common.serperApi')">
        <template #actions>
          <ResetButton
            :title="$t('common.resetSerperToDefaults')"
            @click="resetProvider('serper')"
          />
          <PowerToggle
            :enabled="config.serper.enabled"
            :title="$t('common.enableSerper')"
            @toggle="toggleProviderEnabled('serper')"
          />
        </template>

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
              :label="$t('common.apiKey')"
              :description="$t('common.serperAccessKey')"
            >
              <template #field>
                <input
                  v-model="apiKeyDraft"
                  type="text"
                  name="serper-api-key"
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
      </CollapsiblePanel>
    </PanelLayout>

    <PanelLayout v-if="config">
      <CollapsiblePanel id="brightData" :title="$t('common.brightData')">
        <template #actions>
          <ResetButton
            :title="$t('common.resetBrightDataToDefaults')"
            @click="resetProvider('brightData')"
          />
          <PowerToggle
            :enabled="config.brightData.enabled"
            :title="$t('common.enableBrightData')"
            @toggle="toggleProviderEnabled('brightData')"
          />
        </template>

        <ProviderSection
          provider-name="Bright Data"
          provider-description="Search engine (alternative to Serper)"
          :config="config.brightData"
          :descriptions="brightDataDescriptions"
          :icons="brightDataIcons"
          :configured="isBrightDataConfigured"
          @toggle-endpoint="toggleEndpoint('brightData', $event)"
          @update-results="handleBrightDataUpdateResults($event)"
        >
          <template #prepend>
            <FieldCard
              :icon="KeyRound"
              :label="$t('common.apiKey')"
              :description="$t('common.brightDataAccessKey')"
            >
              <template #field>
                <input
                  v-model="brightDataApiKeyDraft"
                  type="text"
                  name="bright-data-api-key"
                  class="search-engines-section__api-key-input"
                  autocomplete="off"
                  spellcheck="false"
                  @focus="selectBrightDataApiKeyText"
                  @change="submitBrightDataApiKey"
                />
              </template>
            </FieldCard>
            <FieldCard
              :icon="Globe"
              :label="$t('common.serpZone')"
              :description="$t('common.serpZoneDesc')"
            >
              <template #field>
                <input
                  :value="config.brightData.serpZone"
                  type="text"
                  name="bright-data-serp-zone"
                  class="search-engines-section__api-key-input"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="serp_api"
                  @change="handleZoneChange('serpZone', $event)"
                />
              </template>
            </FieldCard>
            <FieldCard
              :icon="FileText"
              :label="$t('common.unlockerZone')"
              :description="$t('common.unlockerZoneDesc')"
            >
              <template #field>
                <input
                  :value="config.brightData.unlockerZone"
                  type="text"
                  name="bright-data-unlocker-zone"
                  class="search-engines-section__api-key-input"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="unlocker"
                  @change="handleZoneChange('unlockerZone', $event)"
                />
              </template>
            </FieldCard>
          </template>
        </ProviderSection>
      </CollapsiblePanel>
    </PanelLayout>

    <PanelLayout v-if="config">
      <CollapsiblePanel id="youtube" :title="$t('common.youtubeApi')">
        <template #actions>
          <ResetButton
            :title="$t('common.resetYouTubeToDefaults')"
            @click="resetProvider('youtube')"
          />
          <PowerToggle
            :enabled="config.youtube.enabled"
            :title="$t('common.enableYouTube')"
            @toggle="toggleProviderEnabled('youtube')"
          />
        </template>

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
              :label="$t('common.apiKey')"
              :description="$t('common.youtubeDataApiKey')"
            >
              <template #field>
                <input
                  v-model="youtubeApiKeyDraft"
                  type="text"
                  name="youtube-api-key"
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
      </CollapsiblePanel>
    </PanelLayout>

    <!-- Preferred / blocked content domains (dynamic source config) -->
    <PanelLayout v-if="config">
      <CollapsiblePanel id="sources" :title="$t('common.sources')">
        <template #actions>
          <ResetButton
            :title="$t('common.resetSourcesToDefaults')"
            @click="resetProvider('sources')"
          />
        </template>

        <SourcesPanel
          :sources="config.sources"
          @patch="handleSourcesPatch($event)"
        />
      </CollapsiblePanel>
    </PanelLayout>
  </SysCtlSection>
</template>

<style scoped>
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
</style>
