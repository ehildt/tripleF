<script setup lang="ts">
import { KeyRound } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import CapabilitiesPanel from '../shared/ui/capabilities-panel/CapabilitiesPanel.vue';
import ProviderSection from '../shared/ui/provider-section/ProviderSection.vue';
import { useEodhdSection } from './composables/use-eodhd-section.composable';
import type { EodhdSectionProps } from './EodhdSection.types';

const props = defineProps<EodhdSectionProps>();

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
  reset: [];
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
    :config="config"
    :descriptions="descriptions"
    :icons="icons"
    :configured="configured"
    :endpoint-max-results="{ history: 1000 }"
    :endpoint-availability="endpointAvailability"
    :items-per-row="2"
    @toggle-endpoint="emit('toggleEndpoint', $event)"
    @update-results="emit('updateResults', $event)"
  >
    <template #actions>
      <ResetButton
        :title="$t('common.resetEodhdToDefaults')"
        @click="emit('reset')"
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
      <CapabilitiesPanel v-if="capabilityRows.length" :rows="capabilityRows" />
    </template>

    <template #metadataSecondary>
      <CapabilitiesPanel v-if="sourceStatus.length" :statuses="sourceStatus" />
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
