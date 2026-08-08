<script setup lang="ts">
import { LoaderCircle, Search } from '@lucide/vue';
import { computed, ref } from 'vue';

import type { OllamaModel } from '../../../../../types/ollama-model.model';
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

const searchQuery = ref('');

/** Local models first, then cloud — each group is already sorted alphabetically. */
const allModels = computed(() => [...props.localModels, ...props.cloudModels]);

const filteredModels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allModels.value;
  return allModels.value.filter((m) => m.model.toLowerCase().includes(q));
});
</script>

<template>
  <div class="model-list-content">
    <div class="model-list-search">
      <Search class="model-list-search__icon" :size="14" />
      <input
        v-model="searchQuery"
        class="model-list-search__input"
        :placeholder="$t('common.search')"
      />
    </div>

    <div class="model-list-items">
      <!-- Loading state: only while the very first catalog is missing — a
           background refresh keeps rendering the models it already has. -->
      <div v-if="loading && !allModels.length" class="model-list-loading">
        <LoaderCircle class="model-list-loading__icon" />
        <span class="model-list-loading__text">{{ $t('common.loading') }}</span>
      </div>

      <!-- Model list: local models first, then cloud. -->
      <template v-if="!loading || allModels.length">
        <ModelListItem
          v-for="m in filteredModels"
          :key="m.model"
          :model="m"
          :selected="m.model === selectedModel"
          @select="$emit('select', $event)"
        />
      </template>

      <!-- Empty state -->
      <div v-if="!allModels.length && !loading" class="model-list-empty">
        {{ $t('common.noModelsAvailable') }}
      </div>
      <!-- Search with no matches -->
      <div
        v-if="allModels.length && !filteredModels.length"
        class="model-list-empty"
      >
        {{ $t('common.noModelsFound') }}
      </div>
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

/* Sticky search header, styled like the language selector: a full-width bar
   with a bottom border that stays put while the list scrolls. */
.model-list-search {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  margin-bottom: var(--spacing-1);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
  z-index: 1;
}

.model-list-search__icon {
  flex-shrink: 0;
  color: var(--color-fg-muted);
}

.model-list-search__input {
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0;
  border: none;
  background: none;
  font-size: 0.75rem;
  color: var(--color-fg-primary);
}

.model-list-search__input:focus {
  outline: none;
}

.model-list-search__input::placeholder {
  color: var(--color-fg-muted);
}

.model-list-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding-inline: var(--spacing-1);
  padding-bottom: var(--spacing-1);
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
