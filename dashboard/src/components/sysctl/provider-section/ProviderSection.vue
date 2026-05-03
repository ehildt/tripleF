<script setup lang="ts">
import { computed } from 'vue';

import SwitchCard from '../shared/ui/switch-card/SwitchCard.vue';
import {
  hasEndpointResults,
  type ProviderConfig,
} from '../sysctl-config.model';

const props = defineProps<{
  providerName: string;
  providerDescription: string;
  config: ProviderConfig;
  descriptions: Record<string, string>;
  configured: boolean;
  endpointMaxResults?: Record<string, number>;
}>();

const emit = defineEmits<{
  toggleMaster: [];
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
}>();

const EXCLUDED_KEYS = ['apiKey', 'enabled', 'projectId'];

const isContentDisabled = computed(() => !props.config.enabled);

const endpointEntries = computed(() => {
  return Object.entries(props.config).filter(([name, value]) => {
    if (EXCLUDED_KEYS.includes(name)) return false;
    return typeof value === 'object' && value !== null && 'enabled' in value;
  });
});

function getResults(value: unknown): number | undefined {
  return hasEndpointResults(value) ? value.results : undefined;
}
</script>

<template>
  <div class="provider-section">
    <div
      class="provider-section__content"
      :class="{
        'provider-section__content--disabled': isContentDisabled,
      }"
    >
      <div class="provider-section__grid">
        <SwitchCard
          label="enabled"
          description="master toggle"
          :checked="config.enabled"
          :disabled="!configured"
          @toggle="emit('toggleMaster')"
        />

        <SwitchCard
          v-for="[name, value] in endpointEntries"
          :key="name"
          :label="name"
          :description="descriptions[name] ?? ''"
          :checked="(value as { enabled: boolean }).enabled"
          :disabled="!configured || isContentDisabled"
          :has-results="hasEndpointResults(value)"
          :results="getResults(value)"
          :max-results="endpointMaxResults?.[name]"
          @toggle="emit('toggleEndpoint', name)"
          @update-results="emit('updateResults', { name, value: $event })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.provider-section__content {
  padding: var(--spacing-4);
}

.provider-section__content--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.provider-section__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-3);
}
</style>
