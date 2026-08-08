<script setup lang="ts">
import { KeyRound } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import ProviderSection from '../../provider-section/ProviderSection.vue';
import CapabilitiesPanel from '../../shared/ui/capabilities-panel/CapabilitiesPanel.vue';
import { useEodhdSection } from './composables/use-eodhd-section.composable';
import type { EodhdSectionProps } from './EodhdSection.types';

const props = defineProps<EodhdSectionProps>();

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
  reset: [];
  toggleEnabled: [];
}>();

const {
  configured,
  draft,
  selectAllText,
  submit,
  capabilityRows,
  sourceStatus,
  endpointAvailability,
  descriptions,
  icons,
} = useEodhdSection(props);
</script>

<template>
  <ProviderSection
    provider-name="EODHD"
    :provider-description="$t('common.stockMarketDataApi')"
    :config="config"
    :descriptions="descriptions"
    :icons="icons"
    :configured="configured"
    :endpoint-max-results="{ history: 1000 }"
    :endpoint-availability="endpointAvailability"
    @toggle-endpoint="emit('toggleEndpoint', $event)"
    @update-results="emit('updateResults', $event)"
  >
    <template #actions>
      <ResetButton
        :title="$t('common.resetEodhdToDefaults')"
        @click="emit('reset')"
      />
      <PowerToggle
        :enabled="config.enabled"
        :title="$t('common.enableEodhd')"
        @toggle="emit('toggleEnabled')"
      />
    </template>

    <template #apiKey>
      <FieldCard
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.eodhdAccessKey')"
      >
        <template #field>
          <input
            v-model="draft"
            type="text"
            name="eodhd-api-key"
            class="eodhd-section__api-key-input"
            autocomplete="off"
            spellcheck="false"
            @focus="selectAllText"
            @change="submit"
          />
        </template>
      </FieldCard>
    </template>

    <template #metadata>
      <CapabilitiesPanel
        v-if="capabilityRows.length"
        :rows="capabilityRows"
        :statuses="sourceStatus"
      />
    </template>
  </ProviderSection>
</template>

<style scoped>
.eodhd-section__api-key-input {
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
