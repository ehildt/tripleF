<script setup lang="ts">
/**
 * The inline editor's icon picker: a curated allowlist grid of taxonomy
 * icons with the active choice highlighted, plus a clear action. Pure
 * presentational — selection surfaces through the onSelect callback (name
 * to set, null to clear).
 */
import { X } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import TaxonomyIcon from '@/components/shared/ui/taxonomy-icon/TaxonomyIcon.vue';

import type { TaxonomyItemIconPickerProps } from './TaxonomyItemIconPicker.types';

defineProps<TaxonomyItemIconPickerProps>();
</script>

<template>
  <div class="taxonomy-item-icon-picker">
    <div class="taxonomy-item-icon-picker__head">
      <label class="taxonomy-item-icon-picker__label">{{
        $t('common.memoryTaxonomyIcon')
      }}</label>
      <IconButton
        v-if="selectedIcon"
        :title="$t('common.memoryTaxonomyIconClear')"
        size="sm"
        @click="onSelect(null)"
      >
        <X :size="16" />
      </IconButton>
    </div>
    <div class="taxonomy-item-icon-picker__grid">
      <button
        v-for="name in iconNames"
        :key="name"
        type="button"
        class="taxonomy-item-icon-picker__choice"
        :class="{
          'taxonomy-item-icon-picker__choice--active': selectedIcon === name,
        }"
        :title="name"
        :aria-pressed="selectedIcon === name"
        @click="onSelect(name)"
      >
        <TaxonomyIcon :name="name" :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.taxonomy-item-icon-picker {
  display: flex;
  flex-direction: column;
}

.taxonomy-item-icon-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.taxonomy-item-icon-picker__label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

.taxonomy-item-icon-picker__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  max-height: 9rem;
  overflow-y: auto;
}

.taxonomy-item-icon-picker__choice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  color: var(--color-fg-secondary);
  background: transparent;
  border: 1px solid var(--color-divider);
  cursor: pointer;
}

.taxonomy-item-icon-picker__choice:hover {
  color: var(--color-fg-primary);
  border-color: var(--color-fg-muted);
}

.taxonomy-item-icon-picker__choice--active {
  color: var(--color-accent, var(--color-fg-primary));
  border-color: var(--color-accent, var(--color-fg-primary));
}
</style>
