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

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import ProviderSection from '../../provider-section/ProviderSection.vue';
import CapabilitiesPanel from '../../shared/ui/capabilities-panel/CapabilitiesPanel.vue';
import type { BrightDataConfig } from '../../sysctl-config.model';
import { buildBrightDataCapabilityRows } from '../helpers/build-bright-data-capability-rows.helper';

const props = defineProps<{
  config: BrightDataConfig;
  updateApiKey: (apiKey: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
  reset: [];
  toggleEnabled: [];
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
      <PowerToggle
        :enabled="config.enabled"
        :title="$t('common.enableBrightData')"
        @toggle="emit('toggleEnabled')"
      />
    </template>

    <template #apiKey>
      <FieldCard
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.brightDataAccessKey')"
      >
        <template #field>
          <input
            v-model="draft"
            type="text"
            name="bright-data-api-key"
            class="bright-data-section__api-key-input"
            autocomplete="off"
            spellcheck="false"
            @focus="selectAllText"
            @change="submit"
          />
        </template>
      </FieldCard>
    </template>

    <template #prepend>
      <FieldCard
        :icon="Globe"
        :label="$t('common.serpZone')"
        :description="$t('common.serpZoneDesc')"
      >
        <template #field>
          <input
            :value="config.serpZone"
            type="text"
            name="bright-data-serp-zone"
            class="bright-data-section__api-key-input"
            autocomplete="off"
            spellcheck="false"
            placeholder="serp_api"
            @change="onZoneChange('serpZone', $event)"
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
            :value="config.unlockerZone"
            type="text"
            name="bright-data-unlocker-zone"
            class="bright-data-section__api-key-input"
            autocomplete="off"
            spellcheck="false"
            placeholder="unlocker"
            @change="onZoneChange('unlockerZone', $event)"
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
.bright-data-section__api-key-input {
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
