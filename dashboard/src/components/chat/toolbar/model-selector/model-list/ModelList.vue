<script setup lang="ts">
import {
  ChevronDown,
  ChevronRight,
  Cloud,
  HardDrive,
  LoaderCircle,
} from '@lucide/vue';
import { computed } from 'vue';

import type { OllamaModel } from '../../../../../stores/models';
import { useModelListGroups } from './composables/use-model-list-groups';
import ModelListItem from './model-list-item/ModelListItem.vue';

defineEmits<{
  select: [model: string];
}>();

const props = defineProps<{
  /** Models running on the configured Ollama host. */
  localModels: readonly OllamaModel[];
  /** Models available on Ollama Cloud (requires an Ollama API key). */
  cloudModels: readonly OllamaModel[];
  /** Name string of the currently selected model. */
  selectedModel: string;
  /** Whether models are still loading. */
  loading: boolean;
}>();

const { localCollapsed, cloudCollapsed, toggleLocal, toggleCloud } =
  useModelListGroups();

/** Dividers and collapsing only exist when both groups are present. */
const groupsSplit = computed(
  () => props.localModels.length > 0 && props.cloudModels.length > 0,
);
const showLocalItems = computed(
  () => !groupsSplit.value || !localCollapsed.value,
);
const showCloudItems = computed(
  () => !groupsSplit.value || !cloudCollapsed.value,
);
</script>

<template>
  <div class="model-list-content">
    <!-- Loading state: only while the very first catalog is missing — a
         background refresh keeps rendering the models it already has. -->
    <div
      v-if="loading && !localModels.length && !cloudModels.length"
      class="model-list-loading"
    >
      <LoaderCircle class="model-list-loading__icon" />
      <span class="model-list-loading__text">Loading...</span>
    </div>

    <!-- Model list: local models first, cloud models below a divider.
         Section dividers only appear when both groups exist — without an
         Ollama API key there is only the local group and lines are noise. -->
    <template v-if="!loading || localModels.length || cloudModels.length">
      <button
        v-if="localModels.length && cloudModels.length"
        type="button"
        class="model-list-divider"
        :aria-expanded="!localCollapsed"
        aria-label="Toggle local models"
        title="Toggle local models"
        @click="toggleLocal"
      >
        <span class="model-list-divider__line" />
        <span class="model-list-divider__label">
          <HardDrive class="model-list-divider__icon" />
          local models
          <ChevronDown
            v-if="!localCollapsed"
            class="model-list-divider__chevron"
          />
          <ChevronRight v-else class="model-list-divider__chevron" />
        </span>
        <span class="model-list-divider__line" />
      </button>

      <template v-if="showLocalItems">
        <ModelListItem
          v-for="m in localModels"
          :key="m.model"
          :model="m"
          :selected="m.model === selectedModel"
          @select="$emit('select', $event)"
        />
      </template>

      <button
        v-if="localModels.length && cloudModels.length"
        type="button"
        class="model-list-divider"
        :aria-expanded="!cloudCollapsed"
        aria-label="Toggle cloud models"
        title="Toggle cloud models"
        @click="toggleCloud"
      >
        <span class="model-list-divider__line" />
        <span class="model-list-divider__label">
          <Cloud class="model-list-divider__icon" />
          ollama cloud
          <ChevronDown
            v-if="!cloudCollapsed"
            class="model-list-divider__chevron"
          />
          <ChevronRight v-else class="model-list-divider__chevron" />
        </span>
        <span class="model-list-divider__line" />
      </button>

      <template v-if="showCloudItems">
        <ModelListItem
          v-for="m in cloudModels"
          :key="m.model"
          :model="m"
          :selected="m.model === selectedModel"
          @select="$emit('select', $event)"
        />
      </template>
    </template>

    <!-- Empty state -->
    <div
      v-if="!localModels.length && !cloudModels.length && !loading"
      class="model-list-empty"
    >
      No models available
    </div>
  </div>
</template>

<style scoped>
.model-list-content {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  /* The dropdown opens downward from the sticky toolbar, so cap the list
     height and let it scroll instead of growing past the viewport. */
  max-height: min(24rem, 70vh);
}

.model-list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) 0;
}

.model-list-loading__icon {
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
  color: var(--color-accent-primary);
}

.model-list-loading__text {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.model-list-divider {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-1);
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
}

.model-list-divider:hover .model-list-divider__label {
  color: var(--color-accent-secondary);
}

.model-list-divider__line {
  flex: 1;
  height: 1px;
  background-color: var(--color-divider);
}

.model-list-divider__label {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: 0.625rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-accent-primary);
  transition: color 0.2s ease;
}

.model-list-divider__icon {
  width: 0.75rem;
  height: 0.75rem;
}

.model-list-divider__chevron {
  width: 0.7rem;
  height: 0.7rem;
  color: var(--color-fg-muted);
}

.model-list-empty {
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
}
</style>
