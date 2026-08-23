<script setup lang="ts">
import { Cloud, HardDrive } from '@lucide/vue';
import { computed } from 'vue';

import { formatCtx } from '@/utils/format-ctx.helper';

import type { OllamaModel } from '../../../../../../types/ollama-model.model';
import Tooltip from '../../../../../shared/ui/tooltip/Tooltip.vue';
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
    props.model.context_length
      ? formatCtx(props.model.context_length)
      : undefined,
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
    <HardDrive
      v-if="model.origin !== 'cloud'"
      class="model-list-item__origin-icon"
    />
    <Cloud v-else class="model-list-item__origin-icon" />
    <div class="model-list-item__info">
      <span>{{ model.model }}</span>
      <div class="model-list-item__row">
        <span
          class="model-list-item__meta"
          :class="{ 'model-list-item__meta--empty': !metaText }"
        >
          {{ metaText }}
        </span>
        <!-- Capability badges beside the metadata — only the capabilities
             this model supports are shown, nothing when it supports none. -->
        <div
          v-if="capabilityBadges.length"
          class="model-list-item__capabilities"
        >
          <Tooltip
            v-for="badge in capabilityBadges"
            :key="badge.key"
            :text="
              $t('common.supports', { label: $t(`capabilities.${badge.key}`) })
            "
          >
            <span
              class="model-list-item__capability"
              role="img"
              :aria-label="
                $t('common.supports', {
                  label: $t(`capabilities.${badge.key}`),
                })
              "
            >
              <component
                :is="badge.icon"
                class="model-list-item__capability-icon"
                aria-hidden="true"
              />
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  </button>
</template>

<style scoped>
.model-list-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2);
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.model-list-item:hover {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 80%,
    transparent
  );
}

.model-list-item--selected {
  color: var(--color-accent-primary);
}

.model-list-item__origin-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: var(--color-fg-muted);
}

.model-list-item--selected .model-list-item__origin-icon {
  color: var(--color-accent-primary);
}

/* Stretched column, left-aligned via the button's text-align: an
   align-items: center column would shrink to its content and break the
   meta line's clipping, letting long model names bleed past the edges. */
.model-list-item__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.model-list-item__meta {
  flex: 1;
  min-width: 0;
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-list-item__meta--empty {
  visibility: hidden;
}

/* Meta and capability badges share one row, each taking half the width. */
.model-list-item__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
}

.model-list-item__capabilities {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-1-5);
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
