<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';

import {
  hasEndpointResults,
  type ProviderConfig,
} from '../sysctl-config.model';

const props = withDefaults(
  defineProps<{
    providerName: string;
    providerDescription: string;
    config: ProviderConfig;
    descriptions: Record<string, string>;
    configured: boolean;
    icons?: Record<string, LucideIcon>;
    endpointMaxResults?: Record<string, number>;
  }>(),
  { icons: () => ({}), endpointMaxResults: undefined },
);

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
}>();

const EXCLUDED_KEYS = ['apiKey', 'enabled', 'projectId'];

const isContentDisabled = computed(() => !props.config.enabled);

const endpointEntries = computed(() => {
  return Object.entries(props.config)
    .filter(([name, value]) => {
      if (EXCLUDED_KEYS.includes(name)) return false;
      return typeof value === 'object' && value !== null && 'enabled' in value;
    })
    .sort(([, a], [, b]) => {
      // Fields without a results number come before those with one.
      return Number(hasEndpointResults(a)) - Number(hasEndpointResults(b));
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
        <slot name="prepend" />

        <FieldCard
          v-for="[name, value] in endpointEntries"
          :key="name"
          :icon="icons[name]"
          :label="name"
          :description="descriptions[name] ?? ''"
          :checked="(value as { enabled: boolean }).enabled"
          :number-value="getResults(value)"
          :number-max="endpointMaxResults?.[name]"
          :disabled="!configured || isContentDisabled"
          @toggle="emit('toggleEndpoint', name)"
          @update:number-value="
            emit('updateResults', { name, value: String($event) })
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.provider-section__content {
  padding: var(--spacing-1);
}

.provider-section__content--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.provider-section__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>
