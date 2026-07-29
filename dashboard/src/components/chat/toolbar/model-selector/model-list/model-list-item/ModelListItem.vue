<script setup lang="ts">
import { computed } from 'vue';

import type { OllamaModel } from '../../../../../../stores/models';
import { CAPABILITY_META } from '../../../shared/ui/capability-badge/capability-meta';
import { formatParameterSize } from './helpers/format-parameter-size.helper';
import {
  modelCapabilities,
  type ModelCapability,
} from './helpers/model-capabilities.helper';

const props = defineProps<{
  /** The model entry to render. */
  model: OllamaModel;
  /** Whether this model is the currently selected one. */
  selected: boolean;
}>();

defineEmits<{
  select: [model: string];
}>();

const metaText = computed(() =>
  [
    props.model.parameter_size
      ? formatParameterSize(props.model.parameter_size)
      : undefined,
    props.model.quantization_level,
  ]
    .filter(Boolean)
    .join('  '),
);

/** Badges for the capabilities this model actually supports, in stable order. */
const capabilityBadges = computed(() =>
  modelCapabilities(props.model).map((key: ModelCapability) => ({
    key,
    ...CAPABILITY_META[key],
  })),
);
</script>

<template>
  <button
    class="model-list-item"
    :class="{
      'model-list-item--selected': selected,
    }"
    @click="$emit('select', model.model)"
  >
    <div class="model-list-item__info">
      <span>{{ model.model }}</span>
      <span
        class="model-list-item__meta"
        :class="{ 'model-list-item__meta--empty': !metaText }"
      >
        {{ metaText }}
      </span>
      <!-- Capability badges below the metadata — only the capabilities
           this model supports are shown, nothing when it supports none. -->
      <div v-if="capabilityBadges.length" class="model-list-item__capabilities">
        <span
          v-for="badge in capabilityBadges"
          :key="badge.key"
          class="model-list-item__capability"
          role="img"
          :title="`Supports ${badge.label}`"
          :aria-label="`Supports ${badge.label}`"
        >
          <component
            :is="badge.icon"
            class="model-list-item__capability-icon"
            aria-hidden="true"
          />
        </span>
      </div>
    </div>
  </button>
</template>

<style scoped>
.model-list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-1-5) var(--spacing-3);
  text-align: center;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.model-list-item:hover {
  background-color: var(--color-bg-tertiary);
}

.model-list-item--selected {
  color: var(--color-accent-primary);
}

/* Stretched column, centered via the button's text-align: an
   align-items: center column would shrink to its content and break the
   meta line's clipping, letting long model names bleed past the edges. */
.model-list-item__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.model-list-item__meta {
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-list-item__meta--empty {
  visibility: hidden;
}

.model-list-item__capabilities {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1-5);
  margin-top: var(--spacing-1);
  color: var(--color-fg-muted);
}

.model-list-item__capability {
  display: inline-flex;
  align-items: center;
}

.model-list-item__capability-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.model-list-item--selected .model-list-item__capabilities {
  color: var(--color-accent-secondary);
}
</style>
