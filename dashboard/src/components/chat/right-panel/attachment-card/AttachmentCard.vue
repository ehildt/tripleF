<script setup lang="ts">
/**
 * One file card in the Files panel: name header with an upload-source
 * indicator and a remove button, above a clickable thumbnail that toggles
 * whether the attachment is included in the next prompt.
 */
import { Cloud, CloudDownload, X } from '@lucide/vue';
import { computed } from 'vue';

import Tooltip from '../../../shared/ui/tooltip/Tooltip.vue';
import type { AttachmentItem } from '../composables/use-attachment-list.types';

const props = defineProps<{
  item: AttachmentItem;
  imageSrc: string;
}>();

const emit = defineEmits<{
  remove: [];
  toggle: [];
}>();

const sourceIcon = computed(() =>
  props.item.source === 'cloud' ? CloudDownload : Cloud,
);

const sourceTitle = computed(() =>
  props.item.source === 'cloud'
    ? 'Downloaded from the web'
    : 'Uploaded by the user',
);
</script>

<template>
  <div
    class="attachment-card"
    :class="{ 'attachment-card--unselected': !item.isSelected }"
  >
    <div class="attachment-card__header">
      <span class="attachment-card__name">
        {{ item.name }}
      </span>
      <Tooltip :text="sourceTitle">
        <component
          :is="sourceIcon"
          v-if="item.isUploaded"
          class="attachment-card__uploaded-indicator"
        />
      </Tooltip>
      <Tooltip :text="$t('common.remove')">
        <button
          class="attachment-card__remove"
          :aria-label="$t('common.remove')"
          @click.stop="emit('remove')"
        >
          <X class="attachment-card__remove-icon" />
        </button>
      </Tooltip>
    </div>
    <div
      class="attachment-card__thumb"
      :class="{ 'attachment-card__thumb--unselected': !item.isSelected }"
      @click="emit('toggle')"
    >
      <img
        :src="imageSrc"
        class="attachment-card__image"
        :class="{ 'attachment-card__image--unselected': !item.isSelected }"
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  </div>
</template>

<style scoped>
.attachment-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  overflow: hidden;
  flex-shrink: 0;
  transition:
    opacity 250ms ease,
    filter 250ms ease;
}

.attachment-card:not(:last-child) {
  margin-block-end: 0.5rem;
}

.attachment-card:not(:first-child) {
  margin-block-start: 0.5rem;
}

.attachment-card--unselected {
  opacity: 0.6;
}

.attachment-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-divider);
}

.attachment-card__name {
  flex: 1 1 0%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

.attachment-card__remove {
  padding: var(--spacing-0-5);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
  border: none;
  background-color: transparent;
  flex-shrink: 0;
}

.attachment-card__remove:hover {
  color: var(--color-status-error);
}

.attachment-card__remove-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.attachment-card__uploaded-indicator {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--color-accent-primary);
  flex-shrink: 0;
}

.attachment-card__thumb {
  cursor: pointer;
  transition: filter 250ms ease;
}

.attachment-card__thumb--unselected,
.attachment-card__thumb--unselected .attachment-card__image {
  filter: grayscale(100%);
}

.attachment-card__image {
  width: 100%;
  height: 20dvh;
  object-fit: cover;
  transition: filter 250ms ease;
}

.attachment-card__image--unselected {
  filter: grayscale(100%);
}
</style>
