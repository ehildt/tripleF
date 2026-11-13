<script setup lang="ts">
import { X } from '@lucide/vue';

import IconButton from '../../icon-button/IconButton.vue';
import type {
  LightboxHeaderEmits,
  LightboxHeaderProps,
} from '../Lightbox.types';

defineProps<LightboxHeaderProps>();

const emit = defineEmits<LightboxHeaderEmits>();
</script>

<template>
  <header class="lightbox__header">
    <h1 class="lightbox__title">
      {{ activeTitle && activeTitle.trim() ? activeTitle : 'Image' }}
    </h1>
    <div class="lightbox__header-actions">
      <slot name="actions" />
      <IconButton
        size="lg"
        danger
        :title="$t('common.close')"
        @click="emit('close')"
      >
        <X />
      </IconButton>
    </div>
  </header>
</template>

<style scoped>
.lightbox__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-2);
  text-indent: 0.5rem;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-divider) 70%, transparent);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
}

.lightbox__header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

/* Mobile: smaller text */
@media (max-width: 639px) {
  .lightbox__title {
    font-size: 0.75rem;
  }
}

.lightbox__title {
  font-size: 0.875rem;
  color: var(--color-fg-primary);
  font-family: var(--font-sans);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
