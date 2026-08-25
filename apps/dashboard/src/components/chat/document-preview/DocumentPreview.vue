<script setup lang="ts">
import TextPreview from './text-preview/TextPreview.vue';
import type { DocumentPreviewProps } from './DocumentPreview.types';

defineProps<DocumentPreviewProps>();

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="document-preview__backdrop"
      @click.self="emit('close')"
    >
      <div class="document-preview">
        <header class="document-preview__header">
          <span class="document-preview__name">{{ item?.name }}</span>
          <button
            type="button"
            class="document-preview__close"
            :aria-label="$t('common.close')"
            @click="emit('close')"
          >
            ×
          </button>
        </header>
        <div class="document-preview__body">
          <TextPreview
            v-if="item"
            :name="item.name"
            :html="html ?? undefined"
            :text="text ?? undefined"
          />
          <div v-if="isLoading" class="document-preview__status">
            {{ $t('common.loading') }}
          </div>
          <div v-if="error" class="document-preview__error">{{ error }}</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.document-preview__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(
    in srgb,
    var(--color-bg-primary) 65%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.document-preview {
  display: flex;
  flex-direction: column;
  width: min(90vw, 60rem);
  height: min(85vh, 50rem);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  overflow: hidden;
}

.document-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--color-divider);
}

.document-preview__name {
  flex: 1 1 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

.document-preview__close {
  flex-shrink: 0;
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: color 0.2s ease;
}

.document-preview__close:hover {
  color: var(--color-accent-primary);
}

.document-preview__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: var(--spacing-3);
}

.document-preview__status,
.document-preview__error {
  padding: var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
}

.document-preview__error {
  color: var(--color-status-error);
}
</style>
