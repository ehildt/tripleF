<script setup lang="ts">
import { KeyRound } from '@lucide/vue';

import CapabilitiesPanel from '@/components/settings/integrations-section/shared/ui/capabilities-panel/CapabilitiesPanel.vue';
import ProviderSection from '@/components/settings/integrations-section/shared/ui/provider-section/ProviderSection.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import TextFieldCard from '@/components/shared/ui/text-field-card/TextFieldCard.vue';

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
      <TextFieldCard
        v-model="draft"
        :icon="KeyRound"
        :label="$t('common.apiKey')"
        :description="$t('common.eodhdAccessKey')"
        name="eodhd-api-key"
        :on-commit="submit"
        :on-focus="selectAllText"
      />
    </template>

    <template #metadata>
      <CapabilitiesPanel v-if="capabilityRows.length" :rows="capabilityRows" />
    </template>

    <template #metadataSecondary>
      <CapabilitiesPanel v-if="sourceStatus.length" :statuses="sourceStatus" />
    </template>
  </ProviderSection>
</template>
