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
} from '@lucide/vue';
import { computed } from 'vue';

import CapabilitiesPanel from '@/components/settings/integrations-section/shared/ui/capabilities-panel/CapabilitiesPanel.vue';
import ProviderSection from '@/components/settings/integrations-section/shared/ui/provider-section/ProviderSection.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import TextFieldCard from '@/components/shared/ui/text-field-card/TextFieldCard.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import type { BrightDataConfig } from '../../settings-config.model';
import { buildBrightDataCapabilityRows } from '../helpers/build-bright-data-capability-rows.helper';

const props = defineProps<{
  config: BrightDataConfig;
  updateApiKey: (apiKey: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
  reset: [];
  zoneChange: [payload: { zone: 'serpZone' | 'unlockerZone'; value: string }];
}>();

const configured = computed(() => !!props.config.apiKey);
const maskedApiKey = computed(() => props.config.apiKey ?? '');
const { draft, selectAllText, submit } = useApiKeyForm(
  props.updateApiKey,
  maskedApiKey,
);
const capabilityRows = computed(() =>
  buildBrightDataCapabilityRows(props.config.capabilities),
);

const descriptions = computed<Record<string, string>>(() => ({
  web: i18n.global.t('common.searchCapWebBrightData'),
  images: i18n.global.t('common.searchCapImages'),
  news: i18n.global.t('common.searchCapNews'),
  places: i18n.global.t('common.searchCapPlaces'),
  shopping: i18n.global.t('common.searchCapShopping'),
  videos: i18n.global.t('common.searchCapVideos'),
  scrape: i18n.global.t('common.searchCapScrapeBrightData'),
}));

const icons = {
  web: Globe,
  images: Image,
  news: Newspaper,
  places: MapPin,
  shopping: ShoppingCart,
  videos: Clapperboard,
  scrape: FileText,
};

function onZoneChange(zone: 'serpZone' | 'unlockerZone', event: Event) {
  emit('zoneChange', {
    zone,
    value: (event.target as HTMLInputElement).value.trim(),
  });
}
</script>

<template>
  <ProviderSection
    :config="config"
    :descriptions="descriptions"
    :icons="icons"
    :configured="configured"
    :prepend-items-per-row="1"
    @toggle-endpoint="emit('toggleEndpoint', $event)"
    @update-results="emit('updateResults', $event)"
  >
    <template #actions>
      <ResetButton
        :title="$t('common.resetBrightDataToDefaults')"
        @click="emit('reset')"
      />
    </template>

    <template #apiKey>
      <TextFieldCard
        v-model="draft"
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.brightDataAccessKey')"
        name="bright-data-api-key"
        :on-commit="submit"
        :on-focus="selectAllText"
      />
    </template>

    <template #prepend>
      <TextFieldCard
        :icon="Globe"
        :label="$t('common.serpZone')"
        :description="$t('common.serpZoneDesc')"
        :model-value="config.serpZone ?? ''"
        name="bright-data-serp-zone"
        placeholder="serp_api"
        :on-commit="(event) => onZoneChange('serpZone', event)"
      />
      <TextFieldCard
        :icon="FileText"
        :label="$t('common.unlockerZone')"
        :description="$t('common.unlockerZoneDesc')"
        :model-value="config.unlockerZone ?? ''"
        name="bright-data-unlocker-zone"
        placeholder="unlocker"
        :on-commit="(event) => onZoneChange('unlockerZone', event)"
      />
    </template>

    <template #metadata>
      <CapabilitiesPanel v-if="capabilityRows.length" :rows="capabilityRows" />
    </template>
  </ProviderSection>
</template>
