<script setup lang="ts">
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
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import type { SerperConfig } from '../../sysctl-config.model';
import { buildSerperCapabilityRows } from '../helpers/build-serper-capability-rows.helper';
import CapabilitiesPanel from '../shared/ui/capabilities-panel/CapabilitiesPanel.vue';
import ProviderSection from '../shared/ui/provider-section/ProviderSection.vue';

const props = defineProps<{
  config: SerperConfig;
  updateApiKey: (apiKey: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
  reset: [];
}>();

const configured = computed(() => !!props.config.apiKey);
const maskedApiKey = computed(() => props.config.apiKey ?? '');
const { draft, selectAllText, submit } = useApiKeyForm(
  props.updateApiKey,
  maskedApiKey,
);
const capabilityRows = computed(() =>
  buildSerperCapabilityRows(props.config.capabilities),
);

const descriptions = computed<Record<string, string>>(() => ({
  web: i18n.global.t('common.searchCapWebSerper'),
  images: i18n.global.t('common.searchCapImages'),
  news: i18n.global.t('common.searchCapNews'),
  places: i18n.global.t('common.searchCapPlaces'),
  shopping: i18n.global.t('common.searchCapShopping'),
  reviews: i18n.global.t('common.searchCapReviews'),
  videos: i18n.global.t('common.searchCapVideos'),
  scrape: i18n.global.t('common.searchCapScrapeSerper'),
}));

const icons = {
  web: Globe,
  images: Image,
  news: Newspaper,
  places: MapPin,
  shopping: ShoppingCart,
  reviews: Star,
  videos: Clapperboard,
  scrape: FileText,
};
</script>

<template>
  <ProviderSection
    :config="config"
    :descriptions="descriptions"
    :icons="icons"
    :configured="configured"
    @toggle-endpoint="emit('toggleEndpoint', $event)"
    @update-results="emit('updateResults', $event)"
  >
    <template #actions>
      <ResetButton
        :title="$t('common.resetSerperToDefaults')"
        @click="emit('reset')"
      />
    </template>

    <!-- API key field: displays the masked key (****************),
           patches on change. The real key never reaches the client. -->
    <template #apiKey>
      <FieldCard
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.serperAccessKey')"
      >
        <template #field>
          <input
            v-model="draft"
            type="text"
            name="serper-api-key"
            class="serper-section__api-key-input"
            autocomplete="off"
            spellcheck="false"
            @focus="selectAllText"
            @change="submit"
          />
        </template>
      </FieldCard>
    </template>

    <template #metadata>
      <CapabilitiesPanel v-if="capabilityRows.length" :rows="capabilityRows" />
    </template>
  </ProviderSection>
</template>

<style scoped>
.serper-section__api-key-input {
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
