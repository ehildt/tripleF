<script setup lang="ts">
import { ref } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';

import { useProviderSection } from './composables/use-provider-section.composable';
import type { ProviderSectionProps } from './ProviderSection.types';

const props = withDefaults(defineProps<ProviderSectionProps>(), {
  icons: () => ({}),
  endpointMaxResults: undefined,
  endpointAvailability: undefined,
  prependItemsPerRow: undefined,
  itemsPerRow: undefined,
});

const emit = defineEmits<{
  toggleEndpoint: [name: string];
  updateResults: [payload: { name: string; value: string }];
}>();

const prependRef = ref<HTMLElement>();

const {
  isContentDisabled,
  isEndpointUnavailable,
  endpointEntries,
  getResults,
  itemsPerRow,
  prependItemsPerRow,
  ENDPOINT_LABELS,
} = useProviderSection(props, prependRef);
</script>

<template>
  <div class="provider-section">
    <!-- Account/plan metadata first … -->
    <div
      v-if="$slots.metadata || $slots.metadataSecondary"
      class="provider-section__metadata-row"
      :class="{
        'provider-section__metadata-row--double':
          $slots.metadata && $slots.metadataSecondary,
      }"
    >
      <div
        v-if="$slots.metadata"
        class="provider-section__metadata"
        :class="{ 'provider-section__metadata--disabled': isContentDisabled }"
      >
        <slot name="metadata" />
      </div>

      <div
        v-if="$slots.metadataSecondary"
        class="provider-section__metadata"
        :class="{ 'provider-section__metadata--disabled': isContentDisabled }"
      >
        <slot name="metadataSecondary" />
      </div>
    </div>

    <!-- … then the credential fields (API key, zones) with the provider
         actions (reset, master toggle) on the same row … -->
    <div class="provider-section__actions">
      <div v-if="$slots.apiKey" class="provider-section__api-key">
        <slot name="apiKey" />
      </div>
      <div v-if="$slots.actions" class="provider-section__actions-buttons">
        <slot name="actions" />
      </div>
    </div>

    <!-- … and finally the endpoint fields (checkbox + results number). -->
    <div class="provider-section__fields">
      <FieldGrid
        :items-per-row="itemsPerRow"
        :prepend-items-per-row="prependItemsPerRow"
      >
        <template v-if="$slots.prepend" #prepend>
          <div ref="prependRef" class="provider-section__prepend">
            <slot name="prepend" />
          </div>
        </template>

        <FieldCard
          v-for="[name, value] in endpointEntries"
          :key="name"
          :icon="icons[name]"
          :label="ENDPOINT_LABELS[name] ?? name"
          :description="descriptions[name] ?? ''"
          :checked="(value as { enabled: boolean }).enabled"
          :number-value="getResults(value)"
          :number-max="endpointMaxResults?.[name]"
          :disabled="
            !configured || isContentDisabled || isEndpointUnavailable(name)
          "
          @toggle="emit('toggleEndpoint', name)"
          @update:number-value="
            emit('updateResults', { name, value: String($event) })
          "
        />
      </FieldGrid>
    </div>
  </div>
</template>

<style scoped>
.provider-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-2);
}

.provider-section__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-1);
  min-height: calc(2.25rem + 2 * var(--spacing-2));
  background:
    radial-gradient(
      ellipse 120% 140% at 12% 50%,
      color-mix(in srgb, var(--color-accent-primary) 18%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 120% 140% at 88% 50%,
      color-mix(in srgb, var(--color-accent-secondary) 14%, transparent) 0%,
      transparent 60%
    ),
    var(--color-bg-elevated);
}

.provider-section__api-key {
  flex: 1 1 auto;
  min-width: 0;
}

/* The API key field sits on the radiant actions row — let it blend in
   instead of showing its own field background. Only affects the API key
   FieldCard, not the endpoint fields in the grid below. */
.provider-section__api-key :deep(.field-card) {
  background: transparent;
  width: 100%;
}

/* Let the input take the remaining width — the label/description shrink to
   their natural size instead of splitting the field evenly. */
.provider-section__api-key :deep(.field-card__content) {
  flex: 0 1 auto;
}

.provider-section__api-key :deep(.field-card__field) {
  flex: 1 1 auto;
}

.provider-section__actions-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.provider-section__metadata-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-3);
}

/* Two metadata panels share the row; a lone one takes the full width. */
.provider-section__metadata-row--double {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.provider-section__metadata {
  min-width: 0;
  transition: opacity 0.3s ease;
}

.provider-section__metadata--disabled {
  opacity: 0.4;
}

.provider-section__fields {
  min-width: 0;
}

/* The prepend slot's FieldCards participate directly in the shared grid. */
.provider-section__prepend {
  display: contents;
}
</style>
