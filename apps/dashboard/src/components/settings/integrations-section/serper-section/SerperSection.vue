<script setup lang="ts">
import {
  Clapperboard,
  FileText,
  Globe,
  Image,
  KeyRound,
  MapPin,
  Newspaper,
  RotateCcw,
  ShoppingCart,
  Star,
} from '@lucide/vue';
import { computed } from 'vue';

import CapabilitiesPanel from '@/components/settings/integrations-section/shared/ui/capabilities-panel/CapabilitiesPanel.vue';
import ProviderSection from '@/components/settings/integrations-section/shared/ui/provider-section/ProviderSection.vue';
import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import TextFieldCard from '@/components/shared/ui/text-field-card/TextFieldCard.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import { buildSerperCapabilityRows } from '../helpers/build-serper-capability-rows.helper';
import type {
  SerperSectionEmits,
  SerperSectionProps,
} from './SerperSection.types';

const props = defineProps<SerperSectionProps>();

const emit = defineEmits<SerperSectionEmits>();

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
    :endpoint-max-results="endpointMaxResults"
    @toggle-endpoint="emit('toggleEndpoint', $event)"
    @update-results="emit('updateResults', $event)"
  >
    <template #actions>
      <MenuButton
        :icon="RotateCcw"
        :label="$t('common.resetSerperToDefaults')"
        @click="emit('reset')"
      />
    </template>

    <!-- API key field: displays the masked key (****************),
           patches on change. The real key never reaches the client. -->
    <template #apiKey>
      <TextFieldCard
        v-model="draft"
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.serperAccessKey')"
        name="serper-api-key"
        :on-commit="submit"
        :on-focus="selectAllText"
      />
    </template>

    <template #metadata>
      <CapabilitiesPanel v-if="capabilityRows.length" :rows="capabilityRows" />
    </template>
  </ProviderSection>
</template>
